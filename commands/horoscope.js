const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

// Helper function to get zodiac sign from date
function getZodiacSign(month, day) {
    const dates = {
        'capricorn': [1, 19, 12, 22],
        'aquarius': [1, 20, 2, 18],
        'pisces': [2, 19, 3, 20],
        'aries': [3, 21, 4, 19],
        'taurus': [4, 20, 5, 20],
        'gemini': [5, 21, 6, 20],
        'cancer': [6, 21, 7, 22],
        'leo': [7, 23, 8, 22],
        'virgo': [8, 23, 9, 22],
        'libra': [9, 23, 10, 22],
        'scorpio': [10, 23, 11, 21],
        'sagittarius': [11, 22, 12, 21]
    };

    for (let sign in dates) {
        const [startMonth, startDay, endMonth, endDay] = dates[sign];
        if ((month === startMonth && day >= startDay) || (month === endMonth && day <= endDay)) {
            return sign;
        }
    }
    return 'capricorn'; // Default for Dec 22-31
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('horoscope')
        .setDescription('Get your daily horoscope')
        .addStringOption(option =>
            option.setName('sign')
                .setDescription('Your zodiac sign')
                .addChoices(
                    { name: 'Aries ♈', value: 'aries' },
                    { name: 'Taurus ♉', value: 'taurus' },
                    { name: 'Gemini ♊', value: 'gemini' },
                    { name: 'Cancer ♋', value: 'cancer' },
                    { name: 'Leo ♌', value: 'leo' },
                    { name: 'Virgo ♍', value: 'virgo' },
                    { name: 'Libra ♎', value: 'libra' },
                    { name: 'Scorpio ♏', value: 'scorpio' },
                    { name: 'Sagittarius ♐', value: 'sagittarius' },
                    { name: 'Capricorn ♑', value: 'capricorn' },
                    { name: 'Aquarius ♒', value: 'aquarius' },
                    { name: 'Pisces ♓', value: 'pisces' }
                ))
        .addIntegerOption(option =>
            option.setName('month')
                .setDescription('Birth month (1-12)')
                .setMinValue(1)
                .setMaxValue(12))
        .addIntegerOption(option =>
            option.setName('day')
                .setDescription('Birth day (1-31)')
                .setMinValue(1)
                .setMaxValue(31)),

    async execute(interaction) {
        await interaction.deferReply();

        const sign = interaction.options.getString('sign');
        const month = interaction.options.getInteger('month');
        const day = interaction.options.getInteger('day');

        // Validate input
        if (!sign && (!month || !day)) {
            return await interaction.editReply('Please provide either a zodiac sign or a complete birthday (month and day)!');
        }

        if (month && day && !sign) {
            // Validate date
            const date = new Date(2000, month - 1, day);
            if (date.getMonth() !== month - 1 || date.getDate() !== day) {
                return await interaction.editReply('Invalid date! Please check your month and day combination.');
            }
        }

        let zodiacSign = sign;
        if (!zodiacSign) {
            zodiacSign = getZodiacSign(month, day);
        }

        try {
            const response = await axios.get(`https://horoscope-app-api.vercel.app/api/v1/get-horoscope/daily?sign=${zodiacSign}&day=today`);
            const horoscope = response.data;

            const signEmojis = {
                aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋',
                leo: '♌', virgo: '♍', libra: '♎', scorpio: '♏',
                sagittarius: '♐', capricorn: '♑', aquarius: '♒', pisces: '♓'
            };

            const horoscopeEmbed = new EmbedBuilder()
                .setColor('#FF69B4')
                .setTitle(`${signEmojis[zodiacSign]} Daily Horoscope for ${zodiacSign.charAt(0).toUpperCase() + zodiacSign.slice(1)}`)
                .addFields(
                    { name: 'Today\'s Horoscope', value: horoscope.data.horoscope_data },
                    { name: 'Date', value: horoscope.data.date, inline: true },
                    { name: 'Sign', value: zodiacSign.charAt(0).toUpperCase() + zodiacSign.slice(1), inline: true }
                )
                .setAuthor({
                    name: interaction.user.username,
                    iconURL: interaction.user.displayAvatarURL(),
                })
                .setFooter({
                    text: '🕊️ Long Live Jumbo 🕊️',
                    iconURL: 'https://i.imgur.com/qJMLlxG.jpeg',
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [horoscopeEmbed] });
        } catch (error) {
            console.error('API Error:', error.response?.data || error.message);
            await interaction.editReply('There was an error fetching your horoscope! Please try again later.');
        }
    },
};