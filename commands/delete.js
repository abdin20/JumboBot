const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
var mongo = require('../mongodb.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delete')
    .setDescription('Delete a song from the queue')
    .addIntegerOption(option =>
        option.setName('number')
        .setDescription('The queue number of the song to delete, starting from 1 for the second song')
        .setRequired(true)),

  // main function
  async execute(interaction) {
    const songNumber = interaction.options.getInteger('number');
    const results = await mongo.findQueueByGuildId(interaction.guildId);

    if (!results || results.songs.length <= 1) {
      return interaction.reply({ content: '🚫 Cannot delete when the queue has 1 or no songs.', ephemeral: true });
    }

    // Adjusting index to account for the fact that the first song in the queue is currently playing
    const adjustedIndex = songNumber;

    if (adjustedIndex < 1 || adjustedIndex >= results.songs.length) {
      return interaction.reply({ content: `🚫 Invalid song number. Please provide a number between 1 and ${results.songs.length - 1}.`, ephemeral: true });
    }

    // Deleting the song
    const deletedSong = results.songs.splice(adjustedIndex, 1)[0];

    // Update the queue in the database
    await mongo.updateQueueByGuildId(interaction.guildId, { songs: results.songs });

    // Reply to the user
    const deleteEmbed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("🎶 Song Deleted 🎶")
      .setDescription(`Deleted song number ${songNumber + 1}: ${deletedSong.title}`)
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setFooter({
        text: "🕊️ Long Live Jumbo 🕊️",
        iconURL: "https://i.imgur.com/qJMLlxG.jpeg",
      });

    interaction.reply({ embeds: [deleteEmbed] });
  },
};
