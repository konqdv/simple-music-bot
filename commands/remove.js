const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Quita una canción de la cola')
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

    // songs[0] es la canción sonando, así que la posición 1 del usuario es songs[1].
    const song = queue.songs[posicion];

    if (!song) {
      return interaction.reply({
        content: `❌ No hay ninguna canción en la posición ${posicion}.`,
        ephemeral: true,
      });
    }

    queue.songs.splice(posicion, 1);
    await interaction.reply(`🗑️ Quitada de la cola: **${song.name}**`);
  },
};
