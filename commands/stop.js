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
            message.channel.send(exampleEmbed);
            return;
        } 
        
        //delete queue and leave
         await mongo.deleteQueueByObject({ channelId: message.channel.id });
         message.member.voice.channel.leave();
	},
};