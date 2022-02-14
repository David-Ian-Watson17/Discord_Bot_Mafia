const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const lynching = require('../../code/lynchcommands.js');
const error = require('../../code/errormessages.js');

module.exports = {
    name: ['bindlynchupdates'],
    description: "(hosts only) (server only) Adds this channel as a channel for lynch updates to be posted in.",
    usage: "",
    erased: true,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        lynching.addUpdateChannel(gameid, message.channel.id);
        return true;
    }
}