const Discord = require('discord.js');
var mongo = require("./mongodb.js");
exports.attemptKickUser = async function attemptKickUser(state) {

    //get channel name and user
    var channelName = state.channel.name;
    var user = state.member.user

    var filteredChannelName = channelName.match(/\d/g);

    //setup embed message
    var exampleEmbed = new Discord.MessageEmbed();
    exampleEmbed.setColor('#aa381e');
    exampleEmbed.setTitle("Government");
    exampleEmbed.setThumbnail("https://i.imgur.com/cUin9RC.jpeg");


    //check if channel name is made for social credit checking
    if (filteredChannelName !== null && channelName.indexOf("+") > -1) {
        filteredChannelName = filteredChannelName.join("");
        //convert to integer
        filteredChannelName = parseInt(filteredChannelName)

        //get users social credit
        //set balance for author of message if they dont have one
        await mongo.findUserByAuthor(user);
        var socialCredit = await mongo.findCreditById(user.id);

        //check if person has enough credit
        if (filteredChannelName > socialCredit) {
            try {
                //kick users
                console.log(`Kicking ${user.username} has ${socialCredit}, needs ${filteredChannelName}`)
                // exampleEmbed.setDescription(`You need ${filteredChannelName} to join but only have ${socialCredit} social credit `)
                // client.users.cache.get(user.id).send(exampleEmbed);
                channel=state.guild.channels.cache.filter(c => c.type === 'text').find(x => x.position == 0);
                exampleEmbed.setDescription(`<@${user.id}> tried joining but didn't have enough credit`)
                channel.send(exampleEmbed);
                state.kick("Not enough social credit");
            } catch (error) {
                console.log(error)
            }

        }
    }



}