const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const lynching = require('../../code/lynchcommands.js');
const client = require('../../client.js').client();
const errorcodes = require('../../universal_data/errorcodes.json');

module.exports = {
    name: ["changevoteweight","addvoteweight"],
    description: "(Host Only) Gives a player's vote the weight of multiple votes",
    usage: "<user tag> <new weight(number)>",
    erased: false,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //validate proper number of args
        if(args < 3) return errorcodes.ERROR_NOT_ENOUGH_ARGS;

        //get target id and new weight from args
        var targetid = args[1].replace(/[<>&!@]/g, "");
        var newweight = args[2];

        //validate target and weight
        if(targetid == NaN) return errorcodes.ERROR_NOT_VALID_TARGET;
        if(newweight == NaN) return errorcodes.ERROR_INVALID_INPUT;

        //update weight
        lynching.setWeight(gameid, targetid, newweight);
        return true;
    }
}