const { MongoClient } = require('mongodb');
var mongo = require("../mongodb.js");


module.exports = {
	name: 'balance',
	description: 'balance check how much shekels you got',
	async execute(message, args) {

       //get balance
        balance = await mongo.findBalanceById(message.author.id);

        //reply showing balance
        message.reply("you have " + `${balance}` + " shekels")
	},
};