const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const channellimits = require('../../code/channel_limits.js');
const error = require('../../code/errormessages.js');

module.exports = {
    name: ['setmessagelimit'],
    description: "(hosts only) (server only) Sets the maximum number of messages for the specified channel.",
    usage: "<channel tag>(channel optional) <limit>",
    erased: true,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {

        if(args.length < 2) return true;

        var channelid = message.channel.id;
        var limit = args[1];
        if(args.length > 2)
        {
            channelid = args[1].toString().replace(/<>!#/g, "")
            limit = args[2];
        }

        if(!message.guild.channels.cache.has(channelid))
        {
            message.channel.send("Invalid channel! Make sure it is in the same server as this channel.");
            return true;
        }

        return channellimits.setmessagelimit(gameid, channelid, limit);
    }
}