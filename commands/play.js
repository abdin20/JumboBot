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
const https = require('https');
const http = require('http');
const fs = require("fs");
const path = require("path");
const { URL } = require('url');
const { PassThrough } = require('stream');
const ffmpeg = require('ffmpeg-static');
const youtubedl = require("youtube-dl-exec");

// Buffer size so we keep reading from the HTTP socket when ffmpeg consumes slowly.
// Large buffer (100MB) so we can often finish downloading before CDN resets the connection.
const STREAM_BUFFER_HWM = 100 * 1024 * 1024; // 100MB
const MAX_CONCURRENT_YOUTUBE_STREAMS = 5;
const MAX_YOUTUBE_DURATION_SECONDS = 2 * 60 * 60; // 2 hours
// How long to wait before trusting a yt-dlp stream is actually going to work, instead of
// spending a whole separate dumpSingleJson call up front to find out.
const DIRECT_STREAM_GRACE_MS = 1500;
let activeYoutubeStreams = 0;
// Remembers the last (cookie, runtime, profile) combo that worked, so most plays can skip
// straight to streaming with it instead of re-running the full cascade every time.
let lastWorkingYoutubeCombo = null;
const YOUTUBE_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const COOKIES_TXT_PATH = path.resolve(__dirname, "..", "cookies.txt");
const YTDLP_PROFILES = [
  { name: "age_mixed", extractorArgs: "youtube:player_client=tv_downgraded,web_creator,web", format: "bestaudio/best" },
  { name: "android", extractorArgs: "youtube:player_client=android", format: "bestaudio/best" },
  { name: "ios", extractorArgs: "youtube:player_client=ios", format: "bestaudio/best" },
  { name: "web", extractorArgs: "youtube:player_client=web", format: "bestaudio[ext=m4a]/bestaudio/best" },
];
const YTDLP_RUNTIME_CANDIDATES = [
  { name: "node", args: { jsRuntimes: "node" } },
  { name: "default", args: {} },
];

// Native agents: no axios for long-lived streams (avoids Node/axios stream quirks that cause ~40s ECONNRESET)
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 6 });
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 6 });

function getFriendlyYouTubeError(err) {
  const stderr = String(err?.stderr || "");
  const msg = String(err?.message || "");
  const combined = `${stderr}\n${msg}`.toLowerCase();
  if (combined.includes("sign in to confirm your age")) {
    return "This video is age-restricted and cannot be played with the current yt-dlp extractor profile.";
  }
  if (combined.includes("http error 403") || combined.includes("forbidden")) {
    return "YouTube blocked this stream request (403). Try another video.";
  }
  if (combined.includes("requested format is not available")) {
    return "No playable format was available for this video with current extractor profiles.";
  }
  return null;
}

// Cached after the first check -- cookies.txt's presence is a deploy-time concern, not
// something that changes mid-run, so there's no need to hit the filesystem on every call.
let cookiesTxtExists = null;
function getYoutubeDlCookieCandidates() {
  if (cookiesTxtExists === null) {
    cookiesTxtExists = fs.existsSync(COOKIES_TXT_PATH);
  }
  const candidates = [];
  if (cookiesTxtExists) {
    candidates.push({ name: "cookies.txt", args: { cookies: COOKIES_TXT_PATH } });
  }
  candidates.push({ name: "no-cookies", args: {} });
  return candidates;
}

function createYoutubeDlBaseArgs(profile, extraArgs = {}) {
  return {
    ignoreConfig: true,
    noWarnings: true,
    noCheckCertificates: true,
    extractorArgs: profile.extractorArgs,
    forceIpv4: true,
    userAgent: YOUTUBE_USER_AGENT,
    ...extraArgs,
  };
}

// Always resolves to the profile's own generic yt-dlp selector (e.g. "bestaudio/best") --
// yt-dlp negotiates the concrete format itself at stream time, so there's nothing useful
// to compute from info.formats here (it was previously built and then never used).
function selectFormat(profile) {
  return profile.format;
}

async function getYoutubeDlInfo(videoUrl) {
  let lastErr;
  const cookieCandidates = getYoutubeDlCookieCandidates();
  for (const cookieCandidate of cookieCandidates) {
    for (const runtimeCandidate of YTDLP_RUNTIME_CANDIDATES) {
      for (const profile of YTDLP_PROFILES) {
        try {
          const info = await youtubedl(videoUrl, {
            dumpSingleJson: true,
            skipDownload: true,
            ...createYoutubeDlBaseArgs(profile, { ...cookieCandidate.args, ...runtimeCandidate.args }),
          });
          return { info, profile, cookieCandidate, runtimeCandidate };
        } catch (err) {
          lastErr = err;
        }
      }
    }
  }
  throw lastErr || new Error("yt-dlp failed to fetch video info");
}

