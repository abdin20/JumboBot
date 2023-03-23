const { SlashCommandBuilder,EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gamblers")
    .setDescription("mentions all gamblers"),
  async execute(interaction) {
    //riley, noah, jack w, javier
    let msg = `<@152558158806646784> <@331589423546368001> <@559892149307572234> <@166703160876990464>`;
    //jet , abdn, shane, jason, milton,david w
    msg += `<@134127232904986624> <@163368896844267521> <@545042126644445184> <@152989214932336640> <@199708115434864641> <@150029401973587969>`;
    msg+=`\n ATTENTION ALL DISTINGUINED GENTLEMEN`

    const exampleEmbed = new EmbedBuilder().setColor("2003fc").setAuthor({
      name: interaction.user.username,
      iconURL: interaction.user.displayAvatarURL(),
    });
    exampleEmbed.setTitle("🎰  --GAMBLERS--  🎲");
    exampleEmbed.setDescription(msg);

    await interaction.reply({ embeds: [exampleEmbed] });
  },
};
