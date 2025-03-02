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
const { PassThrough } = require('stream');
const { spawn } = require('child_process');
const googleTTS = require('google-tts-api');

var mongo = require("../mongodb.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tts")
    .setDescription("Bot joins and speaks the text using text-to-speech")
    .addStringOption((option) =>
      option
        .setName("text")
        .setDescription("The text you want the bot to speak")
        .setRequired(true)
    ),

  // main function
  async execute(interaction) {
    // Check if user is in a voice channel
    if (!interaction.member.voice.channelId) {
      interaction.reply({
        content: "You need to be in a voice channel!",
        ephemeral: true,
      });
      return;
    }

    // Get the text to speak
    const textToSpeak = interaction.options.getString("text");
    
    // Check if text is too long (Google TTS has a limit of 200 characters)
    if (textToSpeak.length > 200) {
      interaction.reply({
        content: "Text is too long! Please keep it under 200 characters.",
        ephemeral: true,
      });
      return;
    }

    // Defer the reply as TTS might take a moment
    await interaction.deferReply();

    try {
      // Check if music is currently playing and stop it if necessary
      const results = await mongo.findQueueByGuildId(interaction.guildId);
      if (results && results.songs.length > 0) {
        // Music is playing, stop it and clear the queue
        const connection = getVoiceConnection(interaction.guildId);
        if (connection) {
          connection.disconnect();
        }
        
        // Delete the queue
        console.log(`Deleting queue for ${interaction.guild.name} to play TTS`);
        await mongo.deleteQueueByObject(results);
      }

      // Join the voice channel
      const connection = joinVoiceChannel({
        channelId: interaction.member.voice.channelId,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });

      // Create an audio player
      const player = createAudioPlayer();
      connection.subscribe(player);

      // Get TTS URL from Google TTS API
      const url = googleTTS.getAudioUrl(textToSpeak, {
        lang: 'en',
        slow: false,
        host: 'https://translate.google.com',
      });

      // Create a resource from the TTS URL
      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream',
      });

      const resource = createAudioResource(response.data);
      
      // Play the TTS audio
      player.play(resource);

      // Wait for the audio to start playing
      await entersState(player, AudioPlayerStatus.Playing, 5000);

      // Send a success message
      const exampleEmbed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle("🔊 Text-to-Speech 🔊")
        .setDescription(`Speaking: "${textToSpeak}"`)
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setFooter({
          text: "🕊️ Long Live Jumbo 🕊️",
          iconURL: "https://i.imgur.com/qJMLlxG.jpeg",
        });
      
      await interaction.editReply({ embeds: [exampleEmbed] });

      // Set up event listeners for the player
      player.on(AudioPlayerStatus.Idle, () => {
        // Disconnect when done playing
        setTimeout(() => {
          if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
            connection.disconnect();
          }
        }, 3000); // Wait 3 seconds before disconnecting
      });

      // Handle connection errors
      connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
          ]);
          // Seems to be reconnecting to a new channel - ignore disconnect
        } catch (error) {
          // Seems to be a real disconnect which SHOULDN'T be recovered from
          connection.destroy();
        }
      });

    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: "There was an error while executing the TTS command!", ephemeral: true });
    }
  },
}; 