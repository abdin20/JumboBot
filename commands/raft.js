//d imports
const Discord = require('discord.js');


module.exports = {
    name: 'raft',
    description: 'asks to play raft',
    async execute(message, args) {

        //display nicely with embeds
        exampleEmbed = new Discord.MessageEmbed();
        exampleEmbed.setColor('#0099ff');
        exampleEmbed.setTitle("Jumbo");
            //aaron, shane, gogurt, capp
        msg =`<@146425358927790081> <@116672531661979652> <@144260931109519360> <@313780633518473218>`
            //abdn
        msg +=`<@163368896844267521>`
        msg+=  `WANNA raft?`
        
        exampleEmbed.setDescription(msg)
        message.channel.send(exampleEmbed);
   
    },
};