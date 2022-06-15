//d imports
const Discord = require('discord.js');


module.exports = {
    name: 'comp',
    description: 'asks to play comp',
    async execute(message, args) {

        //display nicely with embeds
        exampleEmbed = new Discord.MessageEmbed();
        exampleEmbed.setColor('#0099ff');
        exampleEmbed.setTitle("Jumbo");
            //lagdad, eric, riley, noah, jack w, javier
        msg =`<@310442661343526915> <@196694571843977216> <@152558158806646784> <@331589423546368001> <@559892149307572234> <@967261754998542366>`
            //jet , abdn
        msg +=`<@134127232904986624> <@163368896844267521>`
        msg+=  `WANNA COMP?`
        
        exampleEmbed.setDescription(msg)
        message.channel.send(exampleEmbed);;
   
    },
};