
const {
  EmbedBuilder,
  SlashCommandBuilder
} = require("discord.js");

function makeSplash(title, message, color) {
  const safeColor = /^#?[0-9a-fA-F]{6}$/.test(color || "")
    ? parseInt((color || "2684ff").replace("#", ""), 16)
    : 0x2684ff;

  return new EmbedBuilder()
    .setColor(safeColor)
    .setTitle(title.slice(0, 256))
    .setDescription(message.slice(0, 4000))
    .setFooter({ text: "VEXORA • Custom Splash" })
    .setTimestamp();
}

module.exports = {
  name: "splash",
  description: "Create a custom VEXORA splash embed",

  data: new SlashCommandBuilder()
    .setName("splash")
    .setDescription("Create a custom VEXORA splash embed")
    .addStringOption(option =>
      option.setName("title")
        .setDescription("Splash title")
        .setRequired(true)
        .setMaxLength(256))
    .addStringOption(option =>
      option.setName("message")
        .setDescription("Splash message")
        .setRequired(true)
        .setMaxLength(4000))
    .addStringOption(option =>
      option.setName("color")
        .setDescription("Hex colour, e.g. #2684ff")
        .setRequired(false)),

  async execute(message, client, args) {
    const parts = args.join(" ").split("|").map(x => x.trim());

    if (!parts[0] || !parts[1]) {
      return message.reply(
        "Usage: `!splash Title | Your message | #2684ff`"
      );
    }

    return message.reply({
      embeds: [
        makeSplash(parts[0], parts[1], parts[2] || "#2684ff")
      ]
    });
  },

  async executeSlash(interaction) {
    const title = interaction.options.getString("title");
    const message = interaction.options.getString("message");
    const color = interaction.options.getString("color") || "#2684ff";

    return interaction.reply({
      embeds: [makeSplash(title, message, color)]
    });
  }
};
