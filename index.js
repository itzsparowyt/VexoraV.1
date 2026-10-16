const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const PREFIX = process.env.PREFIX || "!";

if (!TOKEN) {
  console.error("Missing DISCORD_TOKEN environment variable!");
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

const commandNames = `
help ping botinfo splash uptime stats invite support
serverinfo userinfo avatar servericon serverbanner membercount
roleinfo rolelist channelinfo channellist emojiinfo createdat
say announce poll choose random roll coinflip calc add subtract
multiply divide percentage reverse upper lower wordcount charcount
timestamp permissions botpermissions prefix setprefix commandlist
kick ban unban timeout untimeout warn warnings clear purge
lock unlock slowmode mute unmute softban banlist modlogs
roleadd roleremove createrole deleterole nick resetnick
channelcreate channeldelete channelrename channeltopic channelnsfw
clonechannel categorycreate categorydelete movechannel
welcome setwelcome testwelcome goodbye setgoodbye autorole
setautorole logging setlogs ticket ticketpanel ticketclose
ticketadd ticketremove ticketclaim ticketrename ticketsetup
verify unverify antispam antiraid automod antiinvite antilink
filterword filteradd filterremove filterlist accountage invitecheck
rules setrules faq feedback report suggest bugreport appeal
embed embedcolor embedtitle embedfooter dm messagecount
activity leaderboard rank profile daily weekly inventory shop
giveaway giveawayend giveawayreroll giveawaylist reactionrole
rrcreate rrdelete rrlist backup backupinfo restore exportconfig
settings health latency shardinfo servercount memberlist rolecount
channelcount emoji-list stickerinfo stickerlist threadcreate threadclose
threadlock threadunlock pin unpin pinned messageinfo fetchmessage
snipe editmessage removemessage purgeuser purgebots purgechannel
purgecontains purgeafter purgebefore warnlist modstats stafflist
adminlist moderatorlist reportuser reportchannel caseinfo caseclose
caseedit notes addnote removenote notelist nickname history
joinedat roles serverfeatures serverboosts vanityurl serverwidget
invitecreate invitelist inviteinfo deleteinvite announcement
embedpreview webhookinfo webhookcreate webhookdelete webhooklist
voiceinfo voicekick voicemove voicelock voiceunlock voicecreate
voicedelete rolecheck channelpermissions setservername
setverification setnotifications setafk afk remind date time
math convert hex rgb emojiid userinfoid memberage serverage
topic setnick rolecolor rolehoist rolementionable welcome-test
tickettranscript ticketsettings security scan config categories
feedbacklist suggestlist pollend pollresults memberstats
serverstats botavatar botstatus setstatus setactivity
`.trim().split(/\s+/);

const commands = new Map();
for (const name of commandNames) {
  commands.set(name, async (ctx) => {
    const { message, interaction, guild, args } = ctx;
    const member = message?.member;
    const isAdmin = member?.permissions?.has(
      PermissionFlagsBits.Administrator
    );

    switch (name) {
      case "ping":
      case "latency":
        return `🏓 Pong! WebSocket: ${client.ws.ping}ms`;

      case "help": {
        const page = Math.max(1, Number(args[0]) || 1);
        const all = [...commands.keys()];
        const pages = [];
        for (let i = 0; i < all.length; i += 20) {
          pages.push(all.slice(i, i + 20));
        }
        const selected = pages[page - 1];
        if (!selected) return `Choose a page from 1 to ${pages.length}.`;
        return {
          embeds: [new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle("✦ VEXORA COMMANDS")
            .setDescription(selected.map(x => `\`${PREFIX}${x}\``).join(" • "))
            .setFooter({ text: `Page ${page}/${pages.length} • ${all.length} commands` })]
        };
      }

      case "splash":
        return {
          embeds: [new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle("✦ V E X O R A")
            .setDescription("Security • Moderation • Utility")
            .setFooter({ text: "VEXORA • Command System" })]
        };

      case "botinfo":
      case "stats":
      case "serverstats":
        return `VEXORA is online.\nServers: ${client.guilds.cache.size}\nCommands listed: ${commands.size}`;

      case "uptime":
        return `⏱️ Uptime: ${Math.floor(client.uptime / 1000)} seconds`;

      case "serverinfo":
      case "servercount":
      case "membercount":
        if (!guild) return "Use this command inside a server.";
        return {
          embeds: [new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(guild.name)
            .setThumbnail(guild.iconURL())
            .addFields(
              { name: "Members", value: String(guild.memberCount), inline: true },
              { name: "Channels", value: String(guild.channels.cache.size), inline: true },
              { name: "Roles", value: String(guild.roles.cache.size), inline: true }
            )]
        };

      case "userinfo":
      case "avatar": {
        const user = message
          ? (message.mentions.users.first() || message.author)
          : interaction.user;
        if (name === "avatar") return user.displayAvatarURL({ size: 1024 });
        return {
          embeds: [new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`User Info: ${user.username}`)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
              { name: "User ID", value: user.id },
              { name: "Created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>` }
            )]
        };
      }

      case "servericon":
        return guild?.iconURL({ size: 1024 }) || "This server has no icon.";

      case "say":
        if (!args.length) return `Usage: ${PREFIX}say your message`;
        return args.join(" ").slice(0, 1800);

      case "upper":
        return args.join(" ").toUpperCase() || "Provide some text.";
      case "lower":
        return args.join(" ").toLowerCase() || "Provide some text.";
      case "reverse":
        return args.join(" ").split("").reverse().join("") || "Provide some text.";
      case "wordcount":
        return `Words: ${args.join(" ").trim().split(/\s+/).filter(Boolean).length}`;
      case "charcount":
        return `Characters: ${args.join(" ").length}`;

      case "random": {
        const max = Math.max(1, Number(args[0]) || 100);
        return `🎲 ${Math.floor(Math.random() * max) + 1}`;
      }
      case "roll":
        return `🎲 You rolled ${Math.floor(Math.random() * 6) + 1}`;
      case "coinflip":
        return Math.random() < 0.5 ? "🪙 Heads!" : "🪙 Tails!";
      case "choose":
        return args.length
          ? `I choose: ${args[Math.floor(Math.random() * args.length)]}`
          : "Usage: !choose pizza burger pasta";

      case "add":
      case "subtract":
      case "multiply":
      case "divide": {
        const a = Number(args[0]), b = Number(args[1]);
        if (!Number.isFinite(a) || !Number.isFinite(b)) {
          return `Usage: ${PREFIX}${name} 10 5`;
        }
        if (name === "add") return String(a + b);
        if (name === "subtract") return String(a - b);
        if (name === "multiply") return String(a * b);
        return b === 0 ? "Cannot divide by zero." : String(a / b);
      }

      case "clear":
      case "purge": {
        if (!message || !guild) return "Use this command in a server channel.";
        if (!member.permissions.has(PermissionFlagsBits.ManageMessages))
          return "You need Manage Messages permission.";
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages))
          return "I need Manage Messages permission.";
        const amount = Number(args[0]);
        if (!Number.isInteger(amount) || amount < 1 || amount > 100)
          return `Usage: ${PREFIX}clear 1-100`;
        const deleted = await message.channel.bulkDelete(amount, true);
        return `🧹 Deleted ${deleted.size} messages.`;
      }

      case "kick":
      case "ban": {
        if (!message || !guild) return "Use this command in a server.";
        const permission = name === "kick"
          ? PermissionFlagsBits.KickMembers
          : PermissionFlagsBits.BanMembers;
        if (!member.permissions.has(permission))
          return `You need ${name === "kick" ? "Kick Members" : "Ban Members"} permission.`;
        const target = message.mentions.members.first();
        if (!target) return `Usage: ${PREFIX}${name} @member [reason]`;
        if (target.id === message.author.id) return "You cannot target yourself.";
        const reason = args.slice(1).join(" ") || "No reason provided";
        if (name === "kick") {
          if (!target.kickable) return "I cannot kick that member; check role positions.";
          await target.kick(reason);
          return `👢 Kicked ${target.user.tag}.`;
        }
        if (!target.bannable) return "I cannot ban that member; check role positions.";
        await target.ban({ reason });
        return `🔨 Banned ${target.user.tag}.`;
      }

      case "lock":
      case "unlock": {
        if (!message || !guild) return "Use this command in a server channel.";
        if (!member.permissions.has(PermissionFlagsBits.ManageChannels))
          return "You need Manage Channels permission.";
        await message.channel.permissionOverwrites.edit(guild.roles.everyone, {
          SendMessages: name === "unlock"
        });
        return name === "lock" ? "🔒 Channel locked." : "🔓 Channel unlocked.";
      }

      case "announce":
        if (!message || !guild) return "Use this command in a server.";
        if (!member.permissions.has(PermissionFlagsBits.ManageMessages))
          return "You need Manage Messages permission.";
        if (!args.length) return `Usage: ${PREFIX}announce your message`;
        return {
          embeds: [new EmbedBuilder()
            .setColor(0xF1C40F)
            .setTitle("📢 Announcement")
            .setDescription(args.join(" ").slice(0, 4000))
            .setTimestamp()]
        };

      case "permissions":
      case "botpermissions":
        if (!guild) return "Use this command in a server.";
        return `Your permissions: ${message?.member?.permissions?.toArray().join(", ") || "Check your server roles."}`;

      default:
        return `ℹ️ \`${name}\` is in the VEXORA command list, but its dedicated feature handler is not implemented yet.`;
    }
  });
}

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;
  const parts = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const name = (parts.shift() || "").toLowerCase();
  const run = commands.get(name);
  if (!run) return;

  try {
    const result = await run({
      client, message, guild: message.guild, args: parts
    });
    if (result) await message.reply(result);
  } catch (error) {
    console.error(`Command ${name} error:`, error);
    await message.reply("❌ Command failed. Check Console and bot permissions.");
  }
});

