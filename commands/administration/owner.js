const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();

module.exports= {
    name: ["owner"],
    description: "Prints the owner of a game.",
    usage: "<game name(optional if in server)>",
    erased: true,
    securitylevel: "",
    gameidreliance: "optional",
    execute(message, args, gameid){

        //retrieve the id of the owner
        var ownerid = admin.getOwner(gameid);
        var gamename = admin.getName(gameid);

        //retrieve the owner
        var owner = client.users.cache.get(ownerid);

        //push owner information into reply string
        var ownerstr = `\`\`\`\nOWNER: ${gamename}\n\n${owner.username}#${owner.discriminator}\`\`\``;

        //send reply
        admin.sendmessage(ownerstr, message.channel);

        //return success
        return true;
    }
}