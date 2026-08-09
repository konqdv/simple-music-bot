const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skipto')
    .setDescription('Salta directamente a una canción de la cola')
    .addIntegerOption((option) =>
      option
        .setName('posicion')
        .setDescription('Posición en la cola (mira /queue). 1 = la siguiente')
        .setMinValue(1)
        .setRequired(true)
    ),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);
    const posicion = interaction.options.getInteger('posicion');

    if (!queue) {
      return interaction.reply({ content: '❌ No hay nada reproduciéndose ahora mismo.', ephemeral: true });
    }

    if (!queue.songs[posicion]) {
      return interaction.reply({
        content: `❌ No hay ninguna canción en la posición ${posicion}.`,
        ephemeral: true,
      });
    }

    try {
      await queue.jump(posicion);
      await interaction.reply(`⏭️ Saltando a: **${queue.songs[0].name}**`);
    } catch (error) {
      await interaction.reply({ content: `❌ ${error.message}`, ephemeral: true });
    }
  },
};
