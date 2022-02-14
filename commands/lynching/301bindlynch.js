const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const lynching = require('../../code/lynchcommands.js');
const error = require('../../code/errormessages.js');

module.exports = {
    name: ['bindlynch'],
    description: "(hosts only) (server only) Allows voting in bound channel. Multiple bound channels are permitted.",
    usage: "",
    erased: true,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        lynching.addVotingChannel(gameid, message.channel.id);
        return true;
    }
}