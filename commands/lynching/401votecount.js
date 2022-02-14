const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const lynching = require('../../code/lynchcommands.js');
const errorcodes = require('../../universal_data/errorcodes.json');

module.exports = {
    name: ['votecount'],
    description: "(server only) Prints the current vote count, adhering to visibility rules.",
    usage: "",
    erased: true,
    securitylevel: "",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //get the voting information
        var votingcount = lynching.getWeightedVotes(gameid);

        //no voting information, return fail
        if(votingcount == -1) return errorcodes.ERROR_LYNCH_NOT_RUNNING;

        //post voting information
        var votinginformation = `\`\`\`Votes:\n\n` + lynching.stringifyWeightedVotes(votingcount) + `\`\`\``;
        message.channel.send(votinginformation);
        return true;
    }
}