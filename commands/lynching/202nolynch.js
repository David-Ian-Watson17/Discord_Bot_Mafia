const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();
const lynching = require('../../code/lynchcommands.js');
const errorcodes = require('../../universal_data/errorcodes.json');

module.exports = {
    name: ['nolynch'],
    description: "(server only) Vote for no one to be lynched.",
    usage: "",
    erased: false,
    securitylevel: "voter",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //make sure the vote is happening in a voting channel
        if(!lynching.validVotingChannel(gameid, message.channel.id)) return errorcodes.ERROR_NOT_VOTING_CHANNEL;

        //perform the nolynch and respond if successful
        var lynchresult = lynching.nolynch(gameid, message.author.id);
        if(lynchresult == true)
        {
            //get the lynch emoji for this game and try to react with it
            var emoji = lynching.getEmoji(gameid);
            try{
                message.react(emoji);
            }
            catch(error)
            {
                //react failed, try getting it another way
                try{
                    emoji = message.guild.emojis.cache.get(emojistr);
                    message.react(emoji);
                }
                catch(err)
                {
                    //default if all else fails
                    message.react("😎");
                }
            }
        }

        return lynchresult;
    }
}