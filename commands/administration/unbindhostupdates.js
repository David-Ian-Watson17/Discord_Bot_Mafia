const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();

module.exports = {
    name: ['unbindhostupdates'],
    description: "(hosts only) (server only) Removes this channel as an update channel for hosts.",
    usage: "",
    erased: true,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //remove host update channel
        admin.removehostupdatechannel(gameid, message.channel.id);
        return true;
    }
}