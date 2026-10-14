
const {
  EmbedBuilder,
  SlashCommandBuilder,
  User
} = require("discord.js");

module.exports = {
  name: "userinfo",
  description: "Show user information",

  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Show information about a user")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("User to inspect")
        .setRequired(false)
    ),

  async execute(message, client, args) {
    const member = message.mentions.members.first()
      || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);

    const user = member?.user || message.mentions.users.first()
      || message.author;

    return sendInfo(message, user, member);
  },

  async executeSlash(interaction) {
    const user = interaction.options.getUser("user") || interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    return sendInfo(interaction, user, member);
  }
};

async function sendInfo(target, user, member) {
  const embed = new EmbedBuilder()
    .setColor(0x2684ff)
    .setTitle(`👤 ${user.tag}`)
    .setThumbnail(user.displayAvatarURL({ size: 256 }))
    .addFields(
      { name: "User ID", value: user.id, inline: true },
      { name: "Bot account", value: user.bot ? "Yes" : "No", inline: true },
      { name: "Account created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`, inline: true },
      {
        name: "Joined server",
        value: member?.joinedTimestamp
          ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`
          : "Not available",
        inline: true
      },
      {
        name: "Highest role",
        value: member?.roles?.highest?.toString() || "Not available",
        inline: true
      }
    )
    .setFooter({ text: "VEXORA • User Information" })
    .setTimestamp();

  return target.reply({ embeds: [embed] });
}
