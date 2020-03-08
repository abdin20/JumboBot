
const fs = require('fs');
const Discord = require('discord.js');

module.exports = {
	name: 'kiss',
    description: '$kiss <user>',


	async execute(message, args) {
        //if no arguments
        
        //random images uwu
        files =[
            "https://i.imgur.com/sGVgr74.gif",
            "https://media.giphy.com/media/nyGFcsP0kAobm/giphy.gif",
            "https://media2.giphy.com/media/FqBTvSNjNzeZG/giphy.gif",
            "https://data.whicdn.com/images/328811537/original.gif",
            "https://data.whicdn.com/images/294356906/original.gif",
            "https://media1.giphy.com/media/12VXIxKaIEarL2/giphy.gif",
            "https://media1.tenor.com/images/ac790bce799c45786b102e567173d115/tenor.gif?itemid=15517596"
        
        ]
        if(!args){
            message.reply("you need to mention a user!")
            return;
        }

        //SET THE TEXT TO SEND
        msg= `<@${message.author.id}> kissed ${message.mentions.users.first()}` 
        file=files[Math.floor(Math.random() * (+files.length ))]
        message.channel.send(msg, {files: [file]});
	},
};