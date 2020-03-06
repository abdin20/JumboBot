module.exports = {
	name: 'coinflip',
	description: '$coinflip',
	execute(message, args) {
		 if (Math.random() * 10 >= 5) {
            result = "heads"
        } else {
            result = "tails"
        }

        msg.channel.send(result);
	},
};