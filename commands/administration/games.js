const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();

module.exports= {
    name: ["games"],
    description: "Lists all currently managed games.",
    usage: "",
    erased: true,
    securitylevel: "",
    gameidreliance: "none",
    execute(message, args, gameid)
    {
        //get game names and their ids
        var names = admin.getGameNames();
        var ids = admin.getGameIds();

        //prepare response
        var printstring = "\`\`\`Games List:\n";
        for(var i = 0; i < names.length; i++)
        {
            printstring += `${names[i]} (${ids[i]})\n`;
        }
        printstring += "\`\`\`";
        
        //send response
        admin.sendmessage(printstring, message.channel);
        return true;
    }
}