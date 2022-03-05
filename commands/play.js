//db imoprts
var mongo = require("../mongodb.js");
const Discord = require('discord.js');


// timeout function variable
let timeoutID;
//youtube imports
const searchYoutube = require('youtube-api-v3-search');
const urlParser = require("js-video-url-parser");
const ytdl = require('ytdl-core');
var auth = process.env.GOOGLE_API_2;

const fs = require('fs');
module.exports = {
  name: 'play',
  description: '$play <search term for youtube>',
  async execute(message, args) {
    //join the arguements
    search = args.join(" ");
    //display nicely with embeds
    var exampleEmbed = new Discord.MessageEmbed();
    exampleEmbed.setColor('#0099ff');
    exampleEmbed.setTitle("Music");

    //check if arguemnts are there
    if (args.length < 1) {
      exampleEmbed.setDescription("Please enter a search term");
      console.log("1")
      message.channel.send(exampleEmbed);
      return
    }

    //check if in voice channel
    if (!message.member.voice.channel) {
      exampleEmbed.setDescription("You need to be in a voice channel");
      console.log("2")
      message.channel.send(exampleEmbed);
      return;
    }

    //song url
    var url = ""
    var title = search

    var queueOptions;

    var timeStamp = "";
    /////////////if its a youtube link or not a link and a search term, use yts library
    if ((search.indexOf("http") > -1 && search.indexOf("yout") > -1) || search.indexOf("http") < 0) {


      searchQuery = search;//the query is the search term by default



      //check for time stamp in video
      if (search.indexOf("?t=") > -1) {
        searchQuery = search.substring(0, search.indexOf("?t=")) //edit teh query to get rid of time stamp
        timeStamp = "?t=" + search.substring(search.indexOf("?t=") + 3) //get time stamp part of url
        console.log("time stamp detected");
      }

      //check for time stamp in video other format
      if (search.indexOf("&t=") > -1) {
        searchQuery = search.substring(0, search.indexOf("&t=")) //edit teh query to get rid of time stamp
        timeStamp = "?t=" + search.substring(search.indexOf("&t=") + 3) //get time stamp part of url
        console.log("time stamp detected");
      }

      //check for playlist link and remove playlist part of link
      if (searchQuery.indexOf("&list=") > -1) {
        searchQuery = searchQuery.substring(0, searchQuery.indexOf("&list=")) //edit teh query to get rid of time stamp
        console.log("playlist link found, new link : " + searchQuery);
      }

      //check for playlist link and remove playlist part of link other format
      if (searchQuery.indexOf("?list=") > -1) {
        searchQuery = searchQuery.substring(0, searchQuery.indexOf("?list=")) //edit teh query to get rid of time stamp
        console.log("playlist link found, new link : " + searchQuery);
      }


      //if its a youtube link we dont need to search for it again
      if (search.indexOf("http") >= 0) {
        url = searchQuery + timeStamp;

        //get data from ytdl libarary
        data = await ytdl.getInfo(searchQuery)
        title = data.videoDetails.title;

      } else {

        //options for the youtube query. 
        //q property is the search term we got from user
        const options = {
          q: searchQuery,
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
          console.log("3")
          message.channel.send(exampleEmbed);;
          auth = process.env.GOOGLE_API;//if not reset api key to other account
          r = await searchYoutube(auth, options)
        }

        //check to see if there are results
        if (typeof r.items[0] === 'undefined') {
          exampleEmbed.setDescription("No results error");
          console.log("4")
          message.channel.send(exampleEmbed);;
          return;
        }

        //adds time stamp to if there was one
        url = "https://www.youtube.com/watch?v=" + r.items[0].id.videoId + timeStamp//get url
        title = r.items[0].snippet.title //get title


      }


    } else {
      url = search;
    }
    //////////////////////////////////
    exampleEmbed.setDescription(`Added [${title}]` + "(" + url + ")")
    console.log(`Added [${title}]` + "(" + url + ")");
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
      message.channel.send(exampleEmbed);;

      //go to playmusic function
      await this.playMusic(message, message.member.voice.channel);
      return;
    } else if (results.songs.length == 0) {    //if queue is empty 
      message.channel.send(exampleEmbed);;
      //get song queue and add the new song
      addSong = results.songs;
      addSong.push(url)

      //push it to db
      await mongo.updateQueueByGuildId(message.guild.id, { songs: addSong })

      await this.playMusic(message, message.member.voice.channel); //run the play loop once more

    } else {  //if the queue exists then we add it to queue
      message.channel.send(exampleEmbed);;

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
        var delay = 45 //in seconds
        //if were in method from running a skip method, no need for delay
        if (typeof options !== 'undefined' && options.skip === true) {
          delay = 0;
        }

        // After the queue has ended
        timeoutID = setTimeout(async () => {

          //code to leave server
          await mongo.deleteQueueByObject({ guildId: voiceChannel.guild.id });
        //play see you next time at end of playing
          await connection.play("https://lobfile.com/file/2J2V.mp3").on("finish", async ()=>{
            message.guild.me.voice.channel.leave();
        })
        

        }, delay * 1000) // You should use the time in ms
        return
      } else { ///runs if queue is not empty
        // If the bot is used again
        clearTimeout(timeoutID)
        timeoutID = undefined
      }
      /////






      /////

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

        //get data from ytdl libarary
        data = await ytdl.getInfo(url)

        title = data.videoDetails.title;

        //parse link
        exampleEmbed.setDescription(`Playing [${title}]` + "(" + url + ")")
        console.log(`Playing [${title}]` + "(" + url + ")");
        message.channel.send(exampleEmbed);;

        //default seek to 0
        var seek = 0;

        //check if options argument was passed through
        if (typeof options != 'undefined') {
          seek = options.seconds; //set seek to options passed through
          console.log("seek to " + seek + " seconds")
        }

        //check for time stamp in video
        if (url.indexOf("?t=") > -1) {

          seek = url.substring(url.indexOf("?t=") + 3) //get time stamp part of url
          url = url.substring(0, url.indexOf("?t=")) //edit teh query to get rid of time stamp
          console.log("time stamp parsed for " + seek + "s");
        }

        //check for time stamp in video
        if (url.indexOf("?t=") > -1) {

          seek = url.substring(url.indexOf("?t=") + 3) //get time stamp part of url
          url = url.substring(0, url.indexOf("?t=")) //edit teh query to get rid of time stamp
          console.log("time stamp parsed for " + seek + "s");
          console.log("new url" + url)
        }


        //property for ytdl to seek video
        var begin=seek+"s"

        // const dispatcher = connection.play(ytdl(url, { quality: "lowestaudio", begin: seek }), { seek: seek }).on("finish", async () => {
        const dispatcher= connection.play(ytdl(url, { quality: "lowestaudio", begin: seek }), { seek: seek }).on("finish", async () => {
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
        message.channel.send(exampleEmbed);;
        console.log("Playing (" + url + ")")
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