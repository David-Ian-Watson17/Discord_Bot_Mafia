const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const connections = require('../../code/connections.js');
const errorcodes = require('../../universal_data/errorcodes.json');

module.exports = {
    name: ["createconnection"],
    description: "(hosts only) Create a one-way connection from one channel in a server to another channel in either the same server or another server. Both servers must belong to a game in which you are host.",
    usage: "'anonymous'(optional) <start/end> <channel tag>(server optional)",
    erased: true,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //verify arg length is correct
        if(args.length < 2) return false;

        //get channelid, whether this is the start or end of a connection, and whether it will be anonymous
        var checks = makechecks(message, args);
        var startend = checks[0];
        var channelid = message.channel.id;
        if(checks[1] > 0)
            channelid = args[checks[1]].replace(/[<>!#]/g, "");
        var anonymous = checks[2];

        //invalid inputs, either start or end wasn't entered, or multiple channels were entered
        if(startend == -1 || startend == -2 || checks[1] == -2) return errorcodes.ERROR_INVALID_INPUT;

        //determine whether starting or ending connection and do it
        switch(startend)
        {
            case 0:
                return createconnectionstart(gameid, channelid, message.author.id, anonymous);
            case 1:
                return createconnectionend(gameid, channelid, message.author.id);
            default:
                return false;
        }
    }
}

//create the start of a connection. this is also where anonymity of the connection is decided
var createconnectionstart = function(gameid, channelid, userid, anonymous)
{
    if(connections.getinitializedconnection(gameid, userid) != -1)
        return errorcodes.ERROR_CONNECTION_INCOMPLETE_CONNECTION;

    connections.startconnection(gameid, userid, channelid, anonymous);

    return true;
}

//end a started connection. anonymity doesn't matter because it was already decided at the start of the connection
var createconnectionend = function(gameid, channelid, userid)
{
    if(connections.getinitializedconnection(gameid, userid) == -1)
        return errorcodes.ERROR_CONNECTION_NO_START_TO_FINISH;

    connections.fulfillconnection(gameid, userid, channelid);

    return true;
}

//retrieve whether this is the start or the end of a connection, whether the args contain the channel id, and
//whether the connection will be anonymous
var makechecks = function(message, args)
{
    //holding variables
    var anonymous = 0;
    var channellocation = -1;
    var startend = -1;

    //for each arg other than the command...
    for(var i = 1; i < args.length; i++)
    {
        //store there being a "start" in the args, or invalid (-2) if it remembers there being an "end" as well
        if(args[i] == "start")
        {
            if(startend == -2 || startend == 1)
                startend = -2;
            else
                startend = 0;
        }
        //store there being an "end" in the args, or invalid (-2) if it remembers there being a "start" as well
        if(args[i] == "end")
        {
            if(startend == -2 || startend == 0)
                startend = -2;
            else
                startend = 1;
        }
        //store there being an "anonymous" in the args
        if(args[i] == "anonymous")
        {
            anonymous = 1;
        }
        //store the index location of this found channelid or invalid (-2) if it remembers finding another
        else if(/[0-9]+/.test(args[i].replace(/[<>!#]/g, "")))
        {
            if(channellocation != -1)
                channellocation = -2;
            else
                channellocation = i;
        }
    }

    //return result of checks, start or end, channel index, and whether this connection is anonymous
    return [startend, channellocation, anonymous];
}