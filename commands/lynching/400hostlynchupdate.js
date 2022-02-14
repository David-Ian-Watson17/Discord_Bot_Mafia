const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const lynching = require('../../code/lynchcommands.js');
const errorcodes = require('../../universal_data/errorcodes.json');

module.exports = {
    name: ['hostlynchupdate'],
    description: "(hosts only) (server only) Send an update to a host update channel if it exists, or the hosts' dms otherwise.",
    usage: "",
    erased: true,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //get voting information
        var fullvotes = lynching.getFullWeightedVotes(gameid);
        
        //no voting information exists
        if(fullvotes == -1) return errorcodes.ERROR_LYNCH_NOT_RUNNING;

        //update hosts with full voting information
        var voteinformation = `\`\`\`FULL VOTE INFORMATION:\n\n` + lynching.stringifyWeightedVotes(fullvotes) + `\`\`\``;
        admin.updateHosts(gameid, voteinformation);
        return true;
    }
}