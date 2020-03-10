const Discord = require('discord.js');
const yts = require( 'yt-search' )
const ytdl = require('ytdl-core');

module.exports = {
	name: 'play',
	description: '$play <search term for youtube>',
	async execute(message, args) {
        //join the arguements
        search=args.join(" ");
        
        //check if arguemnts are there
        if (args.length<1){
            message.reply("Please enter a search term");
            return
        }

        //check if in voice channel
        if (!message.member.voice.channel){
            message.reply("You need to be in a voice channel")
            return;
        }
        
        //search youtube for the terms
          const r = await yts(search)          
          url=r.videos[0].url
          
           

        //get voice channel
          voiceChannel=message.member.voice.channel;
          
          //join channel and play
          await voiceChannel.join().then(foo = async connection => {
            console.log("joined channel");
            //dispatcher plays the audio
            const dispatcher = connection.play(ytdl(url), { filter : 'audioonly' });
            dispatcher.setVolume(0.35);
            dispatcher.on("end", end => {
                console.log("left channel");
                 voiceChannel.leave();
            });
        }).catch(err => console.log(err));


	},
};