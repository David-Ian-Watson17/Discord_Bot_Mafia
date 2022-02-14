const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const channellimits = require('../../code/channel_limits.js');
const error = require('../../code/errormessages.js');

module.exports = {
    name: ['allmessagelimits'],
    description: "(hosts only) Prints the message limit for specified channel. The oldest message is deleted when the message limit is reached and a new message is sent.",
    usage: "<game name>(server optional)",
    erased: false,
    securitylevel: "host",
    gameidreliance: "optional",
    execute(message, args, gameid)
    {
        //ensure no channels were deleted without removing their message limits
        channellimits.cleanselimits(gameid);

        //get all current channel message limits
        var limits = channellimits.getchannelmessagelimits(gameid);

        //forge reply
        var reply = `\`\`\`MESSAGE LIMITS: ${gamename}\n\n`;
        for(var i = 0; i < limits.length; i++)
        {
            try{
                var channel = client.channels.cache.get(limits[i][0]);
                var guild = channel.guild;
                var limit = limits[i][1];

                reply += `${guild.name}/${channel.name} : ${limit} messages\n`;
            }
            catch(err)
            {
                console.error(err);
            }
        }
        reply += `\`\`\``;

        //send reply
        admin.sendmessage(reply, message.channel);
    }
}