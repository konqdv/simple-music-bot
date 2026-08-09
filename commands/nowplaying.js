const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Muestra la canción que se está reproduciendo actualmente'),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);

    if (!queue) {
      return interaction.reply({ content: '❌ No hay nada reproduciéndose ahora mismo.', ephemeral: true });
    }

    const song = queue.songs[0];
    if (!song) {
      return interaction.reply({ content: '❌ No hay nada reproduciéndose ahora mismo.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🎧 Sonando ahora')
      .setDescription(`**${song.name}**`)
      .addFields(
        { name: 'Duración', value: song.formattedDuration, inline: true },
        { name: 'Pedida por', value: `${song.user}`, inline: true }
      )
      .setThumbnail(song.thumbnail);

    await interaction.reply({ embeds: [embed] });
  },
};
