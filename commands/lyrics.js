//d imports
const Discord = require('discord.js');
var mongo = require("../mongodb.js");
const ytdl = require("ytdl-core");
const scraper = require("azlyrics-scraper");


module.exports = {
    name: 'lyrics',
    description: 'displays the lyrics for the current song playing',
    async execute(message, args) {

        //display nicely with embeds
        exampleEmbed = new Discord.MessageEmbed();
        exampleEmbed.setColor('#0099ff');
        var title;

        //get queue of songs from database
        results = await mongo.findQueueByGuildId(message.guild.id);

        //queue not found
        if (!results) {

            exampleEmbed.setDescription("No song playing")
            message.channel.send(exampleEmbed);
            return;

        } else {
            //get first song
            song = results.songs[0]

            //check if its youtube link
            if ((song.indexOf("http") > -1 && song.indexOf("yout") > -1)) {
                //get data from ytdl libarary
                data = await ytdl.getInfo(song)

                //no title was found
                if (!data) {
                    exampleEmbed.setDescription("No title could be found")
                    message.channel.send(exampleEmbed);
                    return;
                }


                title = data.title;
                console.log("Executing lyric search for " + title);
                exampleEmbed.setTitle(title);
            } else { //if not 
                exampleEmbed.setDescription("only works for youtube songs")
                message.channel.send(exampleEmbed);
                return;
            }


            //get lyrics
            var lyrics = await scraper.getLyric(title)

            //build message to send
            var msg = "";
            var count = 0;
            // go through array of lyrics
            for (let m = 0; m < lyrics.length; m++) {
                count++;
                msg += lyrics[m] + "\n";

                //if the count is 25 send the message
                if (count == 25) {
                    exampleEmbed.setDescription(msg);
                    message.channel.send(exampleEmbed);
                    msg = "";
                    count = 0;
                }
            }

            //send again incase the last lyrics arent sent
            exampleEmbed.setDescription(msg);
            message.channel.send(exampleEmbed);

        }






    },
};