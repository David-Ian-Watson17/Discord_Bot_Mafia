const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();

module.exports = {
    name: ['hosts'],
    description: "Prints the list of hosts for a game.",
    usage: "<game name>(server optional)",
    erased: true,
    securitylevel: "",
    gameidreliance: "optional",
    execute(message, args, gameid){
        
        //retrieve hosts and game name
        var hosts = admin.getHosts(gameid);
        var gamename = admin.getName(gameid);
        
        //add host data to string
        var hoststr = `\`\`\`\nHOSTS: ${gamename}\n\n`;
        for(var i = 0; i < hosts.length; i++)
        {
            var user = client.users.cache.get(hosts[i]);
            hoststr += `${user.username}#${user.discriminator}\n`;
        }
        hoststr += `\`\`\``;

        //print host data
        admin.sendmessage(hoststr, message.channel);
        return true;
    }
}