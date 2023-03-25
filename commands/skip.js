const { SlashCommandBuilder } = require("discord.js");
const { EmbedBuilder } = require("discord.js");
var mongo = require("../mongodb.js");
play = require("./play.js");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skips current song"),

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
      })
    if (!interaction.member.voice.channelId) {
      exampleEmbed.setDescription("You need to be in a voice channel!");
      interaction.reply({ embeds: [exampleEmbed], ephemeral: true });
      return;
    }

    results = await mongo.findQueueByGuildId(interaction.guildId);
    if (!results) {
      exampleEmbed.setDescription("Queue doesnt exist");
      interaction.reply({ embeds: [exampleEmbed], ephemeral: true });

      //if there is a queue greater than 1
    } else {
      if (results.songs.length === 0) {
        return;
      }
      //shift the array
      songs = results.songs;
      song = songs.shift();
      exampleEmbed.setColor("#0099ff");
      exampleEmbed.setDescription(`Skipped [${song.title}](${song.url})`);
      console.log("Skipped " + song.title);
      interaction.reply({ embeds: [exampleEmbed] });
      //update to db and play music
      console.log(`Updating queue for ${interaction.guild.name}`);
      await mongo.updateQueueByGuildId(interaction.guildId, { songs: songs });
      play.playMusic(interaction);
    }
  },
};
