//d imports
var mongo = require("../mongodb.js");
const Discord = require('discord.js');
var play = require("./play.js");
//url parser
const urlParser = require("js-video-url-parser");
//playlist metadata
const usetube = require('usetube')
//playlist video fetcher
const ytfps = require('ytfps');


module.exports = {
  name: 'youtube',
  description: '$youtube <playlist_link>',
  async execute(message, args) {
    //display nicely with embeds
    exampleEmbed = new Discord.MessageEmbed();
    exampleEmbed.setColor('#0099ff');
    exampleEmbed.setTitle("Youtube Playlist");

    var searchUrl = "";  //default to no url and indexing starting at 0
    var songs = new Array();
    var playlistId = "";
    var count = 0;
    //check if arguemnts are there
    if (args.length < 1) {
      exampleEmbed.setDescription("Please enter a playlist link");
      message.channel.send(exampleEmbed);
      return;
    }

    //check if in voice channel
    if (!message.member.voice.channel) {
      exampleEmbed.setDescription("You need to be in a voice channel");
      message.channel.send(exampleEmbed);
      return;
    }

    //update user on progress
    exampleEmbed.setDescription("Searching, please wait");
    message.channel.send(exampleEmbed);


    //get url for playlist
    searchUrl = args[0];
    playlistIndex = 0; //default to get whole playlist
    //check if list exists in link
    if (urlParser.parse(searchUrl).list) {


      //save playlist id
      playlistId = urlParser.parse(searchUrl).list

      //check to see if there are parameters and if so check if theres an index,
      if (urlParser.parse(searchUrl).params && urlParser.parse(searchUrl).params.index ) {
        playlistIndex = urlParser.parse(searchUrl).params.index //set index of playlist if found from link
        exampleEmbed.setDescription(`Starting index found in link : ${playlistIndex}` );
        message.channel.send(exampleEmbed);
      };
      console.log(`Starting index is ${playlistIndex}`)


      //get list of videos from playlist id
      result= await (await ytfps(playlistId)).videos

      //for every video push it to the song array
      result.forEach((element, currIndex) => {
        if (currIndex >= playlistIndex) {   //check to see if we are starting from the correct index
          songs.push(`${element.url}`)
          count++;
        }

      })
    } else {
      exampleEmbed.setDescription("Invalid playlist link");
      message.channel.send(exampleEmbed);
      return;
    }

    //check to see if music queue is in db
    results = await mongo.findQueueByGuildId(message.guild.id);

    //queue not found
    if (!results) {
      propertyObject = new Object();
      propertyObject.guildId = message.guild.id
      propertyObject.songs = songs
      propertyObject.loop = false; //loop defaults to off

      //create queue in db
      await mongo.createQueueByObject(propertyObject)

      //go to playmusic function
      await play.playMusic(message, message.member.voice.channel);

    } else {
      //get the songs from queue and concat the new playlist songs
      newSongs = results.songs.concat(songs);

      //update queue
      await mongo.updateQueueByGuildId(message.guild.id, { songs: newSongs })

    }


    //send embed message
    exampleEmbed.setDescription("Added " + count + " songs to queue");
    message.channel.send(exampleEmbed);

  },
};