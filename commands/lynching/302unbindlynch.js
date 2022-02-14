const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const lynching = require('../../code/lynchcommands.js');
const error = require('../../code/errormessages.js');

module.exports = {
    name: ['unbindlynch'],
    description: "(hosts only) (server only) Removes this channel as a channel where votes can be placed.",
    usage: "",
    erased: true,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        lynching.removeVotingChannel(gameid, message.channel.id);
        return true;
    }
}