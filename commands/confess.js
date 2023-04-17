const fs = require("fs");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("confess")
        .setDescription("Confess anonymously")
        .addStringOption((option) =>
            option.setName("confession")
                .setDescription("Confess anonymously")
                .setRequired(true)
        )
        .addChannelOption((option) =>
            option.setName("channel")
                .setDescription("The channel to send the confession to")
        ),
    async execute(interaction) {
        const confession = interaction.options.getString("confession");
        const channelOption = interaction.options.getChannel("channel");

        // Load confession channels and confessions from JSON file
        let confessionData = { channels: {}, confessions: [] };
        if (await fs.existsSync("../confession-data.json")) {
            confessionData = await require("../confession-data.json");
        }

        let channelId;

        // Check if confession channel has been set for the guild
        if (confessionData?.channels?.[interaction.guild.id]) {
            channelId = confessionData.channels[interaction.guild.id].guildConfessionChannel;
        }

        // If channel option is provided, set it as the confession channel for the guild
        if (channelOption) {
            confessionData.channels[interaction.guild.id] = {
                guildName: interaction.guild.name,
                guildConfessionChannel: channelOption.id,
            };
            channelId = channelOption.id;

            // Write confession channels to JSON file
            await fs.writeFileSync(
                "./confession-data.json",
                JSON.stringify(confessionData)
            );
        }

        // If no confession channel has been set, prompt user to set one
        if (!channelId) {
            return await interaction.reply({
                content:
                    "No confession channel has been set for this server. To set one, run `/confess channel <channel>`.",
                ephemeral: true,
            });
        }

        // Construct anonymous confession message and add to the confessions array
        const confessionObject = {
            number: confessionData.confessions.length + 1,
            confession: confession,
        };
        confessionData.confessions.push(confessionObject);

        // Write confessions to JSON file
        try {
            await fs.writeFileSync(
                "./confession-data.json",
                JSON.stringify(confessionData)
            );
            fs.chmodSync("../confession-data.json", "777");
        } catch (err) {
            console.log('error saving confession')
        }

        const date = new Date();
        const formattedDate = date.toLocaleString("en-US", {
            timeZone: "America/New_York",
            timeZoneName: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
        const exampleEmbed = new EmbedBuilder()
            .setColor("#ff0000")
            .setTitle(`🤫 Anonymous Confession #${confessionObject.number} `)
            .setDescription(confession)
            .setFooter({ text: `Confession made on ${formattedDate}` })

        // Send anonymous confession to the confession channel
        const confessionChannel = await interaction.guild.channels.cache.get(channelId);
        await confessionChannel.send({ embeds: [exampleEmbed] });

        // Reply to user confirming the confession has been sent
        await interaction.reply({
            content: `Your confession (number ${confessionObject.number}) has been sent!`,
            ephemeral: true,
        });
    },
};
