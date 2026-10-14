async function deploy() {
console.log(Registering $DIL0 slash commands...);
await rest.put(
Routes.applicationGuildCommands(clientId, guildId),
{ body: commands }
);
console.log("Slash commands registered successfully.");
}
deploy().catch(error => {
console.error(error);
process.exit(1);
});
</CodeBlock>
