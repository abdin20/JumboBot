const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus, AudioPlayerStatus, createAudioPlayer, createAudioResource, StreamType, getVoiceConnection, entersState } = require('@discordjs/voice');
const { EmbedBuilder } = require('discord.js');

// const ytdl = require('ytdl-core');
const ytdl = require("discord-ytdl-core");
var youtubeID = require('youtube-id');
const searchYoutube = require('youtube-api-v3-search');
const urlParser = require("js-video-url-parser");
var mongo = require("../mongodb.js");
var auth = process.env.GOOGLE_API;

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
        if (!interaction.member.voice.channelId) {
            interaction.reply({ content: "You need to be in a voice channel!", ephemeral: true })
            return
        }
        // get search from user
        const searchQuery = interaction.options.getString('search')

        //get queryType
        const queryType = await (this.getQueryType(searchQuery))
        let title = searchQuery;
        let url = ""
        let query = ""
        let youtubeResult
        let thumbnail = ""
        // types of query are youtube link, direct link, or search
        switch (queryType) {
            case 'youtube':
                youtubeResult = await this.getYoutubeInfo(urlParser.parse(searchQuery).id)
                url = youtubeResult.url
                title = youtubeResult.title
                thumbnail = youtubeResult.thumbnail
                query = 'youtube'
                break;

            // direct link
            case 'direct':
                title = searchQuery;
                url = searchQuery
                query = "direct"
                return
                break;

            // defaults to searching youtube
            default:
                youtubeResult = await this.getYoutubeInfo(searchQuery)
                url = youtubeResult.url
                title = youtubeResult.title
                thumbnail = youtubeResult.thumbnail
                query = 'youtube'
            // const searchResult = await this.getYouTubeSearchResults(searchQuery)
            // url = "https://www.youtube.com/watch?v=" + searchResult.items[0].id.videoId
            // title = searchResult.items[0].snippet.title
            // query = "youtube"
        }

        // process this info into queue
        await this.processQueue(interaction, title, url, query, thumbnail);
    },
    // can take videoId or search params
    async getYoutubeInfo(videoId) {
        const searchResult = await this.getYouTubeSearchResults(videoId)
        url = "https://www.youtube.com/watch?v=" + searchResult.items[0].id.videoId
        title = searchResult.items[0].snippet.title
        query = "youtube"
        thumbnail = searchResult.items[0].snippet.thumbnails.medium.url
        return { url: url, title: title, query: query, thumbnail: thumbnail }

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
            console.log("Quota error");
            auth = process.env.GOOGLE_API_2;//if not reset api key to other account
            r = await searchYoutube(auth, options)
        }

        //check to see if there are results
        if (typeof r.items[0] === 'undefined') {
            console.log("No results error");
            return;
        }

        return r;
    },
    async processQueue(interaction, title, url, queryType, thumbnail) {
        console.log(`${interaction.user.username} requested ${title}`)
        const exampleEmbed = new EmbedBuilder()
        exampleEmbed
            .setColor('#0099ff')
            .setDescription("🎶 Adding " + "[" + title + "]" + "(" + url + ") 🎶")
            .setURL(url)
            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
        await interaction.reply({ embeds: [exampleEmbed] });

        const songObject = { url: url, title: title, queryType: queryType, thumbnail: thumbnail }
        results = await mongo.findQueueByGuildId(interaction.guildId);
        if (!results) {
            console.log(`Creating queue for ${interaction.guild.name}`)
            //if no queue, make one, add to db, and run teh playmusic
            propertyObject = new Object();
            propertyObject.guildId = interaction.guildId
            propertyObject.songs = [songObject]
            propertyObject.loop = false; //loop defaults to off

            //create queue in db
            await mongo.createQueueByObject(propertyObject)
            //go to playmusic function
            await this.playMusic(interaction);
        } else if (results.songs.length == 0) {    //if queue is empty 

            //get song queue and add the new song
            addSong = results.songs;
            addSong.push(songObject)

            //push it to db
            console.log(`Updating queue for ${interaction.guild.name}`)
            await mongo.updateQueueByGuildId(interaction.guildId, { songs: addSong })

            await this.playMusic(interaction); //run the play loop once more

        } else {  //if the queue exists then we add it to queue

            addSong = results.songs;
            addSong.push(songObject)
            console.log(`Updating queue for ${interaction.guild.name}`)
            await mongo.updateQueueByGuildId(interaction.guildId, { songs: addSong })

        }
    },
    async playMusic(interaction, skip = false) {
        try {
            const exampleEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
            var delay = 5;

            const results = await mongo.findQueueByGuildId(interaction.guildId);
            //delete the queue if the size is 0
            if (!results || (results && results.songs.length === 0)) {
                const newresults = await mongo.findQueueByGuildId(interaction.guildId)
                if (newresults) {
                    console.log(`Deleting queue for ${interaction.guild.name}`)
                    await mongo.deleteQueueByObject(newresults)
                }
                    let checkConnection = getVoiceConnection(interaction.guildId);
                    console.log(checkConnection._state.status)
                    if (checkConnection && (checkConnection._state.status === "ready")) checkConnection.disconnect();

                // timeoutID = setTimeout(async () => {
                //     console.log('timeout function ran')
                //     const results = await mongo.findQueueByGuildId(interaction.guildId);
                //     let checkConnection = getVoiceConnection(interaction.guildId);
                //     if (!results && checkConnection && (checkConnection._state.status !== "ready")) checkConnection.disconnect();
                // }, delay * 1000)
                return
            }

            let connection = getVoiceConnection(interaction.guildId);
            if (typeof connection === 'undefined' || (typeof connection !== 'undefined' && (connection._state.status === "disconnected" || connection._state.status === "signalling"))) {
                console.log('connecting')
                connection = joinVoiceChannel({
                    channelId: interaction.member.voice.channelId,
                    guildId: interaction.guildId,
                    adapterCreator: interaction.channel.guild.voiceAdapterCreator,
                });

                await entersState(connection, VoiceConnectionStatus.Ready, 5_000)
            }
            // if (!connection) {
            //     connection = joinVoiceChannel({
            //         channelId: interaction.member.voice.channelId,
            //         guildId: interaction.guildId,
            //         adapterCreator: interaction.channel.guild.voiceAdapterCreator,
            //     });
            // }
            // on disconnect stop queue


            connection.on('error', err => { console.log(err) })

            //get the song queue
            playingSong = results.songs.shift();
            //shift the queue
            title = playingSong.title
            url = playingSong.url
            thumbnail = playingSong.thumbnail
            console.log("Playing " + "[" + title + "]" + "(" + url + ")")
            exampleEmbed.setDescription("🎶 Playing " + "[" + title + "]" + "(" + url + ") 🎶")
            exampleEmbed.setURL(url)
            exampleEmbed.setImage(thumbnail)

            const player = createAudioPlayer();
            // const resource = createAudioResource(ytdl(url, { filter: 'audioonly'}));
            // const resource = createAudioResource(ytdl(url, {filter: "audioonly", opusEncoded: true, encoderArgs: ['-af', 'bass=g=10']}));
            const resource = createAudioResource(ytdl(url, {filter: "audioonly", opusEncoded: true, encoderArgs: ['-af','']}));
            
            interaction.channel.send({ embeds: [exampleEmbed] })

            player.play(resource)
            connection.subscribe(player)

            player.on(AudioPlayerStatus.Idle, (async () => {
                const results = await mongo.findQueueByGuildId(interaction.guildId)
                songs = results.songs
                songs.shift()
                console.log(`Updating queue for ${interaction.guild.name}`)
                await mongo.updateQueueByGuildId(interaction.guildId, { songs: songs })
                this.playMusic(interaction)
                player.stop();

            }));
            player.on('error', async error => {
                console.error(`Error: ${error.message}`);
                player.stop();
                const nextresults = await mongo.findQueueByGuildId(interaction.guildId)
                if (nextresults) {
                    console.log(`Deleting queue for ${interaction.guild.name}`)
                    await mongo.deleteQueueByObject(nextresults)
                }
            });
        } catch (err) {
            console.log(err)
            const nextresults = await mongo.findQueueByGuildId(interaction.guildId)
            if (nextresults) {
                console.log(`Deleting queue for ${interaction.guild.name}`)
                await mongo.deleteQueueByObject(nextresults)
            }

        }

    },
    async getQueryType(searchQuery) {

        //if its not a link
        if (searchQuery.indexOf("http") < 0) {
            return null
        }
        // guaranteed link 
        const urlType = urlParser.parse(searchQuery)

        // if cannot parse the link it must be a direct link
        if (urlType === undefined || typeof (urlType) === 'undefined') {
            return 'direct'
        }
        // else the link was parsed and was a valid search result
        return urlType.provider;

    }
};
