const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const lynching = require('../../code/lynchcommands.js');
const error = require('../../code/errormessages.js');

module.exports = {
    name: ['cancellynch'],
    description: "(hosts only) (server only) Cancels the lynch in progress.",
    usage: "",
    erased: false,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //cancel lynch
        lynching.cancelLynch(gameid);
        return true;
    }
}