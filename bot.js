const {
  Client,
  GatewayIntentBits,
  Events,
  ActivityType,
  Collection
} = require("discord.js");

const fs = require("node:fs");
const path = require("node:path");

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

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");

if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath)
    .filter(file => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);

    try {
      const command = require(filePath);

      if (command.name && typeof command.execute === "function") {
        client.commands.set(command.name, command);
        console.log(`Loaded command: ${command.name}`);
      } else {
        console.log(`Skipped invalid command file: ${file}`);
      }
    } catch (error) {
      console.error(`Failed to load ${file}:`, error);
    }
  }
}

client.once(Events.ClientReady, readyClient => {
  console.log(`VEXORA online: ${readyClient.user.tag}`);
  console.log(`Loaded ${client.commands.size} prefix commands.`);

  readyClient.user.setPresence({
    activities: [{
      name: `${PREFIX}help | VEXORA`,
      type: ActivityType.Watching
    }],
    status: "online"
  });
});

client.on(Events.MessageCreate, async message => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content
    .slice(PREFIX.length)
    .trim()
    .split(/\s+/);

  const commandName = (args.shift() || "").toLowerCase();
  if (!commandName) return;

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, client, args);
  } catch (error) {
    console.error(`Command ${commandName} failed:`, error);
    await message.reply("❌ Command failed. Please try again.");
  }
});

client.login(TOKEN).catch(error => {
  console.error("VEXORA login failed:", error);
  process.exit(1);
});
