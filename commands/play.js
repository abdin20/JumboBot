//db imoprts
var mongo = require("../mongodb.js");
const Discord = require('discord.js');

//youtube imports
const yts = require('yt-search')
const ytdl = require('ytdl-core');
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
    var url=""
    var title=search

    /////////////if its a youtube link or not a link and a search term, use yts library
    if((search.indexOf("http")>-1 && search.indexOf("yout")>-1) || search.indexOf("http")<0){
      const r = await yts(search)
      url = r.videos[0].url
      title=r.videos[0].title
    }else{
      url=search;
    }
//////////////////////////////////

    //get queue from db if it doesnt exists
    results = await mongo.findQueueByGuildId(message.guild.id);
    if (!results) {
      //if no queue, make one, add to db, and run teh playmusic
      propertyObject = new Object();
      propertyObject.guildId = message.guild.id
      propertyObject.songs = [url]

      await mongo.createQueueByObject(propertyObject)
      exampleEmbed.setURL(url);
      exampleEmbed.setDescription(`Added ${title} to queue`);
      message.channel.send(exampleEmbed);
      await this.playMusic(message);
      return;
    }else if(results.songs.length==0){    //if queue is empty 
      exampleEmbed.setDescription(`Added ${title} to queue`);
      exampleEmbed.setURL(url);
      message.channel.send(exampleEmbed);

      //get song queue and add the new song
      addSong = results.songs;
      addSong.push(url) 

      //push it to db
      await mongo.updateQueueByGuildId(message.guild.id, { songs: addSong })

      await this.playMusic(message); //run the play loop once more

    } else {  //if the queue exists then we add it to queue
      //search youtube for the terms and get url
      exampleEmbed.setURL(url);
      exampleEmbed.setDescription(`Added ${title} to queue`);
      message.channel.send(exampleEmbed);

      addSong = results.songs;
      addSong.push(url)
      await mongo.updateQueueByGuildId(message.guild.id, { songs: addSong })

      return;
    }
  },

  async playMusic(message) {
    //get voice channel
    voiceChannel = message.member.voice.channel;

    //join channel and play
    await voiceChannel.join().then(foo = async connection => {
      results = await mongo.findQueueByGuildId(message.guild.id);

      //delete the queue if the size is 0
      if (!results || results.songs.length == 0) {
        await mongo.deleteQueueByObject({ guildId: message.guild.id });
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
      exampleEmbed.setTitle("Playing");



      //IF YOUTUBe LINK

      if(url.indexOf("yout")>-1){
      //parse link
      const r = await yts(url)
      title=r.videos[0].title
      exampleEmbed.setURL(url);
      exampleEmbed.setDescription(`${title}`)
      message.channel.send(exampleEmbed)

     
      const dispatcher = connection.play(ytdl(url,{ quality:"highestaudio" })).on("finish", async () => {
        
        //get the latest song queue
        results = await mongo.findQueueByGuildId(message.guild.id)
        songs = results.songs
        //get the url for the first song in queue, whilst removing it from the array
        url = songs.shift();
        console.log(`Finished ${title}`)
        //update the queue with the removed first song
        await mongo.updateQueueByGuildId(message.guild.id, { songs: songs })
        this.playMusic(message);

      }).on("error", async error => { message.channel.send("Error youtube")  ///youtube error method
    
    
      results = await mongo.findQueueByGuildId(message.guild.id)
      songs = results.songs
      //get the url for the first song in queue, whilst removing it from the array
      url = songs.shift();
      console.log(`Finished ${title}`)
      //update the queue with the removed first song
      await mongo.updateQueueByGuildId(message.guild.id, { songs: songs })
      this.playMusic(message);
    
   
    });

      //else its a direct link//////////////////////////////////////////////////////////////
      }else{
    //play the audio with link
    exampleEmbed.setURL(url);
    exampleEmbed.setDescription(`${url}`)
    message.channel.send(exampleEmbed)
      const dispatcher = connection.play(url).on("finish", async () => {

        //get the latest song queue
        results = await mongo.findQueueByGuildId(message.guild.id)
        songs = results.songs
        //get the url for the first song in queue, whilst removing it from the array
        url = songs.shift();
        console.log(`Finished ${url}`)
        //update the queue with the removed first song
        await mongo.updateQueueByGuildId(message.guild.id, { songs: songs })
        this.playMusic(message);

      }).on("error",async error => { message.channel.send("Error direct link") 
      
      results = await mongo.findQueueByGuildId(message.guild.id)
      songs = results.songs
      //get the url for the first song in queue, whilst removing it from the array
      url = songs.shift();
      //update the queue with the removed first song
      await mongo.updateQueueByGuildId(message.guild.id, { songs: songs })
      this.playMusic(message);
    
    
    });
    }
      ////////////main error of playMessage method
    }).catch( async err => {console.log(err)
    
    
      results = await mongo.findQueueByGuildId(message.guild.id)
      songs = results.songs
      //get the url for the first song in queue, whilst removing it from the array
      url = songs.shift();
      //update the queue with the removed first song
      await mongo.updateQueueByGuildId(message.guild.id, { songs: songs })
      this.playMusic(message);

    });

  },

};