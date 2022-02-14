const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();

module.exports = {
    name: ['categories'],
    description: "Prints the command categories that exist.",
    usage: "",
    erased: true,
    securitylevel: "",
    gameidreliance: "none",
    execute(message, args, gameid)
    {
        //start up reply
        admin.sendmessage("__CATEGORIES__\n\n", message.channel);

        //construct reply
        var commandDirectories = fs.readdirSync(`./commands/`);
        var reply = "";
        for(var directory of commandDirectories)
        {
            reply += `${directory}\n`;
        }

        //send reply
        admin.sendcodemessage(reply, message.channel);
    }
}