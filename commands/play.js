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


    //get queue from db if it doesnt exists
    results = await mongo.findQueueByChannelId(message.channel.id);
    if (!results) {
      //if no queue, make one, add to db, and run teh playmusic
      propertyObject = new Object();
      propertyObject.channelId = message.channel.id

      const r = await yts(search)
      url = r.videos[0].url
      propertyObject.songs = [url]
      await mongo.createQueueByObject(propertyObject)
      await this.playMusic(message);
      return;
    } else {  //if the queue exists then we add it to queue
      //search youtube for the terms and get url
      const r = await yts(search)
      exampleEmbed.setDescription(`Added ${r.videos[0].title} to queue`);
      message.channel.send(exampleEmbed);
      url = r.videos[0].url
      addSong = results.songs;

      addSong.push(url)
      await mongo.updateQueueByChannelId(message.channel.id, { songs: addSong })

      return;
    }
  },

  async playMusic(message) {
    //get voice channel
    voiceChannel = message.member.voice.channel;

    //join channel and play
    await voiceChannel.join().then(foo = async connection => {
      results = await mongo.findQueueByChannelId(message.channel.id);

      //delete the queue and leave if the size is 0
      if (!results || results.songs.length == 0) {
        await mongo.deleteQueueByObject({ channelId: message.channel.id });
        voiceChannel.leave();
        console.log("left channel");
        return;
      }

      //get the song queue
      playingSongs = results.songs;
      //shift the queue
      url = playingSongs.shift();
      console.log("joined channel");
      //dispatcher plays the audio

      const r = await yts(url)
      title = r.videos[0].title

      //send to discord
      exampleEmbed = new Discord.MessageEmbed();
      exampleEmbed.setColor('#0099ff');
      exampleEmbed.setTitle("Playing");
      exampleEmbed.setDescription(`${title}`)
      message.channel.send(exampleEmbed)

      //play the audio
      const dispatcher = connection.play(ytdl(url), { filter: 'audioonly', quality: 'lowestaudio' }).on("finish", async () => {

        //get the latest song queue
        results = await mongo.findQueueByChannelId(message.channel.id)
        songs = results.songs
        //get the url for the first song in queue, whilst removing it from the array
        url = songs.shift();
        console.log(`Finished ${url}`)
        //update the queue with the removed first song
        await mongo.updateQueueByChannelId(message.channel.id, { songs: songs })
        this.playMusic(message);

      }).on("error", error => { connection.play(ytdl(r.videos[2].url), { filter: 'audioonly', quality: 'lowestaudio' }) });
    }).catch(err => console.log(err));

  },

};