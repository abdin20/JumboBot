//db imoprts
var mongo = require("../mongodb.js");
const Discord = require('discord.js');

play = require("./play.js");

module.exports = {
    name: 'skip',
    description: 'skips the current song',
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
        results = await mongo.findQueueByGuildId(message.guild.id);
        //if there is no queue
        if (!results) {
            exampleEmbed.setDescription("Queue doesnt exist"); 
            message.channel.send(exampleEmbed);

            //if there is a queue greater than 1
        } else{
            //shift the array 
            songs = results.songs;
            song= songs.shift();

            exampleEmbed.setDescription("Skipped "+ song);
            console.log("Skipped "+ song);
            message.channel.send(exampleEmbed);
            //update to db and play music
            await mongo.updateQueueByGuildId(message.guild.id, { songs: songs })
            play.playMusic(message,message.member.voice.channel,{skip:true});
        }

    },
};