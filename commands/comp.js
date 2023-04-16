const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("comp")
    .setDescription("mentions mandems to play comp/val"),
  async execute(interaction) {
    // Array of user IDs
    let usersObjects = {
      lagdad: "310442661343526915",
      eric: "196694571843977216",
      riley: "152558158806646784",
      noah: "331589423546368001",
      "jack w": "559892149307572234",
      javier: "166703160876990464",
      jet: "134127232904986624",
      abdn: "163368896844267521",
      carrie: "313780633518473218",
      connor: "144260548245061632",
      nic: "181589300754907137",
    };
    
    // Fetch all the user objects using Promise.all()
    const userObjects = await Promise.all(
      Object.values(usersObjects).map(async (userId) => {
        try {
          const user = await interaction.client.users.fetch(userId);
          return user;
        } catch (error) {
          // If user not found, return null
          console.log(`User with ID ${userId} not found.`);
          return null;
        }
      })
    );

    // Create the mention string
    const mentionString = userObjects
      .filter((user) => user !== null)
      .map((user) => user.toString())
      .join(" ");

    // Construct the embed message with mentions
    const exampleEmbed = new EmbedBuilder()
      .setColor("#25cf0e")
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTitle("🔫 --COMP/VAL-- 🔫")
      .setDescription(`${mentionString}, wanna comp/val?`);

    // Reply in the channel
    await interaction.reply({ embeds: [exampleEmbed] });
    const guildsFilter=[`"rock" ZONE`]
    // Send a direct message to each user
    for (const user of userObjects) {
      if (user !== null) {
        let message=``;
        let guildName=interaction.guild.name
        if(guildsFilter.includes(guildName)){
          message=`Hey ${user.username}, we're playing comp/val!`
        }else{
          message=`Hey ${user.username}, we're playing comp/val! \nJoin the ${guildName} Discord!`
        }
        try {
          await user.send(message);
        } catch (error) {
          console.log(`Failed to send message to ${user.username}`);
        }
      }
    }
  },
};