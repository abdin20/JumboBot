const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gauntlet")
    .setDescription("mentions all gauntleteers"),
  async execute(interaction) {
    //riley, noah, jack w, lagdad
    let msg = `<@152558158806646784> <@331589423546368001> <@559892149307572234> <@310442661343526915>`;
    //jet , abdn, milton, david w, john
    msg += `<@134127232904986624> <@152989214932336640> <@199708115434864641> <@150029401973587969> <@165898703410954241>`;
    //capp, connor, aaron, andrew g
    msg += `<@313780633518473218> <@144260548245061632> <@146425358927790081> <@144260931109519360>`;
    msg += `\n ATTENTION ALL GAUNTLETEERS`;

    const exampleEmbed = new EmbedBuilder()
      .setColor("#fc9003")
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTitle("💍 --GAUNTLET--  💍")
      .setDescription(msg)
      .setFooter({
        text: "🕊️ Long Live Jumbo 2020-2023 🕊️",
        iconURL: "https://i.imgur.com/qJMLlxG.jpeg",
      });

    await interaction.reply({ embeds: [exampleEmbed] });
  },
};
