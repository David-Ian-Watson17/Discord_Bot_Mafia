const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const lynching = require('../../code/lynchcommands.js');
const client = require('../../client.js').client();
const errorcodes = require('../../universal_data/errorcodes.json');

module.exports = {
    name: ["viewlovehate", "viewlove", "viewhate", "viewloved", "viewhated"],
    description: "(Host Only) Prints a list of all players with a loved or hated status as well as the degree.",
    usage: "",
    erased: false,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //get data
        var lovehatedata = lynching.getLoveHate(gameid);

        //prepare response
        var lovehatestring = "```Players who have a loved/hated modifier and the degree:\n\n"
        for(var i = 0; i < lovehatedata.length; i++)
        {
            var user = client.users.cache.get(lovehatedata[i][0]);
            var degreestr = "";
            if(lovehatedata[i][1] < 0) degreestr = `Hated, ${lovehatedata[i][1]} votes to lynch`;
            else degreestr = `Loved, +${lovehatedata[i][1]} votes to lynch`;
            if(user != undefined)
            {
                lovehatestring += `${user.username}#${user.discriminator}: ${degreestr}\n`;
            }
        }
        lovehatestring += "```";

        //send response
        admin.sendmessage(lovehatestring, message.channel);
        return true;
    }
}