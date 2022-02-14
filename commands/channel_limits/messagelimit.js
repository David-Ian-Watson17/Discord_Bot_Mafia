const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const channellimits = require('../../code/channel_limits.js');
const error = require('../../code/errormessages.js');

module.exports = {
    name: ['messagelimit'],
    description: "(hosts only) (server only) Prints the message limit for specified channel. The oldest message is deleted when the message limit is reached and a new message is sent.",
    usage: "<channel tag>(channel optional)",
    erased: false,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //get channel id
        var channelid = message.channel.id;
        if(args.length > 1)
        {
            channelid = args[1].toString().replace(/<>!#/g, "");
        }

        //get the limit for specified channel
        var limit = channellimits.getmessagelimit(gameid, channelid);
        
        if(limit == -1)
        {
            message.channel.send("There is no message limit for channel.");
        }
        
        else
        {
            message.channel.send(`Channel has a message limit of ${limit}.`);
        }
    }
}