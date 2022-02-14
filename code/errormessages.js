const Discord = require('discord.js');
const prefix = require('../universal_data/prefix.json').prefix;
const errorcodes = require('../universal_data/errorcodes.json');
const admin = require('./administration.js');

var logcode = function(errorcode)
{
    switch(errorcode){
        case errorcodes.GOOD_EXECUTE:
            console.log("GOOD_EXECUTE");
            break;
        case errorcodes.ERROR_NO_SUCH_COMMAND:
            console.log("ERROR_NO_SUCH_COMMAND");
            break;
        case errorcodes.ERROR_PERMS_OWNER:
            console.log("ERROR_PERMS_OWNER");
            break;
        case errorcodes.ERROR_PERMS_HOST:
            console.log("ERROR_PERMS_HOST");
            break;
        case errorcodes.ERROR_PERMS_SERVEROWNER:
            console.log("ERROR_PERMS_SERVEROWNER");
            break;
        case errorcodes.ERROR_GAME_NOT_FOUND:
            console.log("ERROR_GAME_NOT_FOUND");
            break;
        case errorcodes.ERROR_GENERIC_COMMAND_EXECUTE_FAIL:
            console.log("ERROR_GENERIC_COMMAND_EXECUTE_FAIL");
            break;
        case errorcodes.ERROR_NO_UPDATE_CHANNEL:
            console.log("ERROR_NO_UPDATE_CHANNEL");
            break;
        case errorcodes.ERROR_NO_LYNCH_ROLE:
            console.log("ERROR_NO_LYNCH_ROLE");
            break;
        case errorcodes.ERROR_NO_VOTERS:
            console.log("ERROR_NO_VOTERS");
            break;
        case errorcodes.ERROR_NOT_VOTING_CHANNEL:
            console.log("ERROR_NOT_VOTING_CHANNEL");
            break;
        case errorcodes.ERROR_NOT_VOTER:
            console.log("ERROR_NOT_VOTER");
            break;
        case errorcodes.ERROR_NOT_VOTEABLE:
            console.log("ERROR_NOT_VOTEABLE");
            break;
        case errorcodes.ERROR_NOT_A_NUMBER:
            console.log("ERROR_NOT_A_NUMBER");
            break;
        case errorcodes.ERROR_NOT_VALID_TARGET:
            console.log("ERROR_NOT_VALID_TARGET");
            break;
        case errorcodes.ERROR_SERVER_ALREADY_IN_GAME:
            console.log("ERROR_SERVER_ALREADY_IN_GAME");
            break;
        case errorcodes.ERROR_GAME_ALREADY_EXISTS:
            console.log("ERROR_GAME_ALREADY_EXISTS");
            break;
        case errorcodes.ERROR_INVALID_INPUT:
            console.log("ERROR_INVALID_INPUT");
            break;
        case errorcodes.ERROR_CONNECTION_INCOMPLETE_CONNECTION:
            console.log("ERROR_CONNECTION_INCOMPLETE_CONNECTION");
            break;
        case errorcodes.ERROR_CONNECTION_NO_START_TO_FINISH:
            console.log("ERROR_CONNECTION_NO_START_TO_FINISH");
            break;
        case errorcodes.ERROR_CONNECTION_NO_SUCH_CONNECTION:
            console.log("ERROR_CONNECTION_NO_SUCH_CONNECTION");
            break;
        case errorcodes.ERROR_NOT_ENOUGH_ARGS:
            console.log("ERROR_NOT_ENOUGH_ARGS");
            break;
        case errorcodes.ERROR_LYNCH_IS_RUNNING:
            console.log("ERROR_LYNCH_IS_RUNNING");
        default:
            console.log(`UNUSUAL_CODE_RECEIVED: ${errorcode}`);
    }
}

