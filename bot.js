
const {
  Client, GatewayIntentBits, Events, EmbedBuilder,
  SlashCommandBuilder, PermissionFlagsBits, REST, Routes
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const PREFIX = process.env.PREFIX || "!";
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!TOKEN) throw new Error("DISCORD_TOKEN is missing.");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const commands = [
  new SlashCommandBuilder()
    .setName("ping").setDescription("Check bot latency"),

  new SlashCommandBuilder()
    .setName("help").setDescription("Show VEXORA commands"),

  new SlashCommandBuilder()
    .setName("serverinfo").setDescription("Show server information"),

  new SlashCommandBuilder()
    .setName("userinfo").setDescription("Show user information")
    .addUserOption(o => o.setName("user").setDescription("User to inspect")),

  new SlashCommandBuilder()
    .setName("kick").setDescription("Kick a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(o => o.setName("user").setDescription("Member").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason")),

  new SlashCommandBuilder()
    .setName("ban").setDescription("Ban a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o => o.setName("user").setDescription("Member").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason")),

  new SlashCommandBuilder()
    .setName("timeout").setDescription("Timeout a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName("user").setDescription("Member").setRequired(true))
    .addIntegerOption(o => o.setName("minutes").setDescription("Duration in minutes").setRequired(true).setMinValue(1).setMaxValue(40320))
    .addStringOption(o => o.setName("reason").setDescription("Reason")),

  new SlashCommandBuilder()
    .setName("purge").setDescription("Delete recent messages")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(o => o.setName("amount").setDescription("Number from 1 to 100").setRequired(true).setMinValue(1).setMaxValue(100))
].map(c => c.toJSON());

function embed(title, description, color = 0x2684ff) {
  return new EmbedBuilder()
    .setColor(color).setTitle(title)
    .setDescription(description)
    .setFooter({ text: "VEXORA • Server Management" })
    .setTimestamp();
}

