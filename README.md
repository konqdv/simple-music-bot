# 🎵 Simple Music Bot

Bot de música para Discord construido con **discord.js v14** y **DisTube v5**.
Reproduce desde YouTube, Spotify, SoundCloud y cualquier sitio soportado por `yt-dlp`.

Todo se controla con comandos de barra (`/play`, `/skip`, …) y con un **panel de
botones** que aparece junto a cada canción.

---

## ✨ Características

- 🎧 Reproducción por **nombre** o por **enlace** (no hace falta pegar la URL)
- 📃 **Playlists de YouTube** y **enlaces de Spotify** (canciones, álbumes y listas)
- 🎛️ **Panel de botones**: pausa, saltar, volumen, repetición, mezclar y detener
- 📜 Cola completa: ver, mezclar, quitar y saltar a una posición concreta
- 🔁 Repetición de canción o de toda la cola
- 👋 Se sale solo del canal de voz cuando se queda vacío o termina la cola
- 🚫 **No necesita claves de API** de YouTube ni de Spotify

---

## 📋 Requisitos

1. **Node.js v18** o superior — [descargar](https://nodejs.org)
2. **FFmpeg** instalado en el sistema
   - Windows: `winget install Gyan.FFmpeg`
   - macOS: `brew install ffmpeg`
   - Linux: `sudo apt install ffmpeg`
3. Un **token de bot de Discord** (gratis, se saca en el paso siguiente)

> El binario de `yt-dlp` se descarga solo al instalar las dependencias.

---

## 🤖 Crear el bot en Discord

1. Entra en el [Portal de Desarrolladores de Discord](https://discord.com/developers/applications)
   y pulsa **New Application**.
2. Ve a la pestaña **Bot** → **Reset Token** y **copia el token**.
3. Ve a **OAuth2 → General** y copia el **Application ID** (ese es tu `CLIENT_ID`).
4. Ve a **OAuth2 → URL Generator** y marca:
   - **Scopes**: `bot` y `applications.commands`
   - **Bot Permissions**: `Send Messages`, `Embed Links`, `Use Slash Commands`,
     `Connect` y `Speak`
5. Abre la URL generada al final de la página e invita el bot a tu servidor.

> ⚠️ **Nunca compartas ni subas tu token.** Si se te escapa alguna vez, entra al
> portal y pulsa **Reset Token** de inmediato.

---

## ⚙️ Configuración

### 1. Instalar dependencias

```bash
npm install
```

> Si npm avisa sobre scripts de instalación, apruébalo con
> `npm approve-scripts @distube/yt-dlp`: es la descarga del binario de `yt-dlp`.

### 2. Crear el archivo `.env`

Copia `.env.example` con el nombre `.env` y rellena tus datos:

```env
DISCORD_TOKEN=el_token_de_tu_bot
CLIENT_ID=el_application_id
GUILD_ID=el_id_de_tu_servidor
```

| Variable | Obligatorio | Descripción |
|---|---|---|
| `DISCORD_TOKEN` | Sí | Token del bot (pestaña **Bot** del portal) |
| `CLIENT_ID` | Sí | Application ID (**OAuth2 → General**) |
| `GUILD_ID` | No | ID de tu servidor. Con él los comandos aparecen al instante; sin él se registran globalmente y tardan hasta 1 hora |
| `FFMPEG_PATH` | No | Ruta a `ffmpeg` si no está en el PATH |

> Para copiar el ID de tu servidor: activa **Ajustes → Avanzado → Modo desarrollador**,
> luego clic derecho sobre el servidor → **Copiar ID de servidor**.

> ⚠️ El archivo `.env` está en `.gitignore` y **nunca** se sube al repositorio.

### 3. Ajustes opcionales (`config.json`)

Este archivo no contiene secretos, así que se puede compartir sin problema:

```json
{
  "DEFAULT_VOLUME": 100,
  "MAX_PLAYLIST_SIZE": 100,
  "STAY_TIME": 60,
  "LEAVE_ON_EMPTY": true,
  "LEAVE_ON_FINISH": true
}
```

| Opción | Descripción |
|---|---|
| `DEFAULT_VOLUME` | Volumen inicial (0-100) |
| `MAX_PLAYLIST_SIZE` | Máximo de canciones que se cargan de una playlist |
| `STAY_TIME` | Segundos antes de salirse del canal de voz |
| `LEAVE_ON_EMPTY` | Salirse cuando no queda nadie en el canal |
| `LEAVE_ON_FINISH` | Salirse al terminar la cola |

---

## ▶️ Poner el bot en marcha

```bash
npm run deploy   # registra los comandos "/" en Discord (solo la primera vez
                 # y cada vez que añadas o cambies un comando)
npm start        # arranca el bot
```

---

## 🎮 Comandos

| Comando | Descripción |
|---|---|
| `/play <canción>` | Reproduce una canción o playlist (nombre o enlace) |
| `/skip` | Salta a la siguiente canción |
| `/skipto <posición>` | Salta directamente a una canción de la cola |
| `/stop` | Detiene la música y vacía la cola |
| `/pause` | Pausa la reproducción |
| `/resume` | Reanuda la reproducción |
| `/queue` | Muestra la cola actual |
| `/nowplaying` | Muestra la canción actual |
| `/shuffle` | Mezcla la cola aleatoriamente |
| `/remove <posición>` | Quita una canción de la cola |
| `/volume <0-100>` | Ajusta el volumen |
| `/loop <modo>` | Repetición: desactivada, canción o cola |
| `/help` | Lista todos los comandos |
| `/uptime` | Tiempo que lleva el bot encendido |
| `/ping` | Latencia del bot |

### Panel de botones

Cada canción aparece con estos controles:

| Botón | Acción |
|---|---|
| ⏯️ | Pausar / reanudar |
| ⏭️ | Saltar canción |
| 🔉 / 🔊 | Bajar / subir volumen (de 10 en 10) |
| 🔁 | Cambiar modo de repetición |
| 🔀 | Mezclar la cola |
| ⏹️ | Detener y vaciar la cola |

Solo pueden usarlos quienes estén en el mismo canal de voz que el bot.

---

## 📝 Notas importantes

**Sobre Spotify.** Spotify usa DRM y no permite transmitir su audio. El bot lee los
*nombres* de las canciones del enlace y reproduce el equivalente desde YouTube, así
que a veces puede sonar otra versión. Sin credenciales de la API de Spotify, de una
lista o álbum se leen como máximo **100 canciones**.

**Sobre las playlists de YouTube.** Usa enlaces del tipo
`youtube.com/playlist?list=...`. Si pegas un enlace de vídeo que además lleva
`&list=...`, se reproduce **solo ese vídeo**.

---

## 📁 Estructura del proyecto

```
.
├── commands/           # Un archivo por cada comando "/"
├── lib/
│   ├── config.js       # Carga de config.json
│   ├── controls.js     # Panel de botones
│   ├── ffmpeg-path.js  # Localiza el ejecutable de FFmpeg
│   ├── ytdlp.js        # Wrapper de yt-dlp
│   ├── ytdlp-plugin.js # Plugin genérico (SoundCloud, Bandcamp, …)
│   └── youtube-ytdlp-plugin.js  # YouTube: búsqueda + audio vía yt-dlp
├── index.js            # Punto de entrada
├── deploy-commands.js  # Registra los comandos en Discord
├── config.json         # Ajustes (sin secretos)
└── .env                # Token y IDs (NO se sube al repositorio)
```

### Añadir un comando nuevo

Crea un archivo en `commands/` con esta forma y ejecuta `npm run deploy`:

```js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ejemplo')
    .setDescription('Descripción del comando'),

  async execute(interaction) {
    await interaction.reply('¡Hola!');
  },
};
```

---

## 🔧 Problemas frecuentes

| Problema | Solución |
|---|---|
| `Used disallowed intents` | Este bot no necesita intents privilegiados; asegúrate de no haber añadido otros a mano en el código |
| `Missing Access` al hacer `deploy` | El bot no está en el servidor, o falta el scope `applications.commands`. Vuelve a invitarlo con la URL del paso 4 |
| `ffmpeg is not installed` | Instala FFmpeg, o indica la ruta con `FFMPEG_PATH` en el `.env` |
| El bot entra al canal pero no se oye nada | Comprueba que tenga permiso **Speak** en ese canal y que no esté silenciado (clic derecho sobre el bot) |
| Los comandos `/` no aparecen | Ejecuta `npm run deploy`. Sin `GUILD_ID` pueden tardar hasta 1 hora |

---

## 📄 Licencia

MIT — puedes usarlo, modificarlo y compartirlo libremente.
