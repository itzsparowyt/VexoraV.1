// ========================================
// VEXORA BOT — PART 1/3
// Single-file Discord bot (discord.js v14)
// ========================================

const {
  Client,
  GatewayIntentBits,
  Events,
  ActivityType,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const PREFIX = process.env.PREFIX || "!";

if (!TOKEN) {
  console.error("ERROR: DISCORD_TOKEN environment variable is missing.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const BLUE = 0x2589ff;

function makeEmbed(title, description, color = BLUE) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: "VEXORA • Discord Security Bot" })
    .setTimestamp();
}

async function replyMessage(message, title, description, color = BLUE) {
  return message.reply({
    embeds: [makeEmbed(title, description, color)]
  });
}

async function replyInteraction(interaction, title, description, color = BLUE) {
  const payload = {
    embeds: [makeEmbed(title, description, color)],
    ephemeral: true
  };

  if (interaction.replied || interaction.deferred) {
    return interaction.followUp(payload);
  }

  return interaction.reply(payload);
}

const prefixCommands = new Map();

function command(name, description, execute) {
  prefixCommands.set(name, { name, description, execute });
}

// ---------- BASIC COMMANDS ----------

command("ping", "Check bot latency", async (message) => {
  await replyMessage(
    message,
    "🏓 Pong!",
    `WebSocket latency: **${client.ws.ping} ms**`
  );
});

command("splash", "Show VEXORA splash screen", async (message) => {
  const embed = new EmbedBuilder()
    .setColor(0x1677ff)
    .setTitle("⚡ V E X O R A")
    .setDescription(
      "**Security • Moderation • Management**\n\n" +
      "Your server, protected and organized.\n\n" +
      `Prefix: \`${PREFIX}\`\n` +
      `Commands loaded: **${prefixCommands.size}**`
    )
    .setThumbnail(client.user.displayAvatarURL())
    .setFooter({ text: "VEXORA • Ready to protect your server" })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
});

command("help", "Show available commands", async (message) => {
  const list = [...prefixCommands.keys()]
    .map((name) => `\`${PREFIX}${name}\``)
    .join(" • ");

  await replyMessage(message, "📚 VEXORA Commands", list);
});

command("about", "About VEXORA", async (message) => {
  await replyMessage(
    message,
    "ℹ️ About VEXORA",
    "VEXORA is a Discord bot for moderation, security and server utilities."
  );
});

command("serverinfo", "Show server information", async (message) => {
  if (!message.guild) {
    return replyMessage(message, "Server Info", "Use this command in a server.");
  }

  await replyMessage(
    message,
    `📊 ${message.guild.name}`,
    `**Members:** ${message.guild.memberCount}\n` +
    `**Server ID:** ${message.guild.id}\n` +
    `**Created:** <t:${Math.floor(message.guild.createdTimestamp / 1000)}:D>`
  );
});

command("userinfo", "Show user information", async (message) => {
  const member = message.mentions.members.first() || message.member;

  if (!member) {
    return replyMessage(message, "User Info", "User not found.");
  }

  await replyMessage(
    message,
    `👤 ${member.user.tag}`,
    `**User ID:** ${member.id}\n` +
    `**Joined:** ${member.joinedTimestamp
      ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
      : "Unknown"}\n` +
    `**Account created:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:D>`
  );
});

command("avatar", "Show your or a mentioned user's avatar", async (message) => {
  const user = message.mentions.users.first() || message.author;
  const embed = makeEmbed(`🖼️ ${user.username}'s Avatar`, `[Open avatar](${user.displayAvatarURL({ size: 1024 })})`)
    .setImage(user.displayAvatarURL({ size: 1024 }));

  await message.reply({ embeds: [embed] });
});

command("botinfo", "Show bot information", async (message) => {
  await replyMessage(
    message,
    "🤖 VEXORA Bot Info",
    `**Bot:** ${client.user.tag}\n` +
    `**Servers:** ${client.guilds.cache.size}\n` +
    `**Users cached:** ${client.users.cache.size}\n` +
    `**Prefix:** \`${PREFIX}\``
  );
});

