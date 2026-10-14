
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "ping",
  description: "Check VEXORA bot latency",

  async execute(message, client) {
    const embed = new EmbedBuilder()
      .setColor(0x2684ff)
      .setTitle("🏓 VEXORA — Pong!")
      .setDescription(
        `**Bot latency:** ${client.ws.ping} ms\n` +
        `**Status:** 🟢 Online`
      )
      .setFooter({ text: "VEXORA • Utility" })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }
};
