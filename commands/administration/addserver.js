const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();

module.exports = {
    name: ['addserver'],
    description: "(hosts only) (server owner only) Adds a server to a game. Must be owner of both to execute.",
    usage: "<game name>",
    erased: true,
    securitylevel: "host serverowner",
    gameidreliance: "named",
    execute(message, args, gameid){

        //get server id
        var guildid = message.channel.guild.id;

        //verify server is not already a member of another game
        if(admin.gameIdFromServerId(guildid) != -1) return errorcodes.ERROR_SERVER_ALREADY_IN_GAME;

        //add server
        admin.addServer(gameid, guildid);
        return true;
    }
}