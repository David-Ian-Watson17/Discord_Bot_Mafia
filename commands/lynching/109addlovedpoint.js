const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const lynching = require('../../code/lynchcommands.js');
const client = require('../../client.js').client();
const errorcodes = require('../../universal_data/errorcodes.json');

module.exports = {
    name: ["addlovedpoint"],
    description: "Require one more vote to lynch target.",
    usage: "<user tag>",
    erased: false,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //validate proper number of args
        if(args < 2) return errorcodes.ERROR_NOT_ENOUGH_ARGS;

        //get target id from args
        var targetid = args[1].replace(/[<>&!@]/g, "");

        //validate target
        if(targetid == NaN) return errorcodes.ERROR_NOT_VALID_TARGET;

        //add loved point
        lynching.addLovedPoint(gameid, targetid);
        return true;
    }
}