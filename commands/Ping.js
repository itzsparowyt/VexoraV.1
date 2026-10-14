
const {
  EmbedBuilder,
  SlashCommandBuilder
} = require("discord.js");

module.exports = {
  name: "ping",
  description: "Check VEXORA latency",

  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check VEXORA bot latency"),

  async execute(message, client) {
    const embed = new EmbedBuilder()
      .setColor(0x2684ff)
      .setTitle("🏓 VEXORA — Pong!")
      .setDescription(
        `**WebSocket latency:** ${client.ws.ping} ms\n` +
        "**Status:** 🟢 Online"
      )
      .setFooter({ text: "VEXORA • Utility" })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction, client) {
    const embed = new EmbedBuilder()
      .setColor(0x2684ff)
      .setTitle("🏓 VEXORA — Pong!")
      .setDescription(
        `**WebSocket latency:** ${client.ws.ping} ms\n` +
        "**Status:** 🟢 Online"
      )
      .setFooter({ text: "VEXORA • Utility" })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
