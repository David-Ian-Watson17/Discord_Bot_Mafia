var admin = require('./administration.js');
var client = require("../client.js").client();
var fs = require('fs');

/*
CHANNEL STATES

This file is used for maintaining channel states. It deals in permission overwrites mainly, and the files it interacts with are in
the channelstates directory.

Format of a channel state file:

<channelid>.txt:

<role/user id>  <allowbitmap>  <denybitmap>
*/

/*
GETTERS
*/

var openpermsexist = function(gameid, channelid)
{
    fs.access(`./games/${gameid}/channelstates/open/${channelid}.txt`, fs.constants.F_OK, (err) => {
        if(err) {
            return false;
        }
        return true;
    });
}

var closedpermsexist = function(gameid, channelid)
{
    fs.access(`./games/${gameid}/channelstates/closed/${channelid}.txt`, fs.constants.F_OK, (err) => {
        if(err) {
            return false;
        }
        return true;
    });
}

var getopenpermissions = function(gameid, channelid)
{
    var perms = [];

    var data = null;
    var rawdata = null;
    try{
        rawdata = fs.readFileSync(`./games/${gameid}/channelstates/open/${channelid}.txt`).toString();
        data = rawdata.split("\n");
        for(var i = 0; i < (data.length - 1); i++)
        {
            var current = data[i].split("  ");
            perms.push([current[0], current[1], current[2]]);
        }
    }
    catch(error){
        return null;
    }

    return perms;
}

var getclosedpermissions = function(gameid, channelid)
{
    var perms = [];

    var data = null;
    var rawdata = null;
    try{
        rawdata = fs.readFileSync(`./games/${gameid}/channelstates/closed/${channelid}.txt`).toString();
        data = rawdata.split("\n");
        for(var i = 0; i < (data.length - 1); i++)
        {
            var current = data[i].split("  ");
            perms.push([current[0], current[1], current[2]]);
        }
    }
    catch(error){
        return null;
    }

    return perms;
}

/*
SETTERS
*/

//perms format: [[role/userid, allow, deny], ...]
var setopenpermissions = function(gameid, channelid, perms)
{
    fs.writeFileSync(`./games/${gameid}/channelstates/open/${channelid}.txt`, convertpermsstring(perms));
}

//perms format: [[role/userid, allow, deny], ...]
var setclosedpermissions = function(gameid, channelid, perms)
{
    fs.writeFileSync(`./games/${gameid}/channelstates/closed/${channelid}.txt`, convertpermsstring(perms));
}

var convertpermsstring = function(perms)
{
    var permstring = "";

    for(var i = 0; i < perms.length; i++)
    {
        permstring += `${perms[i][0]}  ${perms[i][1]}  ${perms[i][2]}\n`;
    }

    return permstring;
}

/*
CONVERTERS
*/

var bitconverter = function(bit)
{
    switch(bit)
    {
        case 0x1:
            return 'CREATE_INSTANT_INVITE'
        case 0x2:
            return 'KICK_MEMBERS'
        case 0x4:
            return 'BAN_MEMBERS'
        case 0x8:
            return 'ADMINISTRATOR'
        case 0x10:
            return 'MANAGE_CHANNELS'
        case 0x20:
            return 'MANAGE_GUILD'
        case 0x40:
            return 'ADD_REACTIONS'
        case 0x80:
            return 'VIEW_AUDIT_LOG'
        case 0x100:
            return 'PRIORITY_SPEAKER'
        case 0x200:
            return 'STREAM'
        case 0x400:
            return 'VIEW_CHANNEL'
        case 0x800:
            return 'SEND_MESSAGES'
        case 0x1000:
            return 'SEND_TTS_MESSAGES'
        case 0x2000:
            return 'MANAGE_MESSAGES'
        case 0x4000:
            return 'EMBED_LINKS'
        case 0x8000:
            return 'ATTACH_FILES'
        case 0x10000:
            return 'READ_MESSAGE_HISTORY'
        case 0x20000:
            return 'MENTION_EVERYONE'
        case 0x40000:
            return 'USE_EXTERNAL_EMOJIS'
        case 0x80000:
            return 'VIEW_GUILD_INSIGHTS'
        case 0x100000:
            return 'CONNECT'
        case 0x200000:
            return 'SPEAK'
        case 0x400000:
            return 'MUTE_MEMBERS'
        case 0x800000:
            return 'DEAFEN_MEMBERS'
        case 0x1000000:
            return 'MOVE_MEMBERS'
        case 0x2000000:
            return 'USE_VAD'
        case 0x4000000:
            return 'CHANGE_NICKNAME'
        case 0x8000000:
            return 'MANAGE_NICKNAMES'
        case 0x10000000:
            return 'MANAGE_ROLES'
        case 0x20000000:
            return 'MANAGE_WEBHOOKS'
        case 0x40000000:
            return 'MANAGE_EMOJIS'
        default:
            return undefined;
    }
}

var convertbitmap = function(num)
{
    var permissionarray = [];

    var bit = 1;
    while(bit < 0x50000000)
    {
        if((num & bit) != 0)
        {
            permissionarray.push(bitconverter(bit));
        }
        bit = bit * 2;
    }

    return permissionarray;
}

module.exports = {
    openpermsexist: openpermsexist,
    closedpermsexist: closedpermsexist,
    getopenpermissions: getopenpermissions,
    getclosedpermissions: getclosedpermissions,
    setopenpermissions: setopenpermissions,
    setclosedpermissions: setclosedpermissions,
    convertbitmap: convertbitmap
}