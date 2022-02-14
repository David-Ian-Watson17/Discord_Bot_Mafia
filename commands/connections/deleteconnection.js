const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const connections = require('../../code/connections.js');
const error = require('../../code/errormessages.js');

module.exports = {
    name: ["deleteconnection"],
    description: "(hosts only) Removes a connection for a game by a specified index.",
    usage: "<game name> <index>",
    erased: true,
    securitylevel: "host",
    gameidreliance: "optional",
    execute(message, args, gameid)
    {
        //get gameid and index
        var index = getindex(message, args);

        //verify index is valid
        if(index == -1) return errorcodes.ERROR_INVALID_INPUT;

        //remove connection
        connections.removeconnectionbyindex(gameid, index);

        //return success
        return true;
    }
}

var getindex = function(message, args)
{
    //index will hold return value
    var index = -1;
    
    //get index
    var testindex = args[args.length - 1];

    //verify a valid number was entered
    if(testindex != NaN && testindex > 0)
        index = testindex;

    //return index or -1 on failure. -1 adjustment is for 1 based index conversion to 0 based index
    return (index - 1);
}