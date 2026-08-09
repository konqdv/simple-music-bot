require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const { YtDlpPlugin } = require('./lib/ytdlp-plugin');
const { YouTubeYtDlpPlugin } = require('./lib/youtube-ytdlp-plugin');
const { buildControls, handleControl } = require('./lib/controls');
const { resolveFfmpegPath } = require('./lib/ffmpeg-path');
const config = require('./lib/config');

const { DISCORD_TOKEN } = process.env;

if (!DISCORD_TOKEN) {
  console.error('❌ Falta DISCORD_TOKEN en el archivo .env. Revisa .env.example.');
  process.exit(1);
}

// Blindaje: un error suelto (p. ej. de una librería de terceros) nunca debe
// tumbar todo el proceso del bot. Solo lo registramos y seguimos corriendo.
process.on('uncaughtException', (error) => {
  console.error('⚠️ uncaughtException (el bot sigue corriendo):', error);
});
process.on('unhandledRejection', (error) => {
  console.error('⚠️ unhandledRejection (el bot sigue corriendo):', error);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// --- Cargar comandos ---
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command?.data && command?.execute) {
    client.commands.set(command.data.name, command);
  }
}

// --- Configurar DisTube (motor de música) ---
const FFMPEG_PATH = resolveFfmpegPath();
console.log('🎬 FFmpeg:', FFMPEG_PATH);

// El orden importa: YtDlpPlugin valida cualquier URL, así que debe ir al final.
// SpotifyPlugin solo lee los metadatos (Spotify tiene DRM y no se puede transmitir);
// la canción equivalente se busca y reproduce desde YouTube.
client.distube = new DisTube(client, {
  plugins: [new SpotifyPlugin(), new YouTubeYtDlpPlugin(), new YtDlpPlugin()],
  emitNewSongOnly: true,
  ffmpeg: { path: FFMPEG_PATH },
});

// Guilds que están cargando una playlist: evita inundar el chat con un mensaje
// "Añadida a la cola" por cada canción.
client.bulkAdd = new Set();

// --- Eventos de DisTube ---
// Volumen inicial de cada cola nueva (DisTube usa 50 por defecto).
client.distube.on('initQueue', (queue) => {
  queue.setVolume(config.DEFAULT_VOLUME);
});

client.distube.on('playSong', (queue, song) => {
  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle('🎶 Reproduciendo ahora')
    .setDescription(`**${song.name}**`)
    .addFields(
      { name: 'Duración', value: song.formattedDuration, inline: true },
      { name: 'Pedida por', value: `${song.user}`, inline: true }
    )
    .setThumbnail(song.thumbnail ?? null);

  queue.textChannel?.send({ embeds: [embed], components: buildControls() });
});

client.distube.on('addSong', (queue, song) => {
  if (client.bulkAdd.has(queue.id)) return;

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setDescription(`➕ Añadida a la cola: **${song.name}** - \`${song.formattedDuration}\``);
  queue.textChannel?.send({ embeds: [embed] });
});

client.distube.on('addList', (queue, playlist) => {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setDescription(`📃 Playlist añadida: **${playlist.name}** (${playlist.songs.length} canciones)`);
  queue.textChannel?.send({ embeds: [embed] });
});

client.distube.on('finish', (queue) => {
  queue.textChannel?.send('✅ Cola de reproducción finalizada.');

  if (config.LEAVE_ON_FINISH) {
    programarSalida(queue.id, queue.voice, 'la cola terminó');
  }
});

// Firma real: (error, queue, song) — ver node_modules/distube/dist/index.d.ts
client.distube.on('error', (error, queue, song) => {
  console.error('Error de DisTube:', error);
  queue?.textChannel?.send(`❌ Ocurrió un error${song ? ` con **${song.name}**` : ''}: ${error?.message ?? error}`);
});

// --- Salida automática del canal de voz ---
// DisTube v5 quitó las opciones leaveOn*, así que lo manejamos nosotros.
const salidasProgramadas = new Map();

function cancelarSalida(guildId) {
  const temporizador = salidasProgramadas.get(guildId);
  if (temporizador) {
    clearTimeout(temporizador);
    salidasProgramadas.delete(guildId);
  }
}

function programarSalida(guildId, voice, motivo) {
  cancelarSalida(guildId);

  const temporizador = setTimeout(() => {
    salidasProgramadas.delete(guildId);

    // Si mientras tanto volvió a sonar algo, no nos vamos.
    const queue = client.distube.getQueue(guildId);
    if (queue && queue.songs.length && !queue.paused) return;

    console.log(`👋 Saliendo del canal de voz (${motivo}).`);
    voice?.leave();
  }, config.STAY_TIME * 1000);

  salidasProgramadas.set(guildId, temporizador);
}

// Salir si el bot se queda solo en el canal de voz.
client.on('voiceStateUpdate', (oldState) => {
  if (!config.LEAVE_ON_EMPTY) return;

  const voice = client.distube.voices.get(oldState.guild.id);
  const canal = voice?.channel;
  if (!canal) return;

  const humanos = canal.members.filter((miembro) => !miembro.user.bot).size;

  if (humanos === 0) {
    programarSalida(oldState.guild.id, voice, 'me quedé solo');
  } else {
    cancelarSalida(oldState.guild.id);
  }
});

// --- Eventos del cliente de Discord ---
client.once('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  // Botones del panel de control de música
  if (interaction.isButton()) {
    try {
      const respuesta = await handleControl(interaction);
      if (respuesta) await interaction.reply({ content: respuesta, ephemeral: true });
    } catch (error) {
      console.error('Error en el panel de control:', error);
      if (!interaction.replied) {
        await interaction.reply({ content: `❌ ${error?.message ?? error}`, ephemeral: true });
      }
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error al ejecutar el comando ${interaction.commandName}:`, error);
    const payload = { content: '❌ Ocurrió un error al ejecutar este comando.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }
  }
});

client.login(DISCORD_TOKEN);
