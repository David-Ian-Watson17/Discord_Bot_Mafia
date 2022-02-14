var client;

module.exports = {
    initializeClient()
    {
        var Discord = require('discord.js');
        client = new Discord.Client({ intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_EMOJIS_AND_STICKERS", "GUILD_INTEGRATIONS", "GUILD_WEBHOOKS", "GUILD_INVITES", "GUILD_VOICE_STATES", "GUILD_PRESENCES", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "GUILD_MESSAGE_TYPING", "DIRECT_MESSAGES", "DIRECT_MESSAGE_REACTIONS"]});
    },
    client()
    {
        return client;
    }
}