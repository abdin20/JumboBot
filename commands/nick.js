const Discord = require('discord.js');
module.exports = {
    name: 'nick',
    description: 'nick @PERSON <nickname>',
    async execute(message, args) {
        //check if arguemnts are there


        //display nicely with embeds
        exampleEmbed = new Discord.MessageEmbed();
        exampleEmbed.setColor('#0099ff');
        exampleEmbed.setTitle("Nickname");

        //check for arguments
        if (args.length < 1) {
            exampleEmbed.setDescription("please give a user and nickname");
            message.channel.send({ embeds: [exampleEmbed] });
            return
        }

        //get the guildmember
        let member = message.mentions.members.first()

        //pop the first argument which is the user mentioned
            args.shift();
            nickReason = args.join(" ")

        try {
            await member.setNickname(nickReason);
            exampleEmbed.setDescription("Changed " + member.displayName + "'s nickname!");
            message.channel.send({ embeds: [exampleEmbed] });

        } catch (error) {
            console.error(error);
            exampleEmbed.setDescription("error");
            message.channel.send({ embeds: [exampleEmbed] });
        }



    },
};