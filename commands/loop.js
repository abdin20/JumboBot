const { SlashCommandBuilder } = require("discord.js");
const { EmbedBuilder } = require("discord.js");
var mongo = require("../mongodb.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("loop")
    .setDescription("toggle looping of songs playing"),
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
    let loop =!results.loop
    await mongo.updateQueueByGuildId(interaction.guildId, { loop });
    exampleEmbed.setDescription(`Loop is ${loop ? "on" :"off"}`);
    interaction.reply({ embeds: [exampleEmbed]});
  },
};
