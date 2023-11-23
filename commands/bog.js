const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require('fs');
const path = require('path');

const specificUserIds = ['1019709027439087707', '310442661343526915'];
const stateFilePath = path.join(__dirname, '../bogState.json');
const historyFilePath = path.join(__dirname, '../bogHistory.json');

function formatDate(date) {
    return new Date(date).toLocaleString('en-US', {
        timeZone: 'America/New_York',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    }) + ' EST';
}

// Load or initialize state
let bogState = { onBreak: false, timestamp: null };
if (fs.existsSync(stateFilePath)) {
    bogState = JSON.parse(fs.readFileSync(stateFilePath));
} else {
    fs.writeFileSync(stateFilePath, JSON.stringify(bogState));
}

// Load or initialize bog history
let bogHistory = [];
if (fs.existsSync(historyFilePath)) {
    bogHistory = JSON.parse(fs.readFileSync(historyFilePath));
} else {
    fs.writeFileSync(historyFilePath, JSON.stringify(bogHistory));
}

const bogTime = 1000*60*5; // 5 minutes
module.exports = {
    data: new SlashCommandBuilder()
        .setName("bog")
        .setDescription("Manage a shared bog break for specific users"),
    async execute(interaction) {
        await interaction.deferReply();
        const embed = new EmbedBuilder()
            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
            .setFooter({ text: '🕊️ Long Live Jumbo 🕊️', iconURL: 'https://i.imgur.com/qJMLlxG.jpeg' });

        // Non-specific users can check the status
        if (!specificUserIds.includes(interaction.user.id)) {
            const status = bogState.onBreak ? 'currently on a bog break. 🚬' : 'not currently on a bog break. 🚭';
            embed.setDescription(`Lagdad is ${status}`);
            embed.setColor(bogState.onBreak ? '#00ff00' : '#ff0000');
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        // Specific users can start/end the bog break
        if (!bogState.onBreak) {
            // Start the bog break
            bogState.onBreak = true;
            bogState.timestamp = Date.now();
            embed.setDescription(`Bog break has started by Lagdad.`);
            await interaction.editReply({ embeds: [embed] });

            // Set a timer for the reminder
            setTimeout(async () => {
                if (bogState.onBreak) {
                    embed.setDescription('⏰ The bog break is running late. ⏰');
                    // Send a DM to each user in the specificUserIds array
                    for (const userId of specificUserIds) {
                        try {
                            embed.setDescription('⏰ Your bog break is over, time to wrap it up! ⏰');
                            const user = await interaction.client.users.fetch(userId);
                            await user.send({ embeds: [embed] });
                        } catch (error) {
                            console.error(`Could not send DM to user ${userId}: ${error}`);
                        }
                    }
                    embed.setDescription('⏰ The bog break is running late. ⏰');
                    await interaction.editReply({ embeds: [embed] });
                }
            }, bogTime);
        } else {
            // End the bog break
            const endTime = Date.now();
            const breakDuration = endTime - bogState.timestamp;
            const hours = Math.floor(breakDuration / 3600000);
            const minutes = Math.floor((breakDuration % 3600000) / 60000);
            const seconds = Math.floor((breakDuration % 60000) / 1000);
            
            let durationParts = [];
            if (hours > 0) durationParts.push(`${hours} hours`);
            if (minutes > 0) durationParts.push(`${minutes} minutes`);
            if (seconds > 0) durationParts.push(`${seconds} seconds`);
            
            const durationText = durationParts.join(' and ');
            embed.setDescription(`Bog break has ended by Lagdad. Duration: ${durationText}.`);
            await interaction.editReply({ embeds: [embed] });

            const formattedStart = formatDate(bogState.timestamp);
            const formattedEnd = formatDate(endTime);

            // Log the bog break in history
            bogHistory.push({
                start: formattedStart,
                end: formattedEnd,
                duration: breakDuration
            });
            fs.writeFileSync(historyFilePath, JSON.stringify(bogHistory));

            bogState.onBreak = false;
        }

        fs.writeFileSync(stateFilePath, JSON.stringify(bogState));
    },
};
