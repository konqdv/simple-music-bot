const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Salta a la siguiente canción de la cola'),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);

    if (!queue) {
      return interaction.reply({ content: '❌ No hay nada reproduciéndose ahora mismo.', ephemeral: true });
    }

    try {
      const song = queue.songs[1];
      await queue.skip();
      await interaction.reply(song ? `⏭️ Saltado a: **${song.name}**` : '⏭️ Canción saltada.');
    } catch (error) {
      await interaction.reply({ content: `❌ ${error.message}`, ephemeral: true });
    }
  },
};
