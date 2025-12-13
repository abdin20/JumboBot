const { SlashCommandBuilder } = require("discord.js");
const { EmbedBuilder } = require("discord.js");
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
const axios = require('axios');
const ffmpeg = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
var mongo = require("../mongodb.js");
const play = require("./play.js");

// Load gachiradio data
let gachiradioData = [];
const dataPath = path.join(__dirname, '..', 'radio_data.json');

function loadGachiRadioData() {
  try {
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8');
      gachiradioData = JSON.parse(data);
      console.log(`Loaded ${gachiradioData.length} tracks from radio_data.json`);
    } else {
      console.warn('gachiradio_data.json not found. Radio command will not work.');
    }
  } catch (error) {
    console.error('Error loading gachiradio data:', error);
    gachiradioData = [];
  }
}

// Load data on module initialization
loadGachiRadioData();

// Pool of embed images (placeholder - user will set these later)
// To add images, simply add image URLs to this array:
// const embedImages = [
//   "https://example.com/image1.jpg",
//   "https://example.com/image2.png",
//   // ... more image URLs
// ];
const embedImages = [
  "https://lithi.io/file/cpnDFQNG.jpg",
  "https://lithi.io/file/Zd8Dkv9a.jpg",
  "https://lithi.io/file/sFyCWgds.jpg",
  "https://lithi.io/file/bL7Xd7Hy.jpg"


  // Add image URLs here later
];

function getRandomEmbedImage() {
  if (embedImages.length === 0) {
    return null; // Return null if no images set yet
  }
  return embedImages[Math.floor(Math.random() * embedImages.length)];
}

function getRandomTrack() {
  if (gachiradioData.length === 0) return null;
  return gachiradioData[Math.floor(Math.random() * gachiradioData.length)];
}

function getRandomTracks(count) {
  if (gachiradioData.length === 0) return [];
  const maxCount = Math.min(count, gachiradioData.length);
  const shuffled = [...gachiradioData].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, maxCount);
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function searchTracks(query) {
  if (gachiradioData.length === 0) return [];
  const lowerQuery = query.toLowerCase().trim();
  
  // Split query into words for better matching
  const queryWords = lowerQuery.split(/\s+/).filter(word => word.length > 0);
  
  return gachiradioData.filter(track => {
    const lowerTitle = track.title.toLowerCase();
    const lowerTags = track.tags.map(t => t.toLowerCase()).join(' ');
    
    // Check if all query words appear in title or tags
    // This allows for more flexible searching (e.g., "bring me horizon" will match "Bring Me The Horizon")
    return queryWords.every(word => 
      lowerTitle.includes(word) || lowerTags.includes(word)
    );
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("radio")
    .setDescription("Play music from Gachi Radio")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("Search query (leave empty for random tracks)")
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!interaction.member.voice.channelId) {
      await interaction.reply({
        content: "You need to be in a voice channel!",
        ephemeral: true,
      });
      return;
    }

    if (gachiradioData.length === 0) {
      await interaction.reply({
        content: "Radio data not loaded. Please check gachiradio_data.json file.",
        ephemeral: true,
      });
      return;
    }

    const query = interaction.options.getString("query");
    const maxTracks = 10;

    let selectedTracks = [];

    if (!query || query.trim().length === 0) {
      // Random mode: select 10 random tracks
      selectedTracks = getRandomTracks(maxTracks);
    } else {
      // Search mode: find tracks matching the query
      const searchResults = searchTracks(query);
      
      if (searchResults.length === 0) {
        await interaction.reply({
          content: `No tracks found matching: "${query}"\n\nTry searching by artist name, song title, or tags (e.g., "gachi", "remix", "right-version")`,
          ephemeral: true,
        });
        return;
      }
      
      // Shuffle and take up to maxTracks
      const shuffledResults = shuffleArray(searchResults);
      selectedTracks = shuffledResults.slice(0, Math.min(maxTracks, shuffledResults.length));
    }

    if (selectedTracks.length === 0) {
      await interaction.reply({
        content: "Failed to select tracks. Please try again.",
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({ content: "Success!", ephemeral: true });
    await interaction.deleteReply();

    // Process all tracks into queue
    await this.processMultipleTracks(interaction, selectedTracks);
  },

  async processMultipleTracks(interaction, tracks) {
    const thumbnail = getRandomEmbedImage() || "https://i.imgur.com/inFYoNd.jpeg";
    
    console.log(`${interaction.user.username} requested ${tracks.length} radio tracks`);
    
    // Create embed showing how many tracks were added
    const exampleEmbed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("📻 Gachi Radio 📻")
      .setDescription(
        `Adding ${tracks.length} track${tracks.length > 1 ? 's' : ''} to queue:\n\n` +
        tracks.slice(0, 5).map((track, idx) => `${idx + 1}. [${track.title}](${track.url})`).join('\n') +
        (tracks.length > 5 ? `\n... and ${tracks.length - 5} more` : '')
      )
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setFooter({
        text: "🕊️ Long Live Jumbo 🕊️",
        iconURL: "https://i.imgur.com/qJMLlxG.jpeg",
      });

    // Add embed image if available
    if (thumbnail) {
      exampleEmbed.setImage(thumbnail);
    }

    await interaction.channel.send({ embeds: [exampleEmbed] });

    // Create song objects for all tracks
    const songObjects = tracks.map(track => ({
      url: track.url,
      title: track.title,
      queryType: "direct", // These are direct MP3 links
      thumbnail: thumbnail,
      seek: 0,
    }));
    
    results = await mongo.findQueueByGuildId(interaction.guildId);
    if (!results) {
      console.log(`Creating queue for ${interaction.guild.name}`);
      propertyObject = new Object();
      propertyObject.guildId = interaction.guildId;
      propertyObject.songs = songObjects;
      propertyObject.loop = false;

      await mongo.createQueueByObject(propertyObject);
      await play.playMusic(interaction);
    } else if (results.songs.length == 0) {
      addSong = results.songs;
      addSong.push(...songObjects);

      console.log(`Updating queue for ${interaction.guild.name}`);
      await mongo.updateQueueByGuildId(interaction.guildId, { songs: addSong });

      await play.playMusic(interaction);
    } else {
      addSong = results.songs;
      addSong.push(...songObjects);
      console.log(`Updating queue for ${interaction.guild.name}`);
      await mongo.updateQueueByGuildId(interaction.guildId, { songs: addSong });
    }
  },

  async processQueue(
    interaction,
    title,
    url,
    queryType,
    thumbnail,
    songParams = { priority: false, seek: 0 }
  ) {
    console.log(`${interaction.user.username} requested radio track: ${title}`);
    const exampleEmbed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("📻 Gachi Radio 📻")
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

    // Add embed image if available
    if (thumbnail) {
      exampleEmbed.setImage(thumbnail);
    }

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
      propertyObject = new Object();
      propertyObject.guildId = interaction.guildId;
      propertyObject.songs = [songObject];
      propertyObject.loop = false;

      await mongo.createQueueByObject(propertyObject);
      await play.playMusic(interaction);
    } else if (results.songs.length == 0) {
      addSong = results.songs;
      addSong.push(songObject);

      console.log(`Updating queue for ${interaction.guild.name}`);
      await mongo.updateQueueByGuildId(interaction.guildId, { songs: addSong });

      await play.playMusic(interaction);
    } else {
      addSong = results.songs;
      songParams?.priority
        ? addSong.splice(1, 0, songObject)
        : addSong.push(songObject);
      console.log(`Updating queue for ${interaction.guild.name}`);
      await mongo.updateQueueByGuildId(interaction.guildId, { songs: addSong });
    }
  },
};
