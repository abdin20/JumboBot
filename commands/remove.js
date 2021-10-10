//db imoprts
var mongo = require("../mongodb.js");
const Discord = require('discord.js');

play = require("./play.js");

module.exports = {
    name: 'remove',
    description: '$remove <index>',
    async execute(message, args) {

        //display nicely with embeds
        exampleEmbed = new Discord.MessageEmbed();
        exampleEmbed.setColor('#0099ff');
        exampleEmbed.setTitle("Music");

        //get queue
        results = await mongo.findQueueByGuildId(message.guild.id);

        //if there is no queue
        if (!results) {
            exampleEmbed.setDescription("Queue doesnt exist cannot remove song");
            message.channel.send(exampleEmbed);

            //if there is a queue greater than 1
        }

        search = args.join(" ")
        //check if arguemnts are there

        ///also post queue info TO DOO!!!!1/////////
        if (args.length < 1) {
            exampleEmbed.setDescription("$remove <index>");
            message.channel.send(exampleEmbed);
            songs = results.songs;

            var songString=""
            for(let m=0;m<songs.length;m++){
                
            }

            return
        }

        //check if its number
        if (!isNaN(search)) {
            var index = parseInt(num) -1;

            if (index > results.songs.length || index<0) {
                exampleEmbed.setDescription("Invalid index selected");
                message.channel.send(exampleEmbed);
                return;
            }

        } else {
            exampleEmbed.setDescription("Please enter a number");
            message.channel.send(exampleEmbed);
            return
        }
        //shift the array 
        songs = results.songs;
        song = songs.shift();

        exampleEmbed.setDescription("Skipped " + song);
        console.log("Skipped " + song);
        message.channel.send(exampleEmbed);



    },
};