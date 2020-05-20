//d imports
var mongo = require("../mongodb.js");
const Discord = require('discord.js');
var play = require("./play.js");

const vid_data = require('vid_data');



module.exports = {
  name: 'youtube',
  description: '$youtube <playlist_link>',
  async execute(message, args) {
    //display nicely with embeds
    exampleEmbed = new Discord.MessageEmbed();
    exampleEmbed.setColor('#0099ff');
    exampleEmbed.setTitle("Youtube Playlist");

    var searchUrl = "";  //default to no url and indexing starting at 0
    var index = 0;
    var count = 0;
    var songs = new Array();
    var timeStamp = "";
    var playlistId = "";
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

    searchUrl = args[0];

    //check for time stamp in video
    if (searchUrl.indexOf("?t=") > -1) {
      timeStamp = "?t=" + searchUrl.substring(searchUrl.indexOf("?t=") + 3) //get time stamp part of url
      searchUrl = searchUrl.substring(0, searchUrl.indexOf("?t=")) //edit teh query to get rid of time stamp
      console.log("time stamp detected");
    }

    //check for time stamp in video other format
    if (searchUrl.indexOf("&t=") > -1) {
      timeStamp = "&t=" + searchUrl.substring(searchUrl.indexOf("&t=") + 3) //get time stamp part of url
      searchUrl = searchUrl.substring(0, searchUrl.indexOf("&t=")) //edit teh query to get rid of time stamp
      console.log("time stamp detected");
    }


    //check if there is an index spot to start from
    if (searchUrl.indexOf("&index=") > -1) {
      index = searchUrl.substring(searchUrl.indexOf("&index=") + 7) //get time stamp part of url
      searchUrl = searchUrl.substring(0, searchUrl.indexOf("&index="))
      console.log("index detected : " + index);
    }

    //check if there is an index spot to start from other form
    if (searchUrl.indexOf("?index=") > -1) {
      index = searchUrl.substring(searchUrl.indexOf("?index=") + 7) //get time stamp part of url
      searchUrl = searchUrl.substring(0, searchUrl.indexOf("?index="))
      console.log("index detected : " + index);
    }

    //check for time stamp in video other format
    if (searchUrl.indexOf("&list=") > -1) {
      playlistId = searchUrl.substring(searchUrl.indexOf("&list=") + 6) //get time stamp part of url
      console.log("list id detected");
    } //check for time stamp in video other format
    else if (searchUrl.indexOf("?list=") > -1) {
      playlistId = searchUrl.substring(searchUrl.indexOf("?list=") + 6) //get time stamp part of url
      console.log("list id detected");
    }else{
      exampleEmbed.setDescription("error with playlists id");
      message.channel.send(exampleEmbed);
      return;
    }

    searchUrl="https://www.youtube.com/playlist?list="+playlistId;


    //get vid ids for playlist
    console.log("running playlist search on " + searchUrl)
    searchResults = await vid_data.get_playlist_videos(searchUrl)
    if (!searchResults) {
      exampleEmbed.setDescription("error with playlists");
      message.channel.send(exampleEmbed);
      return;
    }
    //add the videos to playlist
    for (var m = index - 1; m < searchResults.length; m++) {
      count++;

      //if first item in for loop, add the time stamp if there is one 
      if (m == (index - 1)) {
        songs.push("https://www.youtube.com/watch?v=" + searchResults[m] + timeStamp);
      } else {
        songs.push("https://www.youtube.com/watch?v=" + searchResults[m]);
      }

    }

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