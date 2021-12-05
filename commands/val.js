//d imports
const Discord = require('discord.js');


module.exports = {
    name: 'val',
    description: 'asks to play val',
    async execute(message, args) {

        //display nicely with embeds
        exampleEmbed = new Discord.MessageEmbed();
        exampleEmbed.setColor('#0099ff');
        exampleEmbed.setTitle("Jumbo");
            //noah, eric, riley, jason
        msg =`<@331589423546368001> <@196694571843977216> <@152558158806646784> <@152989214932336640>`
            //jet , abdn, jonathan, nic k, jack, john h, javert
        msg +=`<@134127232904986624> <@163368896844267521> <@185208328975024128> <@181589300754907137> <@559892149307572234> <@165898703410954241> <@166703160876990464>`
        msg+=  `WANNA VAL?`
        
        exampleEmbed.setDescription(msg)
        message.channel.send(exampleEmbed);;
   
    },
};