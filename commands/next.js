const { SlashCommandBuilder } = require("discord.js");
const { EmbedBuilder } = require("discord.js");
var mongo = require("../mongodb.js");
const searchYoutube = require("youtube-api-v3-search");
const urlParser = require("js-video-url-parser");
const play = require("./play.js");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("next")
    .setDescription("Adds a song up next in the queue")
    .addStringOption((option) =>
      option
        .setName("search")
        .setDescription("Search term for music")
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

    const searchQuery = interaction.options.getString("search");
    const { title, url, query, thumbnail } = await play.parseSearchQuery(
      searchQuery
    );
    console.log(`Added up next ${title}`);
    interaction.reply({ content: 'Success!', ephemeral: true });
    interaction.deleteReply()
    play.processQueue(interaction, title, url, query, thumbnail, true);
  },
};
