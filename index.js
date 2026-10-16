const {
  Client,
  GatewayIntentBits,
  Events,
  ActivityType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  PermissionFlagsBits,
  REST,
  Routes
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const PREFIX = process.env.PREFIX || "!";
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!TOKEN) {
  throw new Error("Missing DISCORD_TOKEN environment variable.");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Warnings reset when the bot restarts.
const warningStore = new Map();

const slashCommands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check VEXORA latency"),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show VEXORA command pages"),

  new SlashCommandBuilder()
    .setName("splash")
    .setDescription("Show the official VEXORA splash card"),

  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Show server information"),

  new SlashCommandBuilder()
    .setName("membercount")
    .setDescription("Show server member statistics"),

  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Show user information")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("User to inspect")
    ),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a server member")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(option =>
      option.setName("user")
        .setDescription("Member to kick")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason")
        .setDescription("Reason")
        .setMaxLength(500)
    ),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(option =>
      option.setName("user")
        .setDescription("User to ban")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason")
        .setDescription("Reason")
        .setMaxLength(500)
    ),

  new SlashCommandBuilder()
    .setName("softban")
    .setDescription("Ban and immediately unban a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(option =>
      option.setName("user")
        .setDescription("Member to softban")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason")
        .setDescription("Reason")
        .setMaxLength(500)
    ),

  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Issue a member warning")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(option =>
      option.setName("user")
        .setDescription("Member to warn")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason")
        .setDescription("Reason")
        .setMaxLength(500)
    ),

  new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("Show warnings for a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(option =>
      option.setName("user")
        .setDescription("Member whose warnings to view")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option.setName("user")
        .setDescription("Member")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName("minutes")
        .setDescription("Minutes, 1–40320")
        .setMinValue(1)
        .setMaxValue(40320)
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason")
        .setDescription("Reason")
        .setMaxLength(500)
    ),

  new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Delete recent messages")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(option =>
      option.setName("amount")
        .setDescription("Amount, 1–100")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
].map(command => command.toJSON());

function makeEmbed(title, description, color = 0x5865F2) {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setFooter({
      text: "VEXORA • Server Management & Security"
    })
    .setTimestamp();

  if (client.user) {
    embed.setAuthor({
      name: "VEXORA • System",
      iconURL: client.user.displayAvatarURL()
    });
  }

  return embed;
}

function helpPayload(page = 1) {
  const pages = [
    {
      title: "Utility",
      lines: [
        `\`${PREFIX}ping\` / \`/ping\` — latency`,
        `\`${PREFIX}help\` / \`/help\` — command pages`,
        `\`${PREFIX}splash\` / \`/splash\` — official splash`,
        `\`${PREFIX}serverinfo\` / \`/serverinfo\` — server details`,
        `\`${PREFIX}membercount\` / \`/membercount\` — member stats`,
        `\`${PREFIX}userinfo [@user]\` / \`/userinfo\` — user profile`
      ]
    },
    {
      title: "Moderation",
      lines: [
        `\`${PREFIX}kick @user [reason]\` / \`/kick\``,
        `\`${PREFIX}ban @user [reason]\` / \`/ban\``,
        `\`${PREFIX}softban @user [reason]\` / \`/softban\``,
        `\`${PREFIX}warn @user [reason]\` / \`/warn\``,
        `\`${PREFIX}warnings @user\` / \`/warnings\``,
        `\`${PREFIX}timeout @user minutes [reason]\` / \`/timeout\``,
        `\`${PREFIX}purge 1-100\` / \`/purge\``
      ]
    }
  ];

  const totalPages = pages.length;
  page = Math.max(1, Math.min(Number(page) || 1, totalPages));

  const selected = pages[page - 1];

  const embed = makeEmbed(
    `📚 VEXORA Command Center • ${selected.title}`,
    selected.lines.join("\n")
  ).setFooter({
    text: `Page ${page}/${totalPages} • VEXORA Command Center`
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`vexhelp:${page - 1}`)
      .setLabel("Previous")
      .setEmoji("◀️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 1),

    new ButtonBuilder()
      .setCustomId(`vexhelp:${page + 1}`)
      .setLabel("Next")
      .setEmoji("▶️")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === totalPages)
  );

  return {
    embeds: [embed],
    components: [row]
  };
}

function warnKey(guildId, userId) {
  return `${guildId}:${userId}`;
}

