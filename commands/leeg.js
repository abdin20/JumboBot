//d imports
const Discord = require('discord.js');


module.exports = {
    name: 'leeg',
    description: 'asks to play seige',
    async execute(message, args) {

        //display nicely with embeds
        exampleEmbed = new Discord.MessageEmbed();
        exampleEmbed.setColor('#0099ff');
        exampleEmbed.setTitle("Jumbo");

        msg =`<@${144260548245061632}> <@${294638368996982784}> <@${116672531661979652}> <@${163368896844267521}> `

        msg +=`<@${313780633518473218}> <@${144260931109519360}> <@${146425358927790081}> <@${message.author.id}> `
        msg+= `WANNA LEEG?`
        
        exampleEmbed.setDescription(msg)
        message.channel.send(exampleEmbed);
   
    },
};