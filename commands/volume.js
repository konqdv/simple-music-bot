const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Ajusta el volumen de la música (0-100)')
    .addIntegerOption((option) =>
      option
        .setName('nivel')
        .setDescription('Nivel de volumen entre 0 y 100')
        .setMinValue(0)
        .setMaxValue(100)
        .setRequired(true)
    ),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);
    const nivel = interaction.options.getInteger('nivel');

    if (!queue) {
      return interaction.reply({ content: '❌ No hay nada reproduciéndose ahora mismo.', ephemeral: true });
    }

    queue.setVolume(nivel);
    await interaction.reply(`🔊 Volumen ajustado a **${nivel}%**.`);
  },
};
