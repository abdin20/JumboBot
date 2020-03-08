
const fs = require('fs');
const Discord = require('discord.js');
module.exports = {
	name: 'kiss',
	description: '$kiss <user>',
	async execute(message, args) {
        //if no arguments
        if(!args){
            message.reply("you need to mention a user!")
            return;
        }

        //SET THE TEXT TO SEND
        msg= `<@${message.author.id}> kissed ${message.mentions.users.first()}` 
        message.channel.send(msg, {files: ["https://media.giphy.com/media/nyGFcsP0kAobm/giphy.gif"]});
	},
};