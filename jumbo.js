const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, './.env') })

const { Client, GatewayIntentBits, Collection, CommandInteractionOptionResolver } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus, AudioPlayerStatus, createAudioPlayer, createAudioResource, StreamType, getVoiceConnection, entersState } = require('@discordjs/voice');
const fs = require('fs')
const { createReadStream } = require('fs')
const client = new Client({ intents: ["Guilds", "GuildVoiceStates", "GuildMembers", 'GuildEmojisAndStickers', 'GuildPresences', 'GuildMessageReactions', 'GuildMessageReactions'] });
var mongo = require("./mongodb.js");

const token = process.env.BOT_TOKEN
// shane london, connor, aaron
const alwaysPlaySoundEffectIds=['545042126644445184','144260548245061632','146425358927790081']

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


const getRandomSoundEffect = (playerId) => {
	// if shane
	if(playerId==="545042126644445184"){
		return 'https://lobfile.com/file/0qDy.mp3'
	}
	//connor
	if(playerId==="144260548245061632"){
		return 'https://lobfile.com/file/cds1.mp3'
	}//aaron
	if(playerId==="146425358927790081"){
		return 'https://lobfile.com/file/K8oM.mp3'
	}

	// return 'https://lobfile.com/file/wKG2.ogg'
	//winner , ads, fna2 eerie, bruh, boing, gmod, vine, clash, metalgear, tf2 notif, 
	const clips = ['https://lobfile.com/file/0qDy.mp3','https://lobfile.com/file/E9oa.mp3', 'https://lobfile.com/file/zylm.mp3', 'https://lobfile.com/file/NWF0g.mp3', 'https://lobfile.com/file/nWGC.mp3', 'https://lobfile.com/file/L005.mp3','https://lobfile.com/file/c617.mp3','https://lobfile.com/file/tDKk.mp3','https://lobfile.com/file/1xCr.mp3', 'https://lobfile.com/file/0zc1.mp3'   ]

	return clips[Math.floor(Math.random() * clips.length)];
}



client.on('voiceStateUpdate', async (oldState, newState) => {

	// dont do anything if its a bot
	if (oldState.member.user.bot || newState.member.user.bot) {
		return;
	}
	//nothing if user leaves
	if (newState.channelId === null) {
		// console.log('a user left!')
		return
	}

	if (newState.channelId === oldState.channelId && oldState.channelId!==null) {
		// console.log('a user didnt move')
		return
	}
	let connection = getVoiceConnection(newState.guild.id);
	if (connection && connection._state.status === "ready") {
		// console.log('bot already ready and doing something')
		return
	}

	const isAlwaysPlay = alwaysPlaySoundEffectIds.includes(newState.member.id)
	const random = Math.floor(Math.random() * 11)
	// will always run if its shane
	if(random>=4 &&!isAlwaysPlay){
		return
	}
	console.log(`Playing sound effect for ${newState.member.user.username}`)



	// console.log("CHECK FOR UNDEFINED")
	// console.log((typeof checkConnection !== 'undefined' && checkConnection._state.status!=="disconnected"))
	const results = await mongo.findQueueByGuildId(newState.guild.id);
	//if there is a music queue do nothing
	if ((results && results.songs.length > 0)) {
		return
	}

	//join voice channel
	let checkConnection = joinVoiceChannel({
		channelId: newState.channelId,
		guildId: newState.guild.id,
		adapterCreator: newState.guild.voiceAdapterCreator,
	});

	await entersState(checkConnection, VoiceConnectionStatus.Ready, 5_000)

	// let connection = joinVoiceChannel({
	// 	channelId: newState.channelId,
	// 	guildId: newState.guild.id,
	// 	adapterCreator: newState.guild.voiceAdapterCreator,
	// });
	let newplayer = createAudioPlayer();
	let resource = createAudioResource(getRandomSoundEffect(newState.member.id));
	newplayer.on(AudioPlayerStatus.Idle, (async () => {
		const results = await mongo.findQueueByGuildId(newState.guild.id);
		if (!results) checkConnection.disconnect();

	}));
	// newplayer.on(AudioPlayerStatus.AutoPaused, (async () => {
	// 	console.log("autopaused")
	// 	const results = await mongo.findQueueByGuildId(newState.guild.id);
	// 	if (!results) checkConnection.disconnect();

	// }));

	newplayer.play(resource)
	checkConnection.subscribe(newplayer)

});

client.login(token);
