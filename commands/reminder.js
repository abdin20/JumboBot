const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
var mongo = require("../mongodb.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reminder')
        .setDescription('Set a reminder for a specific date and time')
        .addStringOption(option =>
            option.setName('date')
                .setDescription('Date in YYYY-MM-DD or MM/DD/YYYY format')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('hour')
                .setDescription('Hour in 24-hour format (0-23)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(23))
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Reminder text')
                .setRequired(true)
                .setMaxLength(500)),

    async execute(interaction) {
        await interaction.deferReply();

        const dateString = interaction.options.getString('date');
        const hour = interaction.options.getInteger('hour');
        const reminderText = interaction.options.getString('text');

        // Parse the date string
        let targetDate;
        try {
            // Try YYYY-MM-DD format first
            if (dateString.includes('-')) {
                const parts = dateString.split('-');
                if (parts.length === 3) {
                    targetDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), hour, 0, 0, 0);
                } else {
                    throw new Error('Invalid date format');
                }
            }
            // Try MM/DD/YYYY format
            else if (dateString.includes('/')) {
                const parts = dateString.split('/');
                if (parts.length === 3) {
                    // Check if it's MM/DD/YYYY or DD/MM/YYYY by checking if first part > 12
                    if (parseInt(parts[0]) > 12) {
                        // DD/MM/YYYY
                        targetDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), hour, 0, 0, 0);
                    } else {
                        // MM/DD/YYYY
                        targetDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]), hour, 0, 0, 0);
                    }
                } else {
                    throw new Error('Invalid date format');
                }
            } else {
                throw new Error('Invalid date format');
            }

            // Validate the date
            if (isNaN(targetDate.getTime())) {
                throw new Error('Invalid date');
            }




        } catch (error) {
            return await interaction.editReply('❌ Invalid date format! Please use YYYY-MM-DD or MM/DD/YYYY format.');
        }

        // Create reminder object
        const reminderObject = {
            userId: interaction.user.id,
            username: interaction.user.username,
            guildId: interaction.guildId,
            channelId: interaction.channelId,
            reminderText: reminderText,
            targetDate: targetDate,
            sent: false,
            createdAt: new Date()
        };

        try {
            await mongo.createReminder(reminderObject);

            const formattedDate = targetDate.toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });

            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Reminder Created')
                .setDescription(`**Reminder:** ${reminderText}\n**Date & Time:** ${formattedDate}`)
                .setFooter({
                    text: '🕊️ Long Live Jumbo 🕊️',
                    iconURL: 'https://i.imgur.com/qJMLlxG.jpeg',
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });
        } catch (error) {
            console.error('Error creating reminder:', error);
            await interaction.editReply('❌ There was an error creating your reminder. Please try again later.');
        }
    },
};

