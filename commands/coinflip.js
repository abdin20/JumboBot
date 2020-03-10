const Discord = require('discord.js');
module.exports = {
	name: 'coinflip',
	description: 'NOT GAMBLING flips head or tails',
	execute(message, args) {
		 if (Math.random() * 10 >= 5) {
            result = "heads"
        } else {
            result = "tails"
        }

        //display nicely with embeds
        exampleEmbed = new Discord.MessageEmbed();
        exampleEmbed.setColor('#0099ff');
        exampleEmbed.setTitle("Coinflip");
       
        exampleEmbed.setDescription("Coin flipped to " + result);

        message.channel.send(exampleEmbed);
	},
};