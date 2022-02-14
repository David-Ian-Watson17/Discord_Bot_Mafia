const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const lynching = require('../../code/lynchcommands.js');
const error = require('../../code/errormessages.js');

module.exports = {
    name: ['getstrippedvoters'],
    description: "Prints a list of players without a vote.",
    usage: "",
    erased: true,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //retrieve exception data
        var exceptions = lynching.getVotingExceptions(gameid);

        //prepare response
        var printstr = "```Players who don't have a vote:\n\n"
        for(var i = 0; i < exceptions.length; i++)
        {
            var user = client.users.cache.get(exceptions[i]);
            if(user != undefined)
            {
                printstr += `${user.username}#${user.discriminator}\n`;
            }
            
        }
        printstr += "```";

        //send response
        admin.sendmessage(printstr, message.channel);
        
    }
}