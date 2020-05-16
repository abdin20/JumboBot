//d imports
const Discord = require('discord.js');


module.exports = {
    name: 'tft',
    description: 'asks to play tft',
    async execute(message, args) {

        //display nicely with embeds
        exampleEmbed = new Discord.MessageEmbed();
        exampleEmbed.setColor('#0099ff');
        exampleEmbed.setTitle("Jumbo");
            //milton, daniel, john h, sen
        msg =`<@199708115434864641> <@320397226012835852> <@165898703410954241> <@326394453675737088>`
            //jonathan 
        msg +=`<@185208328975024128>`
        msg+=  `WANNA tft?`
        
        exampleEmbed.setDescription(msg)
        message.channel.send(exampleEmbed);
   
    },
};