
const Discord = require('discord.js');
var ffmpeg = require('ffmpeg');

var voice=require('../voice.js');

module.exports = {
  name: 'stop',
  description: "stops audio, bot leaves",
  async execute(message, args) {

    //check if person is in voice channel
    if (!message.member.voice.channel) {
      message.reply("You need to be in a voice channel")
      return;
    }

    await voice.execute(message,"null","stop")

  }
};