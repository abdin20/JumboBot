const { SlashCommandBuilder } = require('discord.js');
const searchYoutube = require('youtube-api-v3-search');
const embedjs = require('embedjs');


var auth = process.env.GOOGLE_API_2;
module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Searches YouTube for a song and plays it')
        .addStringOption(option =>
            option.setName('search')
                .setDescription('Search term for music')
                .setRequired(true)),

    // main function
    async execute(interaction) {
        // get search from user
        const searchQuery = interaction.options.getString('search')

        //get queryType
        const queryType = (this.getQueryType(searchTerm))

        switch (queryType) {

            case "YouTube":
                break;

            // direct link
            case "direct":
                break;

            // defaults to searching youtube
            default:
                let title = searchQuery;
                let url = ""
                // if its a youtube link
                const searchResult = await this.getYouTubeSearchResults(searchQuery)
                await interaction.reply(searchResult.items[0].snippet.title)
        }


        // after we successfully gotten a link 
        //url and title might need to be redfined here

    },
    async test(interaction) {
        await interaction.reply("TEST");
    },
    async getYouTubeSearchResults(searchTerm) {

        const options = {
            q: searchTerm,
            part: 'snippet',
            type: 'video',
            maxResults: 1
        }
        let r = await searchYoutube(auth, options).catch((err) => {
            console.error(err);
        });

        //check to see google api accepted request
        if (typeof r.items === 'undefined') {
            exampleEmbed.setDescription("Quota error");
            message.channel.send(exampleEmbed);;
            auth = process.env.GOOGLE_API;//if not reset api key to other account
            r = await searchYoutube(auth, options)
        }

        //check to see if there are results
        if (typeof r.items[0] === 'undefined') {
            exampleEmbed.setDescription("No results error");
            message.channel.send(exampleEmbed);;
            return;
        }

        return r;
    },
    async getQueryType(searchQuery) {

        const embeds = embedjs.getAll(searchQuery);

        if (embeds.length === 0) {
            return "direct"
        }

        return embeds[0].provider_name;

    }
};
