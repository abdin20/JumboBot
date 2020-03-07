
const Discord = require('discord.js');
var ffmpeg = require('ffmpeg');
var queue=[];

    
module.exports = {
  name: 'voice',
  description: "voice controller",
  async execute(message, link, command) {


    //check if person is in voice channel
    if (!message.member.voice.channel) {
      message.reply("You need to be in a voice channel")
      return;
    }

    if(command=="stop"){
        await dispatcher.destroy();
        message.member.voice.channel.leave();
        return;
    }

    if(command=="start"){
    connection= await message.member.voice.channel.join();
    dispatcher = await connection.play(link);
    dispatcher.on('finish', () => {
        console.log('audio.mp3 has finished playing!');
        
      });
    }

    
    

 
  },



};