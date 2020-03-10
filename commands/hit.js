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
     
        playerCards = result.playerCards;
        dealerCards = result.dealerCards;
        playerScore = result.playerScore;
        dealerScore = result.dealerScore;
        bet=result.bet;

        dealerMessage = "";
        playerMessage = "";

        //random card
        suit = suits[Math.floor(Math.random() * 4)]
        value = values[Math.floor(Math.random() * 13)]
        //randomize until drawn card not found
        while (playerCards.indexOf(suit + ":" + value) >= 0 || dealerCards.indexOf(suit + ":" + value) >= 0) {
            suit = suits[Math.floor(Math.random() * 4)]
            value = values[Math.floor(Math.random() * 13)]
        }

        playerCards.push(suit + ":" + value);

        //add the card to player score
        //check for face cards
        if (value == "Q" || value == "J" | value == "K") {
            playerScore += 10;

            //check for Ace
        } else if (value == "A") {
            if (playerScore > 10) {
                //if player busts, take away 10 score, net gain of 1
                playerScore += 1;
            }else{
                playerScore += 11;
            }
            
        } else {
            playerScore += parseInt(value, 10);
        }

        //new values
        gameObject = new Object();
        gameObject.playerCards = playerCards;
        gameObject.playerScore = playerScore;
        //update database

        
        await mongo.updateGameByMessageId( result.messageId, gameObject) 
        
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
         msg+="\n $hit to get another card \n $stand to STAND \n "

        if (playerScore > 21) {
            msg+="\n You Lose!"
        //get the game info once again and delete it
        result = await mongo.findGameByType(message.author.id, message.channel.id, "blackjack")
        await mongo.deleteGamebyObject({ messageId: result.messageId });
        }

         //display nicely with embeds
         exampleEmbed = new Discord.MessageEmbed();
         exampleEmbed.setColor('#0099ff');
         exampleEmbed.setTitle("Blackjack - " + bet + " shekels");
        
         exampleEmbed.setDescription(msg);

         message.reply(exampleEmbed)
    },
};