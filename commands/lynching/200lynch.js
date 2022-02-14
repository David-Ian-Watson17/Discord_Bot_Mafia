const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const lynching = require('../../code/lynchcommands.js');
const errorcodes = require('../../universal_data/errorcodes.json');

module.exports = {
    name: ['lynch', 'lunch', 'heccinmurder', 'shank', 'gank', 'hang', 'kill', 'stab', 'cutup', 'murder','sendtohell', 
            'expire', 'cancellifesubscription', 'execute', 'stringup', 'erase', 'hailmary', 'silence', 'remove',
            'delet', 'delete', 'knife', 'shouldertouch', 'uwu', 'owo', 'yeet', 'nuzzle', 'uwux3nuzzles', 'unalive',
            'whip', 'naenae', 'foreclose', 'seismictoss', 'dead', 'yourmommypp', 'sus', 'bonk', 'bean', 'rip',
            'thanossnap', 'dematerialize', 'destroy', 'teartoshreds', 'annihilate', 'warn', 'modkill', 'slice'],
    description: "(server only) Vote to lynch a player. Lynching must be active to go through.",
    usage: "<user tag>",
    erased: false,
    securitylevel: "voter",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //get target's id
        var targetid = args[1].replace(/[<>&!@]/g, "");

        //ensure there is a target
        if(targetid == NaN) return errorcodes.ERROR_NOT_VALID_TARGET;

        //ensure lynching is taking place in a voting channel
        if(!lynching.validVotingChannel(gameid, message.channel.id)) return errorcodes.ERROR_NOT_VOTING_CHANNEL;

        //perform the lynch and respond if successful
        var lynchresult = lynching.lynch(gameid, targetid, message.author.id);
        if(lynchresult == true)
        {
            //get the lynch emoji and attempt to react with it
            var emoji = lynching.getEmoji(gameid);
            try{
                message.react(emoji);
            }
            catch(error)
            {
                //failed, try getting the lynch emoji another way
                try{
                    emoji = message.guild.emojis.cache.get(emojistr);
                    message.react(emoji);
                }
                catch(err)
                {
                    //all else fails, default
                    message.react("😎");
                }
            }
        }

        return lynchresult;
    }
}