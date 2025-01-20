const { SlashCommandBuilder } = require('discord.js');
const { Rcon } = require('rcon-client');

// Define allowed users - replace with actual IDs
// randy, lagdad, reflectile
const allowedUserIds = ['163368896844267521','310442661343526915','146425358927790081'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('restartmc')
        .setDescription('Restarts the Minecraft server (Admin only)'),

    async execute(interaction) {
        // Check permissions
        if (!allowedUserIds.includes(interaction.user.id)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        await interaction.reply('Connecting to the Minecraft server to stop it...');

        try {
            const rcon = await Rcon.connect({
                host: process.env.MINECRAFT_HOST,    // Add these to your .env file
                port: process.env.MINECRAFT_PORT,    // Add these to your .env file
                password: process.env.MINECRAFT_RCON_PASSWORD  // Add these to your .env file
            });

            // Send the stop command
            const response = await rcon.send('stop');
            console.log(`Server stop response: ${response}`);
            
            await interaction.editReply('Minecraft server is shutting down.');
            rcon.end();

        } catch (error) {
            console.error('Error stopping Minecraft server:', error);
            await interaction.editReply('Failed to stop the Minecraft server. Check the logs for details.');
        }
    },
}; 