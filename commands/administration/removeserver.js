const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();

module.exports = {
    name: ["removeserver"],
    description: "(server owner only) Remove the current server from the game it is a part of, if any.",
    usage: "",
    erased: true,
    securitylevel: "serverowner",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //remove the server from its game
        admin.removeServer(gameid, message.channel.guild.id);
        return true;
    }
}