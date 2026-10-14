
const {
  EmbedBuilder,
  SlashCommandBuilder
} = require("discord.js");

module.exports = {
  name: "serverinfo",
  description: "Show server information",

  data: new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Show information about this server"),

  async execute(message) {
    return sendInfo(message, message.guild);
  },

  async executeSlash(interaction) {
    return sendInfo(interaction, interaction.guild);
  }
};

async function sendInfo(target, guild) {
  if (!guild) {
    const reply = { content: "❌ Use this command inside a server." };
    return target.reply(reply);
  }

  const owner = await guild.fetchOwner().catch(() => null);

  const embed = new EmbedBuilder()
    .setColor(0x2684ff)
    .setTitle(`🏰 ${guild.name}`)
    .setThumbnail(guild.iconURL({ size: 256 }))
    .addFields(
      { name: "Server ID", value: guild.id, inline: true },
      { name: "Members", value: `${guild.memberCount}`, inline: true },
      { name: "Owner", value: owner ? `${owner.user.tag}` : "Unavailable", inline: true },
      { name: "Text channels", value: `${guild.channels.cache.filter(c => c.isTextBased()).size}`, inline: true },
      { name: "Roles", value: `${guild.roles.cache.size}`, inline: true },
      { name: "Created", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true }
    )
    .setFooter({ text: "VEXORA • Server Information" })
    .setTimestamp();

  return target.reply({ embeds: [embed] });
}
