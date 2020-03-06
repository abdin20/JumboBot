
const fs = require('fs');

module.exports = {
	name: 'help',
	description: 'help for commands',
	execute(message, args) {
        text = "";
        const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

        //read commands
        for (const file of commandFiles) {
            console.log(file)
            const command = require(`./${file}`);
            text+=`$${command.name}` + "- " + `${command.description}` + "\n"
        }

        message.channel.send(text);
	},
};