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
        results = await mongo.findQueueByChannelId(message.channel.id);
        //if there is no queue
        if (!results) {
            exampleEmbed.setDescription("Queue doesnt exist");
            message.channel.send(exampleEmbed);

            //if there is a queue greater than 1
        } else if (results.songs.length > 1) {
            //shift the array 
            songs = results.songs;
            songs.shift();

            //update to db and play music
            await mongo.updateQueueByChannelId(message.channel.id, { songs: songs })
            play.playMusic(message);
        } else {
            //else skip the 1 song in queue by deleteing current queue and leave voice
            await mongo.deleteQueueByObject({ channelId: message.channel.id });
            
        }

    },
};