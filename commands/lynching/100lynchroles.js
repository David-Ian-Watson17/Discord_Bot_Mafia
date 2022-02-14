const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const lynching = require('../../code/lynchcommands.js');
const error = require('../../code/errormessages.js');

module.exports = {
    name: ['lynchroles'],
    description: "(hosts only) (server only) Lists the roles of users that are able to be lynched or vote for a lynch.",
    usage: "",
    erased: false,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //retrieve roles and game name
        var roles = lynching.getRoles(gameid);
        var gamename = admin.getName(gameid);

        //prepare response
        var reply = `LYNCH ROLES: ${gamename}\n\n`;
        for(var i = 0; i < roles.length; i++)
        {
            reply += `${roles[i].guild.name}: ${roles[i].name}\n`;
        }

        //send response
        admin.sendcodemessage(reply, message.channel);
        return true;
    }
}