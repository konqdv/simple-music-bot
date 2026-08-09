const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Comprueba la latencia del bot'),

  async execute(interaction) {
    await interaction.reply(`🏓 Pong! Latencia: **${Math.round(interaction.client.ws.ping)}ms**`);
  },
};
