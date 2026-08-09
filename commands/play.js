const { SlashCommandBuilder } = require('discord.js');
const { ytDlpJson } = require('../lib/ytdlp');

const config = require('../lib/config');

const MAX_PLAYLIST_SONGS = config.MAX_PLAYLIST_SIZE;

const isUrl = (text) => /^https?:\/\//i.test(text);

const YTDLP_BASE_FLAGS = {
  dumpSingleJson: true,
  noWarnings: true,
  skipDownload: true,
  simulate: true,
};

/**
 * Detecta playlists de YouTube. Solo tratamos como playlist las URLs de tipo
 * /playlist?list=..., para que un enlace normal de video (watch?v=...&list=...)
 * reproduzca solo ese video, que es lo que la gente suele esperar.
 */
const isYouTubePlaylist = (url) =>
  /(?:youtube\.com|youtu\.be)/i.test(url) && /\/playlist/i.test(url) && /[?&]list=/i.test(url);

/**
 * YtDlpPlugin solo resuelve enlaces directos, no busca por texto.
 * Si el usuario escribió un nombre de canción (no un link), usamos yt-dlp para
 * buscar en YouTube ("ytsearch1:") y obtener el enlace del primer resultado.
 */
async function resolveToUrl(query) {
  if (isUrl(query)) return query;

  const info = await ytDlpJson(`ytsearch1:${query}`, YTDLP_BASE_FLAGS);
  const result = info?.entries?.[0] ?? info;
  return result?.webpage_url ?? null;
}

/**
 * Obtiene los enlaces de una playlist de YouTube.
 * Usamos flatPlaylist porque sin esa opción yt-dlp descarga la info completa de
 * cada video (lentísimo en playlists grandes). La librería que DisTube usa por
 * defecto para playlists de YouTube está rota, por eso lo resolvemos aquí.
 */
async function fetchPlaylistEntries(url) {
  const info = await ytDlpJson(url, { ...YTDLP_BASE_FLAGS, flatPlaylist: true });

  const urls = (info?.entries ?? [])
    .map((entry) => entry?.url ?? (entry?.id ? `https://www.youtube.com/watch?v=${entry.id}` : null))
    .filter(Boolean);

  return { title: info?.title ?? 'Playlist', urls };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Reproduce una canción o playlist (nombre o enlace de YouTube/Spotify/SoundCloud)')
    .addStringOption((option) =>
      option
        .setName('cancion')
        .setDescription('Nombre, enlace de canción o enlace de playlist')
        .setRequired(true)
    ),

  async execute(interaction) {
    const query = interaction.options.getString('cancion');
    const { channel } = interaction.member.voice;

    if (!channel) {
      return interaction.reply({
        content: '❌ Debes estar en un canal de voz para usar este comando.',
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    const { client } = interaction;
    const playOptions = { member: interaction.member, textChannel: interaction.channel };

    try {
      if (isYouTubePlaylist(query)) {
        const { title, urls } = await fetchPlaylistEntries(query);

        if (!urls.length) {
          await interaction.editReply('❌ Esa playlist está vacía o no se pudo leer.');
          return;
        }

        const seleccionadas = urls.slice(0, MAX_PLAYLIST_SONGS);
        await interaction.editReply(
          `📃 Cargando playlist **${title}** (${seleccionadas.length} canciones)...`
        );

        // Las canciones se añaden una por una, así que silenciamos el aviso
        // individual y avisamos una sola vez al terminar.
        client.bulkAdd.add(interaction.guildId);
        let añadidas = 0;

        try {
          for (const url of seleccionadas) {
            try {
              await client.distube.play(channel, url, playOptions);
              añadidas += 1;
            } catch (error) {
              console.error(`No se pudo añadir ${url}:`, error?.message ?? error);
            }
          }
        } finally {
          client.bulkAdd.delete(interaction.guildId);
        }

        const omitidas = urls.length - seleccionadas.length;
        await interaction.editReply(
          `📃 Playlist **${title}**: ${añadidas} canciones añadidas a la cola.` +
            (omitidas > 0 ? ` (Se omitieron ${omitidas}, el límite es ${MAX_PLAYLIST_SONGS}.)` : '')
        );
        return;
      }

      const url = await resolveToUrl(query);

      if (!url) {
        await interaction.editReply(`❌ No encontré resultados para: **${query}**`);
        return;
      }

      await client.distube.play(channel, url, playOptions);
      await interaction.editReply(`🔎 Buscando: **${query}**`);
    } catch (error) {
      console.error(error);

      const mensaje = /DRM/i.test(error?.message ?? '')
        ? '❌ Spotify no permite transmitir su audio directamente. Prueba con el nombre de la canción o un enlace de YouTube.'
        : '❌ Ocurrió un error al intentar reproducir la canción.';

      await interaction.editReply(mensaje);
    }
  },
};
