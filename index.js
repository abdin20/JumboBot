const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, './.env') })


prefix = `$`;
var token =process.env.BOT_TOKEN;


///////////////////////////////discord stuff
const fs = require('fs');
var mongo = require("./mongodb.js");
var voiceStateMethods=require('./voiceStateMethods.js')

//discord client
const Discord = require('discord.js');
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] })
client.options.http.api = "https://discord.com/api"

//global access to client
global.client=client;
//parser
const parser  = require('discord-command-parser');

//getting commands
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

//read commands from file
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}


client.once('ready', foo = async () => {
    console.log('Ready!');
    client.user.setActivity("Type $help for commands");
    await mongo.deleteAllQueues();
});

client.once('reconnecting', () => {
    console.log('Reconnecting!');
});

client.once('disconnect', () => {
    console.log('Disconnect!');
});

client.on('message', foo = async (message) => {
    //if not prefix or bot talking ignore it
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    ///parse the message
    const parsed = parser.parse(message, prefix);
    //will make a new one if person doesnt have account
    await mongo.findUserByAuthor(message.author);

    //args of command
    const args = parsed.arguments

    //first arguement 
    const command = parsed.command;

    //if cant find command return nothing;  
    if (!client.commands.has(command)) return;

    //try command
    try {
        console.log( message.author.username + " executing " + command)
        client.commands.get(command).execute(message, args);
    } catch (error) {
        console.error(error);
        message.reply('there was an error trying to execute that command!');
    }


});


//person joining channel
client.on('voiceStateUpdate', (oldState, newState) => {

    if (oldState.member.user.bot || newState.member.user.bot) return;

    if(oldState.channelID === newState.channelID) {
        // console.log('a user has not moved!')
    }
    if(oldState.channelID != null && newState.channelID != null && newState.channelID != oldState.channelID) {
        // console.log('a user switched channels')
        voiceStateMethods.attemptKickUser(newState)
    }
    if(oldState.channelID === null) {
        voiceStateMethods.attemptKickUser(newState)
    }
    if (newState.channelID === null) {
        // console.log('a user left!')
    }
});

client.login(token);