const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gamblers")
    .setDescription("mentions all gamblers")
    .addAttachmentOption(option => option.setName('image').setDescription('Optional image to include.')),
  async execute(interaction) {
    //riley, noah, jack w, javier
    let msg = `<@152558158806646784> <@331589423546368001> <@559892149307572234> <@166703160876990464>`;
    //jet , abdn, shane, jason, milton,david w
    msg += `<@134127232904986624> <@163368896844267521> <@545042126644445184> <@152989214932336640> <@199708115434864641> <@150029401973587969>`;
    msg += `\n \n ❗❗ ATTENTION ALL DISTINGUINED GENTLEMEN ❗❗`;

    const attachment = interaction.options?.getAttachment("image");
    const exampleEmbed = new EmbedBuilder()
      .setColor("2003fc")
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTitle("🎰  --GAMBLERS--  🎲")
      .setDescription(msg)
      .setFooter({
        text: "🕊️ Long Live Jumbo 🕊️",
        iconURL: "https://i.imgur.com/qJMLlxG.jpeg",
      })

      if(attachment?.url){
        exampleEmbed.setImage(attachment.url)
      }

    await interaction.reply({ embeds: [exampleEmbed] });
  },
};
