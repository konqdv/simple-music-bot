const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pausa la canción actual'),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);

    if (!queue) {
      return interaction.reply({ content: '❌ No hay nada reproduciéndose ahora mismo.', ephemeral: true });
    }

    if (queue.paused) {
      return interaction.reply({ content: '⚠️ La música ya está pausada.', ephemeral: true });
    }

    queue.pause();
    await interaction.reply('⏸️ Música pausada.');
  },
};
