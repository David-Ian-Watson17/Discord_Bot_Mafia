const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();

module.exports= {
    name: ['deletegame'],
    description: "(owner only) Deletes all files related to a game previously created.",
    usage: "<game name>",
    erased: false,
    securitylevel: "owner",
    gameidreliance: "named",
    execute(message, args, gameid){

        //delete game
        admin.deleteGame(gameid)
        return true;
    }
}