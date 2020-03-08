const { MongoClient } = require('mongodb');
var mongo = require("../mongodb.js");
var scams=["You sold 6 fake rolex's",
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
        //if less that 200 can use
        if(balance<200){
            //random balance gain
            gain=Math.floor(Math.random() * 1000);
            balance+=gain;
            //update db
            await mongo.updateBalanceById(message.author.id, {balance:balance})
            
            //get scam message
            msg=scams[Math.floor(Math.random() * (+scams.length ))]
            message.reply(msg + " and got " + gain+ " shekels \n Balance: " +balance+ " shekels");
        }else{
            message.reply("You already have alot of shekels");
        }
	},
};