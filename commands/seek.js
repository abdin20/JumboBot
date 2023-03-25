const { SlashCommandBuilder } = require("discord.js");
const { EmbedBuilder } = require("discord.js");
var mongo = require("../mongodb.js");
const searchYoutube = require("youtube-api-v3-search");
const urlParser = require("js-video-url-parser");
const play = require("./play.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("seek")
    .setDescription("seeks to the desired time (in seconds) ")
    .addIntegerOption((option) =>
      option
        .setName("seconds")
        .setDescription("how many seconds into the video to seek")
        .setRequired(true)
    ),
  // main function
  async execute(interaction) {
    const exampleEmbed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("🎶 Music 🎶")
      .setColor("#0099ff")
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setFooter({
        text: "🕊️ Long Live Jumbo 🕊️",
        iconURL: "https://i.imgur.com/qJMLlxG.jpeg",
      });
    if (!interaction.member.voice.channelId) {
      exampleEmbed.setDescription("You need to be in a voice channel!");
      interaction.reply({ embeds: [exampleEmbed], ephemeral: true });
      return;
    }
    results = await mongo.findQueueByGuildId(interaction.guildId);
    if (!results) {
      exampleEmbed.setDescription("Queue doesnt exist");
      interaction.reply({ embeds: [exampleEmbed], ephemeral: true });
      return;
    }
    
    const seek = interaction.options.getInteger("seconds");

    if (seek<0) {
      exampleEmbed.setDescription("Please enter number larger than 0");
      interaction.reply({ embeds: [exampleEmbed], ephemeral: true });
      return;
    }

    interaction.reply({ content: 'Success!', ephemeral: true });
    play.playMusic(interaction,seek);
  },
};
