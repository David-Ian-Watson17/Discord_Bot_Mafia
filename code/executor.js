/*
This code is to be an execution wrapper for all commands
It performs automatic checks, such as security level, to verify a command
Can be executed, then executes it if it's valid
*/
const Discord = require('discord.js');
const client = require('../client.js').client();
const prefix = require('../universal_data/prefix.json').prefix;
const admin = require('./administration.js');
const errorcodes = require('../universal_data/errorcodes.json');

var execute = function(message)
{
    //get args from message
    const args = message.content.split(/ +/);

    //get name of command
    const commandName = args[0].toLowerCase().slice(prefix.length);

    //valid command
    if (client.commands.has(commandName))
    {
        const command = client.commands.get(commandName);

        var securitylevels = command.securitylevel.split(/ +/g);
        var gameidreliance = command.gameidreliance;
        
        //get gameid
        var gameid = getGameId(message, args, gameidreliance);

        //unable to execute command
        if(gameid == -1)
            return errorcodes.ERROR_GAME_NOT_FOUND;

        //verify user has permissions to use command
        for(var index = 0; index < securitylevels.length; index++)
        {
            switch(securitylevels[index])
            {
                case "owner":
                    if(!admin.isOwner(gameid, message.author.id))
                    {
                        return errorcodes.ERROR_PERMS_OWNER;
                    }
                    break;
                case "host":
                    if(!admin.isHost(gameid, message.author.id))
                    {
                        return errorcodes.ERROR_PERMS_HOST;
                    }
                    break;
                case "serverowner":
                    if(message.channel.guild.ownerId != message.author.id)
                    {
                        return errorcodes.ERROR_PERMS_SERVEROWNER;
                    }
                    break;
                default:
                    break;
            }
        }

        try {
            var returnedvalue = command.execute(message, args, gameid);
            if(returnedvalue == false)
            {
                return errorcodes.ERROR_GENERIC_COMMAND_EXECUTE_FAIL;
            }
            else if(returnedvalue != true)
            {
                return returnedvalue;
            }
        } catch (error) {
            console.log(error);
            message.reply('an unexpected error occurred while trying to execute that command!');
        }
        return errorcodes.GOOD_EXECUTE;
    }
    return errorcodes.ERROR_NO_SUCH_COMMAND;
}

//takes in the args and server reliance and returns a game id
//returns 0 if game id is unneeded or -1 if game id is invalid
var getGameId = function(message, args, gameidreliance)
{
    var gameid = -1;

    //only finds game id in server
    if(gameidreliance == "server")
    {
        gameid = getGameIdServer(message, args);
    }

    //either mandates finding game id in command or command was sent in DM channel
    else if(gameidreliance == "named" || (gameidreliance == "optional" && message.channel.type == 'DM'))
    {
        gameid = getGameIdNameInMessage(message, args);
    }

    //could find game id in command or server, check command first
    else if(gameidreliance == "optional")
    {
        gameid = getGameIdEither(message, args);
    }

    //game id unneeded, gameidreliance == "unneeded"
    else
    {
        gameid = 0;
    }

    return gameid;
}

//used if command requires it be sent in server
var getGameIdServer = function(message, args)
{
    //verify valid server channel
    if(message.channel.type != "GUILD_TEXT" && 
        message.channel.type != "GUILD_PUBLIC_THREAD" && 
        message.channel.type != "GUILD_PRIVATE_THREAD" && 
        message.channel.type != "GUILD_NEWS")
    {
        return -1;
    }

    return admin.gameIdFromServerId(message.guild.id);
}

//used if command sent in DM channel
var getGameIdNameInMessage = function(message, args)
{
    if(args.length < 2)
        return -1;

    return admin.gameIdFromName(args[1]);
}

//used if command does not require it be sent in server
var getGameIdEither = function(message, args)
{
    var gameid = -1;
    //POSSIBLE PROBLEM HERE IF GAME NAME LINES UP WITH PROPER ARG NAME
    //MAY NEED TO BAN SOME GAME NAMES OR DO A BETTER CHECK
    if(args.length > 1)
    {
        gameid = admin.gameIdFromName(args[1]);
    }
    if(gameid == -1)
    {
        gameid = admin.gameIdFromServerId(message.guild.id);
    }
    return gameid;
}

module.exports = {
    execute: execute
}