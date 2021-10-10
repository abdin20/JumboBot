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


        let member = message.mentions.members.first(),
        

        nickReason=args[1]

        await member.setNickname(nickReason);

        exampleEmbed.setDescription("Changed " + member.displayName+ "'s nickname!");
        message.channel.send({ embeds: [exampleEmbed] });


    },
};