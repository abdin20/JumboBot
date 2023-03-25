const { SlashCommandBuilder } = require("discord.js");
const { EmbedBuilder } = require("discord.js");
var mongo = require("../mongodb.js");

const urlParser = require("js-video-url-parser");
//playlist metadata
//playlist video fetcher
const ytfps = require("ytfps");
const play = require("./play.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("playlist")
    .setDescription("add songs from youtube playlist to queue")
    .addStringOption((option) =>
      option
        .setName("url")
        .setDescription("url for youtube playlist")
        .setRequired(true)
    ),
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

    // get search from user
    const url = interaction.options.getString("url");
    const parsedResult = urlParser.parse(url);
    var playlistIndex = 0;
    var count = 0;
    const songs = [];
    if (parsedResult?.provider === "youtube" && parsedResult?.list) {
      //save playlist id
      let playlistId = parsedResult.list;
      //check to see if there are parameters and if so check if theres an index,
      if (parsedResult?.params && parsedResult?.params.index) {
        playlistIndex = parsedResult.params.index; //set index of playlist if found from link
        playlistIndex -= 1; //to account for indexing at 0
        interaction.channel.send({ content: `Starting index found in link : ${playlistIndex} `,ephemeral:true });
      }
      console.log(`Starting index is ${playlistIndex}`);

      //get list of videos from playlist id
      result = await (await ytfps(playlistId)).videos;
      //for every video push it to the song array
      result.forEach((element, currIndex) => {
        if (currIndex >= playlistIndex) {
          //check to see if we are starting from the correct index
          songs.push({
            url: element.url,
            title: element.title,
            queryType: "youtube",
            thumbnail: element.thumbnail_url,
            seek: 0,
          });
          count++;
        }
      });
    } else {
      exampleEmbed.setDescription("Invalid playlist link");
      interaction.reply({ embeds: [exampleEmbed] });
      return;
    }

    results = await mongo.findQueueByGuildId(interaction.guildId);
    if (!results) {
      console.log(`Creating queue for ${interaction.guild.name}`);
      //if no queue, make one, add to db, and run teh playmusic
      propertyObject = new Object();
      propertyObject.guildId = interaction.guildId;
      propertyObject.songs = [...songs];
      propertyObject.loop = false; //loop defaults to off

      //create queue in db
      await mongo.createQueueByObject(propertyObject);
      //go to playmusic function
      await play.playMusic(interaction);
    }else{
      let newSongs = results.songs.concat(songs);

      //update queue
      await mongo.updateQueueByGuildId(interaction.guildId,{ songs: newSongs })
    }
    exampleEmbed.setDescription("Added " + count + " songs to queue");
    interaction.reply({ embeds: [exampleEmbed] });

  },
};
