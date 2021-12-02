const { MongoClient } = require('mongodb');
var mongo = require("../mongodb.js");
const fs = require('fs');
const Discord = require('discord.js');

var users=[]
var reasons=[];

module.exports = {
    name: 'credit',
    description: '<args> possible args "score <user>", "add <user> <reason> ", remove <user> <reason>',
    async execute(message, args) {


        const filter = (reaction, user) => reaction.emoji.name === '🇹🇼';
        const reactionTime = 90000;
        var reactionCount = -1;

        //set balance for author of message if they dont have one
        await mongo.findUserByAuthor(message.author);

        //start building embed message
        var exampleEmbed = new Discord.MessageEmbed();
        exampleEmbed.setColor('#aa381e');
        exampleEmbed.setTitle("Social Credit");
        exampleEmbed.setThumbnail("https://i.imgur.com/cUin9RC.jpeg");
        exampleEmbed.setFooter("China #1")
        if (typeof args[0] === 'undefined') {
            exampleEmbed.setDescription('you need to enter arguments eg "score <user>", "add <user> <reason> ", remove <user> <reason>');
            message.channel.send(exampleEmbed);
            return; //leave 

        }

        //get social credit 
        if (args[0] === "score") {
            //check author of message if user didnt mention
            if (!message.mentions.users.first()) {
                //get balance of author of message
                socialCredit = await mongo.findCreditById(message.author.id);
                user = message.author;
            } else {
                socialCredit = await mongo.findCreditById(message.mentions.users.first().id);
                user = message.mentions.users.first();
            }

            //reply showing balance
            exampleEmbed.setImage(user.avatarURL());
            exampleEmbed.setDescription(`${user.username}'s social credit score is ${socialCredit}`)
            message.reply(exampleEmbed);

        } else if (args[0] === "add") {
            //check author of message if user didnt mention
            if (!message.mentions.users.first()) {
                exampleEmbed.setDescription("you must mention a user");
                message.channel.send(exampleEmbed);
                return; //leave 

            } else {

                //get mentioned user object
                user = message.mentions.users.first();
                users.push(user)
                let username = user.username;
                let userId = user.id
                let userAvatarURL=user.avatarURL();
                exampleEmbed.setThumbnail(user.avatarURL());
                exampleEmbed.setImage("https://i.imgur.com/xJlNJts.png");
                //check if reason was given 
                if (typeof args[2] === 'undefined') {
                    exampleEmbed.setDescription("you must give a reason");
                    message.channel.send(exampleEmbed);
                    return; //leave 
                } else { //else reason was given
                    //get rid of the defining argument, shift twice to get rid of add, and username
                    args.shift();
                    args.shift();
                    reason = args.join(" ")

                    reasons.push(reason)
                    exampleEmbed.setDescription(`React in the next ${reactionTime / 1000} seconds to increase ${users[users.length-1]}'s social credit \n Reason: ${reasons[reasons.length-1]}`)

                    //promise for sending message
                    var reactionMessage = await message.channel.send(exampleEmbed)
                    //bot react to message
                    reactionMessage.react('🇹🇼')
                    //wait 15 seconds for emojis
                    const collector = reactionMessage.createReactionCollector(filter, { time: reactionTime });

                    //edit message showing how much it changed
                    var tempMessage = new Discord.MessageEmbed();
                    tempMessage.setColor('#aa381e');
                    tempMessage.setTitle("Social Credit");
                    tempMessage.setThumbnail(users[users.length-1].avatarURL());
                    tempMessage.setImage("https://i.imgur.com/xJlNJts.png");
                    tempMessage.setFooter("China #1")
                    var newReason = reason
                    collector.on('collect', r => { console.log(`1 upvote`); reactionCount++; });

                    collector.on('end', async (collected) => {
                        console.log(`Collected ${reactionCount} items`)

                        //get users current score
                        currentScore = await mongo.findCreditById(users[0].id);
                        // increase by factor of number of emojis collected
                        currentScore += 100 * reactionCount;

                        //update users social credit
                        await mongo.updateSocialCreditById(users[0].id, { socialCredit: currentScore })

                        tempMessage.setDescription(`${users[0].username}'s score was increased by ${100 * reactionCount} \n Reason: ${reasons[0]} \n New Social Credit Score: ${currentScore}`);
                        reactionMessage.edit(tempMessage);

                        //remove first element from user and reasons array for future messages
                        users.shift();
                        reasons.shift()
                        //check if user is in channel
                        //https://lithi.io/file/7m7T.mp3
                        //check if person in channel
                        if (message.member.voice.channel && !await mongo.findQueueByGuildId(message.guild.id)) {

                            await message.member.voice.channel.join()

                                .then(foo = async (connection) => {
                                    await connection.play("https://lithi.io/file/7m7T.mp3").on("finish", async () => {
                                        //leaves after finishing
                                        message.guild.me.voice.channel.leave();
                                    });
                                });
                        }
                    });
                }
            }
        } else if (args[0] === "remove") {
            //check author of message if user didnt mention
            if (!message.mentions.users.first()) {
                exampleEmbed.setDescription("you must mention a user");
                message.channel.send(exampleEmbed);
                return; //leave 

            } else {

                //get mentioned user object
                user = message.mentions.users.first();
                users.push(user)
                let username = user.username;
                let userId = user.id
                let userAvatarURL=user.avatarURL();
                //create social credit if not found
                await mongo.findUserByAuthor(user);
                exampleEmbed.setThumbnail(user.avatarURL());
                exampleEmbed.setImage("https://i.imgur.com/OR8IhE7.png");
                //check if reason was given 
                if (typeof args[2] === 'undefined') {
                    exampleEmbed.setDescription("you must give a reason");
                    message.channel.send(exampleEmbed);
                    return; //leave 
                } else { //else reason was given
                    //get rid of the defining argument, shift twice to get rid of add, and username
                    args.shift();
                    args.shift();
                    reason = args.join(" ")
                    //push to reason array
                    reasons.push(reason);

                    exampleEmbed.setDescription(`React in the next ${reactionTime / 1000} seconds to decrease ${users[users.length-1]}'s social credit \n Reason: ${reasons[reasons.length-1]}`)

                    //promise for sending message
                    var reactionMessage = await message.channel.send(exampleEmbed)
                    //bot react to message
                    reactionMessage.react('🇹🇼')
                    //wait 15 seconds for emojis
                    const collector = reactionMessage.createReactionCollector(filter, { time: reactionTime });

                    //edit message showing how much it changed
                    var otherMessage = new Discord.MessageEmbed();
                    otherMessage.setColor('#aa381e');
                    otherMessage.setTitle("Social Credit");
                    otherMessage.setThumbnail(users[users.length-1].avatarURL());
                    otherMessage.setImage("https://i.imgur.com/OR8IhE7.png");
                    otherMessage.setFooter("China #1")

                    //once time is over update users credit score
                    collector.on('collect', r => { console.log(`1 downvote`); reactionCount++; });
                    collector.on('end', foo = async collected => {
                        console.log(`Collected ${reactionCount} items`)

                        //get users current score
                        currentScore = await mongo.findCreditById(users[0].id);
                        // increase by factor of number of emojis collected
                        currentScore -= 100 * (reactionCount);

                        //update users social credit
                        await mongo.updateSocialCreditById(users[0].id, { socialCredit: currentScore })

                        otherMessage.setDescription(`${users[0].username}'s score was decreased by ${100 * (reactionCount)} \n Reason: ${reasons[0]} \n New Social Credit Score: ${currentScore}`);
                        reactionMessage.edit(otherMessage);

                        //shift the users and reasons
                        users.shift();
                        reasons.shift()
                        //check if user is in channel
                        //https://lithi.io/file/7m7T.mp3
                        //check if person in channel and music not playing
                        if (message.member.voice.channel && !await mongo.findQueueByGuildId(message.guild.id)) {

                            await message.member.voice.channel.join()

                                .then(foo = async (connection) => {
                                    await connection.play("https://lithi.io/file/CfCP.mp3").on("finish", async () => {
                                        //leaves after finishing
                                        message.guild.me.voice.channel.leave();
                                    });
                                });
                        }
                    });
                }
            }
        }

    }
};