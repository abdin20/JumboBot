//db imoprts
var mongo = require("../mongodb.js");
const Discord = require('discord.js');

const searchYoutube = require('youtube-api-v3-search');
const ytdl = require("ytdl-core");
var auth = process.env.GOOGLE_API_2;
module.exports = {
    name: 'next',
    description: 'plays this YOUTUBE song next',
    async execute(message, args) {

        //display nicely with embeds
        exampleEmbed = new Discord.MessageEmbed();
        exampleEmbed.setColor('#0099ff');
        exampleEmbed.setTitle("Music");



        //check if arguemnts are there
        if (args.length < 1) {
        exampleEmbed.setDescription("Please enter a term");
        message.channel.send(exampleEmbed);;
        return;
        }

        //get search term to add
        search= args.join(" ")
        console.log(search)

        //check if in voice channel
        if (!message.member.voice.channel) {
            exampleEmbed.setDescription("You need to be in a voice channel");
            message.channel.send(exampleEmbed);;
            return;
        }

        //get queue
        results = await mongo.findQueueByGuildId(message.guild.id);


        //if there is no queue
        if (!results) {
            exampleEmbed.setDescription("Queue doesnt exist"); 
            message.channel.send(exampleEmbed);;

            //if there is a queue greater than 1
        } else{

 
            //shift the array 
            songs = results.songs;
   

               //options for the youtube query. 
        //q property is the search term we got from user
        const options = {
            q: search,
            part: 'snippet',
            type: 'video',
            maxResults: 1
          }
  
          //search 
          let r = await searchYoutube(auth, options).catch((err) => {
            console.error(err);
          });
  
          //check to see google api accepted request
          if (typeof r.items === 'undefined') {
            exampleEmbed.setDescription("Quota error");
            message.channel.send(exampleEmbed);;
            auth = process.env.GOOGLE_API; //if not reset api key to other account
            r = await searchYoutube(auth, options)
          }
  
          //check to see if there are results
          if (typeof r.items[0] === 'undefined') {
            exampleEmbed.setDescription("No results error");
            message.channel.send(exampleEmbed);;
            return;
          }
  
          //adds time stamp to if there was one
          url = "https://www.youtube.com/watch?v=" + r.items[0].id.videoId //get url
          title = r.items[0].snippet.title //get title

          songs.splice(1,0,`${url}`)  

            exampleEmbed.setDescription("Added "+ title +" up next ");
            console.log("Added "+ title +" up next ");
            message.channel.send(exampleEmbed);;
            //update to db and play music
            await mongo.updateQueueByGuildId(message.guild.id, { songs: songs })
        }

    },
};