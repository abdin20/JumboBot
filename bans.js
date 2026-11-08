const { EmbedBuilder } = require("discord.js");

// Flip to false to let everyone use Jumbo again without clearing the list.
const BANS_ENABLED = false;
// User IDs blocked from interacting with Jumbo while BANS_ENABLED is true.
const bannedUserIds = [
  "310442661343526915", // lagdad
];

const isBanned = (userId) => BANS_ENABLED && bannedUserIds.includes(userId);

const buildBannedEmbed = (user) =>
  new EmbedBuilder()
    .setColor("#FF0000")
    .setTitle("🚫 Banned")
    .setDescription(`Sorry ${user}, you are banned from Jumbo interactions.`)
    .setFooter({
      text: "🕊️ Long Live Jumbo 🕊️",
      iconURL: "https://i.imgur.com/qJMLlxG.jpeg",
    })
    .setTimestamp();

module.exports = { isBanned, buildBannedEmbed };
