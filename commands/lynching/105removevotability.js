const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const lynching = require('../../code/lynchcommands.js');
const errorcodes = require('../../universal_data/errorcodes.json');

module.exports = {
    name: ['removevotability'],
    description: "(hosts only) (server only) Removes the ability of the selected user(s) to be voted for in a lynch.",
    usage: "<player tag>...",
    erased: false,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //minimum number of args to be valid
        if(args.length < 2) return errorcodes.ERROR_NOT_ENOUGH_ARGS;

        //add each exception
        for(var i = 1; i < args.length; i++)
        {
            var current = args[i].split("><");
            for(var j = 0; j < current.length; j++)
            {
                var targetid = current[j].replace(/[<>&!@]/g, "");
                lynching.addVoteableException(gameid, targetid);
            }
        }

        return true;
    }
}