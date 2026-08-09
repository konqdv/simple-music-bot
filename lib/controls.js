const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Panel de control de música con botones (equivalente moderno a los controles
 * por reacciones: usa componentes nativos de Discord, no requiere permisos de
 * reacciones ni el intent de contenido de mensajes).
 */

const BOTONES = [
  { id: 'music_pause', emoji: '⏯️', estilo: ButtonStyle.Secondary },
  { id: 'music_skip', emoji: '⏭️', estilo: ButtonStyle.Secondary },
  { id: 'music_voldown', emoji: '🔉', estilo: ButtonStyle.Secondary },
  { id: 'music_volup', emoji: '🔊', estilo: ButtonStyle.Secondary },
  { id: 'music_loop', emoji: '🔁', estilo: ButtonStyle.Secondary },
  { id: 'music_shuffle', emoji: '🔀', estilo: ButtonStyle.Secondary },
  { id: 'music_stop', emoji: '⏹️', estilo: ButtonStyle.Danger },
];

function buildControls() {
  const filas = [];

  for (let i = 0; i < BOTONES.length; i += 5) {
    const fila = new ActionRowBuilder().addComponents(
      BOTONES.slice(i, i + 5).map(({ id, emoji, estilo }) =>
        new ButtonBuilder().setCustomId(id).setEmoji(emoji).setStyle(estilo)
      )
    );
    filas.push(fila);
  }

  return filas;
}

const NOMBRES_REPEAT = ['desactivada', 'canción actual 🔂', 'cola completa 🔁'];

/**
 * Ejecuta la acción de un botón del panel.
 * Devuelve el texto de confirmación, o null si el botón no es del panel.
 */
async function handleControl(interaction) {
  const { customId } = interaction;
  if (!customId.startsWith('music_')) return null;

  const queue = interaction.client.distube.getQueue(interaction.guildId);
  if (!queue) return '❌ No hay nada reproduciéndose ahora mismo.';

  // Solo quien está en el mismo canal de voz puede controlar la música.
  const canalUsuario = interaction.member?.voice?.channel;
  if (!canalUsuario || canalUsuario.id !== queue.voice?.channel?.id) {
    return '❌ Debes estar en el mismo canal de voz que el bot.';
  }

  switch (customId) {
    case 'music_pause':
      if (queue.paused) {
        queue.resume();
        return `▶️ Reanudado por ${interaction.user}`;
      }
      queue.pause();
      return `⏸️ Pausado por ${interaction.user}`;

    case 'music_skip':
      if (queue.songs.length <= 1 && !queue.autoplay) {
        return '⚠️ No hay más canciones en la cola.';
      }
      await queue.skip();
      return `⏭️ Saltada por ${interaction.user}`;

    case 'music_voldown': {
      const nivel = Math.max(0, queue.volume - 10);
      queue.setVolume(nivel);
      return `🔉 Volumen: **${nivel}%**`;
    }

    case 'music_volup': {
      const nivel = Math.min(100, queue.volume + 10);
      queue.setVolume(nivel);
      return `🔊 Volumen: **${nivel}%**`;
    }

    case 'music_loop': {
      const modo = (queue.repeatMode + 1) % 3;
      queue.setRepeatMode(modo);
      return `🔁 Repetición: **${NOMBRES_REPEAT[modo]}**`;
    }

    case 'music_shuffle':
      await queue.shuffle();
      return `🔀 Cola mezclada por ${interaction.user}`;

    case 'music_stop':
      await queue.stop();
      return `⏹️ Detenido por ${interaction.user}`;

    default:
      return null;
  }
}

module.exports = { buildControls, handleControl };
