const fs = require('fs');
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const client = require('../../client.js').client();

module.exports = {
    name: ["help", "commands"],
    description: "Gives a list of all available commands, their description, and their usage.",
    usage: "<category>(optional)",
    erased: true,
    securitylevel: "",
    gameidreliance: "none",
    execute(message, args, gameid){
        

        //start up reply
        admin.sendmessage("__COMMANDS__\n\n", message.channel);

        //load up command directoyr
        if(args.length < 2)
        {
            var commanddirectories = fs.readdirSync(`./commands/`);
            for(var directory of commanddirectories)
            {
                //add directory overhead to reply
                var reply = `  ${directory.toUpperCase()}:\n\n`

                //for each file...
                var files = fs.readdirSync(`./commands/${directory}/`).filter(file => file.endsWith('.js'));
                for(var file of files)
                {
                    const command = require(`../${directory}/${file}`);

                    //add command to reply
                    reply += `${require('../../universal_data/prefix.json').prefix}${command.name[0]} ${command.usage}: ${command.description}\n\n`;
                }

                //send reply
                admin.sendcodemessage(reply, message.channel);
            }

            return true;
        }
        try{
            var directory = args[1].toLowerCase();

            //add directory overhead to reply
            var reply = `  ${directory.toUpperCase()}:\n\n`

            //for each file...
            var files = fs.readdirSync(`./commands/${directory}/`).filter(file => file.endsWith('.js'));
            for(var file of files)
            {
                const command = require(`../${directory}/${file}`);

                //add command to reply
                reply += `${require('../../universal_data/prefix.json').prefix}${command.name[0]} ${command.usage}: ${command.description}\n\n`;
            }

            //send reply
            admin.sendcodemessage(reply, message.channel);

            return true;
        }
        catch(error)
        {
            message.channel.send(`No such category ${args[1].toLowerCase()}`);

            return true;
        }
    }
}