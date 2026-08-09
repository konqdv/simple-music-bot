const { PlayableExtractorPlugin, Song, Playlist, DisTubeError } = require('distube');
const { ytDlpJson } = require('./ytdlp');

/**
 * Plugin genérico basado en yt-dlp: soporta SoundCloud, Bandcamp, Twitch,
 * enlaces directos a audio y cualquier otro sitio que yt-dlp reconozca.
 *
 * Sustituye al YtDlpPlugin oficial, que se rompe al interpretar la salida de
 * yt-dlp (ver el comentario en lib/ytdlp.js). Al ser el plugin más genérico,
 * debe registrarse SIEMPRE al final: acepta cualquier URL.
 */

const FLAGS_BASE = {
  dumpSingleJson: true,
  noWarnings: true,
  preferFreeFormats: true,
  skipDownload: true,
  simulate: true,
};

const esPlaylist = (info) => Array.isArray(info?.entries);

/** Traduce la respuesta de yt-dlp al formato de canción que espera DisTube. */
function construirCancion(plugin, info, options) {
  return new Song(
    {
      plugin,
      source: info.extractor,
      playFromSource: true,
      id: info.id,
      name: info.title || info.fulltitle,
      url: info.webpage_url || info.original_url,
      isLive: info.is_live,
      thumbnail: info.thumbnail || info.thumbnails?.[0]?.url,
      duration: info.is_live ? 0 : info.duration,
      uploader: { name: info.uploader, url: info.uploader_url },
      views: info.view_count,
      likes: info.like_count,
      ageRestricted: Boolean(info.age_limit) && info.age_limit >= 18,
    },
    options
  );
}

class YtDlpPlugin extends PlayableExtractorPlugin {
  validate() {
    return true;
  }

  async resolve(url, options) {
    const info = await ytDlpJson(url, FLAGS_BASE).catch((error) => {
      throw new DisTubeError('YTDLP_ERROR', `${error?.message ?? error}`);
    });

    if (esPlaylist(info)) {
      if (!info.entries.length) {
        throw new DisTubeError('YTDLP_ERROR', 'La playlist está vacía.');
      }

      return new Playlist(
        {
          source: info.extractor,
          songs: info.entries.map((entrada) => construirCancion(this, entrada, options)),
          id: String(info.id),
          name: info.title,
          url: info.webpage_url,
          thumbnail: info.thumbnails?.[0]?.url,
        },
        options
      );
    }

    return construirCancion(this, info, options);
  }

  async getStreamURL(song) {
    if (!song.url) {
      throw new DisTubeError('YTDLP_ERROR', 'No se puede obtener el audio de una canción sin URL.');
    }

    const info = await ytDlpJson(song.url, { ...FLAGS_BASE, format: 'ba/ba*' }).catch((error) => {
      throw new DisTubeError('YTDLP_ERROR', `${error?.message ?? error}`);
    });

    if (esPlaylist(info)) {
      throw new DisTubeError('YTDLP_ERROR', 'No se puede reproducir una playlist completa como una sola pista.');
    }

    if (!info?.url) {
      throw new DisTubeError('YTDLP_ERROR', `No se pudo obtener el audio de ${song.url}`);
    }

    return info.url;
  }

  getRelatedSongs() {
    return [];
  }
}

module.exports = { YtDlpPlugin };
