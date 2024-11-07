const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create a poll')
    .addStringOption(option =>
      option.setName('question')
        .setDescription('Poll question')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('options')
        .setDescription('Poll options (comma separated)')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('duration')
        .setDescription('Poll duration in minutes (default: 60)')
        .setMinValue(1)
        .setMaxValue(1440))
    .addBooleanOption(option =>
      option.setName('single_vote')
        .setDescription('Allow only one vote per user (default: false)')
        .setRequired(false)),

  async execute(interaction) {
    const question = interaction.options.getString('question');
    const optionsString = interaction.options.getString('options');
    const duration = interaction.options.getInteger('duration') || 10;
    const singleVote = interaction.options.getBoolean('single_vote') ?? false;

    const options = optionsString.split(',')
      .map(opt => opt.trim())
      .filter(opt => opt.length > 0);

    if (options.length < 2) {
      return interaction.reply({ 
        content: 'Please provide at least 2 options!', 
        ephemeral: true 
      });
    }
    if (options.length > 10) {
      return interaction.reply({ 
        content: 'Maximum 10 options allowed!', 
        ephemeral: true 
      });
    }

    // Create buttons for each option
    let rows = [];
    const votes = new Map();
    const userVotes = new Map();

    function updateRows() {
      // Helper function to create/update all rows
      const newRows = [];
      for (let i = 0; i < options.length; i += 4) {
        const row = new ActionRowBuilder();
        const buttonsInRow = options.slice(i, i + 4).map((opt, index) => {
          const buttonId = `poll_${i + index}`;
          const button = new ButtonBuilder()
            .setCustomId(buttonId)
            .setLabel(`${opt} (${votes.get(buttonId)?.count || 0})`)
            .setStyle(ButtonStyle.Primary);
          return button;
        });
        row.addComponents(buttonsInRow);
        newRows.push(row);
      }

      // Add the "Add Option" button in a new row
      const addOptionButton = new ButtonBuilder()
        .setCustomId('add_option')
        .setLabel('Add Option')
        .setStyle(ButtonStyle.Secondary);
      
      const addOptionRow = new ActionRowBuilder()
        .addComponents(addOptionButton);
      
      newRows.push(addOptionRow);
      
      return newRows;
    }

    // Initial rows setup
    rows = updateRows();

    const pollEmbed = new EmbedBuilder()
      .setColor('#FF69B4')
      .setTitle(`📊 ${question}`)
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setDescription(
        `**Vote for your choice below!**\n\n${options.map((opt, i) => {
          const emoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'][i];
          return `${emoji} **│** \`${opt}\``;
        }).join('\n\n─────────────────\n\n')}` +
        '\n\n━━━━━━━━━━━━━━━━━━━━━━\n' +
        (singleVote 
          ? '🔒 *Only one vote per user allowed*' 
          : '🔓 *Multiple votes allowed*') +
        '\n\n*Click the buttons below to cast your vote!*'
      )
      .setFooter({
        text: `Poll ends in ${duration} minutes | 🕊️ Long Live Jumbo 🕊️`,
        iconURL: "https://i.imgur.com/qJMLlxG.jpeg",
      })
      .setTimestamp();

    const pollMessage = await interaction.reply({ 
      embeds: [pollEmbed],
      components: rows,
      fetchReply: true 
    });

    // Create button collector
    const collector = pollMessage.createMessageComponentCollector({ 
      time: duration * 60 * 1000 
    });

    collector.on('collect', async (i) => {
      if (!i.isButton()) return;

      if (i.customId === 'add_option') {
        const modal = new ModalBuilder()
          .setCustomId('add_option_modal')
          .setTitle('Add Poll Option');

        const optionInput = new TextInputBuilder()
          .setCustomId('new_option')
          .setLabel('New Option')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(100);

        const actionRow = new ActionRowBuilder().addComponents(optionInput);
        modal.addComponents(actionRow);

        await i.showModal(modal);
        return;
      }

      const userId = i.user.id;
      const buttonId = i.customId;

      if (singleVote) {
        const previousVote = userVotes.get(userId);
        if (previousVote === buttonId) {
          // Remove vote if clicking same button
          if (!votes.has(buttonId)) {
            votes.set(buttonId, { option: options[parseInt(buttonId.split('_')[1])], count: 0 });
          }
          votes.get(buttonId).count--;
          userVotes.delete(userId);
        } else {
          // Change vote
          if (previousVote && votes.has(previousVote)) {
            votes.get(previousVote).count--;
          }
          if (!votes.has(buttonId)) {
            votes.set(buttonId, { option: options[parseInt(buttonId.split('_')[1])], count: 0 });
          }
          votes.get(buttonId).count++;
          userVotes.set(userId, buttonId);
        }
      } else {
        // Toggle vote
        if (!votes.has(buttonId)) {
          votes.set(buttonId, { option: options[parseInt(buttonId.split('_')[1])], count: 0 });
        }
        
        if (userVotes.get(userId)?.includes(buttonId)) {
          votes.get(buttonId).count--;
          userVotes.set(userId, (userVotes.get(userId) || []).filter(id => id !== buttonId));
        } else {
          votes.get(buttonId).count++;
          userVotes.set(userId, [...(userVotes.get(userId) || []), buttonId]);
        }
      }

      // Update rows using the helper function
      rows = updateRows();
      await i.update({ components: rows });
    });

    // Add modal submit handler
    interaction.client.on('interactionCreate', async (i) => {
      if (!i.isModalSubmit() || i.customId !== 'add_option_modal') return;

      const newOption = i.fields.getTextInputValue('new_option').trim();
      
      // Validate new option
      if (newOption.length === 0) {
        await i.reply({ content: 'Option cannot be empty!', ephemeral: true });
        return;
      }

      if (options.includes(newOption)) {
        await i.reply({ content: 'This option already exists!', ephemeral: true });
        return;
      }

      if (options.length >= 10) {
        await i.reply({ content: 'Maximum number of options (10) reached!', ephemeral: true });
        return;
      }

      // Add new option
      options.push(newOption);
      const buttonId = `poll_${options.length - 1}`;
      votes.set(buttonId, { option: newOption, count: 0 });

      // Update rows using the helper function
      rows = updateRows();

      // Update embed description with the same formatting as initial display
      const updatedEmbed = EmbedBuilder.from(pollEmbed)
        .setDescription(
          `**Vote for your choice below!**\n\n${options.map((opt, i) => {
            const emoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'][i];
            return `${emoji} **│** \`${opt}\``;
          }).join('\n\n─────────────────\n\n')}` +
          '\n\n━━━━━━━━━━━━━━━━━━━━━━\n' +
          (singleVote 
            ? '🔒 *Only one vote per user allowed*' 
            : '🔓 *Multiple votes allowed*') +
          '\n\n*Click the buttons below to cast your vote!*'
        );

      await i.update({ 
        embeds: [updatedEmbed],
        components: rows 
      });
    });

    // When poll ends
    collector.on('end', async () => {
      const results = Array.from(votes.values())
        .sort((a, b) => b.count - a.count);

      const resultsEmbed = new EmbedBuilder()
        .setColor('#FF69B4')
        .setTitle(`📊 Poll Results: ${question}`)
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setDescription(
          results.map((result, i) => {
            const position = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'][i];
            const percentage = (result.count / Array.from(votes.values()).reduce((sum, v) => sum + v.count, 0) * 100) || 0;
            const progressBar = createProgressBar(percentage);
            return `${position} **${result.option}**\n${progressBar} \`${result.count} votes (${percentage.toFixed(1)}%)\``;
          }).join('\n\n')
        )
        .setFooter({
          text: '🕊️ Long Live Jumbo 🕊️',
          iconURL: "https://i.imgur.com/qJMLlxG.jpeg",
        })
        .setTimestamp();

      // Disable all buttons using the same structure
      const disabledRows = rows.map(row => {
        const newRow = new ActionRowBuilder();
        row.components.forEach(button => {
          if (button.data.custom_id === 'add_option') {
            newRow.addComponents(
              ButtonBuilder.from(button).setDisabled(true)
            );
          } else {
            const voteData = votes.get(button.data.custom_id);
            if (voteData) {
              newRow.addComponents(
                ButtonBuilder.from(button)
                  .setDisabled(true)
                  .setLabel(`${voteData.option} (${voteData.count})`)
              );
            }
          }
        });
        return newRow;
      });

      await pollMessage.edit({ 
        embeds: [pollEmbed.setFooter({
          text: 'Poll ended | 🕊️ Long Live Jumbo 🕊️',
          iconURL: "https://i.imgur.com/qJMLlxG.jpeg",
        })], 
        components: disabledRows 
      });
      
      await interaction.channel.send({ embeds: [resultsEmbed] });
    });

    // Add this helper function for creating progress bars
    function createProgressBar(percentage) {
      const filled = Math.round(percentage / 10);
      const empty = 10 - filled;
      return '█'.repeat(filled) + '░'.repeat(empty);
    }
  },
};