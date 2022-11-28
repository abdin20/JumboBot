const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, './.env') })

const { Client, GatewayIntentBits, Collection, CommandInteractionOptionResolver } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus, AudioPlayerStatus, createAudioPlayer, createAudioResource, StreamType, getVoiceConnection, entersState } = require('@discordjs/voice');
const fs = require('fs')
const { createReadStream } = require('fs')
const client = new Client({ intents: ["Guilds", "GuildVoiceStates", "GuildMembers", 'GuildEmojisAndStickers', 'GuildPresences', 'GuildMessageReactions', 'GuildMessageReactions'] });

const soundImports=require('./sounds.js')
const clipNames=soundImports.clipNames
const clips=soundImports.clips

var mongo = require("./mongodb.js");

const token = process.env.BOT_TOKEN
// shane london, connor, aaron
// const alwaysPlaySoundEffectIds=['545042126644445184','144260548245061632','146425358927790081']
const alwaysPlaySoundEffectIds = ['545042126644445184']

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


const getRandomSoundEffect = (playerId, userName) => {
	// if shane
	console.log(`Playing effect for ${userName}`)
	const playerRand = Math.floor(Math.random() * 101)
	if (playerRand <= 48) {
		console.log("playing custom user song")
		// shane
		if (playerId === "545042126644445184") {
			return 'https://lobfile.com/file/0qDy.mp3'
		}
		//connor
		if (playerId === "144260548245061632") {
			return 'https://lobfile.com/file/WxhT.mp3'
		}//aaron
		if (playerId === "146425358927790081") {
			return 'https://lobfile.com/file/RWM9.mp3'
		}//shane chen
		if (playerId === "116672531661979652") {
			return 'https://lobfile.com/file/IYrZ.mp3'
		}//carrie
		if (playerId === "313780633518473218") {
			return 'https://lobfile.com/file/1SDy.mp3'
		}//noah
		if (playerId === "331589423546368001") {
			return 'https://lobfile.com/file/eSQe.mp3'
		}//riley
		if (playerId === "152558158806646784") {
			let playerSongs = ['https://lobfile.com/file/LrLR.mp3', 'https://lobfile.com/file/t7b2.mp3',
				'https://lithi.pw/file/A12T', 'https://lobfile.com/file/vaS7D.mp3', 'https://lobfile.com/file/Wsq3.mp3',
				'https://lobfile.com/file/hxSK.mp3', 'https://lobfile.com/file/bCXd.mp3']
			const playerSongRand = Math.floor(Math.random() * playerSongs.length)
			return playerSongs[playerSongRand]
		}//jason
		if (playerId === "152989214932336640") {
			return 'https://lobfile.com/file/U2KP.mp3'
		}//jet
		if (playerId === "134127232904986624") {
			return 'https://lobfile.com/file/tPAd.mp3'
		}
		// abdin
		if(playerId ==="163368896844267521"){
			let playerSongs = ['https://lobfile.com/file/xeOe.wav','https://lobfile.com/file/imx8.mp3']
			const playerSongRand = Math.floor(Math.random() * playerSongs.length)
			return playerSongs[playerSongRand]
		}
	}


	// return 'https://lobfile.com/file/wKG2.ogg'

	const rand = Math.floor(Math.random() * clips.length)
	console.log(`Effect: ${clipNames[rand]}`)
	return clips[rand];
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

	if (newState.channelId === oldState.channelId && oldState.channelId !== null) {
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
	if (random >= 4 && !isAlwaysPlay) {
		return
	}


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
	let resource = createAudioResource(getRandomSoundEffect(newState.member.id, newState.member.user.username));
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
