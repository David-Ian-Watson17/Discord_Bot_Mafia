const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const lynching = require('../../code/lynchcommands.js');
const client = require('../../client.js').client();
const errorcodes = require('../../universal_data/errorcodes.json');

module.exports = {
    name: ["voteweights"],
    description: "(Host Only) View all abnormal vote weights for players",
    usage: "",
    erased: false,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //get data
        var weightdata = lynching.getVoteWeights(gameid);

        //prepare response
        var weightstring = "```Players who have a different weight to their votes:\n\n"
        for(var i = 0; i < weightdata.length; i++)
        {
            var user = client.users.cache.get(weightdata[i][0]);
            if(user != undefined)
            {
                weightstring += `${user.username}#${user.discriminator}: Vote counts for ${weightdata[i][1]} votes\n`;
            }
        }
        weightstring += "```";

        //send response
        admin.sendmessage(weightstring, message.channel);
        return true;
    }
}