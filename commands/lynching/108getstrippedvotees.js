const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const lynching = require('../../code/lynchcommands.js');
const error = require('../../code/errormessages.js');

module.exports = {
    name: ['getstrippedvotees'],
    description: "Prints a list of players that can't be voted for.",
    usage: "",
    erased: true,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //retrieve exceptions
        var exceptions = lynching.getVoteableExceptions(gameid);

        //repare response
        var printstr = "```Players who can't be voted for:\n\n"
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