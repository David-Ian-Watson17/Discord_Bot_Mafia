const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const lynching = require('../../code/lynchcommands.js');
const errorcodes = require('../../universal_data/errorcodes.json');

module.exports = {
    name: ['unlynch'],
    description: "(server only) Cancel a previous lynch vote.",
    usage: "",
    erased: false,
    securitylevel: "voter",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //make sure the vote is in a voting channel
        if(!lynching.validVotingChannel(gameid, message.channel.id)) return errorcodes.ERROR_NOT_VOTING_CHANNEL;

        //perform the unlynch and try to react
        var lynchresult = lynching.unlynch(gameid, message.author.id);
        if(lynchresult == true)
        {
            //get the lynch emoji for this game and attempt to react
            var emoji = lynching.getEmoji(gameid);
            try{
                message.react(emoji);
            }
            catch(error)
            {
                //failed to get normal way, try another way
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