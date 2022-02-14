const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();

module.exports = {
    name: ['servers'],
    description: "(hosts only) Prints a list of all the servers that are a part of a game.",
    usage: "<gamename>(server optional)",
    erased: true,
    securitylevel: "host",
    gameidreliance: "optional",
    execute(message, args, gameid)
    {
        //retrieve game name
        var gamename = admin.getName(gameid);

        //prepare reply
        var reply = `\`\`\`SERVERS: ${gamename}\n\n`;
        var serverids = admin.getServers(gameid);
        for(var i = 0; i < serverids.length; i++)
        {
            try{
                var server = client.guilds.cache.get(serverids[i]);
                reply += `${server.name} / ${server.owner.user.username}#${server.owner.user.discriminator}\n`;
            }
            catch(error)
            {
                console.log(error);
            }
        }
        reply += `\`\`\``;

        //send reply
        admin.sendmessage(reply, message.channel);
        return true;
    }
}