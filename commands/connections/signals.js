const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const connections = require('../../code/connections.js');
const errorcodes = require('../../universal_data/errorcodes.json');

module.exports = {
    name: ["signals"],
    description: "(hosts only) Prints a list of signals with their indexes.",
    usage: "<game name>(server optional)",
    erased: true,
    securitylevel: "host",
    gameidreliance: "optional",
    execute(message, args, gameid){
        //cleanse faulty connections
        connections.cleanseConnections(gameid);

        //retrieve signal list
        var signallist = connections.getsignals(gameid);
        var gamename = admin.getName(gameid);

        //initialize string
        var reply = `\`\`\`SIGNALS: ${gamename}\n\n`;

        //for each connection
        for(var i = 0; i < signallist.length; i++)
        {
            //retrieve channels
            try{
                var index = signallist[i][0];
                var signal = signallist[i][1];
                reply += `${index}: ${signal}\n\n`;
            }
            catch(error)
            {
                console.error(error);
            }
        }
        reply += `\`\`\``;

        //send response
        admin.sendmessage(reply, message.channel);

        //return success
        return true;
    }
}