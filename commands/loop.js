const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Activa/desactiva la repetición')
    .addStringOption((option) =>
      option
        .setName('modo')
        .setDescription('Modo de repetición')
        .setRequired(true)
        .addChoices(
          { name: 'Desactivado', value: 'off' },
          { name: 'Canción actual', value: 'song' },
          { name: 'Cola completa', value: 'queue' }
        )
    ),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);
    const modo = interaction.options.getString('modo');

    if (!queue) {
      return interaction.reply({ content: '❌ No hay nada reproduciéndose ahora mismo.', ephemeral: true });
    }

    const modos = { off: 0, song: 1, queue: 2 };
    queue.setRepeatMode(modos[modo]);

    const nombres = { off: 'Desactivado', song: 'Canción actual 🔂', queue: 'Cola completa 🔁' };
    await interaction.reply(`🔁 Modo de repetición: **${nombres[modo]}**`);
  },
};
