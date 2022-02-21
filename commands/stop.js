//db imoprts
var mongo = require("../mongodb.js");
const Discord = require('discord.js');

play = require("./play.js");
module.exports = {
	name: 'stop',
	description: 'stops all music and disconnects bot',
	async execute(message, args) {
        //display nicely with embeds
        exampleEmbed = new Discord.MessageEmbed();
        exampleEmbed.setColor('#0099ff');
        exampleEmbed.setTitle("Music");

        //check if in voice channel
        if (!message.member.voice.channel) {
            exampleEmbed.setDescription("You need to be in a voice channel");
            message.channel.send(exampleEmbed);;
            return;
        } 
        
        //delete queue and leave
         await mongo.deleteQueueByObject({ guildId: message.guild.id });
         await message.member.voice.channel.join()
           .then(foo = async (connection) => {
               await connection.play("https://lobfile.com/file/kKf0.mp3");
               message.guild.me.voice.channel.leave();
           });
        
	},
};