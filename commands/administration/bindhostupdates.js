const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();

module.exports = {
    name: ['bindhostupdates'],
    description: "(hosts only) Adds this channel as one for hosts to receive host updates.",
    usage: "",
    erased: true,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //add a host update channel
        admin.addhostupdatechannel(gameid, message.channel.id);
        return true;
    }
}