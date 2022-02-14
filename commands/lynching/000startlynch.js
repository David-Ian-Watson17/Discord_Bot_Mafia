const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const lynching = require('../../code/lynchcommands.js');
const errorcodes = require('../../universal_data/errorcodes.json');

module.exports = {
    name: ['startlynch'],
    description: "(host only) (server only) Starts a lynch. Requires at least one update channel and at least one lynch role.",
    usage:  "<number of votes>",
    erased: false,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //get votes
        var votes = -1;
        if(args.length > 1)
        {
            votes = args[1];
        }
        
        //verify votes
        if(votes == NaN || votes < -1) return errorcodes.ERROR_INVALID_INPUT;

        //cannot start lynch while one is running
        if(lynching.lynchisrunning(gameid))
        {
            message.channel.send(`*A lynch vote is already running! To reset voting, use ${require('../../universal_data/prefix.json').prefix}resetlynch. To cancel voting, use ${require('../../universal_data/prefix.json').prefix}cancellynch.*`);
            return true;
        }

        //start a lynch
        return lynching.startLynch(gameid, votes);
    }
}