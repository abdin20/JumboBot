const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("comp")
    .setDescription("mentions mandems to play comp/val"),
  async execute(interaction) {
    //lagdad, eric, riley, noah, jack w, javier
    let msg = `<@310442661343526915> <@196694571843977216> <@152558158806646784> <@331589423546368001> <@559892149307572234> <@166703160876990464>`;
    //jet , abdn, carrie, connor, nic
    msg += `<@134127232904986624> <@163368896844267521> <@313780633518473218> <@144260548245061632> <@181589300754907137> \n WANNA COMP/VAL`;

    const exampleEmbed = new EmbedBuilder()
      .setColor("#25cf0e")
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTitle("🔫 --COMP/VAL-- 🔫")
      .setDescription(msg)
      .setFooter({
        text: "🕊️ Long Live Jumbo 🕊️",
        iconURL: "https://i.imgur.com/qJMLlxG.jpeg",
      });

    await interaction.reply({ embeds: [exampleEmbed] });
  },
};
