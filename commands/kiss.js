
const fs = require('fs');
const Discord = require('discord.js');

const imageSearch = require('image-search-google');
const imageClient = new imageSearch(process.env.CSI, process.env.GOOGLE_API);

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

        var num=Math.floor( (Math.random()*4) + 1)
        //search google
        imageClient.search("anime kissing gif", {page : num })
            .then(images => {
                //get a random image from the array
                image = (images[Math.floor(Math.random() * images.length)])

                //SET THE TEXT TO SEND
                msg = `<@${message.author.id}> kissed ${message.mentions.users.first()}`
        
                message.channel.send(msg, { files: [image] });
            })
            .catch(error => message.reply("Couldn't find any images"));


           
    },
};