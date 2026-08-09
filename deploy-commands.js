require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('❌ Faltan DISCORD_TOKEN o CLIENT_ID en el archivo .env');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command?.data) {
    commands.push(command.data.toJSON());
  }
}

const rest = new REST().setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log(`⏳ Registrando ${commands.length} comandos (/)...`);

    // Si defines GUILD_ID, los comandos se registran solo en ese servidor
    // (instantáneo, ideal para desarrollo/pruebas).
    // Si lo dejas vacío, se registran de forma global (tarda hasta 1 hora en propagarse).
    const route = GUILD_ID
      ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
      : Routes.applicationCommands(CLIENT_ID);

    const data = await rest.put(route, { body: commands });

    console.log(`✅ ${data.length} comandos registrados correctamente.`);
  } catch (error) {
    console.error('❌ Error al registrar comandos:', error);
  }
})();
