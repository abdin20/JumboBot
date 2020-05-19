//db imoprts
var mongo = require("../mongodb.js");
const Discord = require('discord.js');

//youtube imports
const searchYoutube = require('youtube-api-v3-search');
const ytdl = require("ytdl-core");
var auth = process.env.GOOGLE_API;

const fs = require('fs');
module.exports = {
  name: 'play',
  description: '$play <search term for youtube>',
  async execute(message, args) {
    //join the arguements
    search = args.join(" ");

    //display nicely with embeds
    exampleEmbed = new Discord.MessageEmbed();
    exampleEmbed.setColor('#0099ff');
    exampleEmbed.setTitle("Music");

    //check if arguemnts are there
    if (args.length < 1) {
      exampleEmbed.setDescription("Please enter a search term");
      message.channel.send(exampleEmbed);
      return
    }

    //check if in voice channel
    if (!message.member.voice.channel) {
      exampleEmbed.setDescription("You need to be in a voice channel");
      message.channel.send(exampleEmbed);
      return;
    }

    //song url
    var url = ""
    var title = search

    /////////////if its a youtube link or not a link and a search term, use yts library
    if ((search.indexOf("http") > -1 && search.indexOf("yout") > -1) || search.indexOf("http") < 0) {

      //options for the youtube query. 
      //q property is the search term we got from user
      const options = {
        q: search,
        part: 'snippet',
        type: 'video',
        maxResults: 1
      }

      //search 
      let flag = false;
      let r = await searchYoutube(auth, options).catch((err) => {
        console.error(err);
        flag = true;
      });

      if (flag) {
        auth = process.env.GOOGLE_API_2;
        r = await searchYoutube(auth, options)
        flag = false;
      }


      //check to see if there are results
      if (typeof r.items === 'undefined') {
        exampleEmbed.setDescription("Quota error");
        message.channel.send(exampleEmbed);
        return;
      }

      //check to see if there are results
      if (typeof r.items[0] === 'undefined') {
        exampleEmbed.setDescription("No results error");
        message.channel.send(exampleEmbed);
        return;
      }

      url = "https://www.youtube.com/watch?v=" + r.items[0].id.videoId //get url
      title = r.items[0].snippet.title //get title

    } else {
      url = search;
    }
    //////////////////////////////////
    exampleEmbed.setDescription(`Added [${title}]` + "(" + url + ")")
    //get queue from db if it doesnt exists
    results = await mongo.findQueueByGuildId(message.guild.id);
    if (!results) {
      //if no queue, make one, add to db, and run teh playmusic
      propertyObject = new Object();
      propertyObject.guildId = message.guild.id
      propertyObject.songs = [url]
      propertyObject.loop = false; //loop defaults to off

      //create queue in db
      await mongo.createQueueByObject(propertyObject)

      //send embed message
      message.channel.send(exampleEmbed);

      //go to playmusic function
      await this.playMusic(message, message.member.voice.channel);
      return;
    } else if (results.songs.length == 0) {    //if queue is empty 
      message.channel.send(exampleEmbed);
      //get song queue and add the new song
      addSong = results.songs;
      addSong.push(url)

      //push it to db
      await mongo.updateQueueByGuildId(message.guild.id, { songs: addSong })

      await this.playMusic(message, message.member.voice.channel); //run the play loop once more

    } else {  //if the queue exists then we add it to queue
      //search youtube for the terms and get url
      message.channel.send(exampleEmbed);

      addSong = results.songs;
      addSong.push(url)
      await mongo.updateQueueByGuildId(message.guild.id, { songs: addSong })

      return;
    }
  },

  async playMusic(message, voiceChannel, options) {
    //get voice channel
    // voiceChannel = message.member.voice.channel;

    //join channel and play
    await voiceChannel.join().then(foo = async connection => {
      results = await mongo.findQueueByGuildId(voiceChannel.guild.id);

      //delete the queue if the size is 0
      if (!results || results.songs.length == 0) {
        await mongo.deleteQueueByObject({ guildId: voiceChannel.guild.id });
        connection.play("");
        return;
      }

      //get the song queue
      playingSongs = results.songs;
      //shift the queue
      url = playingSongs.shift();
      console.log("joined channel");
      //dispatcher plays the audio



      //send to discord
      exampleEmbed = new Discord.MessageEmbed();
      exampleEmbed.setColor('#0099ff');
      exampleEmbed.setTitle("Music")


      //IF YOUTUBe LINK
      if (url.indexOf("yout") > -1) {

        //options for the youtube query. 
        //q property is the url we got from queue
        title = url;

        //parse link
        exampleEmbed.setDescription(`Playing [${title}]` + "(" + url + ")")


        message.channel.send(exampleEmbed)
        let seek =0;


        //check if options argument was passed through
        if (typeof options != 'undefined') {
          seek = options.seconds; //set seek to options passed through
          console.log("seek to " +seek +" seconds")
        } else {
          seek = 0;  //else set to 0
        }

        let begin=seek+"s";
        const dispatcher = connection.play(ytdl(url, {begin: begin})).on("finish", async () => {

          //get the latest song queue
          results = await mongo.findQueueByGuildId(voiceChannel.guild.id)
          songs = results.songs
          //get the url for the first song in queue, whilst removing it from the array

          //if loop isnt enabled, shift the queue 
          if (!results.loop) {
            url = songs.shift();
          }

          console.log(`Finished ${title}`)
          //update the queue with the removed first song
          await mongo.updateQueueByGuildId(voiceChannel.guild.id, { songs: songs })
          this.playMusic(message, voiceChannel);

        }).on("error", async error => {
          message.channel.send("Error youtube")  ///youtube error method

          console.log(error);
          results = await mongo.findQueueByGuildId(message.guild.id)
          songs = results.songs
          //get the url for the first song in queue, whilst removing it from the array
          url = songs.shift();
          console.log(`Finished ${title}`)
          //update the queue with the removed first song
          await mongo.updateQueueByGuildId(message.guild.id, { songs: songs })
          this.playMusic(message, voiceChannel);


        });

        //else its a direct link//////////////////////////////////////////////////////////////
      } else {
        //play the audio with link
        exampleEmbed.setURL(url);
        exampleEmbed.setDescription(`${url}`)
        message.channel.send(exampleEmbed)
        const dispatcher = connection.play(url).on("finish", async () => {

          //get the latest song queue
          results = await mongo.findQueueByGuildId(message.guild.id)
          songs = results.songs
          //get the url for the first song in queue, whilst removing it from the array


          //if loop isnt enabled, shift the queue 
          if (!results.loop) {
            url = songs.shift();
          }
          console.log(`Finished ${url}`)
          //update the queue with the removed first song
          await mongo.updateQueueByGuildId(message.guild.id, { songs: songs })
          this.playMusic(message, voiceChannel);

        }).on("error", async error => {
          message.channel.send("Error direct link")

          results = await mongo.findQueueByGuildId(message.guild.id)
          songs = results.songs
          //get the url for the first song in queue, whilst removing it from the array
          url = songs.shift();
          //update the queue with the removed first song
          await mongo.updateQueueByGuildId(message.guild.id, { songs: songs })
          this.playMusic(message, voiceChannel);


        });
      }
      ////////////main error of playMessage method
    }).catch(async err => {
      console.log(err)


      results = await mongo.findQueueByGuildId(message.guild.id)
      songs = results.songs
      //get the url for the first song in queue, whilst removing it from the array
      url = songs.shift();
      //update the queue with the removed first song
      await mongo.updateQueueByGuildId(message.guild.id, { songs: songs })
      this.playMusic(message, voiceChannel);

    });

  },

};