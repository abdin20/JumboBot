const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
let isOnBreak = false;
let breakTimer;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bog')
        .setDescription('Toggle bog break status'),

    async execute(interaction) {
        // Define the specific user's ID
        const specificUserId = '310442661343526915';

        const bogEmbed = new EmbedBuilder()
            .setColor(isOnBreak ? '#00ff00' : '#ff0000')
            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
            .setFooter({ text: '🕊️ Long Live Jumbo 🕊️', iconURL: 'https://i.imgur.com/qJMLlxG.jpeg' });

        // Check if the user is the specific user
        if (interaction.user.id === specificUserId) {
            if (isOnBreak) {
                // User returns from break
                clearTimeout(breakTimer);
                bogEmbed.setDescription('🚭 Lagdad is back from the bog break.');
                isOnBreak = false;
            } else {
                // User goes on break
                bogEmbed.setDescription('🚬 Lagdad is now on a bog break. 🚬');
                isOnBreak = true;

                // Start a 5-minute timer
                breakTimer = setTimeout(async () => {
                    try {
                        const user = await interaction.client.users.fetch(specificUserId);
                        user.send('⏰ Your bog break is over, time to wrap up!');
                        bogEmbed.setDescription('⏲️ Lagdad is running late from the bog break.');
                        await interaction.editReply({ embeds: [bogEmbed] });
                    } catch (error) {
                        console.error('Error sending DM: ', error);
                    }
                }, 300000); // 5 minutes in milliseconds
            }
        } else {
            // If it's not the specific user
            bogEmbed.setDescription(isOnBreak
                ? '🚬 Lagdad is currently on a bog break.'
                : '🚭 Lagdad is not on a bog break.');
        }

        await interaction.reply({ embeds: [bogEmbed] });
    },
};