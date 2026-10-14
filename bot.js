
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
  throw new Error("DISCORD_TOKEN environment variable is missing.");
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

if (!fs.existsSync(commandsPath)) {
  fs.mkdirSync(commandsPath, { recursive: true });
}

for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"))) {
  try {
    const command = require(path.join(commandsPath, file));

    if (!command.name || typeof command.execute !== "function") {
      console.warn(`Skipped invalid command: ${file}`);
      continue;
    }

    client.commands.set(command.name, command);
    console.log(`Loaded command: ${command.name}`);
  } catch (error) {
    console.error(`Failed to load ${file}:`, error);
  }
}

client.once(Events.ClientReady, readyClient => {
  console.log(`VEXORA online: ${readyClient.user.tag}`);
  console.log(`Loaded ${client.commands.size} commands.`);

  readyClient.user.setPresence({
    activities: [{
      name: `${PREFIX}help | VEXORA`,
      type: ActivityType.Watching
    }],
    status: "online"
  });
});

client.on(Events.MessageCreate, async message => {
  if (!message.guild || message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const parts = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const name = (parts.shift() || "").toLowerCase();

  if (!name) return;

  const command = client.commands.get(name);
  if (!command) return;

  try {
    await command.execute(message, client, parts);
  } catch (error) {
    console.error(`Prefix command error (${name}):`, error);
    await message.reply("❌ Command failed. Check hosting logs.");
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command || typeof command.executeSlash !== "function") {
    return interaction.reply({
      content: "This slash command is not configured yet.",
      ephemeral: true
    });
  }

  try {
    await command.executeSlash(interaction, client);
  } catch (error) {
    console.error(`Slash command error (${interaction.commandName}):`, error);

    const reply = {
      content: "❌ Command failed. Check hosting logs.",
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

client.login(TOKEN).catch(error => {
  console.error("VEXORA login failed:", error);
  process.exit(1);
});
