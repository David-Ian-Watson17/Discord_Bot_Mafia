const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const errorcodes = require('../../universal_data/errorcodes.json');

module.exports = {
    name: ['removehost'],
    description: "(owner only) Removes a host from a game.",
    usage: "<game name>(server optional) <host tag>",
    erased: true,
    securitylevel: "owner",
    gameidreliance: "optional",
    execute(message, args, gameid){

        //retrieve game id and host id
        var hostid = gethostid(message, args);

        //verify correct information entered
        if(hostid == -1) return errorcodes.ERROR_NOT_VALID_TARGET;

        //remove the host
        admin.removeHost(gameid, hostid);
        return true;
    }
}

//retrieve host id from args
var gethostid = function(message, args)
{
    var hostid = -1;

    if(args.length < 2)
        return -1;

    hostid = args[args.length - 1].replace(/[<>&!@]/g, "");

    return hostid;
}