async function dispatch(name, ctx, args = [], slash = false) {
  const guild = ctx.guild;
  const actor = slash ? ctx.user : ctx.author;

  const actorMember = guild
    ? (
        slash
          ? await guild.members.fetch(actor.id).catch(() => null)
          : ctx.member
      )
    : null;

  const reply = async payload => {
    if (typeof payload === "string") {
      payload = {
        embeds: [makeEmbed("VEXORA", payload)]
      };
    }

    if (!slash) {
      return ctx.reply(payload);
    }

    if (ctx.replied || ctx.deferred) {
      return ctx.followUp(payload);
    }

    return ctx.reply(payload);
  };

  const getUser = key =>
    slash ? ctx.options.getUser(key) : null;

  const getString = key =>
    slash ? ctx.options.getString(key) : null;

  const getInt = key =>
    slash ? ctx.options.getInteger(key) : null;

  // PING
  if (name === "ping") {
    return reply({
      embeds: [
        makeEmbed(
          "🏓 VEXORA — Pong!",
          `**WebSocket latency:** ${client.ws.ping} ms\n**Status:** 🟢 Online`,
          0x57F287
        )
      ]
    });
  }

  // HELP
  if (name === "help") {
    const page = slash ? 1 : Number(args[0]) || 1;
    return reply(helpPayload(page));
  }

  // SPLASH — PREFIX AND SLASH
  if (name === "splash") {
    const embed = makeEmbed(
      "✦ V E X O R A",
      "**SECURITY • MODERATION • MANAGEMENT**\n\n" +
      "Welcome to VEXORA.\n" +
      "Professional tools for your Discord server.",
      0x5865F2
    )
      .setThumbnail(client.user.displayAvatarURL({ size: 512 }))
      .addFields(
        {
          name: "🟢 System Status",
          value: "Online",
          inline: true
        },
        {
          name: "⚙️ Slash Commands",
          value: String(slashCommands.length),
          inline: true
        }
      );

    return reply({ embeds: [embed] });
  }

  // BOT MUST BE IN A SERVER FOR THESE COMMANDS
  if (!guild) {
    return reply({
      embeds: [
        makeEmbed(
          "❌ Server Required",
          "Use this command inside a Discord server.",
          0xED4245
        )
      ]
    });
  }

  // SERVER INFO
  if (name === "serverinfo") {
    const owner = await guild.fetchOwner().catch(() => null);

    const embed = makeEmbed(
      `🏰 ${guild.name}`,
      [
        `**Server ID:** \`${guild.id}\``,
        `**Members:** ${guild.memberCount.toLocaleString()}`,
        `**Owner:** ${owner?.user.tag || "Unavailable"}`,
        `**Roles:** ${guild.roles.cache.size}`,
        `**Channels:** ${guild.channels.cache.size}`,
        `**Created:** <t:${Math.floor(guild.createdTimestamp / 1000)}:D>`
      ].join("\n")
    );

    const icon = guild.iconURL({ size: 256 });
    if (icon) embed.setThumbnail(icon);

    return reply({ embeds: [embed] });
  }

  // MEMBER COUNT
  if (name === "membercount") {
    await guild.members.fetch().catch(() => null);

    const members = guild.members.cache;
    const humans = members.filter(m => !m.user.bot).size;
    const bots = members.filter(m => m.user.bot).size;

    const embed = makeEmbed(
      `👥 ${guild.name} • Member Statistics`,
      "Current server membership overview."
    ).addFields(
      {
        name: "Total Members",
        value: `**${guild.memberCount.toLocaleString()}**`,
        inline: true
      },
      {
        name: "👤 Humans",
        value: `**${humans.toLocaleString()}**`,
        inline: true
      },
      {
        name: "🤖 Bots",
        value: `**${bots.toLocaleString()}**`,
        inline: true
      },
      {
        name: "🚀 Server Boosts",
        value: `**${guild.premiumSubscriptionCount ?? 0}**`,
        inline: true
      },
      {
        name: "💎 Boost Level",
        value: `**Level ${guild.premiumTier}**`,
        inline: true
      }
    );

    const icon = guild.iconURL({ size: 256 });
    if (icon) embed.setThumbnail(icon);

    return reply({ embeds: [embed] });
  }

  // USER INFO
  if (name === "userinfo") {
    const target =
      (slash ? getUser("user") : ctx.mentions.users.first()) || actor;

    const member = await guild.members.fetch(target.id).catch(() => null);

    const roles = member
      ? member.roles.cache
          .filter(role => role.id !== guild.id)
          .sort((a, b) => b.position - a.position)
          .map(role => role.toString())
      : [];

    const embed = makeEmbed(
      `👤 ${target.tag || target.username}`,
      "**VEXORA • User Profile**"
    )
      .setThumbnail(target.displayAvatarURL({ size: 512 }))
      .addFields(
        {
          name: "🪪 User ID",
          value: `\`${target.id}\``,
          inline: false
        },
        {
          name: "🤖 Bot Account",
          value: target.bot ? "Yes" : "No",
          inline: true
        },
        {
          name: "📅 Account Created",
          value: `<t:${Math.floor(target.createdTimestamp / 1000)}:F>`,
          inline: true
        },
        {
          name: "📥 Joined Server",
          value: member?.joinedTimestamp
            ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`
            : "Not a current server member",
          inline: false
        },
        {
          name: "🎭 Roles",
          value: member
            ? (
                roles.slice(0, 10).join(", ") ||
                "No additional roles"
              ) +
              (roles.length > 10
                ? ` and ${roles.length - 10} more`
                : "")
            : "Unavailable",
          inline: false
        },
        {
          name: "🛡️ Administrator",
          value: member?.permissions.has(
            PermissionFlagsBits.Administrator
          ) ? "Yes" : "No",
          inline: true
        }
      );

    return reply({ embeds: [embed] });
  }

  // PERMISSION REQUIREMENTS
  const requiredPermission = {
    kick: PermissionFlagsBits.KickMembers,
    ban: PermissionFlagsBits.BanMembers,
    softban: PermissionFlagsBits.BanMembers,
    warn: PermissionFlagsBits.ManageMessages,
    warnings: PermissionFlagsBits.ManageMessages,
    timeout: PermissionFlagsBits.ModerateMembers,
    purge: PermissionFlagsBits.ManageMessages
  }[name];

  if (!requiredPermission) {
    return reply({
      embeds: [
        makeEmbed(
          "❔ Unknown Command",
          `Command \`${name}\` is not implemented in this version.\nUse \`${PREFIX}help
