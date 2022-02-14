const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const lynching = require('../../code/lynchcommands.js');
const error = require('../../code/errormessages.js');

module.exports = {
    name: ['lynchchannels'],
    description: "(hosts only) (server only) Posts a list of channels that can be voted in for lynching.",
    usage: "",
    erased: true,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //get channel information
        var channels = lynching.getChannels(gameid);
        var gamename = admin.getName(gameid);
        
        //prepare reply
        var reply = `\`\`\`LYNCH VOTE CHANNELS: ${gamename}\n\n`;
        for(var i = 0; i < channels.length; i++)
        {
            reply += `${channels[i].guild.name}: ${channels[i].name}\n`;
        }
        reply += `\`\`\``;

        //send reply
        message.channel.send(reply);
        return true;
    }
}