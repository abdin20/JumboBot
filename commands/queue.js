const { SlashCommandBuilder } = require("discord.js");
const { EmbedBuilder } = require("discord.js");
var mongo = require("../mongodb.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("show current queue of songs"),
  // main function
  async execute(interaction) {
    const exampleEmbed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("🎶 Currently Playing 🎶")
      .setColor("#0099ff")
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setFooter({
        text: "🕊️ Long Live Jumbo 🕊️",
        iconURL: "https://i.imgur.com/qJMLlxG.jpeg",
      });
    results = await mongo.findQueueByGuildId(interaction.guildId);
    if (!results || results?.songs?.length === 0) {
      exampleEmbed.setDescription("Queue doesnt exist");
      interaction.reply({ embeds: [exampleEmbed], ephemeral: true });
      return;
    }

    let songs = results.songs;
    let firstSong = results.songs[0];

    var msg=""
    msg+=`[${firstSong.title}](${firstSong.url}) \n \n⏩ Up next! ⏩ \n`;
    exampleEmbed.setThumbnail(firstSong.thumbnail);
    if (songs.length > 1) {
      for (const [index, song] of songs.slice(1,Math.min(6,songs.length)).entries()) {
        msg+=`${index+2}. [${song.title}](${song.url}) \n \n`
      }
    }
    exampleEmbed.setDescription(msg)
    interaction.reply({ embeds: [exampleEmbed] });
  },
};
