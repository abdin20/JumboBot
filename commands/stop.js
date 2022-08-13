const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus, AudioPlayerStatus, createAudioPlayer, createAudioResource, StreamType, getVoiceConnection } = require('@discordjs/voice');

var mongo = require("../mongodb.js");
play = require("./play.js");
module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stops playback and deletes queue'),

    // main function
    async execute(interaction) {
        const exampleEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle("Error")
            .setColor('#0099ff')
            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
        if (!interaction.member.voice.channelId) {
            exampleEmbed.setDescription("You need to be in a voice channel!")
            interaction.reply({ embeds: [exampleEmbed] })
            return
        }

        const results = await mongo.findQueueByGuildId(interaction.guildId);
        if (!results) {
            exampleEmbed.setDescription("Queue doesnt exist");
            interaction.reply({ embeds: [exampleEmbed], ephemeral: true })

            //if there is a queue greater than 1
        } else {
            exampleEmbed.setColor('#0099ff');
            exampleEmbed.setDescription(`Ended Queue`);
            interaction.reply({ embeds: [exampleEmbed] })

            const connection = await getVoiceConnection(interaction.guildId);
            console.log(`Deleting queue for ${interaction.guild.name}`)
            await mongo.deleteQueueByObject(results)
            connection.destroy();
            // await mongo.updateQueueByGuildId(interaction.guildId, { songs: [] })

            // play.playMusic(interaction)
        }

    },

};
