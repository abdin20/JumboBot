const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, './.env') })


const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');

const fs = require('fs')
const token = process.env.BOT_TOKEN
const clientId = "894068368120905788"

// goomba, goon, ja nai, beever,"azn thugs",'abdins server'
const guilds = ["635966592303366154", "171025594979581960" , "683543800294932585","591460882819579914","152559548874489856",'1008090190931308624']

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    commands.push(command.data.toJSON());
}


const rest = new REST({ version: '10' }).setToken(token);

for (guild of guilds) {
    rest.put(Routes.applicationGuildCommands(clientId, guild), { body: commands })
        .then(() => console.log('Successfully registered application commands.'))
        .catch(console.error);
}


