//db imoprts
var mongo = require("../mongodb.js");
const Discord = require('discord.js');



module.exports = {
    name: 'leaderboard',
    description: 'shows leaderboard of social credit for server',
    async execute(message, args) {

        //display nicely with embeds
        var exampleEmbed = new Discord.MessageEmbed();
        exampleEmbed.setColor('#aa381e');
        exampleEmbed.setTitle("Social Credit Leaderboard");
        exampleEmbed.setThumbnail("https://i.imgur.com/cUin9RC.jpeg");
        exampleEmbed.setFooter("China #1")


        var guildId = message.guild.id;
        var guild = await client.guilds.fetch(guildId);


        var filterUsers = []
        // var guildMembers=guild.members.fetch().then(console.log)
        //get all users
        result = await mongo.getAllUsers();

        if (result) {

            for (let user of result) {
                //get discord user object using database id

                try {
                    //check to see if user is in guild
                    var isGuild = await guild.members.fetch(user.id).catch()
                    if (isGuild) {
                        filterUsers.push(user)
                    }
                } catch (error) {
                }

            }
            //sort the users by social credit
            filterUsers.sort((a,b)=>{return b.socialCredit-a.socialCredit})

            var stringBuilder=""
            var count=1;
            //construct string for leaderboard
            for(sortedUser of filterUsers){
                stringBuilder+=`${count}. ${sortedUser.name} (${sortedUser.socialCredit}) \n`
                count++;
            }
            //send message
            exampleEmbed.setDescription(stringBuilder)
            message.channel.send(exampleEmbed);
        }
    },
};