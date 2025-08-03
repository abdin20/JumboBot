if (typeof File === 'undefined') {
  global.File = class File {
    constructor(bits, name, options = {}) {
      this.name = name;
      this.lastModified = options.lastModified || Date.now();
      this.size = bits.length;
      this.type = options.type || '';
    }
  };
}
const { SlashCommandBuilder } = require("discord.js");
const {
  joinVoiceChannel,
  VoiceConnectionStatus,
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  StreamType,
  getVoiceConnection,
  entersState,
} = require("@discordjs/voice");
const { EmbedBuilder } = require("discord.js");
const axios = require('axios');
const ffmpeg = require('ffmpeg-static');
const { createReadStream } = require('node:fs');

const play = require("play-dl");

const ytdl = require("@distube/ytdl-core");
const { PassThrough } = require('stream');
const { spawn } = require('child_process');
const youtube = require("youtube-metadata-from-url");
const searchYoutube = require("youtube-api-v3-search");
const urlParser = require("js-video-url-parser");
var mongo = require("../mongodb.js");
var auth = process.env.GOOGLE_API;

const youtubedl = require('youtube-dl-exec')

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Searches YouTube for a song and plays it")
    .addStringOption((option) =>
      option
        .setName("search")
        .setDescription("Search term for music")
        .setRequired(true)
    ),

  // main function
  async execute(interaction) {
    if (!interaction.member.voice.channelId) {
      await interaction.reply({
        content: "You need to be in a voice channel!",
        ephemeral: true,
      });
      return;
    }
    // get search from user
    const searchQuery = interaction.options.getString("search");
    const { title, url, query, thumbnail, seek } = await this.parseSearchQuery(
      searchQuery
    );
    if (!url) {
      await interaction.reply({ content: "No results found", ephemeral: true });
      return;
    }
    await interaction.reply({ content: "Success!", ephemeral: true });
    await interaction.deleteReply();
    // process this info into queue
    await this.processQueue(interaction, title, url, query, thumbnail, {
      priority: false,
      seek,
    });
  },
  // can take videoId or search params
  async getQueryType(searchQuery) {
    //if its not a link
    if (searchQuery.indexOf("http") < 0) {
      return null;
    }
    // guaranteed link
    const urlType = urlParser.parse(searchQuery);
    // if cannot parse the link it must be a direct link
    if (urlType === undefined || typeof urlType === "undefined") {
      return "direct";
    }
    // else the link was parsed and was a valid search result
    return urlType.provider;
  },
  async parseSearchQuery(searchQuery) {
    //get queryType
    const queryType = await this.getQueryType(searchQuery);
    let title = searchQuery;
    let url = "";
    let query = "";
    let youtubeResult;
    let thumbnail = "https://i.imgur.com/inFYoNd.jpeg";
    let seek = 0;
    // types of query are youtube link, direct link, or search
    switch (queryType) {
      case "youtube":
        url =
          "https://www.youtube.com/watch?v=" + urlParser.parse(searchQuery).id;
        result = await youtube.metadata(url);
        title = result.title;
        thumbnail = result.thumbnail_url;
        query = "youtube";
        seek = urlParser.parse(searchQuery)?.params?.start ?? 0;
        break;

      // direct link
      case "direct":
        title = searchQuery;
        url = searchQuery;
        query = "direct";
        break;

      // defaults to searching youtube
      default:
        youtubeResult = await this.getYoutubeInfo(searchQuery);
        url = youtubeResult?.url;
        title = youtubeResult?.title;
        thumbnail = youtubeResult?.thumbnail;
        query = "youtube";
      // const searchResult = await this.getYouTubeSearchResults(searchQuery)
      // url = "https://www.youtube.com/watch?v=" + searchResult.items[0].id.videoId
      // title = searchResult.items[0].snippet.title
      // query = "youtube"
    }
    return { url, title, thumbnail, query, seek };
  },
  async getYoutubeInfo(search) {
    const searchResult = await this.getYouTubeSearchResults(search);
    if (!searchResult || !searchResult?.items || searchResult?.items?.length === 0) {
      return null;
    }
    url = "https://www.youtube.com/watch?v=" + searchResult.items[0].id.videoId;
    title = searchResult.items[0].snippet.title;
    query = "youtube";
    thumbnail = searchResult.items[0].snippet.thumbnails.medium.url;
    return { url: url, title: title, query: query, thumbnail: thumbnail };
  },
  async getYouTubeSearchResults(searchTerm) {
    const options = {
      q: searchTerm,
      part: "snippet",
      type: "video",
      maxResults: 1,
    };
    let r = await searchYoutube(auth, options).catch((err) => {
      console.error(err);
    });

    //check to see google api accepted request
    if (typeof r.items === "undefined") {
      console.log("Quota error");
      auth = process.env.GOOGLE_API_2; //if not reset api key to other account
      r = await searchYoutube(auth, options);
    }

    //check to see if there are results
    if ( !r || typeof r?.items?.[0] === "undefined" || r?.items?.length === 0) {
      console.log("No results error");
      return null;
    }

    return r;
  },
  async processQueue(
    interaction,
    title,
    url,
    queryType,
    thumbnail,
    songParams = { priority: false, seek: 0 }
  ) {
    console.log(`${interaction.user.username} requested ${title}`);
    const exampleEmbed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("🎶 Music 🎶")
      .setDescription(
        `Adding ${songParams?.priority ? "up next " : " "}` +
        `[${title}](${url})`
      )
      .setURL(url)
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setFooter({
        text: "🕊️ Long Live Jumbo 🕊️",
        iconURL: "https://i.imgur.com/qJMLlxG.jpeg",
      });
    interaction.channel.send({ embeds: [exampleEmbed] });

    const songObject = {
      url: url,
      title: title,
      queryType: queryType,
      thumbnail: thumbnail,
      seek: songParams.seek,
    };
    results = await mongo.findQueueByGuildId(interaction.guildId);
    if (!results) {
      console.log(`Creating queue for ${interaction.guild.name}`);
      //if no queue, make one, add to db, and run teh playmusic
      propertyObject = new Object();
      propertyObject.guildId = interaction.guildId;
      propertyObject.songs = [songObject];
      propertyObject.loop = false; //loop defaults to off

      //create queue in db
      await mongo.createQueueByObject(propertyObject);
      //go to playmusic function
      await this.playMusic(interaction);
    } else if (results.songs.length == 0) {
      //if queue is empty

      //get song queue and add the new song
      addSong = results.songs;
      addSong.push(songObject);

      //push it to db
      console.log(`Updating queue for ${interaction.guild.name}`);
      await mongo.updateQueueByGuildId(interaction.guildId, { songs: addSong });

      await this.playMusic(interaction); //run the play loop once more
    } else {
      //if the queue exists then we add it to queue

      addSong = results.songs;
      songParams?.priority
        ? addSong.splice(1, 0, songObject)
        : addSong.push(songObject);
      console.log(`Updating queue for ${interaction.guild.name}`);
      await mongo.updateQueueByGuildId(interaction.guildId, { songs: addSong });
    }
  },
  async playMusic(interaction, seek = null) {
    try {
      const exampleEmbed = new EmbedBuilder()
        .setColor("#0099ff")
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setFooter({
          text: "🕊️ Long Live Jumbo 🕊️",
          iconURL: "https://i.imgur.com/qJMLlxG.jpeg",
        });

      const results = await mongo.findQueueByGuildId(interaction.guildId);
      //delete the queue if the size is 0
      if (!results || (results && results.songs.length === 0)) {
        const newresults = await mongo.findQueueByGuildId(interaction.guildId);
        if (newresults) {
          console.log(`Deleting queue for ${interaction.guild.name}`);
          await mongo.deleteQueueByObject(newresults);
        }
        let checkConnection = getVoiceConnection(interaction.guildId);
        checkConnection.disconnect();
        return;
      }

      let connection = getVoiceConnection(interaction.guildId);

      if (
        typeof connection === "undefined" ||
        (typeof connection !== "undefined" &&
          (connection._state.status === "disconnected" ||
            connection._state.status === "signalling"))
      ) {
        console.log("connecting");
        connection = joinVoiceChannel({
          channelId: interaction.member.voice.channelId,
          guildId: interaction.guildId,
          adapterCreator: interaction.channel.guild.voiceAdapterCreator,
        });

        await entersState(connection, VoiceConnectionStatus.Ready, 5_000);
        connection.on("stateChange", (old_state, new_state) => {
          if (
            old_state.status === VoiceConnectionStatus.Ready &&
            new_state.status === VoiceConnectionStatus.Connecting
          ) {
            connection.configureNetworking();
          }
        });
      }

      connection.on("error", (err) => {
        console.log(err);
      });

      connection.on('stateChange', (oldState, newState) => {
        console.log(`Connection transitioned from ${oldState.status} to ${newState.status}`);
      });

      //get the song queue
      playingSong = results.songs.shift();
      //shift the queue
      title = playingSong.title;
      url = playingSong.url;
      thumbnail = playingSong.thumbnail;
      queryType = playingSong.queryType;
      console.log(`Playing [${title}](${url})`);
      exampleEmbed.setDescription(`Playing [${title}](${url})`);
      exampleEmbed.setTitle("🎶 Music 🎶");
      exampleEmbed.setURL(url);
      exampleEmbed.setImage(thumbnail);

      //check for seek from override first then uses queue seek
      if (seek === null) {
        seek = playingSong.seek;
        interaction.channel.send({ embeds: [exampleEmbed] });
      }

      const player = createAudioPlayer();

      if (queryType === "youtube") {
        console.log("Starting YouTube stream...");
        try {
          let options = {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25
          };

          // Add seeking if specified
          if (seek) {
            options.begin = `${seek}s`;
            console.log(`Attempting to seek to ${seek} seconds`);
          }

          const stream = ytdl(url, options);

          resource = createAudioResource(stream, {
            inputType: StreamType.Arbitrary,
            inlineVolume: true
          });

          console.log("Resource created" + (seek ? ` with seek to ${seek}s` : ''));
        } catch (error) {
          console.error('Error creating stream:', error);
        }
      } else if (queryType === "direct") {
        // Create a stream using ffmpeg for direct file links
        const response = await axios({
          method: 'get',
          url: url,
          responseType: 'stream'
        });
      
        // Use ffmpeg to process the stream
        resource = createAudioResource(response.data, {  inputType: StreamType.Arbitrary,
          inlineVolume: true,
          ffmpegExecutable: ffmpeg
        });
      }
      player.removeAllListeners();
      player.play(resource);
      connection.subscribe(player);

      player.once(AudioPlayerStatus.Idle, async () => {
        const results = await mongo.findQueueByGuildId(interaction.guildId);
        if (!results?.songs) return;
        if (!results.loop) {
          songs = results.songs;
          songs.shift();
          console.log(`Updating queue for ${interaction.guild.name}`);
          await mongo.updateQueueByGuildId(interaction.guildId, {
            songs: songs,
          });
        }
        this.playMusic(interaction);
      });
      player.on('error', error => {
        console.error('Error:', error.message);
      });
      resource.playStream.on('error', error => {
        console.error('Stream Error:', error);
      });

      // Add these event listeners
      player.on('stateChange', (oldState, newState) => {
        console.log(`Player state changed from ${oldState.status} to ${newState.status}`);
      });

      connection.on('debug', (message) => {
        console.log('Voice Connection Debug:', message);
      });
    } catch (err) {
      console.log("Play.js error catcher: ");
      console.log(err);
      const nextresults = await mongo.findQueueByGuildId(interaction.guildId);
      if (nextresults) {
        console.log(`Deleting queue for ${interaction.guild.name}`);
        await mongo.deleteQueueByObject(nextresults);
      }
      let connection = getVoiceConnection(interaction.guildId);
      connection?.disconnect();
    }
  },
};
