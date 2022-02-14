const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const channellimits = require('../../code/channel_limits.js');
const error = require('../../code/errormessages.js');

module.exports = {
    name: ['removemessagelimit'],
    description: "(hosts only) (server only) Removes an established message limit for a channel.",
    usage: "<channel tag>(channel optional)",
    erased: true,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        var channelid = message.channel.id;
        if(args.length > 1)
        {
            channelid = args[1].toString().replace(/<>!#/g, "");
        }

        channellimits.removemessagelimit(gameid, channelid);
    }
}