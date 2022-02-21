
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
               await connection.play("https://lithi.io/file/suMQ.mp3").on("finish", async () => {
                await connection.play("https://lobfile.com/file/2J2V.mp3").on("finish", async ()=>{
                    message.guild.me.voice.channel.leave();
                })
              })
              
           });
        }else{
            message.reply("you need to be in a voice channel");
        }
	},
};