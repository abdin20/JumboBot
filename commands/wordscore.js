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

      // Create leaderboard text with all players
      const leaderboardText = sortedScores.map((score, i) => {
        const avg = (score.totalScore / score.gamesPlayed).toFixed(2);
        const medal = ['🥇','🥈','🥉'][i] || `${i + 1}.`;
        return `${medal} ${score.username} - ${avg} avg (${score.gamesPlayed} games)\n` +
               `Last 5 scores: ${score.puzzles.slice(-5).map(p => p.score).join(', ')}`;
      }).join('\n\n');

      // Split leaderboard into chunks if it's too long for one message
      const chunks = [];
      let currentChunk = '';
      
      leaderboardText.split('\n\n').forEach((entry) => {
        if (currentChunk.length + entry.length + 2 > 4000) { // Discord's limit is 4096
          chunks.push(currentChunk);
          currentChunk = entry;
        } else {
          currentChunk += (currentChunk ? '\n\n' : '') + entry;
        }
      });
      if (currentChunk) chunks.push(currentChunk);

      // Send first embed
      const firstEmbed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle(`${game.charAt(0).toUpperCase() + game.slice(1)} Leaderboard`)
        .setDescription(chunks[0])
        .setFooter({
          text: chunks.length > 1 ? `Page 1/${chunks.length}` : "🕊️ Long Live Jumbo 🕊️",
          iconURL: "https://i.imgur.com/qJMLlxG.jpeg",
        });

      await interaction.reply({ embeds: [firstEmbed] });

      // Send additional embeds if needed
      for (let i = 1; i < chunks.length; i++) {
        const embed = new EmbedBuilder()
          .setColor("#0099ff")
          .setDescription(chunks[i])
          .setFooter({
            text: `Page ${i + 1}/${chunks.length}`,
            iconURL: "https://i.imgur.com/qJMLlxG.jpeg",
          });

        await interaction.followUp({ embeds: [embed] });
      }
    }
  }
};