const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const errorcodes = require('../../universal_data/errorcodes.json');

module.exports = {
    name: ['transferowner'],
    description: "(owner only) Transfers ownership of a game over to another person.",
    usage: "<game name>(server optional) <user tag>",
    erased: true,
    securitylevel: "owner",
    gameidreliance: "optional",
    execute(message, args, gameid){
        
        //retrieve user id
        var userid = getuserid(message, args);

        //verify there's valid arguments
        if(userid == -1) return errorcodes.ERROR_NOT_VALID_TARGET;

        //transfer ownership of the game
        admin.transferOwner(gameid, userid);
        return true;
    }
}

var getuserid = function(message, args)
{
    //userid will hold return value
    var userid = -1;

    //get host id
    userid = args[args.length - 1].replace(/[<>&!@]/g, "");

    //returns new id or -1 if fails
    return userid;
}