//db imoprts
var mongo = require("../mongodb.js");
const Discord = require('discord.js');


module.exports = {
    name: 'next',
    description: 'plays this song next',
    async execute(message, args) {

        //display nicely with embeds
        exampleEmbed = new Discord.MessageEmbed();
        exampleEmbed.setColor('#0099ff');
        exampleEmbed.setTitle("Music");



        //check if arguemnts are there
        if (args.length < 1) {
        exampleEmbed.setDescription("Please enter a term");
        message.channel.send(exampleEmbed);
        return;
        }

        //get search term to add
        search= args.join(" ")

        //check if in voice channel
        if (!message.member.voice.channel) {
            exampleEmbed.setDescription("You need to be in a voice channel");
            message.channel.send(exampleEmbed);
            return;
        }

        //get queue
        results = await mongo.findQueueByGuildId(message.guild.id);


        //if there is no queue
        if (!results) {
            exampleEmbed.setDescription("Queue doesnt exist"); 
            message.channel.send(exampleEmbed);

            //if there is a queue greater than 1
        } else{

 
            //shift the array 
            songs = results.songs;
            songs.splice(1,0,search)

            exampleEmbed.setDescription("Added "+ search +" up next ");
            console.log("Added "+ search +" up next ");
            message.channel.send(exampleEmbed);
            //update to db and play music
            await mongo.updateQueueByGuildId(message.guild.id, { songs: songs })
        }

    },
};