command("uptime", "Show bot uptime", async (message) => {
  const seconds = Math.floor((client.uptime || 0) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;

  await replyMessage(
    message,
    "⏱️ Bot Uptime",
    `${hours}h ${minutes}m ${remaining}s`
  );
});

command("invite", "Show bot invite link", async (message) => {
  const url = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=bot%20applications.commands&permissions=8`;
  await replyMessage(message, "🔗 Invite VEXORA", `[Click here to invite VEXORA](${url})`);
});

// ---------- MODERATION COMMANDS ----------

command("kick", "Kick a mentioned member", async (message, args) => {
  if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
    return replyMessage(message, "⛔ Permission Denied", "You need **Kick Members** permission.", 0xff4444);
  }

  const member = message.mentions.members.first();

  if (!member) {
    return replyMessage(message, "Usage", `\`${PREFIX}kick @member [reason]\``);
  }

  if (!member.kickable) {
    return replyMessage(message, "Cannot Kick", "I cannot kick that member. Check role hierarchy and my permissions.", 0xff4444);
  }

  const reason = args.slice(1).join(" ") || "No reason provided";

  await member.kick(reason);
  await replyMessage(message, "👢 Member Kicked", `**Member:** ${member.user.tag}\n**Reason:** ${reason}`);
});

command("ban", "Ban a mentioned member", async (message, args) => {
  if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
    return replyMessage(message, "⛔ Permission Denied", "You need **Ban Members** permission.", 0xff4444);
  }

  const member = message.mentions.members.first();

  if (!member) {
    return replyMessage(message, "Usage", `\`${PREFIX}ban @member [reason]\``);
  }

  if (!member.bannable) {
    return replyMessage(message, "Cannot Ban", "I cannot ban that member. Check role hierarchy and my permissions.", 0xff4444);
  }

  const reason = args.slice(1).join(" ") || "No reason provided";

  await member.ban({ reason });
  await replyMessage(message, "🔨 Member Banned", `**Member:** ${member.user.tag}\n**Reason:** ${reason}`);
});

command("purge", "Delete recent messages", async (message, args) => {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return replyMessage(message, "⛔ Permission Denied", "You need **Manage Messages** permission.", 0xff4444);
  }

  const amount = Number(args[0]);

  if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
    return replyMessage(message, "Usage", `Use \`${PREFIX}purge 1-100\`.`);
  }

  if (!message.channel.isTextBased() || !message.channel.bulkDelete) {
    return replyMessage(message, "Error", "This channel does not support bulk deletion.");
  }

  try {
    const deleted = await message.channel.bulkDelete(amount, true);
    await replyMessage(message, "🧹 Messages Deleted", `Deleted **${deleted.size}** recent messages.`);
  } catch {
    await replyMessage(message, "Error", "Could not delete messages. Check permissions and channel type.", 0xff4444);
  }
});

command("lock", "Lock the current channel", async (message) => {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return replyMessage(message, "⛔ Permission Denied", "You need **Manage Channels** permission.", 0xff4444);
  }

  await message.channel.permissionOverwrites.edit(
    message.guild.roles.everyone,
    { SendMessages: false }
  );

  await replyMessage(message, "🔒 Channel Locked", "Members can no longer send messages here.");
});

command("unlock", "Unlock the current channel", async (message) => {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return replyMessage(message, "⛔ Permission Denied", "You need **Manage Channels** permission.", 0xff4444);
  }

  await message.channel.permissionOverwrites.edit(
    message.guild.roles.everyone,
    { SendMessages: null }
  );

  await replyMessage(message, "🔓 Channel Unlocked", "The default send-message permission has been restored.");
});

command("slowmode", "Set channel slowmode in seconds", async (message, args) => {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return replyMessage(message, "⛔ Permission Denied", "You need **Manage Channels** permission.", 0xff4444);
  }

  const seconds = Number(args[0]);

  if (!Number.isInteger(seconds) || seconds < 0 || seconds > 21600) {
    return replyMessage(message, "Usage", `Use \`${PREFIX}slowmode 0-21600\`.`);
  }

  await message.channel.setRateLimitPerUser(seconds);
  await replyMessage(message, "🐢 Slowmode Updated", `Slowmode set to **${seconds} seconds**.`);
});

