const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const lynching = require('../../code/lynchcommands.js');
const errorcodes = require('../../universal_data/errorcodes.json');

module.exports = {
    name: ['removelynchrole'],
    description: "(hosts only) (server only) Removes a role or roles from the list of lynchable roles.",
    usage: "<roletag>...",
    erased: false,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //min number of args
        if(args.length < 2) return errorcodes.ERROR_NOT_ENOUGH_ARGS;

        //remove each role from list
        for(var i = 1; i < args.length; i++)
        {
            var current = args[i].split("><");
            for(var j = 0; j < current.length; j++)
            {
                var targetid = current[j].replace(/[<>&!@#]/g, "");
                lynching.removeLynchRole(gameid, message.channel.guild.id, targetid);
            }
        }

        return true;
    }
}