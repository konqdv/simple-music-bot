const fs = require('node:fs');
const path = require('node:path');

/**
 * Configuración del bot (config.json).
 *
 * Aquí NO van datos secretos: el token va en el archivo .env, que nunca se sube
 * al repositorio. Este archivo sí se puede compartir sin riesgo.
 */

const VALORES_POR_DEFECTO = {
  // Volumen inicial (0-100). DisTube usa 50 si no se indica otra cosa.
  DEFAULT_VOLUME: 100,
  // Máximo de canciones que se añaden de una playlist.
  MAX_PLAYLIST_SIZE: 100,
  // Segundos que el bot espera antes de salirse del canal de voz.
  STAY_TIME: 60,
  // Salirse si se queda solo en el canal.
  LEAVE_ON_EMPTY: true,
  // Salirse al terminar la cola.
  LEAVE_ON_FINISH: true,
};

function cargarConfig() {
  const ruta = path.join(__dirname, '..', 'config.json');

  try {
    const contenido = JSON.parse(fs.readFileSync(ruta, 'utf8'));
    return { ...VALORES_POR_DEFECTO, ...contenido };
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn('⚠️ No se pudo leer config.json, se usarán los valores por defecto:', error.message);
    }
    return { ...VALORES_POR_DEFECTO };
  }
}

module.exports = cargarConfig();
