
const {
  EmbedBuilder,
  SlashCommandBuilder
} = require("discord.js");

module.exports = {
  name: "roleinfo",
  description: "Show role information",

  data: new SlashCommandBuilder()
    .setName("roleinfo")
    .setDescription("Show information about a role")
    .addRoleOption(option =>
      option
        .setName("role")
        .setDescription("Role to inspect")
        .setRequired(true)
    ),

  async execute(message, client, args) {
    const role = message.mentions.roles.first()
      || message.guild.roles.cache.get(args[0]);

    if (!role) {
      return message.reply("❌ Mention a role or provide its ID. Example: `!roleinfo @Admin`");
    }

    return sendInfo(message, role);
  },

  async executeSlash(interaction) {
    return sendInfo(interaction, interaction.options.getRole("role"));
  }
};

async function sendInfo(target, role) {
  const embed = new EmbedBuilder()
    .setColor(role.color || 0x2684ff)
    .setTitle(`🎭 ${role.name}`)
    .addFields(
      { name: "Role ID", value: role.id, inline: true },
      { name: "Members", value: `${role.members.size}`, inline: true },
      { name: "Mentionable", value: role.mentionable ? "Yes" : "No", inline: true },
      { name: "Hoisted", value: role.hoist ? "Yes" : "No", inline: true },
      { name: "Position", value: `${role.position}`, inline: true },
      { name: "Color", value: role.hexColor, inline: true }
    )
    .setFooter({ text: "VEXORA • Role Information" })
    .setTimestamp();

  return target.reply({ embeds: [embed] });
}
