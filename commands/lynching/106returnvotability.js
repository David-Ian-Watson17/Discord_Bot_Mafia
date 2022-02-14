const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const lynching = require('../../code/lynchcommands.js');
const errorcodes = require('../../universal_data/errorcodes.json');

module.exports = {
    name: ['returnvotability'],
    description: "(hosts only) (server only) Returns the ability to vote for a specific user if they have been marked as unvoteable.",
    usage: "<userid>...",
    erased: false,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //not enough args to be possible
        if(args.length < 2) return errorcodes.ERROR_NOT_ENOUGH_ARGS;

        //return votability to every user in the list
        for(var i = 1; i < args.length; i++)
        {
            var current = args[i].split("><");
            for(var j = 0; j < current.length; j++)
            {
                var targetid = current[j].replace(/[<>&!@]/g, "");
                lynching.removeVoteableException(gameid, targetid);
            }
        }

        return true;
    }
}