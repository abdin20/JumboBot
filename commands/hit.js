var mongo = require("../mongodb.js");
const Discord = require('discord.js');

var suits = ["spades", "hearts", "diamonds", "clubs"];
var values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

module.exports = {
    name: 'hit',
    description: '$hit for blackjack',
    async execute(message, args) {

        //get game data
        result = await mongo.findGameByType(message.author.id, message.channel.id, "blackjack")
        if (!result) {
            message.reply("You are currently not in a blackjack game");
            return;
        }

       var playerCards = result.playerCards;
       var dealerCards = result.dealerCards;
       var playerScore = result.playerScore;
       var dealerScore = result.dealerScore;
       var bet = result.bet;


        dealerMessage = "";
        playerMessage = "";

        //random card
        suit = suits[Math.floor(Math.random() * 4)]
       var value = values[Math.floor(Math.random() * 13)]
        //randomize until drawn card not found
        while (playerCards.indexOf(suit + ":" + value) >= 0 || dealerCards.indexOf(suit + ":" + value) >= 0) {
            suit = suits[Math.floor(Math.random() * 4)]
            value = values[Math.floor(Math.random() * 13)]
        }

        playerCards.push(suit + ":" + value);

        //calulate score 
        var aces = 0;
        playerScore=0;
        for (let k = 0; k < playerCards.length; k++) {

            //get card
            card= playerCards[k].substring(playerCards[k].indexOf(":")+1);
            
            //keep track of aces
            if (card == "A") {
                aces += 1; //count aces
            } else if (card == "Q" || card== "J" || card == "K") { //otherwise add score normally
                playerScore+=10;
            }else{
                playerScore+=parseInt(card);                  
            }   
        }

        //check for aces last
        for(let m=0;m<aces;m++){
            if(playerScore>10){
                playerScore+=1;
            }else{
                playerScore+=11;
            }
        }

        
//////new code ends/////////////////////////
        //new values
        gameObject = new Object();
        gameObject.playerCards = playerCards;
        gameObject.playerScore = playerScore;
        //update database


        await mongo.updateGameByMessageId(result.messageId, gameObject)

        //add all the dealer cards to a string
        for (let k = 0; k < dealerCards.length; k++) {
            card = dealerCards[k]
            dealerMessage += card.substring(card.indexOf(":") + 1) + ":" + card.substring(0, card.indexOf(":")) + ":"

        }

        //add players cards to a string
        for (let k = 0; k < playerCards.length; k++) {
            card = playerCards[k]
            playerMessage += card.substring(card.indexOf(":") + 1) + ":" + card.substring(0, card.indexOf(":")) + ":"

        }
        //organize dealer and player hands in string
        msg = "Player: " + playerMessage + " Total: " + playerScore + "\n \n Dealer: " + dealerMessage + " Total: " + dealerScore;
        msg += "\n $hit to get another card \n $stand to STAND \n "

        if (playerScore > 21) {
            msg += "\n You Lose!"
            //get the game info once again and delete it
            result = await mongo.findGameByType(message.author.id, message.channel.id, "blackjack")
            await mongo.deleteGamebyObject({ messageId: result.messageId });


            balance = await mongo.findBalanceById(message.author.id)
            msg += "\n You have " + balance + " shekels"
        }

        //display nicely with embeds
        exampleEmbed = new Discord.MessageEmbed();
        exampleEmbed.setColor('#0099ff');
        exampleEmbed.setTitle("Blackjack - " + bet + " shekels");

        exampleEmbed.setDescription(msg);

        message.reply(exampleEmbed)
    },
};