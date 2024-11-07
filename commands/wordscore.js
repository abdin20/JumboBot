const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
var mongo = require("../mongodb.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("wordscore")
    .setDescription("Manage word game scoring")
    .addSubcommand(subcommand =>
      subcommand
        .setName("setchannel")
        .setDescription("Set the channel for tracking word game scores")
        .addChannelOption(option =>
          option
            .setName("channel")
            .setDescription("The channel to track scores in")
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("leaderboard")
        .setDescription("View word game leaderboards")
        .addStringOption(option =>
          option
            .setName("game")
            .setDescription("Which game's leaderboard to view")
            .setRequired(true)
            .addChoices(
              { name: "Wordle", value: "wordle" },
              { name: "Connections", value: "connections" }
            )
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "setchannel") {
      const channel = interaction.options.getChannel("channel");
      await mongo.setWordScoreChannel(interaction.guildId, channel.id);

      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle("Word Score Channel Set")
        .setDescription(`Now tracking word game scores in ${channel}`)
        .setFooter({
          text: "🕊️ Long Live Jumbo 🕊️",
          iconURL: "https://i.imgur.com/qJMLlxG.jpeg",
        });

      await interaction.reply({ embeds: [embed] });
    }

    else if (subcommand === "leaderboard") {
      const game = interaction.options.getString("game");
      
      // Get all guild members
      const guildMembers = await interaction.guild.members.fetch();
      const guildMemberIds = [...guildMembers.keys()];
      
      // Get scores for all users
      const scores = await mongo.getWordScores(game);
      
      // Filter scores to only include guild members
      const guildScores = scores.filter(score => guildMemberIds.includes(score.userId));
      
      if (!guildScores || guildScores.length === 0) {
        return interaction.reply({
          content: "No scores recorded for this server's members yet!",
          ephemeral: true
        });
      }

      // Sort scores by average score (lower is better)
      const sortedScores = guildScores.sort((a, b) => {
        const aAvg = a.totalScore / a.gamesPlayed;
        const bAvg = b.totalScore / b.gamesPlayed;
        return aAvg - bAvg;
      });

      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle(`${game.charAt(0).toUpperCase() + game.slice(1)} Leaderboard`)
        .setDescription(
          sortedScores.slice(0, 10).map((score, i) => {
            const avg = (score.totalScore / score.gamesPlayed).toFixed(2);
            return `${['🥇','🥈','🥉'][i] || `${i + 1}.`} <@${score.userId}> - ${avg} avg (${score.gamesPlayed} games)`;
          }).join('\n')
        )
        .setFooter({
          text: "🕊️ Long Live Jumbo 🕊️",
          iconURL: "https://i.imgur.com/qJMLlxG.jpeg",
        });

      await interaction.reply({ embeds: [embed] });
    }
  }
};