const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const lynching = require('../../code/lynchcommands.js');
const error = require('../../code/errormessages.js');

module.exports = {
    name: ['resetlynch'],
    description: "(host only) (server only) Resets the votes of the currently running lynch.",
    usage: "",
    erased: false,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //reset lynch
        lynching.resetLynch(gameid);
        return true;
    }
}