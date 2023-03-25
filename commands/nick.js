const { SlashCommandBuilder } = require("discord.js");
const { EmbedBuilder } = require("discord.js"); // Changed to EmbedBuilder

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nick")
    .setDescription("set nickname for user")
    .addMentionableOption((option) =>
      option.setName("user")
      .setDescription("username of person to change")
      .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("nickname")
      .setDescription("new nickname")
      .setRequired(true)
    ),
  async execute(interaction) {
    const exampleEmbed = new EmbedBuilder() // Changed to EmbedBuilder
      .setColor("#ff0000")
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setFooter({
        text: "🕊️ Long Live Jumbo 🕊️",
        iconURL: "https://i.imgur.com/qJMLlxG.jpeg",
      });

    const user = interaction.options.getMentionable("user");
    const nickname = interaction.options.getString("nickname");

    // Add code to update the user's nickname in the database
    try {
      await interaction.guild.members.cache.get(user.id).setNickname(nickname);
      exampleEmbed.setDescription(`Changed ${user}'s nickname to ${nickname}.`);
    } catch (error) {
      exampleEmbed.setDescription(`Failed to change ${user}'s nickname. Reason: ${error.message}.`);
    }

    interaction.reply({ embeds: [exampleEmbed] });
  },
};