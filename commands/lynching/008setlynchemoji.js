const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const lynching = require('../../code/lynchcommands.js');
const error = require('../../code/errormessages.js');

module.exports = {
    name: ['setlynchemoji'],
    description: "(hosts only) (server only) Set the emoji that the bot reacts with on a successful lynch vote.",
    usage: "<emoji>",
    erased: false,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //min number of args
        if(args.length < 2) return false;

        var emojiid = args[1];

        var emojiargs = args[1].split(":");

        if(emojiargs.length == 3)
            emojiid = emojiargs[2].replace(">", "");

        try{
            message.guild.emojis.cache.get(args[1]);
        }
        catch(error)
        {
            console.log(error);
            return false;
        }
        
        //set the lynch emoji
        lynching.setEmoji(gameid, emojiid);
        return true;
    }
}