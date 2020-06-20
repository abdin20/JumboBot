//d imports
const Discord = require('discord.js');


module.exports = {
    name: 'seg',
    description: 'asks to play seg',
    async execute(message, args) {

        //display nicely with embeds
        exampleEmbed = new Discord.MessageEmbed();
        exampleEmbed.setColor('#0099ff');
        exampleEmbed.setTitle("Jumbo");
            //aaron, felix, gogurt, capp
        msg =`<@146425358927790081> <@294638368996982784> <@144260931109519360> <@313780633518473218>`
            //connor , abdn
        msg +=`<@144260548245061632> <@163368896844267521>`
        msg+=  `WANNA SEG?`
        
        exampleEmbed.setDescription(msg)
        message.channel.send(exampleEmbed);
   
    },
};