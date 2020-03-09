var mongo = require("../mongodb.js");
module.exports = {
	name: 'highlow',
	description: '$highlow <low/high> <bet>',
	async execute(message, args) {
		 //get the rest of teh word
        
        
 
         //check errors
         if (args.length<2 || !isNaN(args[0]) || isNaN(args[1])){
             message.channel.send("Error, please follow the syntax $highlow <low/high> <bet>")
             return;
         }
         //get balance
         balance = await mongo.findBalanceById(message.author.id)
         //check if enough coins
         if (balance<parseInt(args[1],10)){
             message.channel.send("not enough shekels")
             return;
         }
 
         results= await this.playHighLow(args);
         balance=balance+results[1];
         await mongo.updateUserById(message.author.id, {balance:balance})
 
         if(results[0]=="win"){
             message.reply("Rolled "+`${results[2]}`+ "\nYou Won "+ `${results[1]}` +"\n Balance: " + `${balance}`)
         }else{
             message.reply("Rolled "+`${results[2]}`+ "\nYou lose" +"\n Balance: " + `${balance}`);
         }
 
    },

    async playHighLow(words){
        let profit=0;
        let outcome=""
        bet = parseInt(words[1],10)
    
        let number = Math.floor(Math.random() * 10)
        if (number >= 5) {
            result = "high"
        } else {
            result = "low"
        }
    
    
        if (words[0] == result) {
            outcome="win"
            profit=bet
        } else {
            outcome="lose"
            profit=-1*bet;
        }
        return [outcome,profit,number];
    }
    
    
};