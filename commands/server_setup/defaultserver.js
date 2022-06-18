const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const serversetup = require('../../code/serversetup.js');
const error = require('../../code/errormessages.js');

module.exports = {
    name: ["defaultserver"],
    description: "Converts the current server into a default format for mafia games",
    usage: "",
    erased: false,
    securitylevel: "serverowner",
    gameidreliance: "none",
    execute(message, args, gameid)
    {
        //get guild object
        const server = message.channel.guild;
        return serversetup.defaultserversetup(server);
    }
}