client.once(Events.ClientReady, async (ready) => {
  console.log(`VEXORA online: ${ready.user.tag}`);
  ready.user.setPresence({
    activities: [{ name: `${PREFIX}help | VEXORA`, type: 3 }],
    status: "online"
  });

  if (process.env.CLIENT_ID) {
    try {
      const slashNames = ["ping", "help", "botinfo", "splash", "uptime", "serverinfo", "userinfo", "avatar"];
      const slash = slashNames.map(name =>
        new SlashCommandBuilder().setName(name).setDescription(`VEXORA ${name}`).toJSON()
      );
      const rest = new REST({ version: "10" }).setToken(TOKEN);
      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: slash });
      console.log("VEXORA slash commands registered.");
    } catch (error) {
      console.error("Slash registration failed:", error);
    }
  } else {
    console.log("CLIENT_ID missing; slash commands not registered.");
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const run = commands.get(interaction.commandName);
  if (!run) return interaction.reply({ content: "Command not found.", ephemeral: true });

  try {
    const result = await run({
      client, interaction, guild: interaction.guild, args: []
    });
    await interaction.reply(result || "Done.");
  } catch (error) {
    console.error(error);
    const response = { content: "❌ Command failed. Check Console.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(response);
    } else {
      await interaction.reply(response);
    }
  }
});

client.login(TOKEN);
