
const fs = require('fs');
const Discord = require('discord.js');
const ffmpeg=require("ffmpeg")
module.exports = {
	name: 'talk',
	description: 'talk',
	async execute(message, args) {
        //if no arguments

        //check if person in channel
        if (message.member.voice.channel) {
           await message.member.voice.channel.join()
           .then(foo = async (connection) => {
               await connection.play("https://lithi.io/file/vw5C.mp3");
           });
        }else{
            message.reply("you need to be in a voice channel");
        }
	},
};