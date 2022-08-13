const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, './.env') })
const token = process.env.BOT_TOKEN

// Require the necessary discord.js classes
const { Client, GatewayIntentBits, Collection, CommandInteractionOptionResolver } = require('discord.js');
const fs = require('fs')

// Create a new client instance
const client = new Client({ intents: ["Guilds", "GuildVoiceStates","GuildMembers",'GuildEmojisAndStickers','GuildPresences','GuildMessageReactions','GuildMessageReactions'] });
var mongo = require("./mongodb.js");
// const client = new Client({ intents: [GatewayIntentBits.Guilds] });


client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
const { Player } = require("discord-player");

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}
// When the client is ready, run this code (only once)







client.once('ready', async () => {
	await mongo.deleteAllQueues();
	console.log('Ready!');
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	console.log(`User: ${interaction.user.username} executed ${interaction.commandName}`)
	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		// await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

client.login(token);