var respondcode = function(errorcode, message)
{
    switch(errorcode){
        case errorcodes.GOOD_EXECUTE:
            break;
        case errorcodes.ERROR_NO_SUCH_COMMAND:
            message.reply(`unable to find command "${message.content.split(/ +/g)[0].slice(prefix.length)}"! Make sure you spelled everything correctly, or type ${prefix}commands for a list of commands!`);
            break;
        case errorcodes.ERROR_PERMS_OWNER:
            message.reply(`you must be the owner of the game to use that command!`);
            break;
        case errorcodes.ERROR_PERMS_HOST:
            message.reply(`you must be a host of the game to use that command!`);
            break;
        case errorcodes.ERROR_PERMS_SERVEROWNER:
            message.reply(`you must be the owner of this server to use that command!`);
            break;
        case errorcodes.ERROR_GAME_NOT_FOUND:
            message.reply(`we were unable to find a game to associate that command with!`)
            break;
        case errorcodes.ERROR_GENERIC_COMMAND_EXECUTE_FAIL:
            message.reply(`the command you tried to use failed during execution!`);
            break;
        case errorcodes.ERROR_LYNCH_NOT_RUNNING:
            message.reply(`there is no lynch running currently!`);
            break;
        case errorcodes.ERROR_NO_UPDATE_CHANNEL:
            message.reply(`there's no lynch update channel set up!`);
            break;
        case errorcodes.ERROR_NO_LYNCH_ROLE:
            message.reply(`there aren't any lynch roles!`);
            break;
        case errorcodes.ERROR_NO_VOTERS:
            message.reply(`there are no voters!`);
            break;
        case errorcodes.ERROR_NOT_VOTING_CHANNEL:
            message.reply(`you must use that command in a voting channel!`);
            break;
        case errorcodes.ERROR_NOT_VOTER:
            break;
        case errorcodes.ERROR_NOT_VOTEABLE:
            break;
        case errorcodes.ERROR_NOT_A_NUMBER:
            message.reply(`please enter a valid number.`);
            break;
        case errorcodes.ERROR_NOT_VALID_TARGET:
            message.reply(`please enter a valid target.`);
            break;
        case errorcodes.ERROR_SERVER_ALREADY_IN_GAME:
            var gamename = "a game";
            try{
                var gameid = admin.gameIdFromServerId(message.guild.id);
                gamename = admin.getName(gameid);
            }
            catch(error)
            {
                console.log("ERROR_RETRIEVING_GAME_DATA");
                gamename = "a game";
            }
            message.reply(`server is already a part of ${gamename}!`);
            break;
        case errorcodes.ERROR_GAME_ALREADY_EXISTS:
            message.reply(`that game already exists!`);
            break;
        case errorcodes.ERROR_INVALID_INPUT:
            message.reply(`you didn't provide valid arguments for that command!`);
            break;
        case errorcodes.ERROR_CONNECTION_INCOMPLETE_CONNECTION:
            message.reply(`you have an unfinished connection you must finish first!`);
            break;
        case errorcodes.ERROR_CONNECTION_NO_START_TO_FINISH:
            message.reply(`you must start a connection before you can do that!`);
            break;
        case errorcodes.ERROR_CONNECTION_NO_SUCH_CONNECTION:
            message.reply(`that connection does not exist!`);
            break;
        case errorcodes.ERROR_NOT_ENOUGH_ARGS:
            message.reply(`that command requires more arguments to be used!`);
            break;
        case errorcodes.ERROR_LYNCH_IS_RUNNING:
            message.reply(`cannot do that while a lynch is running! To cancel lynch, use ${prefix}cancellynch. To reset lynch, use ${prefix}resetlynch.`);
            break;
        default:
    }
}

var notOwner = function(channel)
{
    channel.send("You need to be the owner of the game to use that command!");
}

var notHost = function(channel)
{
    channel.send("You need to be a host of the game to use that command!");
}

var notServerOwner = function(channel)
{
    channel.send("You need to be the owner of this server to use that command!");
}

var noGameByName = function(channel, name)
{
    channel.send(`There is no game under the name "${name}"!\nFor a list of in use games, use the "${prefix}games" command.`);
}

var serverNotPartOfGame = function(channel)
{
    channel.send(`This server is not part of any game! To add it to a game, use the "${prefix}addserver" command.`);
}

module.exports = {
    logcode: logcode,
    respondcode: respondcode
}