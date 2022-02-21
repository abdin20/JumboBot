
const fs = require('fs');
const Discord = require('discord.js');
var mongo = require("../mongodb.js");
module.exports = {
	name: 'talk',
	description: 'talk',
	async execute(message, args) {
        //if no arguments

        //check if person in channel
        if (message.member.voice.channel) {
            await mongo.deleteQueueByObject({ guildId: message.guild.id });
           await message.member.voice.channel.join()
           
           .then(foo = async (connection) => {
               await connection.play("https://lithi.io/file/suMQ.mp3");
               await connection.play("https://lobfile.com/file/kKf0.mp3");
           });
        }else{
            message.reply("you need to be in a voice channel");
        }
	},
};