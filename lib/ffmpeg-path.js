const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

/**
 * Localiza el ejecutable de FFmpeg.
 *
 * Se busca en este orden:
 *  1. La variable de entorno FFMPEG_PATH (útil si lo tienes en una ruta propia).
 *  2. La carpeta donde winget instala FFmpeg en Windows. Hace falta porque el
 *     proceso del bot puede no haber heredado el PATH actualizado tras instalarlo.
 *  3. "ffmpeg" a secas, confiando en que esté en el PATH (lo normal en Linux/macOS).
 */
function resolveFfmpegPath() {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;

  if (process.platform === 'win32') {
    const wingetPackages = path.join(
      os.homedir(),
      'AppData',
      'Local',
      'Microsoft',
      'WinGet',
      'Packages'
    );

    try {
      const paquete = fs
        .readdirSync(wingetPackages)
        .find((nombre) => nombre.startsWith('Gyan.FFmpeg'));

      if (paquete) {
        const base = path.join(wingetPackages, paquete);
        const build = fs.readdirSync(base).find((nombre) => nombre.startsWith('ffmpeg-'));

        if (build) {
          const ejecutable = path.join(base, build, 'bin', 'ffmpeg.exe');
          if (fs.existsSync(ejecutable)) return ejecutable;
        }
      }
    } catch {
      // Si no está instalado por winget, seguimos con el PATH.
    }
  }

  return 'ffmpeg';
}

module.exports = { resolveFfmpegPath };
