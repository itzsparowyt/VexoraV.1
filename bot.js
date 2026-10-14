
const {
  Client,
  GatewayIntentBits,
  Events,
  ActivityType
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const PREFIX = process.env.PREFIX || "!";

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

client.once(Events.ClientReady, readyClient => {
  console.log(`VEXORA online: ${readyClient.user.tag}`);

  readyClient.user.setPresence({
    activities: [
      {
        name: `${PREFIX}help | VEXORA`,
        type: ActivityType.Watching
      }
    ],
    status: "online"
  });
});

client.on(Events.MessageCreate, async message => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const command = (args.shift() || "").toLowerCase();

  if (command === "ping") {
    await message.reply(`🏓 Pong! ${client.ws.ping}ms`);
    return;
  }

  if (command === "help") {
    await message.reply({
      embeds: [{
        color: 0x2684ff,
        title: "🛡️ VEXORA — Command Center",
        description:
          "**Utility**\n`!help` `!ping` `!serverinfo` `!userinfo` `!roleinfo`\n\n" +
          "**More commands**\nModeration and server tools will be added in the next files.",
        footer: { text: "VEXORA • Security & Server Management" }
      }]
    });
  }
});

client.login(TOKEN).catch(error => {
  console.error("VEXORA login failed:", error);
  process.exit(1);
});
