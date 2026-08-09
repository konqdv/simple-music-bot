const { SlashCommandBuilder } = require('discord.js');

const formatearTiempo = (ms) => {
  const totalSegundos = Math.floor(ms / 1000);
  const dias = Math.floor(totalSegundos / 86400);
  const horas = Math.floor((totalSegundos % 86400) / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;

  const partes = [];
  if (dias) partes.push(`${dias}d`);
  if (horas) partes.push(`${horas}h`);
  if (minutos) partes.push(`${minutos}m`);
  partes.push(`${segundos}s`);

  return partes.join(' ');
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uptime')
    .setDescription('Muestra cuánto tiempo lleva el bot encendido'),

  async execute(interaction) {
    await interaction.reply(`⏱️ Llevo encendido: **${formatearTiempo(interaction.client.uptime)}**`);
  },
};
