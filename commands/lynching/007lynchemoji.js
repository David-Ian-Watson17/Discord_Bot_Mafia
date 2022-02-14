const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const lynching = require('../../code/lynchcommands.js');
const error = require('../../code/errormessages.js');

module.exports = {
    name: ['lynchemoji'],
    description: "(hosts only) (server only) Prints the emoji the bot reacts to successful lynch votes with.",
    usage: "",
    erased: true,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //get the lynch emoji
        var emoji = lynching.getEmoji(gameid);

        //send emoji as response
        try{
            var newemoji = message.guild.emojis.cache.get(emoji);
            if(newemoji != undefined)
            {
                message.channel.send(newemoji);
            }
            else
            {
                message.channel.send(emoji);
            }
        }
        catch(error)
        {
            message.channel.send(emoji);
        }

        //so much the send emoji i can't even
        message.channel.send(emoji);
        return true;
    }
}