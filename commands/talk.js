
const Discord = require('discord.js');
var ffmpeg = require('ffmpeg');

var voice=require('../voice.js');

module.exports = {
  name: 'talk',
  description: "talk",
  async execute(message, args) {

    //check if person is in voice channel
    if (!message.member.voice.channel) {
      message.reply("You need to be in a voice channel")
      return;
    }

    
    // const connection = await message.member.voice.channel.join();

    // const dispatcher = connection.play('https://drive.google.com/uc?export=download&id=1IpiqytjG-svDH3EEZeNVPZaG7GAM2a3i');
    
    await voice.execute(message,"https://drive.google.com/uc?export=download&id=1IpiqytjG-svDH3EEZeNVPZaG7GAM2a3i","start",)

  }
};