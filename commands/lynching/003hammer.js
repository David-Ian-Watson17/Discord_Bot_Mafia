const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const lynching = require('../../code/lynchcommands.js');
const errorcodes = require('../../universal_data/errorcodes.json');

module.exports = {
    name: ['hammer'],
    description: "(hosts only) (server only) Ends lynch immediately, lynching a specific target.",
    usage: "<target tag>",
    erased: false,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //min number of args
        if(args.length < 2) return false;

        //get and verify target
        var targetid = -1;
        var testid = args[1].replace(/[<>&!@]/g, "");
        if(testid != NaN)
            targetid = testid;
        if(!lynching.validVoteable(gameid, targetid))
            return errorcodes.ERROR_NOT_VOTEABLE;

        //hammer target
        lynching.hammer(gameid, targetid);
        return true;
    }
}