command("timeout", "Timeout a mentioned member", async (message, args) => {
  if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
    return replyMessage(message, "⛔ Permission Denied", "You need **Moderate Members** permission.", 0xff4444);
  }

  const member = message.mentions.members.first();
  const minutes = Number(args[1]);

  if (!member || !Number.isInteger(minutes) || minutes < 1 || minutes > 40320) {
    return replyMessage(message, "Usage", `\`${PREFIX}timeout @member minutes [reason]\``);
  }

  if (!member.moderatable) {
    return replyMessage(message, "Cannot Timeout", "I cannot timeout that member. Check role hierarchy and permissions.", 0xff4444);
  }

  const reason = args.slice(2).join(" ") || "No reason provided";
  await member.timeout(minutes * 60 * 1000, reason);

  await replyMessage(
    message,
    "🔇 Member Timed Out",
    `**Member:** ${member.user.tag}\n**Duration:** ${minutes} minutes\n**Reason:** ${reason}`
  );
});

// ---------- PREFIX COMMAND HANDLER ----------

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const name = (args.shift() || "").toLowerCase();

  const selected = prefixCommands.get(name);
  if (!selected) return;

  try {
    await selected.execute(message, args);
  } catch (error) {
    console.error(`Command ${name} failed:`, error);
    await message.reply({
      embeds: [makeEmbed("❌ Command Error", "The command failed. Check bot permissions and hosting logs.", 0xff4444)]
    }).catch(() => {});
  }
});

// ---------- SLASH COMMANDS ----------

const slashCommands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check VEXORA latency"),

  new SlashCommandBuilder()
    .setName("splash")
    .setDescription("Show the VEXORA splash screen"),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show VEXORA command help"),

  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Show server information"),

  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Show your user information")
].map((item) => item.toJSON());

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    switch (interaction.commandName) {
      case "ping":
        await replyInteraction(interaction, "🏓 Pong!", `WebSocket latency: **${client.ws.ping} ms**`);
        break;

      case "splash":
        await replyInteraction(
          interaction,
          "⚡ V E X O R A",
          "Security • Moderation • Management\n\n" +
          `Prefix: \`${PREFIX}\`\n` +
          `Commands loaded: **${prefixCommands.size}**`
        );
        break;

      case "help":
        await replyInteraction(
          interaction,
          "📚 VEXORA Help",
          [...prefixCommands.keys()].map((name) => `\`${PREFIX}${name}\``).join(" • ")
        );
        break;

      case "serverinfo":
        if (!interaction.guild) {
          await replyInteraction(interaction, "Server Info", "Use this command inside a server.");
          break;
        }

        await replyInteraction(
          interaction,
          `📊 ${interaction.guild.name}`,
          `**Members:** ${interaction.guild.memberCount}\n**Server ID:** ${interaction.guild.id}`
        );
        break;

      case "userinfo":
        await replyInteraction(
          interaction,
          `👤 ${interaction.user.tag}`,
          `**User ID:** ${interaction.user.id}\n` +
          `**Account created:** <t:${Math.floor(interaction.user.createdTimestamp / 1000)}:D>`
        );
        break;
    }
  } catch (error) {
    console.error("Slash command failed:", error);
    await replyInteraction(interaction, "❌ Error", "The command could not be completed.", 0xff4444).catch(() => {});
  }
});

// ---------- STARTUP AND SLASH REGISTRATION ----------

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`VEXORA online: ${readyClient.user.tag}`);
  console.log(`Prefix: ${PREFIX}`);
  console.log(`Prefix commands loaded: ${prefixCommands.size}`);

  readyClient.user.setPresence({
    activities: [{ name: `${PREFIX}help | VEXORA Security`, type: ActivityType.Watching }],
    status: "online"
  });

  // Register slash commands to a test server when IDs are configured.
  if (CLIENT_ID && GUILD_ID) {
    try {
      const rest = new REST({ version: "10" }).setToken(TOKEN);

      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: slashCommands }
      );

      console.log("VEXORA slash commands registered to the configured test server.");
    } catch (error) {
      console.error("Slash command registration failed:", error);
    }
  } else {
    console.log("Slash registration skipped: set DISCORD_CLIENT_ID and DISCORD_GUILD_ID.");
  }
});

client.login(TOKEN);
