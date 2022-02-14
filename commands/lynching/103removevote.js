const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const lynching = require('../../code/lynchcommands.js');
const errorcodes = require('../../universal_data/errorcodes.json');

module.exports = {
    name: ['removevote'],
    description: "(hosts only) (server only) Removes the ability to vote from a specific user.",
    usage: "<userid>...",
    erased: false,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //minimum args
        if(args.length < 2) return errorcodes.ERROR_NOT_ENOUGH_ARGS;

        //add each target to exceptions
        for(var i = 1; i < args.length; i++)
        {
            var current = args[i].split("><");
            for(var j = 0; j < current.length; j++)
            {
                var targetid = current[j].replace(/[<>&!@]/g, "");
                lynching.addVotingException(gameid, targetid);
            }
        }

        return true;
    }
}