const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();

module.exports = {
    name: ['addhost'],
    description: "(Owner only) Add an administrator to a game. Hosts have the same amount of permissions as the owner, except they can't delete the game or add or remove hosts.",
    usage: "<game name>(server optional) <new host's tag>",
    erased: true,
    securitylevel: "owner",
    gameidreliance: "optional",
    execute(message, args, gameid){

        //retrieve game id and host id using args
        var hostid = getnewhost(message, args);
        
        //verify successful values
        if(hostid == -1) return errorcodes.ERROR_NOT_VALID_TARGET;

        //add new host
        admin.addHost(gameid, hostid);
        return true;
    }
}

//get the host id
var getnewhost = function(message, args){

    //host id will be the return value
    var hostid = -1;
    
    //no possible arg
    if(args.length < 2)
        return -1;

    //get host id, if it's invalid, hopefully it returns NaN
    hostid = args[args.length - 1].replace(/[<>&#!@]/g, "");
    
    //return hostid (either valid or -1)
    return hostid;
}