function createYoutubeDlStream(videoUrl, seek = 0, profile = YTDLP_PROFILES[0], format = null, extraArgs = {}) {
  const execArgs = {
    f: format || profile.format,
    o: "-",
    ...createYoutubeDlBaseArgs(profile, extraArgs),
  };
  if (seek > 0) {
    execArgs.downloadSections = [`*${seek}-inf`];
    execArgs.forceKeyframesAtCuts = true;
  }
  const child = youtubedl.exec(videoUrl, execArgs, { stdio: ["ignore", "pipe", "pipe"] });
  if (typeof child.catch === "function") child.catch(() => {});
  return child;
}

// Starts a stream directly with a known-good combo and waits DIRECT_STREAM_GRACE_MS for proof
// it's NOT an immediate failure, instead of doing a separate dumpSingleJson call up front just
// to find out. Never touches the stdout stream's data itself (no 'data'/'readable' listener),
// so there's zero risk of losing audio bytes before handing it off to the caller.
function tryDirectYoutubeStream(videoUrl, seek, combo, graceMs = DIRECT_STREAM_GRACE_MS) {
  return new Promise((resolve, reject) => {
    const { profile, cookieCandidate, runtimeCandidate } = combo;
    const extraArgs = { ...(cookieCandidate?.args || {}), ...(runtimeCandidate?.args || {}) };
    const child = createYoutubeDlStream(videoUrl, seek, profile, profile.format, extraArgs);
    const stream = child.stdout; // capture now -- tinyspawn replaces .stdout with a buffered
                                  // value once the process exits, so it can't be read later
    let stderrLog = "";
    let settled = false;

    child.stderr.on("data", (chunk) => {
      stderrLog += String(chunk);
      if (stderrLog.length > 4000) stderrLog = stderrLog.slice(-4000);
    });

    const finish = (ok, err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (ok) {
        resolve({ child, stream });
      } else {
        child.kill("SIGTERM");
        reject(err || new Error(stderrLog || "yt-dlp exited before producing audio"));
      }
    };

    // A clean exit (code 0) during the grace window means a short clip finished
    // entirely already -- that's a success, not a failure.
    child.once("close", (code) => {
      if (code === 0) finish(true);
      else finish(false, new Error(stderrLog || `yt-dlp exited with code ${code}`));
    });
    stream.once("error", (err) => finish(false, err));

    const timer = setTimeout(() => finish(true), graceMs);
  });
}

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
      headers: { "User-Agent": YOUTUBE_USER_AGENT, ...headers },
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
const { getPreview: getSpotifyPreview } = require("spotify-url-info")(fetch);
var mongo = require("../mongodb.js");
var auth = process.env.GOOGLE_API;

function getHostname(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch (_) {
    return "";
  }
}

function isSpotifyUrl(url) {
  return /spotify\.com$/.test(getHostname(url));
}

function isSoundCloudUrl(url) {
  return /soundcloud\.com$/.test(getHostname(url));
}

// Only single-track links are supported; albums/playlists/artists/user profiles fall through to "no results"
function isSpotifyTrackUrl(url) {
  try {
    const segments = new URL(url).pathname.split("/").filter(Boolean);
    return segments[segments.length - 2] === "track";
  } catch (_) {
    return false;
  }
}

// A SoundCloud track URL is "/user/track-slug" (2 segments); sets ("/user/sets/x") and
// user profiles ("/user") have a different depth
function isSoundCloudTrackUrl(url) {
  try {
    const segments = new URL(url).pathname.split("/").filter(Boolean);
    return segments.length === 2;
  } catch (_) {
    return false;
  }
}

async function getSoundCloudTitle(url) {
  const oembedUrl = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`;
  const res = await fetch(oembedUrl);
  if (!res.ok) {
    throw new Error(`SoundCloud oEmbed HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.title;
}

function acquireYoutubeStreamSlot() {
  if (activeYoutubeStreams >= MAX_CONCURRENT_YOUTUBE_STREAMS) {
    const err = new Error(`Maximum concurrent YouTube streams reached (${MAX_CONCURRENT_YOUTUBE_STREAMS})`);
    err.code = "YOUTUBE_CONCURRENCY_LIMIT";
    throw err;
  }
  activeYoutubeStreams += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeYoutubeStreams = Math.max(0, activeYoutubeStreams - 1);
  };
}

