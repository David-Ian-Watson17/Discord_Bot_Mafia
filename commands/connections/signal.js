const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const connections = require('../../code/connections.js');
const errorcodes = require('../../universal_data/errorcodes.json');

module.exports = {
    name: ["signal"],
    description: "Sends a signal on a signal connection",
    usage: "<member/role>",
    erased: false,
    securitylevel: "",
    gameidreliance: "server",
    execute(message, args, gameid){

        try{
            var signalto = connections.getconnectionsforchannel(message.channel.id);
            for(var i = 0; i < signalto.length; i++)
                connections.sendmessageonchannelssignal([signalto[i][0]], message, signalto[i][2]);
        }
        catch(error)
        {
            console.error(error);
            return false;
        }

        return true;
    }
}