const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();

module.exports = {
    name: ["hostupdatechannels"],
    description: "(hosts only) Prints a list of host update channels",
    usage: "",
    erased: true,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //get channels and game name
        var channels = admin.gethostupdatechannels(gameid);
        var gamename = admin.getName(gameid);
        
        //prepare reply
        var reply = `\`\`\`HOST UPDATE CHANNELS: ${gamename}\n\n`;
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