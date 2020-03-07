prefix = "$";
var token =process.env.BOT_TOKEN;


///////////////////////////////discord stuff
const fs = require('fs');
var mongo = require("./mongodb.js");
const Discord = require('discord.js');
const client = new Discord.Client();

var servers={};

//getting commands
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

//read commands from file
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}


client.once('ready', () => {
    console.log('Ready!');
    client.user.setActivity("Type $help for commands");
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

    //will make a new one if person doesnt have account
    await mongo.findUserByAuthor(message.author);

    //args of command
    const args = message.content.slice(prefix.length).split(' ');

    //first arguement 
    const command = args.shift().toLowerCase();

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


client.login(token);