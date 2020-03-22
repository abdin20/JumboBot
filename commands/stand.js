var mongo = require("../mongodb.js");
const Discord = require('discord.js');

var suits = ["spades", "hearts", "diamonds", "clubs"];
var values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
module.exports = {
    name: 'stand',
    description: '$stand stop getting cards in blackjack',
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
        bet = result.bet;

        dealerMessage = "";
        playerMessage = "";
        //loop through until dealer busts
        while (dealerScore < playerScore && dealerScore < 22) {

            //keep hitting until we can stop

            suit = suits[Math.floor(Math.random() * 4)]
            value = values[Math.floor(Math.random() * 13)]

            //randomizer to make sure dont get same cards
            while (playerCards.indexOf(suit + ":" + value) >= 0 || dealerCards.indexOf(suit + ":" + value) >= 0) {
                suit = suits[Math.floor(Math.random() * 4)]
                value = values[Math.floor(Math.random() * 13)]
            }

            //push the card as a string
            dealerCards.push(suit + ":" + value);

        
            var aces = 0;
            dealerScore = 0;

            //loop though all cards
            for (let k = 0; k < dealerCards.length; k++) {

                //get card
                card = dealerCards[k].substring(dealerCards[k].indexOf(":") + 1);
                //keep track of aces
                if (card == "A") {
                    aces += 1; //count aces
                } else if (card == "Q" || card == "J" || card == "K") { //otherwise add score normally
                    dealerScore += 10;
                } else {
                    dealerScore += parseInt(card);
                }
            }

            //check for aces last
            for (let m = 0; m < aces; m++) {
                if (dealerScore > 10) {
                    dealerScore += 1;
                } else {
                    dealerScore += 11;
                }
            }

        }


        //add all teh dealer cards to a string
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


        //end game conditions
        if (dealerScore == playerScore) {
            msg += "\n Push!"
            profit = parseInt(result.bet);
        } else if (dealerScore > playerScore && dealerScore <= 21) {
            msg += "\n You lose!"
            profit = 0;
        } else if (playerScore > dealerScore && playerScore <= 21) {
            msg += "\n You Win!"
            profit = 2 * parseInt(result.bet);
        } else if (dealerScore > 21 && playerScore <= 21) {
            msg += "\n You Win!"
            profit = 2 * parseInt(result.bet)
        } else {
            msg += "\n You Lose!"
            profit = 0;
        }
        //get balance
        balance = await mongo.findBalanceById(message.author.id)

        //update accordingly
        balance = balance + profit
        await mongo.updateUserById(message.author.id, { balance: balance })


        //update the message last, then send it
        msg += "\n You have " + balance + " shekels"


        //display nicely with embeds
        exampleEmbed = new Discord.MessageEmbed();
        exampleEmbed.setColor('#0099ff');
        exampleEmbed.setTitle("Blackjack - " + bet + " shekels");

        exampleEmbed.setDescription(msg);
        message.reply(exampleEmbed);
        //get the game info once again
        result = await mongo.findGameByType(message.author.id, message.channel.id, "blackjack")
        await mongo.deleteGamebyObject({ messageId: result.messageId });

    },
};