async function runCommand(name, ctx, args = [], slash = false) {
  const guild = ctx.guild;
  const member = slash ? ctx.member : ctx.member;
  const user = slash ? ctx.user : ctx.author;
  const optionUser = key => slash ? ctx.options.getUser(key) : null;
  const optionString = key => slash ? ctx.options.getString(key) : null;
  const optionInt = key => slash ? ctx.options.getInteger(key) : null;

  const reply = async data => {
    if (!slash) return ctx.reply(data);
    if (ctx.replied || ctx.deferred) return ctx.followUp(data);
    return ctx.reply(data);
  };

  if (name === "ping") {
    return reply({ embeds: [embed("🏓 VEXORA Pong!", `WebSocket latency: **${client.ws.ping} ms**`)] });
  }

  if (name === "help") {
    return reply({ embeds: [embed("🛡️ VEXORA Commands",
      "`!ping` / `/ping` — Latency\n" +
      "`!help` / `/help` — Command guide\n" +
      "`!serverinfo` / `/serverinfo` — Server details\n" +
      "`!userinfo [@user]` / `/userinfo` — User details\n" +
      "`!kick @user [reason]` / `/kick` — Kick\n" +
      "`!ban @user [reason]` / `/ban` — Ban\n" +
      "`!timeout @user minutes [reason]` / `/timeout` — Timeout\n" +
      "`!purge amount` / `/purge` — Delete messages"
    )] });
  }

  if (!guild) return reply({ content: "❌ Use this command inside a server." });

  if (name === "serverinfo") {
    const owner = await guild.fetchOwner().catch(() => null);
    return reply({ embeds: [embed(`🏰 ${guild.name}`,
      `**Server ID:** ${guild.id}\n**Members:** ${guild.memberCount}\n` +
      `**Owner:** ${owner?.user.tag || "Unavailable"}\n` +
      `**Roles:** ${guild.roles.cache.size}\n` +
      `**Created:** <t:${Math.floor(guild.createdTimestamp / 1000)}:D>`
    )] });
  }

  if (name === "userinfo") {
    const target = optionUser("user") ||
      (!slash ? (ctx.mentions.users.first() || user) : user);
    const targetMember = await guild.members.fetch(target.id).catch(() => null);

    return reply({ embeds: [new EmbedBuilder()
      .setColor(0x2684ff).setTitle(`👤 ${target.tag}`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: "User ID", value: target.id },
        { name: "Bot", value: target.bot ? "Yes" : "No", inline: true },
        { name: "Joined server", value: targetMember?.joinedTimestamp ? `<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:D>` : "Unavailable", inline: true }
      ).setTimestamp()] });
  }

  const settings = {
    kick: { permission: PermissionFlagsBits.KickMembers, label: "kick" },
    ban: { permission: PermissionFlagsBits.BanMembers, label: "ban" },
    timeout: { permission: PermissionFlagsBits.ModerateMembers, label: "timeout" },
    purge: { permission: PermissionFlagsBits.ManageMessages, label: "purge" }
  }[name];

  if (!settings) return;

  if (!member.permissions.has(settings.permission)) {
    return reply({ content: "❌ You don't have permission to use this command." });
  }

  if (name === "purge") {
    const amount = slash ? optionInt("amount") : Number(args[0]);
    if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
      return reply({ content: "❌ Use a number from 1 to 100." });
    }
    if (!ctx.channel?.isTextBased() || !ctx.channel.bulkDelete) {
      return reply({ content: "❌ This channel doesn't support bulk deletion." });
    }
    const deleted = await ctx.channel.bulkDelete(amount, true);
    return reply({ embeds: [embed("🧹 Messages Purged", `Deleted **${deleted.size}** recent messages.`, 0x2ecc71)] });
  }

  const targetUser = slash ? optionUser("user") :
    (ctx.mentions.users.first() ||
      (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null));

  if (!targetUser) return reply({ content: `❌ Mention a member. Usage: \`!${name} @user\`` });

  const target = await guild.members.fetch(targetUser.id).catch(() => null);
  if (!target) return reply({ content: "❌ Member not found in this server." });

  if (target.id === user.id) return reply({ content: "❌ You cannot use this command on yourself." });
  if (target.id === client.user.id) return reply({ content: "❌ I cannot moderate myself." });
  if (target.id === guild.ownerId) return reply({ content: "❌ The server owner cannot be moderated by this command." });

  if (member.roles.highest.comparePositionTo(target.roles.highest) <= 0 &&
      user.id !== guild.ownerId) {
    return reply({ content: "❌ Your highest role must be above the target's role." });
  }

  if (!target.moderatable && name === "timeout") {
    return reply({ content: "❌ I cannot timeout this member. Check my role position and permissions." });
  }
  if (name === "kick" && !target.kickable) return reply({ content: "❌ I cannot kick this member." });
  if (name === "ban" && !target.bannable) return reply({ content: "❌ I cannot ban this member." });

  let reason, duration;
  if (slash) {
    reason = optionString("reason") || "No reason provided";
    duration = optionInt("minutes");
  } else {
    duration = name === "timeout" ? Number(args[1]) : null;
    reason = args.slice(name === "timeout" ? 2 : 1).join(" ") || "No reason provided";
  }

  try {
    if (name === "kick") await target.kick(reason);
    if (name === "ban") await target.ban({ reason });
    if (name === "timeout") {
      if (!Number.isInteger(duration) || duration < 1 || duration > 40320) {
        return reply({ content: "❌ Timeout must be 1–40320 minutes." });
      }
      await target.timeout(duration * 60 * 1000, reason);
    }

    return reply({ embeds: [embed(
      `✅ Member ${name === "timeout" ? "Timed Out" : name === "kick" ? "Kicked" : "Banned"}`,
      `**Member:** ${target.user.tag}\n**Moderator:** ${user.tag}\n**Reason:** ${reason}`,
      0x2ecc71
    )] });
  } catch (error) {
    console.error(`${name} failed:`, error);
    return reply({ content: "❌ Action failed. Check bot permissions and role hierarchy." });
  }
}

client.once(Events.ClientReady, async ready => {
  console.log(`VEXORA online: ${ready.user.tag}`);

  ready.user.setPresence({
    activities: [{ name: `${PREFIX}help | VEXORA`, type: ActivityType.Watching }],
    status: "online"
  });

  if (CLIENT_ID && GUILD_ID) {
    try {
      const rest = new REST({ version: "10" }).setToken(TOKEN);
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands
      });
      console.log(`Registered ${commands.length} guild slash commands.`);
    } catch (error) {
      console.error("Slash registration failed:", error);
    }
  } else {
    console.log("Slash registration skipped: set DISCORD_CLIENT_ID and DISCORD_GUILD_ID.");
  }
});

client.on(Events.MessageCreate, async message => {
  if (message.author.bot || !message.guild || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const name = (args.shift() || "").toLowerCase();
  if (!name) return;

  try {
    await runCommand(name, message, args, false);
  } catch (error) {
    console.error("Prefix command error:", error);
    await message.reply("❌ Command failed. Check hosting logs.");
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    await runCommand(interaction.commandName, interaction, [], true);
  } catch (error) {
    console.error("Slash command error:", error);
    const response = { content: "❌ Command failed. Check hosting logs.", ephemeral: true };
    if (interaction.replied || interaction.deferred) await interaction.followUp(response);
    else await interaction.reply(response);
  }
});

client.login(TOKEN).catch(error => {
  console.error("VEXORA login failed:", error);
  process.exit(1);
});
