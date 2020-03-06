const { MongoClient } = require('mongodb');
var mongo = require("../mongodb.js");

module.exports = {
	name: 'scam',
	description: 'scam to get shekels, only if you have less than 200',
	async execute(message, args) {
        balance = await mongo.findBalanceById(message.author.id);
        if(balance<200){
            balance+=200;
            await mongo.updateBalanceById(message.author.id, {balance:balance})
            message.reply("You scammed someone out of 200 \n Balance: " +balance);
        }else{
            message.reply("You already have alot of shekels");
        }
	},
};