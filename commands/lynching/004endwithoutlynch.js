const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const lynching = require('../../code/lynchcommands.js');
const error = require('../../code/errormessages.js');

module.exports = {
    name: ['endwithoutlynch'],
    description: "(hosts only) (server only) Ends the current lynch vote as a 'no lynch' immediately.",
    usage: "",
    erased: false,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //end without a lynch
        lynching.endNoLynch(gameid);
        return true;
    }
}