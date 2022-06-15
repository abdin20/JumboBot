//d imports
const Discord = require('discord.js');


module.exports = {
    name: 'gamblers',
    description: 'attention to all gamblers!',
    async execute(message, args) {

        //display nicely with embeds
        exampleEmbed = new Discord.MessageEmbed();
        exampleEmbed.setColor('#0099ff');
        exampleEmbed.setTitle("Jumbo");
            //riley, noah, jack w, javier
        msg =`<@152558158806646784> <@331589423546368001> <@559892149307572234> <@166703160876990464>`
            //jet , abdn, shane, jason, milton
        msg +=`<@134127232904986624> <@163368896844267521> <@545042126644445184> <@152989214932336640> <@199708115434864641>`
        msg+=  `\n ATTENTION ALL DISTINGUISHED GENTLEMEN`
        
        exampleEmbed.setDescription(msg)
        message.channel.send(exampleEmbed);;
   
    },
};