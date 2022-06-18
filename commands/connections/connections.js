const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const connections = require('../../code/connections.js');
const error = require('../../code/errormessages.js');

module.exports = {
    name: ["connections"],
    description: "(hosts only) Prints a list of connections with their indexes.",
    usage: "<gamename>(server optional)",
    erased: true,
    securitylevel: "host",
    gameidreliance: "optional",
    execute(message, args, gameid)
    {
        //clear out faulty connections
        //connections.cleanseConnections(gameid);

        //retrieve connection list
        var connectionList = [];
        var retrievecode = connections.getAllCompleteConnections(gameid, connectionList);
        var gamename = admin.getName(gameid)

        console.log(connectionList);

        //initialize string
        var reply = `CONNECTIONS: ${gamename}\n\n`;

        //add complete connections
        if(retrievecode){
            connectionList.forEach(connection => {
                reply += `<#${connection.startChannel}> -> <#${connection.endChannel}> (${connection.type})\n`;
            })
        }
        else{
            reply += "There was an error retrieving the complete connections!\n";
        }

        //send response
        admin.sendmessage(reply, message.channel);

        //return success
        return true;
    }
}