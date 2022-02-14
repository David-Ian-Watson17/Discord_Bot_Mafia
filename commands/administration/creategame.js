const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const errorcodes = require('../../universal_data/errorcodes.json');

module.exports= {
    name: ['creategame'],
    description: "Creates a new mafia game. Establishes game directory and files.",
    usage: "<name>",
    erased: false,
    securitylevel: "",
    gameidreliance: "none",
    execute(message, args, gameid){

        //min number of arguments
        if(args.length != 2) return false;

        //get game name
        var gamename = args[1];

        //make sure game does not already exist
        if(admin.gameIdFromName(gamename) != -1) return errorcodes.ERROR_GAME_ALREADY_EXISTS;

        //create game
        admin.createGame(gamename, message.author.id);

        //send confirmation message
        message.reply(`Created game "${gamename}"!`);
        return true;
    }
}