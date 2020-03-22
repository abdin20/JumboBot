var mongo = require("../mongodb.js");
const Discord = require('discord.js');

var suits = ["spades", "hearts", "diamonds", "clubs"];
var values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

module.exports = {
	name: 'blackjack',
	description: '$blackjack <bet>',
	async execute(message, args) {

		playerCards = [];
		dealerCards = [];
		playerScore = 0;
		dealerScore = 0;

		playerMessage = "Player: ";
		dealerMessage = "Dealer: ";
		bet = 0;

		//get balance
		balance = await mongo.findBalanceById(message.author.id)


		// uncomment when ready to fully implement game
		// check if playing game
		result = await mongo.findGameByType(message.author.id, message.channel.id, "blackjack")
		if (result) {
			message.reply("You're already in a game");
			return;
		}

		//check if 1 arguement is there
		if (args.length < 1) {
			message.channel.send("Error, please follow the syntax $blackjack <bet>")
			return;
		}

		//handling bet arguement
		if (args[0] == "all") {
			bet =balance; 
			//if not a number or less than 0 cant bet
		}else if( isNaN(args[0]) || args[0]<0  ){
			message.channel.send("Error, please follow the syntax $blackjack <bet>")
			return;
		}else{
			bet=parseInt(args[0],10);
		}

		
		//check if enough coins
		if (balance < bet) {
			message.channel.send("not enough shekels")
			return;
		} else {
			//update balance with bet
			await mongo.updateUserById(message.author.id, { balance: balance - bet })
		}

		///////////////////////////////////////////game logic
		//loop through the deal
		for (m = 0; m < 2; m++) {
			for (k = 0; k < 2; k++) {

				//dealing player cards
				if (m == 0) {
					suit = suits[Math.floor(Math.random() * 4)]
					value = values[Math.floor(Math.random() * 13)]

					//check for face cards
					if (value == "Q" || value == "J" | value == "K") {
						playerScore += 10;

						//check for Ace
					} else if (value == "A") {
						if (playerScore > 10) {
							//if player busts, take away 10 score, net gain of 1
							playerScore += 1;
						} else {
							playerScore += 11;
						}

					} else {
						playerScore += parseInt(value, 10);
					}

					//push the card as a string
					playerCards.push(suit + ":" + value);

					//make the message
					playerMessage += value + " :" + suit + ": ";

					//dealing dealer cards only once
				} else if (m == 1 && k == 0) {

					//random cards
					suit = suits[Math.floor(Math.random() * 4)]
					value = values[Math.floor(Math.random() * 13)]

					//check for face cards
					if (value == "Q" || value == "J" | value == "K") {
						dealerScore += 10;

						//check for Ace
					} else if (value == "A") {
						if (dealerScore > 10) {
							//if player busts, take away 10 score, net gain of 1
							dealerScore += 1;
						} else {
							dealerScore += 11;
						}
					} else {
						dealerScore += parseInt(value, 10);
					}

					//push the card as a string
					dealerCards.push(suit + ":" + value);

					dealerMessage += value + " :" + suit + ": ";

				}

			}
		}
		/////////////////////////////////////game logic
		//set the blackjack game variables

		msg = playerMessage + " Total: " + playerScore + "\n \n" + dealerMessage + " Total: " + dealerScore;
		msg += "\n $hit to get another card \n $stand to STAND"
		//embed message of the game
		exampleEmbed = new Discord.MessageEmbed();
		exampleEmbed.setColor('#0099ff');
		exampleEmbed.setTitle("Blackjack - " + args[0] + " shekels");

		//update the message last, then send it
		exampleEmbed.setDescription(msg);
		await message.channel.send(exampleEmbed).then(foo = async sent => {
			//set the new game object
			game = new Object();
			game.id = message.author.id;
			game.channelId = message.channel.id;
			game.messageId = sent.id;
			game.bet = args[0];
			game.type = "blackjack";
			game.playerCards = playerCards;
			game.dealerCards = dealerCards;
			game.playerScore = playerScore;
			game.dealerScore = dealerScore;
			await mongo.createGameByObject(game);
			console.log("created and upload blackjack game")
		});

	},
};