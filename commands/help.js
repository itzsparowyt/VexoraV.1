
const {
  EmbedBuilder,
  SlashCommandBuilder
} = require("discord.js");

module.exports = {
  name: "help",
  description: "Show VEXORA command guide",

  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show VEXORA command guide"),

  async execute(message, client) {
    return sendHelp(message, client, false);
  },

  async executeSlash(interaction, client) {
    return sendHelp(interaction, client, true);
  }
};

async function sendHelp(target, client, isSlash) {
  const commands = [...client.commands.values()]
    .map(command => `\`!${command.name}\` — ${command.description || "VEXORA command"}`)
    .join("\n");

  const embed = new EmbedBuilder()
    .setColor(0x2684ff)
    .setTitle("🛡️ VEXORA — Command Center")
    .setDescription(
      `**Prefix:** \`!\`\n` +
      `**Commands loaded:** ${client.commands.size}\n\n` +
      (commands || "No commands loaded yet.")
    )
    .setFooter({ text: "VEXORA • Security & Server Management" })
    .setTimestamp();

  if (isSlash) {
    return target.reply({ embeds: [embed] });
  }

  return target.reply({ embeds: [embed] });
}
