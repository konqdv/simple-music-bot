const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Reanuda la canción pausada'),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);

    if (!queue) {
      return interaction.reply({ content: '❌ No hay nada reproduciéndose ahora mismo.', ephemeral: true });
    }

    if (!queue.paused) {
      return interaction.reply({ content: '⚠️ La música no está pausada.', ephemeral: true });
    }

    queue.resume();
    await interaction.reply('▶️ Música reanudada.');
  },
};
