
const fs = require('fs');
const Discord = require('discord.js');

const imageSearch = require('image-search-google');
const imageClient = new imageSearch(process.env.CSI, process.env.GOOGLE_API);
const imageClientTwo = new imageSearch(process.env.CSI, process.env.GOOGLE_API);

module.exports = {
    name: 'kiss',
    description: '$kiss <user>',


    async execute(message, args) {
        //if no arguments
        var pictures=[];
        if (!args) {
            message.reply("you need to mention a user!")
            return;
        }

        //search google
        imageClient.search("anime kissing gif", {})
            .then(images => {
                //get a random image from the array
                for (var k=0;k<images.length;k++){
                    pictures.push(images[k].url);
                }
                
            })
            .catch(error => message.reply("Couldn't find any images"));

            imageClientTwo.search("anime kissing gif", {page : 2})
            .then(images => {
                //get a random image from the array
                for (var k=0;k<images.length;k++){
                    pictures.push(images[k].url);
                }
                
            })
            .catch(error => message.reply("Couldn't find any images"));


            image = (picutres[Math.floor(Math.random() * pictures.length)])

                //SET THE TEXT TO SEND
                msg = `<@${message.author.id}> kissed ${message.mentions.users.first()}`
        
                message.channel.send(msg, { files: [image] });
    },
};