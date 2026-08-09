const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Muestra la cola de reproducción actual'),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);

    if (!queue) {
      return interaction.reply({ content: '❌ No hay nada reproduciéndose ahora mismo.', ephemeral: true });
    }

    const lista = queue.songs
      .map((song, index) => `${index === 0 ? '▶️' : `${index}.`} **${song.name}** - \`${song.formattedDuration}\``)
      .slice(0, 15)
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🎶 Cola de reproducción')
      .setDescription(lista)
      .setFooter({ text: `Volumen: ${queue.volume}% | Repetir: ${['Desactivado', 'Canción', 'Cola'][queue.repeatMode]}` });

    await interaction.reply({ embeds: [embed] });
  },
};
