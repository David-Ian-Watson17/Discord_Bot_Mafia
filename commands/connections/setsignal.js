const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const connections = require('../../code/connections.js');
const errorcodes = require('../../universal_data/errorcodes.json');

module.exports = {
    name: ["setsignal"],
    description: "(hosts only) Sets the signal message for a signal connection.",
    usage: "<index> <newsignal>(string of any length with any number of spaces. use ### to represent a dynamic ping)",
    erased: true,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid){
        if(args.length < 3)
            return errorcodes.ERROR_NOT_ENOUGH_ARGS;

        if(isNaN(args[1]))
            return errorcodes.ERROR_NOT_A_NUMBER;

        var newsignal = "";
        for(var i = 2; i < (args.length - 1); i++)
        {
            newsignal += `${args[i]} `;
        }
        newsignal += args[args.length - 1];

        connections.setsignal(gameid, args[1], newsignal);
    }
}