const Discord = require('discord.js');

module.exports = {
    channeltypes: [
        Discord.Constants.ChannelTypes.GUILD_TEXT,
        Discord.Constants.ChannelTypes.GUILD_PRIVATE_THREAD,
        Discord.Constants.ChannelTypes.GUILD_PUBLIC_THREAD,
        Discord.Constants.ChannelTypes.GUILD_NEWS,
        Discord.Constants.ChannelTypes.GUILD_NEWS_THREAD
    ]
}