function extractYouTubeVideoId(url) {
  const videoIdMatch = url && (url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^/?]+)/));
  let videoId = videoIdMatch ? videoIdMatch[1] : null;
  if (!videoId) {
    try {
      const parsed = urlParser.parse(url);
      videoId = parsed && parsed.id;
    } catch (_) {}
  }
  return videoId;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Searches YouTube for a song and plays it (also accepts Spotify/SoundCloud track links)")
    .addStringOption((option) =>
      option
        .setName("search")
        .setDescription("Search term, YouTube link, or Spotify/SoundCloud track link")
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
    // spotify/soundcloud aren't recognized by js-video-url-parser, so check hostname first
    if (isSpotifyUrl(searchQuery)) {
      return "spotify";
    }
    if (isSoundCloudUrl(searchQuery)) {
      return "soundcloud";
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
        const parsedYoutubeUrl = urlParser.parse(searchQuery);
        url = "https://www.youtube.com/watch?v=" + parsedYoutubeUrl.id;
        result = await youtube.metadata(url);
        title = result.title;
        thumbnail = result.thumbnail_url;
        query = "youtube";
        seek = parsedYoutubeUrl?.params?.start ?? 0;
        break;

      // direct link
      case "direct":
        title = searchQuery;
        url = searchQuery;
        query = "direct";
        break;

      // spotify track link -> pull title/artist, then search youtube for it
      // (albums/playlists/artists are not supported and fall through to "no results")
      case "spotify":
        if (isSpotifyTrackUrl(searchQuery)) {
          let spotifyQuery = null;
          try {
            const preview = await getSpotifyPreview(searchQuery);
            if (preview?.artist && preview?.track) {
              spotifyQuery = `${preview.artist} - ${preview.track}`;
            } else if (preview?.title) {
              spotifyQuery = preview.title;
            }
          } catch (err) {
            console.error("Spotify metadata lookup failed:", err.message);
          }
          if (spotifyQuery) {
            youtubeResult = await this.getYoutubeInfo(spotifyQuery);
            url = youtubeResult?.url;
            title = youtubeResult?.title;
            thumbnail = youtubeResult?.thumbnail;
            query = "youtube";
          }
        }
        break;

      // soundcloud track link -> pull title, then search youtube for it
      // (sets/playlists/user profiles are not supported and fall through to "no results")
      case "soundcloud":
        if (isSoundCloudTrackUrl(searchQuery)) {
          let soundcloudQuery = null;
          try {
            soundcloudQuery = await getSoundCloudTitle(searchQuery);
          } catch (err) {
            console.error("SoundCloud metadata lookup failed:", err.message);
          }
          if (soundcloudQuery) {
            youtubeResult = await this.getYoutubeInfo(soundcloudQuery);
            url = youtubeResult?.url;
            title = youtubeResult?.title;
            thumbnail = youtubeResult?.thumbnail;
            query = "youtube";
          }
        }
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
      //if queue is empty, atomically append the new song
      console.log(`Updating queue for ${interaction.guild.name}`);
      await mongo.pushSongToQueue(interaction.guildId, songObject);

      await this.playMusic(interaction); //run the play loop once more
    } else {
      //if the queue exists then atomically add to it (priority songs go right after the
      //currently playing one, at index 1)
      console.log(`Updating queue for ${interaction.guild.name}`);
      await mongo.pushSongToQueue(interaction.guildId, songObject, songParams?.priority ? 1 : null);
    }
  },
  async playMusic(interaction, seek = null) {
    let releaseYoutubeSlot = null;
    let youtubeDlChild = null;
    let durationCapTimer = null;
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
      //delete the queue if the size is 0 -- atomic so a song added in the gap between this
      //check and the delete isn't silently discarded along with it
      if (!results || results.songs.length === 0) {
        const deletedQueue = await mongo.deleteQueueIfEmpty(interaction.guildId);
        if (!deletedQueue) {
          //a song was added between the read above and the delete attempt -- play it instead
          return this.playMusic(interaction);
        }
        console.log(`Deleting queue for ${interaction.guild.name}`);
        const checkConnection = getVoiceConnection(interaction.guildId);
        checkConnection?.disconnect();
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
        connection.on("error", (err) => {
          console.log(err);
        });
      }

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
        console.log("Starting YouTube stream with yt-dlp...");
        const videoId = extractYouTubeVideoId(url);
        if (!videoId) {
          console.error("No video ID in URL:", { url, queryType });
          throw new Error(`Cannot play: no video ID in URL (${String(url).slice(0, 80)})`);
        }

        releaseYoutubeSlot = acquireYoutubeStreamSlot();
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

        let stream;
        let usedCombo = null;
        if (lastWorkingYoutubeCombo) {
          try {
            const result = await tryDirectYoutubeStream(videoUrl, seek, lastWorkingYoutubeCombo);
            youtubeDlChild = result.child;
            stream = result.stream;
            usedCombo = lastWorkingYoutubeCombo;
            console.log(`YouTube stream started via remembered combo (${usedCombo.profile.name}, ${usedCombo.cookieCandidate?.name || "no-cookies"}, runtime=${usedCombo.runtimeCandidate?.name || "default"})`);
          } catch (err) {
            console.log("Remembered yt-dlp combo failed, falling back to full cascade:", err.message);
          }
        }

        if (!usedCombo) {
          const { profile, cookieCandidate, runtimeCandidate } = await getYoutubeDlInfo(videoUrl);
          const ytAttemptArgs = { ...(cookieCandidate?.args || {}), ...(runtimeCandidate?.args || {}) };
          const selectedFormat = selectFormat(profile);
          youtubeDlChild = createYoutubeDlStream(videoUrl, seek, profile, selectedFormat, ytAttemptArgs);
          stream = youtubeDlChild.stdout;
          usedCombo = { profile, cookieCandidate, runtimeCandidate };
          console.log(`YouTube stream started via full cascade (${usedCombo.profile.name}, ${usedCombo.cookieCandidate?.name || "no-cookies"}, runtime=${usedCombo.runtimeCandidate?.name || "default"}, format=${selectedFormat})`);
        }
        lastWorkingYoutubeCombo = usedCombo;

        let stderrLog = "";
        youtubeDlChild.stderr.on("data", (chunk) => {
          stderrLog += String(chunk);
          if (stderrLog.length > 4000) stderrLog = stderrLog.slice(-4000);
        });

        const releaseOnce = () => releaseYoutubeSlot?.();
        stream.once("end", releaseOnce);
        stream.once("error", releaseOnce);
        stream.once("close", releaseOnce);
        youtubeDlChild.once("close", (code) => {
          if (code && code !== 0 && code !== 143) {
            console.log("yt-dlp exited with code", code, stderrLog || "");
          }
        });

        resource = createAudioResource(stream, {
          inputType: StreamType.Arbitrary,
          inlineVolume: true,
          ffmpegExecutable: ffmpeg,
        });
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

      if (queryType === "youtube") {
        // Enforced on the playback side now instead of a yt-dlp metadata pre-check, since
        // the fast path (tryDirectYoutubeStream) doesn't fetch duration up front.
        durationCapTimer = setTimeout(() => {
          console.log(`Stopping playback: exceeded max duration of ${MAX_YOUTUBE_DURATION_SECONDS / 60} minutes`);
          interaction.channel?.send({ content: `Stopped: this track exceeded the ${MAX_YOUTUBE_DURATION_SECONDS / 60}-minute limit.` }).catch(() => {});
          player.stop();
        }, MAX_YOUTUBE_DURATION_SECONDS * 1000);
      }

      // When the voice connection goes away (/stop, kicked, etc.) the player has no
      // subscribers and just auto-pauses -- it never reaches Idle. Tear down this track's
      // resources here so the duration-cap timer doesn't fire hours later and yt-dlp
      // doesn't keep running / holding a stream slot.
      let disconnectedFromVoice = false;
      const onConnectionStateChange = (_old, newState) => {
        if (
          newState.status !== VoiceConnectionStatus.Disconnected &&
          newState.status !== VoiceConnectionStatus.Destroyed
        ) return;
        disconnectedFromVoice = true;
        connection.off("stateChange", onConnectionStateChange);
        clearTimeout(durationCapTimer);
        releaseYoutubeSlot?.();
        youtubeDlChild?.kill("SIGTERM");
        player.stop(true);
      };
      connection.on("stateChange", onConnectionStateChange);

      player.once(AudioPlayerStatus.Idle, async () => {
        connection.off("stateChange", onConnectionStateChange);
        clearTimeout(durationCapTimer);
        releaseYoutubeSlot?.();
        youtubeDlChild?.kill("SIGTERM");
        // Stopped because we left voice -- don't advance the queue or rejoin.
        if (disconnectedFromVoice) return;
        const results = await mongo.findQueueByGuildId(interaction.guildId);
        if (!results?.songs) return;
        if (!results.loop) {
          console.log(`Updating queue for ${interaction.guild.name}`);
          await mongo.popFrontSongFromQueue(interaction.guildId);
        }
        this.playMusic(interaction);
      });
      player.on('error', error => {
        connection.off("stateChange", onConnectionStateChange);
        clearTimeout(durationCapTimer);
        releaseYoutubeSlot?.();
        youtubeDlChild?.kill("SIGTERM");
        console.error('Player Error:', error.message);
      });
    } catch (err) {
      clearTimeout(durationCapTimer);
      releaseYoutubeSlot?.();
      youtubeDlChild?.kill("SIGTERM");
      console.log("Play.js error catcher: ");
      console.log(err);
      const friendlyYoutubeError = getFriendlyYouTubeError(err);
      if (friendlyYoutubeError) {
        interaction.channel?.send({ content: `Cannot play this track: ${friendlyYoutubeError}` }).catch(() => {});
      } else if (err?.code === "YOUTUBE_CONCURRENCY_LIMIT") {
        interaction.channel?.send({ content: `Cannot play this track: ${err.message}` }).catch(() => {});
      }
      
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
