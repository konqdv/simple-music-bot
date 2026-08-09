const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Muestra todos los comandos disponibles'),

  async execute(interaction) {
    const comandos = [...interaction.client.commands.values()]
      .map((comando) => `**/${comando.data.name}** — ${comando.data.description}`)
      .sort()
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('📖 Comandos disponibles')
      .setDescription(comandos)
      .setFooter({ text: 'También puedes usar los botones del mensaje de reproducción.' });

    await interaction.reply({ embeds: [embed] });
  },
};
