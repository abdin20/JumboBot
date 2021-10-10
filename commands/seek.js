//d imports
var mongo = require("../mongodb.js");
const Discord = require('discord.js');


module.exports = {
    name: 'seek',
    description: 'seek <seconds> only for youtube',
    async execute(message, args) {
        //display nicely with embeds
        exampleEmbed = new Discord.MessageEmbed();
        exampleEmbed.setColor('#0099ff');
        exampleEmbed.setTitle("Music");

        //check if in voice channel
        if (!message.member.voice.channel) {
            exampleEmbed.setDescription("You need to be in a voice channel");
            message.channel.send({ embeds: [exampleEmbed] });
            return;
        }


           //check if arguemnts are there
        if (args.length < 1) {    
        exampleEmbed.setDescription("Please enter number of seconds");
        message.channel.send({ embeds: [exampleEmbed] });
        return;
      }
      
      //check if its number
      if(isNaN(args[0])){
        exampleEmbed.setDescription("Please enter a number");
        message.channel.send(exampleEmbed);
        return;
      }


        //get queue info
        results = await mongo.findQueueByGuildId(message.guild.id);
        
        //if there is no queue
        if (!results) {
            exampleEmbed.setDescription("Queue doesnt exist");
            message.channel.send(exampleEmbed);

            //if there is a queue
        } else{
        

            exampleEmbed.setDescription("Seeked to  "+ args[0] +" seconds ");
            message.channel.send(exampleEmbed);
            //update to db and play music
            play.playMusic(message,message.member.voice.channel, {seconds:args[0]});
        }


    },
};