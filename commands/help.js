
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "help",
  description: "Show VEXORA command guide",

  async execute(message) {
    const embed = new EmbedBuilder()
      .setColor(0x2684ff)
      .setTitle("🛡️ VEXORA — Command Center")
      .setDescription(
        "**⚙️ Utility**\n" +
        "`!help` — Show command guide\n" +
        "`!ping` — Check bot latency\n\n" +
        "**👤 Information**\n" +
        "`!userinfo @user` — User details\n" +
        "`!serverinfo` — Server details\n" +
        "`!roleinfo @role` — Role details\n\n" +
        "**🛡️ Moderation**\n" +
        "Moderation commands will be added after the command loader is ready."
      )
      .setFooter({ text: "VEXORA • Security & Server Management" })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }
};
