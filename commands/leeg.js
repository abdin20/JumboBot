//d imports
const Discord = require('discord.js');


module.exports = {
    name: 'leeg',
    description: 'asks to play leeg',
    async execute(message, args) {

        //display nicely with embeds
        exampleEmbed = new Discord.MessageEmbed();
        exampleEmbed.setColor('#0099ff');
        exampleEmbed.setTitle("Jumbo");
            //milton, daniel, john h, sen
        msg =`<@199708115434864641> <@320397226012835852> <@165898703410954241> <@326394453675737088>`
            //jonathan , dtz, abdn
        msg +=`<@185208328975024128> <@150029401973587969> <@163368896844267521>`
        msg+=  `WANNA LEEG?`
        
        exampleEmbed.setDescription(msg)
        message.channel.send(exampleEmbed);
   
    },
};