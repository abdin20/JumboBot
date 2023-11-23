const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

let isOnBreak = false;
let timerExpired = false;
let breakTimer;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bog')
        .setDescription('Toggle bog break status'),

    async execute(interaction) {

        const specificUserIds = ['310442661343526915', '1019709027439087707'];

        const bogEmbed = new EmbedBuilder()
            .setColor(isOnBreak ? '#00ff00' : '#ff0000')
            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
            .setFooter({ text: '🕊️ Long Live Jumbo 🕊️', iconURL: 'https://i.imgur.com/qJMLlxG.jpeg' });

        if (specificUserIds.includes(`${interaction.user.id}`)) {
            if (isOnBreak) {
                if (!timerExpired) {
                    // User manually ends break
                    clearTimeout(breakTimer);
                    bogEmbed.setDescription('🚭 Lagdad is back from the bog break.');
                } else {
                    // Timer expired and user acknowledges the end of the break
                    bogEmbed.setDescription('🚭 Lagdad has returned from the bog break.');
                }
                // Reset states
                isOnBreak = false;
                timerExpired = false;
            } else {
                // User goes on break
                bogEmbed.setDescription('🚬 Lagdad is now on a bog break. 🚬');
                isOnBreak = true;
                timerExpired = false;

                // Start a 5-minute timer
                breakTimer = setTimeout(async () => {
                    timerExpired = true; // Set timerExpired to true when the timer completes
                    try {
                        const user = await interaction.client.users.fetch(specificUserIds[0]);
                        const user1 = await interaction.client.users.fetch(specificUserIds[1]);
                        await user.send('⏰ Your bog break is over, time to wrap up!');
                        await user1.send('⏰ Your bog break is over, time to wrap up!');
                        bogEmbed.setDescription('Lagdad is running late from his bog break 🕒 ')
                        await interaction.channel.send({ embeds: [bogEmbed] });
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
