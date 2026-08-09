const { YouTubePlugin } = require('@distube/youtube');
const { DisTubeError } = require('distube');
const { ytDlpJson } = require('./ytdlp');

/**
 * YouTubePlugin es necesario porque es el único plugin de tipo "extractor"
 * (permite buscar por nombre, y SpotifyPlugin depende de él para encontrar en
 * YouTube el equivalente de cada canción de Spotify).
 *
 * El problema: su motor interno (@distube/ytdl-core) ya no logra descifrar las
 * URLs de audio de YouTube ("Could not parse decipher function. Stream URLs
 * will be missing"), y FFmpeg termina recibiendo una URL inválida.
 *
 * Por eso conservamos la búsqueda del plugin original pero obtenemos el enlace
 * de audio real con yt-dlp, que sí sigue funcionando.
 */
class YouTubeYtDlpPlugin extends YouTubePlugin {
  async getStreamURL(song) {
    if (!song.url) {
      throw new DisTubeError('YTDLP_ERROR', 'No se puede obtener el audio de una canción sin URL.');
    }

    const info = await ytDlpJson(song.url, {
      dumpSingleJson: true,
      noWarnings: true,
      skipDownload: true,
      simulate: true,
      format: 'ba/ba*',
    }).catch((error) => {
      throw new DisTubeError('YTDLP_ERROR', `${error?.message ?? error}`);
    });

    if (!info?.url) {
      throw new DisTubeError('YTDLP_ERROR', `No se pudo obtener el audio de ${song.url}`);
    }

    return info.url;
  }
}

module.exports = { YouTubeYtDlpPlugin };
