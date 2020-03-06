module.exports = {
	name: 'coinflip',
	description: 'NOT GAMBLING flips head or tails',
	execute(message, args) {
		 if (Math.random() * 10 >= 5) {
            result = "heads"
        } else {
            result = "tails"
        }

        message.channel.send(result);
	},
};