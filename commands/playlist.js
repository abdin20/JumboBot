//d imports
var mongo = require("../mongodb.js");
const Discord = require('discord.js');
var play = require("./play.js");


module.exports = {
    name: 'playlist',
    description: '<args> possible args "add <url/term>", "play <user> <num of songs>", <view> <user>, <remove> <song>',
    async execute(message, args) {
        //display nicely with embeds
        exampleEmbed = new Discord.MessageEmbed();
        exampleEmbed.setColor('#0099ff');
        exampleEmbed.setTitle("Playlist");

        //adding to playlist
        if (args[0] === "add") {
            if (typeof args[1] === 'undefined') { //check for url/term to add 
                exampleEmbed.setDescription("you need an url/search term to add to your playlist");
                message.channel.send(exampleEmbed);
                return;
            }
            //get rid of the defining argument, and get the parameters
            args.shift();
            song = args.join(" ")
            console.log("adding " + song + " to playlist");

            //check to see if user has playlist, if not then make one
            results = await mongo.findPlaylistById(message.author.id);

            //make playlist
            if (!results) {
                playlist = { id: message.author.id, songs: [song] }

                //update db
                await mongo.createPlaylistByObject(playlist);
            } else {
                //if playlist is there get songs, add to playlist

                songs = results.songs; //get the playlist
                songs.push(song)  //append it
                //update db
                await mongo.updatePlaylistById(message.author.id, { songs: songs })
            }

            //send confirmation 
            exampleEmbed.setDescription("Added " + song + " to your playlist");
            message.channel.send(exampleEmbed);
        }


        //playing a random song from someones playlist
        if (args[0] === "play") {
            var songsArray = new Array();
            var songCount = 2;
            if (typeof message.mentions.users.first() === 'undefined') {
                exampleEmbed.setDescription("you need to mention someone to play their playlist");
                message.channel.send(exampleEmbed);
                return;
            }

            //check if number is valid
            if (isNaN(args[2])) {
                exampleEmbed.setDescription("Added 2 songs from " + message.mentions.users.first().username + "'s playlist");
                message.channel.send(exampleEmbed);

            } else {
                songCount = args[2];
                exampleEmbed.setDescription("Added " +songCount+ " songs from " + message.mentions.users.first().username + "'s playlist");
                message.channel.send(exampleEmbed);
            }

            //check if in voice channel
            if (!message.member.voice.channel) {
                exampleEmbed.setDescription("You need to be in a voice channel");
                message.channel.send(exampleEmbed);
                return;
            }


            //check to see if playlist exists
            searchResults = await mongo.findPlaylistById(message.mentions.users.first().id);

            //if not exists thwen send message
            if (!searchResults) {
                exampleEmbed.setDescription("This person has no playlist ");
                message.channel.send(exampleEmbed);
                return;
            } else {

                //if exists 

                //check if enough songs in playlist
                if (searchResults.songs.length < songCount) {
                    exampleEmbed.setDescription("This person only has " + searchResults.songs.length+ " songs");
                    message.channel.send(exampleEmbed);
                    return;
                }

                console.log("adding " + songCount +" songs ")
                //loop until enough songs have been added
                for (let m = 0; m < songCount; m++) {

                    //get a random song
                    song = searchResults.songs[Math.floor(Math.random() * searchResults.songs.length)];
                    //whole the array contains it keep randomizing;
                    while (songsArray.includes(song)) {
                        song = searchResults.songs[Math.floor(Math.random() * searchResults.songs.length)];
                    }

                    //when it doesnt have add to array
                    songsArray.push(song);
                    console.log("adding " + song+" to queue")
                    await play.execute(message, [song]) //and add to queue
                }
            }
        }

        if (args[0] === "view") {

            //if no one is mentioned view your own playlist by default.
            var username = message.author.username;
            var id = message.author.id;

            //check to see mentions
            if (typeof message.mentions.users.first() !== 'undefined') {
                username = message.mentions.users.first().username;
                id = message.mentions.users.first().id;  //set id and username accordingly 
            }

            //find playlist
            //check to see if playlist exists
            results = await mongo.findPlaylistById(id);

            //if not exists then send message
            if (!results) {
                exampleEmbed.setDescription(username + " has no playlist ");
                message.channel.send(exampleEmbed);
                return;
            } else {
                //go through songs
                for (let m = 0; m < results.songs.length; m++) {
                    exampleEmbed.addField(m + 1, results.songs[m], true); //add fields for each song
                }

                message.channel.send(exampleEmbed); ///send to  channel

            }
        }

        if (args[0] === "remove") {
            if (typeof args[1] === 'undefined') { //check for url/term to remove 
                exampleEmbed.setDescription("you need an url/search term to remove from your playlist");
                message.channel.send(exampleEmbed);
                return;
            }

            //check to see if playlist exists
            results = await mongo.findPlaylistById(message.author.id);

            //if not exists thwen send message
            if (!results) {
                exampleEmbed.setDescription("You have no playlist ");
                message.channel.send(exampleEmbed);
                return;
            } else {
                //get rid of the defining argument, and get the parameters
                args.shift();
                removeSong = args.join(" ") //song we want to remove
                console.log("removing :" + removeSong)
                newSongs = new Array();

                //loop through
                for (let k = 0; k < results.songs.length; k++) {

                    console.log(results.songs[k])
                    //only add songs if it isnt the one we want to remove
                    if (results.songs[k] != removeSong) {
                        newSongs.push(results.songs[k]);  //push to array
                        console.log("found remove song: " + removeSong)
                    }
                }
                console.log("New song array " + newSongs)
                //update db
                await mongo.updatePlaylistById(message.author.id, { songs: newSongs })


            }

        }



    },
};