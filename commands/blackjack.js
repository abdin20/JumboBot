var suits = ["spades", "hearts", "diamonds", "clubs"];
var values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

module.exports = {
	name: 'blackjack',
	description: ' Not working - $blackjack <bet>',
	async execute(message, args) {

		playerCards = [];
		dealerCards = [];
		playerScore = 0;
		dealerSCcore = 0;

		playerMessage="Player: ";
		dealerMessage="Dealer: ";

		//check syntax
		if (args.length < 1 || isNaN(args[0])) {
			message.channel.send("Error, please follow the syntax $blackjack <bet>")
			return;
		}

		//check if playing game
		if (findUserByAuthor(message.author).playingBlackjack) {
			message.reply("You're already playing a game!")
			return;
		}

		//get balance
		balance = await mongo.findBalanceById(message.author.id)
		//check if enough coins
		if (balance < parseInt(args[0], 10)) {
			message.channel.send("not enough shekels")
			return;
		}

		for (m = 0; m < 2; m++) {
			for (k = 0; k < 2; k++) {

				//dealing player cards
				if (m == 0) {
					suit=suits[Math.floor(Math.random()*4)] 
					value=values[Math.floor(Math.random()*13)]
					
					//check for face cards
					if(value =="Q" || value =="J" | value =="K"){
						playerScore+=10;

						//check for Ace
					}else if(value == "A"){
						playerScore+=11;
						if(playerScore>20){
							//if player busts, take away 10 score, net gain of 1
							playerScore+= -10;
						}
					}else{
						playerScore+=parseInt(value,10);
					}

					//push the card as a string
					playerCards.push(suit+ ":"+value);

					//make the message
					playerMessage+=value +suit +" ";
					//dealing dealer cards
				} else {

					suit=suits[Math.floor(Math.random()*4)] 
					value=values[Math.floor(Math.random()*13)]
					
					//check for face cards
					if(value =="Q" || value =="J" | value =="K"){
						dealerScore+=10;

						//check for Ace
					}else if(value == "A"){
						dealerScore+=11;
						if(dealerScore>20){
							//if player busts, take away 10 score, net gain of 1
							dealerScore+= -10;
						}
					}else{
						dealerScore+=parseInt(value,10);
					}

					//push the card as a string
					dealerCards.push(suit+ ":"+value);

					dealerMessage+=value +suit +" ";

				}

			}
		}

		message.reply(playerMessage +"\n" + dealerMessage)

		//player busts
		// if(playerScore>21){
		// 	message.reply(playerMessage +"\n" + dealerMessage + "\n You lose")
		// }else if(dealerScore>21){

		// }

	},
};