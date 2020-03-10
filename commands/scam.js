const { MongoClient } = require('mongodb');
const Discord = require('discord.js');
var mongo = require("../mongodb.js");
var scams = ["You sold 6 fake rolex's",
    "You went to Europe just to pickpocket",
    "You sold your toe nails",
    "You sold feet pics ",
    "You collected welfare",
    "You received your inheritance from the Nigerian Prince",
    "You won a dollar scratcher",
    "You sold your piss to some guy in the bathroom",
];

module.exports = {
    name: 'scam',
    description: 'scam to get shekels, only if you have less than 200',
    async execute(message, args) {
        //get balance from db
        balance = await mongo.findBalanceById(message.author.id);
        exampleEmbed = new Discord.MessageEmbed();
        exampleEmbed.setColor('#0099ff');
        exampleEmbed.setTitle("Scam");
        //if less that 200 can use
        if (balance < 200) {
            //random balance gain
            gain = Math.floor(Math.random() * 1000);
            balance += gain;
            //update db
            await mongo.updateUserById(message.author.id, { balance: balance })

            //get scam message
            msg = scams[Math.floor(Math.random() * (+scams.length))]

            exampleEmbed.setDescription(msg + " and got " + gain + " shekels \n Balance: " + balance + " shekels")
        } else {
            exampleEmbed.setDescription("You already have alot of shekels");

        }
        message.reply(exampleEmbed);

    },
};