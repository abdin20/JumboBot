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
const { EmbedBuilder, MessageFlags } = require("discord.js");
const axios = require('axios');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const { PassThrough, Transform } = require('stream');
const ffmpeg = require('ffmpeg-static');

// Buffer size so we keep reading from the HTTP socket when ffmpeg consumes slowly.
// Large buffer (100MB) so we can often finish downloading before CDN resets the connection.
const STREAM_BUFFER_HWM = 100 * 1024 * 1024; // 100MB

// Native agents: no axios for long-lived streams (avoids Node/axios stream quirks that cause ~40s ECONNRESET)
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 6 });
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 6 });

function keepStreamAlive(stream) {
  if (!stream || !stream.socket) return;
  const socket = stream.socket;
  socket.setKeepAlive(true, 30000);
  socket.setTimeout(0);
}

/**
 * Buffers the HTTP stream so we keep reading from the socket when the consumer (ffmpeg) is slow.
 * Prevents googlevideo.com from closing the connection due to "idle" (no reads during backpressure).
 */
function bufferStream(httpStream) {
  const pass = new PassThrough({ highWaterMark: STREAM_BUFFER_HWM });
  httpStream.on('error', (err) => pass.destroy(err));
  httpStream.pipe(pass);
  return pass;
}

/**
 * For Invidious/Google CDN: feed a PassThrough with the HTTP stream and on ECONNRESET
 * (Google closes ~55s) refetch with Range: bytes=received- and pipe the new response.
 * Returns the PassThrough to pass to createAudioResource.
 */
function createResumableStream(url, headers) {
  const pass = new PassThrough({ highWaterMark: STREAM_BUFFER_HWM });
  let totalBytesReceived = 0;

  async function pipeNext() {
    const startOffset = totalBytesReceived;
    const reqHeaders = startOffset > 0 ? { ...headers, Range: `bytes=${startOffset}-` } : headers;
    let stream;
    try {
      stream = await fetchStream(url, reqHeaders);
    } catch (err) {
      pass.destroy(err);
      return;
    }
    const counter = new Transform({
      transform(chunk, enc, cb) {
        totalBytesReceived += chunk.length;
        cb(null, chunk);
      },
    });
    stream.pipe(counter).pipe(pass, { end: false });
    stream.on('error', async (err) => {
      if (err.code !== 'ECONNRESET') {
        pass.destroy(err);
        return;
      }
      counter.unpipe(pass);
      stream.destroy();
      counter.destroy();
      await pipeNext();
    });
    stream.on('end', () => {
      counter.end();
      pass.end();
    });
  }
  pipeNext();
  return pass;
}

/**
 * Fetch audio stream with Node's native https/http (no axios).
 * Returns the response stream (IncomingMessage). Accepts 200 and 206 (Range).
 */
function fetchStream(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const lib = isHttps ? https : http;
    const opts = {
      agent: isHttps ? httpsAgent : httpAgent,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', ...headers },
    };
    const req = lib.get(url, opts, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        req.destroy();
        const nextUrl = new URL(res.headers.location, url).href;
        fetchStream(nextUrl, headers).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200 && res.statusCode !== 206) {
        req.destroy();
        reject(new Error(`Stream HTTP ${res.statusCode}`));
        return;
      }
      keepStreamAlive(res);
      resolve(res);
    });
    req.on('error', reject);
    req.setTimeout(0);
  });
}
const youtube = require("youtube-metadata-from-url");
const searchYoutube = require("youtube-api-v3-search");
const urlParser = require("js-video-url-parser");
var mongo = require("../mongodb.js");
var auth = process.env.GOOGLE_API;

const { InvidiousPlugin } = require("distube-invidious");
const invidiousPlugin = new InvidiousPlugin({
  instance: process.env.INVIDIOUS_INSTANCE || null,
  timeout: 10000,
});

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
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    // Defer immediately so the interaction doesn't expire during parseSearchQuery (3s limit)
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    // get search from user
    const searchQuery = interaction.options.getString("search");
    const { title, url, query, thumbnail, seek } = await this.parseSearchQuery(
      searchQuery
    );
    if (!url) {
      await interaction.editReply({ content: "No results found" });
      return;
    }
    await interaction.editReply({ content: "Success!" });
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
        console.log("Starting YouTube stream with Invidious...");
        // Extract video ID (plugin strips ? so we call Invidious API directly by videoId)
        const videoIdMatch = url && (url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^/?]+)/));
        let videoId = videoIdMatch ? videoIdMatch[1] : null;
        if (!videoId) {
          try {
            const parsed = urlParser.parse(url);
            videoId = parsed && parsed.id;
          } catch (_) {}
        }
        if (!videoId) {
          console.error("No video ID in URL:", { url, queryType });
          throw new Error(`Cannot play: no video ID in URL (${String(url).slice(0, 80)})`);
        }
        const instance = invidiousPlugin.instance;
        // Invidious instances often 403 bot User-Agents; use browser-like headers
        const invidiousHeaders = {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json",
        };
        const apiRes = await axios.get(`${instance}/api/v1/videos/${videoId}`, {
          timeout: invidiousPlugin.timeout ?? 10000,
          headers: invidiousHeaders,
        });
        const data = apiRes.data;
        let streamUrl = null;
        if (data.adaptiveFormats && data.adaptiveFormats.length > 0) {
          let bestAudio = data.adaptiveFormats.find((f) => (f.mimeType || f.type || "").includes("audio") && (f.mimeType || f.type || "").includes("opus"));
          if (!bestAudio) bestAudio = data.adaptiveFormats.find((f) => (f.mimeType || f.type || "").includes("audio") && (f.mimeType || f.type || "").includes("mp4"));
          if (!bestAudio) bestAudio = data.adaptiveFormats.find((f) => (f.mimeType || f.type || "").includes("audio"));
          if (bestAudio && bestAudio.url) streamUrl = bestAudio.url;
        }
        if (!streamUrl && data.formatStreams && data.formatStreams.length > 0) streamUrl = data.formatStreams[0].url;
        if (!streamUrl) throw new Error("No playable stream found from Invidious");
        const stream = createResumableStream(streamUrl, { "User-Agent": invidiousHeaders["User-Agent"] });
        resource = createAudioResource(stream, {
          inputType: StreamType.Arbitrary,
          inlineVolume: true,
          ffmpegExecutable: ffmpeg,
        });
        console.log("Invidious stream created successfully");
      } else if (queryType === "direct") {
        const httpStream = await fetchStream(url, {});
        const stream = bufferStream(httpStream);
        resource = createAudioResource(stream, {  inputType: StreamType.Arbitrary,
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
        console.error('Player Error:', error.message);
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
  }
};
