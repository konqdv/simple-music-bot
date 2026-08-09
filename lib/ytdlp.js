const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

/**
 * Wrapper propio de yt-dlp.
 *
 * ¿Por qué no usamos el `json()` que trae @distube/yt-dlp? Porque mezcla stdout
 * y stderr en un mismo buffer antes de hacer JSON.parse. yt-dlp escribe avisos
 * en stderr (por ejemplo el de "--no-call-home está obsoleto"), así que el parse
 * falla y tumba el proceso. Aquí leemos stdout y stderr por separado.
 *
 * Reutilizamos el binario que descarga ese paquete al instalarse.
 */

function resolveBinaryPath() {
  if (process.env.YTDLP_PATH) return process.env.YTDLP_PATH;

  const nombre = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  const paqueteDir = path.dirname(require.resolve('@distube/yt-dlp'));
  const binario = path.join(paqueteDir, '..', 'bin', nombre);

  return fs.existsSync(binario) ? binario : nombre;
}

const BINARY_PATH = resolveBinaryPath();

/** Convierte { dumpSingleJson: true, format: 'ba' } en ['--dump-single-json', '--format', 'ba'] */
function buildArgs(flags) {
  return Object.entries(flags).flatMap(([clave, valor]) => {
    const bandera = `--${clave.replace(/[A-Z]/g, (letra) => `-${letra.toLowerCase()}`)}`;

    if (valor === true) return [bandera];
    if (valor === false || valor == null) return [];
    return [bandera, String(valor)];
  });
}

/**
 * Ejecuta yt-dlp y devuelve su salida JSON.
 * @param {string} url Enlace o consulta de búsqueda (por ejemplo "ytsearch1:...")
 * @param {object} flags Opciones en camelCase
 */
function ytDlpJson(url, flags = {}) {
  return new Promise((resolve, reject) => {
    const proceso = spawn(BINARY_PATH, [url, ...buildArgs(flags)], { windowsHide: true });

    let stdout = '';
    let stderr = '';

    proceso.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    proceso.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    proceso.on('error', reject);

    proceso.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `yt-dlp terminó con el código ${code}`));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error(`yt-dlp no devolvió un JSON válido.\n${stderr.trim() || stdout.slice(0, 300)}`));
      }
    });
  });
}

module.exports = { ytDlpJson, BINARY_PATH };
