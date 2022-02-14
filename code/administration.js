const client = require('../client.js').client();
const Discord = require('discord.js');
const fs = require('fs');
const dir = './games';
const errorcodes = require('../universal_data/errorcodes.json');

//NO NUMBERS ALLOWED
//NUMBERS GTFO

/*
GAME FUNCTIONS
*/

var createGame = function(chosengamename, ownerid)
{
    var gamename = chosengamename.replace(/ +/, " ");

    //create id
    var id = createGameId();
    while(gameExists(id))
        id = createGameId();

    //create game directory
    fs.mkdirSync(`${dir}/${id}`);

    //add name to game's name file and game map file
    fs.appendFileSync(`./data/gamemap.txt`, `${id}  ${gamename}\n`);

    //write game files: name.txt, owner.txt, hosts.txt, servers.txt
    fs.writeFileSync(`${dir}/${id}/name.txt`, gamename);
    fs.writeFileSync(`${dir}/${id}/owner.txt`, `${ownerid}`);
    fs.writeFileSync(`${dir}/${id}/hosts.txt`, `${ownerid}\n`);
    fs.writeFileSync(`${dir}/${id}/servers.txt`, "");
    fs.writeFileSync(`${dir}/${id}/connections.txt`, "");
    fs.writeFileSync(`${dir}/${id}/hostupdatechannels.txt`, "");

    //write channel message limit 
    fs.mkdirSync(`${dir}/${id}/channelmessagelimits`);

    //write channel states directories
    fs.mkdirSync(`${dir}/${id}/channelstates`);
    fs.mkdirSync(`${dir}/${id}/channelstates/open`);
    fs.mkdirSync(`${dir}/${id}/channelstates/closed`);
    
    //write lynching files
    fs.mkdirSync(`${dir}/${id}/lynching`);
    fs.writeFileSync(`${dir}/${id}/lynching/channels.txt`, '');
    fs.writeFileSync(`${dir}/${id}/lynching/roles.txt`, '');
    fs.writeFileSync(`${dir}/${id}/lynching/votingexceptions.txt`, '');
    fs.writeFileSync(`${dir}/${id}/lynching/voteableexceptions.txt`, '');
    fs.writeFileSync(`${dir}/${id}/lynching/updatechannels.txt`, '');
    fs.writeFileSync(`${dir}/${id}/lynching/votecap.txt`,'');
    fs.writeFileSync(`${dir}/${id}/lynching/voteweights.txt`, '');
    fs.writeFileSync(`${dir}/${id}/lynching/lovehateweights.txt`, '');
    fs.writeFileSync(`${dir}/${id}/lynching/emoji.txt`, "😎");

}

var deleteGame = function(gameid)
{
    try
    {
        var gamename = getName(gameid);
        fs.writeFileSync(`./data/gamemap.txt`, fs.readFileSync(`./data/gamemap.txt`).toString().replace(`${gameid}  ${gamename}\n`, ""));
        var servermapcontents = fs.readFileSync(`./data/servermap.txt`).toString().split("\n");
        var newstring = ""
        for(i = 0; i < servermapcontents.length - 1; i++)
        {
            if(servermapcontents[i].split("  ")[1] == `${gameid}`)
                servermapcontents[i] = ""
            else
                servermapcontents[i] += "\n";
            newstring += servermapcontents[i];
        }
        fs.writeFileSync(`./data/servermap.txt`, newstring);
        fs.rmSync(`${dir}/${gameid}`, { recursive: true });
    }
    catch(err)
    {
        console.error(err);
        return false;
    }
    return true;
}

var gameExists = function(gameid)
{
    return fs.existsSync(`${dir}/${gameid}`);
}

var gameIdFromName = function(gamename)
{
    var rawgamemapdata = fs.readFileSync(`./data/gamemap.txt`).toString().split("\n");
    for(var i = 0; i < (rawgamemapdata.length - 1); i++)
    {
        var current = rawgamemapdata[i].split("  ");
        if(current[1] == gamename)
            return current[0];
    }
    return -1;
}

var gameIdFromServerId = function(guildid)
{
    var rawservermapdata = fs.readFileSync(`./data/servermap.txt`).toString().split("\n");
    for(var i = 0; i < (rawservermapdata.length - 1); i++)
    {
        var current = rawservermapdata[i].split("  ");
        if(current[0] == guildid)
            return current[1];
    }
    return -1;
}

var createGameId = function()
{
    return Math.floor(Math.random() * 99999999);
}

var getGameIds = function()
{
    var games = [];
    var gameids = fs.readFileSync(`./data/gamemap.txt`).toString().split("\n");
    for(var i = 0; i < (gameids.length - 1); i++)
    {
        var current = gameids[i].split("  ");
        games.push(current[0]);
    }
    return games;
}

/*
NAME FUNCTIONS
*/

var getName = function(gameid)
{
    return fs.readFileSync(`${dir}/${gameid}/name.txt`).toString();
}

var setName = function(gameid, gamename)
{
    fs.writeFileSync(`${dir}/${gameid}/name.txt`, gamename);
}

var getGameNames = function()
{
    var ids = getGameIds();
    return getGameNamesFromIdList(ids);
}

var getGameNamesFromIdList = function(gameidlist)
{
    var games = [];
    for(var i = 0; i < gameidlist.length; i++)
    {
        games.push(getName(gameidlist[i]));
    }
    return games;
}

/*
OWNER FUNCTIONS
*/

var getOwner = function(gameid)
{
    var rawownerdata = fs.readFileSync(`${dir}/${gameid}/owner.txt`).toString();
    return rawownerdata;
}

var transferOwner = function(gameid, userid)
{
    fs.writeFileSync(`${dir}/${gameid}/owner.txt`, `${userid}`);
    if(!isHost(gameid, userid))
        addHost(gameid, userid);
}

var isOwner = function(gameid, userid)
{
    if(getOwner(gameid) == userid)
        return true;
    return false;
}

/*
HOST FUNCTIONS
*/

var getHosts = function(gameid)
{
    var hosts = [];
    var rawhostdata = fs.readFileSync(`${dir}/${gameid}/hosts.txt`).toString().split("\n");
    for(var i = 0; i < (rawhostdata.length - 1); i++)
    {
        hosts.push(rawhostdata[i]);
    }
    return hosts;
}

var isHost = function(gameid, userid)
{
    var hosts = getHosts(gameid);
    for(var i = 0; i < hosts.length; i++)
    {
        if(hosts[i] == userid)
            return true;
    }
    return false;
}

var addHost = function(gameid, userid)
{
    if(isHost(gameid, userid))
        return;

    fs.appendFileSync(`${dir}/${gameid}/hosts.txt`, `${userid}\n`);
}

var removeHost = function(gameid, userid)
{
    if(!isHost(gameid, userid))
        return;

    var rawhostdata = fs.readFileSync(`${dir}/${gameid}/hosts.txt`).toString();
    fs.writeFileSync(`${dir}/${gameid}/hosts.txt`, rawhostdata.replace(`${userid}\n`, ""));
}

var removeHostByIndex = function(gameid, index)
{
    var rawhostdata = fs.readFileSync(`${dir}/${gameid}/hosts.txt`).toString();
    var hostdata = rawhostdata.split("\n");
    if((hostdata.length - 2) < index)
        return false;
    fs.writeFileSync(`${dir}/${gameid}/hosts.txt`, rawhostdata.replace(`${hostdata[index]}\n`, ""));
    return true;
}

/*
SERVER FUNCTIONS
*/

var getServers = function(gameid)
{
    var servers = [];
    var rawserverdata = fs.readFileSync(`${dir}/${gameid}/servers.txt`).toString().split("\n");
    for(var i = 0; i < (rawserverdata.length - 1); i++)
    {
        servers.push(rawserverdata[i]);
    }
    return servers;
}

var addServer = function(gameid, serverid)
{
    if(gameIdFromServerId(serverid) != -1)
        return;

    fs.appendFileSync(`${dir}/${gameid}/servers.txt`, `${serverid}\n`);
    fs.appendFileSync(`./data/servermap.txt`, `${serverid}  ${gameid}\n`);
}

var removeServer = function(gameid, serverid)
{
    fs.writeFileSync(`${dir}/${gameid}/servers.txt`, fs.readFileSync(`${dir}/${gameid}/servers.txt`).toString().replace(`${serverid}\n`, ""));
    fs.writeFileSync(`./data/servermap.txt`, fs.readFileSync(`./data/servermap.txt`).toString().replace(`${serverid}  ${gameid}\n`, ""));
}

//host update channel commands

var addhostupdatechannel = function(gameid, channelid)
{
    //make sure channel isn't already in the file
    var rawchanneldata = fs.readFileSync(`${dir}/${gameid}/hostupdatechannels.txt`);
    var channeldata = rawchanneldata.toString().split("\n");
    for(var i = 0; i < (channeldata.length - 1); i++)
    {
        if(channelid == channeldata[i])
            return;
    }

    //add channel to end of file
    fs.appendFileSync(`${dir}/${gameid}/hostupdatechannels.txt`, `${channelid}\n`);
}

var removehostupdatechannel = function(gameid, channelid)
{
    var rawchanneldata = fs.readFileSync(`${dir}/${gameid}/hostupdatechannels.txt`).toString();
    rawchanneldata = rawchanneldata.replace(`${channelid}\n`, "");
    fs.writeFileSync(`${dir}/${gameid}/hostupdatechannels.txt`, rawchanneldata);
}

var gethostupdatechannels = function(gameid)
{
    cleanseHostUpdateChannels(gameid);

    var channels = [];
    var rawchanneldata = fs.readFileSync(`${dir}/${gameid}/hostupdatechannels.txt`).toString().split("\n");

    for(var i = 0; i < (rawchanneldata.length - 1); i++)
    {
        try{
            var channel = client.channels.cache.get(rawchanneldata[i]);
            channels.push(channel);
        }
        catch(err){
            console.log(`Lynch gethostupdatechannels error:\n${err}`);
        }
    }
    return channels;
}

var updateHosts = function(gameid, string)
{
    var channels = gethostupdatechannels(gameid);

    //there are no update channels, dm hosts
    if(channels.length == 0)
    {
        var hosts = getHosts(gameid);
        for(var i = 0; i < hosts.length; i++)
        {
            var host = client.users.cache.get(hosts[i]);
            if(host.dmChannel == null)
                host.createDM().then(channel => {
                    channel.send(string);
                });
            else
            {
                host.dmChannel.send(string);
            }
        }
    }

    //there are update channels
    for(var i = 0; i < channels.length; i++)
    {
        channels[i].send(string);
    }
}

var cleanseHostUpdateChannels = function(gameid)
{
    var rawchannels = fs.readFileSync(`${dir}/${gameid}/hostupdatechannels.txt`).toString();
    var channels = rawchannels.split("\n");
    {
        for(var i = 0; i < (channels.length - 1); i++)
        {
            try{
                var channel = client.channels.cache.get(channels[i]);
                if(channel == undefined)
                {
                    rawchannels = rawchannels.replace(`${channels[i]}\n`, "");
                }
            }
            catch(error)
            {
                rawchannels = rawchannels.replace(`${channels[i]}\n`, "");
            }
        }
    }
    fs.writeFileSync(`${dir}/${gameid}/hostupdatechannels.txt`, rawchannels);
}

//message senders
var sendmessage = function(message, channel)
{
    //if the message is not 2000 characters, just send it
    if(message.length < 2000)
    {
        channel.send(message);
        return;
    }

    //split the message by newlines
    var strings = message.split("\n");

    //j measures the offset from the current
    var j = 0;
    for(var i = 0; (i + j) < strings.length; i++)
    {
        //offset holds the current place for j, so modifications don't affect the string being looked at until next while run
        var offset1 = j;

        //combine lines in a message until no more can be combined without exceeding character limit
        //I.E. Too few characters per line break
        while(((i + j + 1) < strings.length) && (strings[i + offset1].length + strings[i + j + 1].length) < 1999)
        {
            strings[i + offset1] = strings[i + offset1] + "\n" + strings[i + j + 1];
            j++;
        }

        //Too many characters before line break, divide by words
        if(strings[i + offset1].length > 2000)
        {
            //split current line into words
            var substrings = strings.split(" ");

            //l measures the offset for the words held in this line
            var l = 0;

            //go through the words (AKA substrings) and determine what can be printed
            for(var k = 0; (k + l) < substrings.length; k++)
            {
                var offset2 = l;

                //combine words up to 2000 characters
                while(((k + l + 1) < substrings.length) && (substrings[k + offset2].length + substrings[k + l + 1].length) < 1999)
                {
                    substrings[k + offset2] = substrings[k + offset2] + " " + substrings[k + l + 1];
                    l++;
                }

                //Too many continuous characters without spacing
                if(substrings[k + offset2].length > 2000)
                {

                    //start at the start index and print 2000 characters at a time
                    var startindex = 0;
                    var endindex = 2000;
                    while(startindex % 2000 == 0 && startindex != endindex)
                    {
                        var subsub = substrings[k + offset2].substring(startindex, endindex);
                        channel.send(subsub);
                        startindex = endindex;
                        endindex += 2000;
                        if(endindex > substrings[k + offset2].length)
                            endindex = substrings[k + offset2].length;
                    }
                }

                //length acceptable, send string
                else
                {
                    channel.send(substrings[k + offset2]);
                }
            }
        }

        //length acceptable, send string
        else
        {
            channel.send(strings[i + offset1]);
        }
    }
}

var sendcodemessage = function(message, channel)
{
    if(message.length < 1993)
    {
        channel.send(`\`\`\`\n${message}\`\`\``);
        return;
    }

    //split the message by newlines
    var strings = message.split("\n");

    //j measures the offset from the current
    var j = 0;
    for(var i = 0; (i + j) < strings.length; i++)
    {

        //offset holds the current place for j, so modifications don't affect the string being looked at until next while run
        var offset1 = j;

        //combine lines in a message until no more can be combined without exceeding character limit
        //I.E. Too few characters per line break
        while(((i + j + 1) < strings.length) && (strings[i + offset1].length + strings[i + j + 1].length) < 1992)
        {
            strings[i + offset1] = strings[i + offset1] + "\n" + strings[i + j + 1];
            j++;
        }

        //Too many characters before line break, divide by words
        if(strings[i + offset1].length > 1993)
        {
            //split current line into words
            var substrings = strings[i + offset1].split(" ");

            //l measures the offset for the words held in this line
            var l = 0;

            //go through the words (AKA substrings) and determine what can be printed
            for(var k = 0; (k + l) < substrings.length; k++)
            {
                var offset2 = l;

                //combine words up to 2000 characters
                while(((k + l + 1) < substrings.length) && (substrings[k + offset2].length + substrings[k + l + 1].length) < 1992)
                {
                    substrings[k + offset2] = substrings[k + offset2] + " " + substrings[k + l + 1];
                    l++;
                }

                //Too many continuous characters without spacing
                if(substrings[k + offset2].length > 1993)
                {

                    //start at the start index and print 2000 characters at a time
                    var startindex = 0;
                    var endindex = 1993;
                    while(startindex % 1993 == 0 && startindex != endindex)
                    {
                        var subsub = substrings[k + offset2].substring(startindex, endindex);
                        channel.send(subsub);
                        startindex = endindex;
                        endindex += 1993;
                        if(endindex > substrings[k + offset2].length)
                            endindex = substrings[k + offset2].length;
                    }
                }

                //length acceptable, send string
                else
                {
                    channel.send(`\`\`\`\n${substrings[k + offset2]}\`\`\``);
                }
            }
        }

        //length acceptable, send string
        else
        {
            channel.send(`\`\`\`\n${strings[i + offset1]}\`\`\``);
        }
    }
}


module.exports = {
    //game functions
    createGame: createGame,
    deleteGame: deleteGame,
    gameExists: gameExists,
    gameIdFromName: gameIdFromName,
    gameIdFromServerId: gameIdFromServerId,
    getGameIds: getGameIds,

    //name functions
    getName: getName,
    setName: setName,
    getGameNamesFromIdList: getGameNamesFromIdList,
    getGameNames: getGameNames,

    //owner functions
    getOwner: getOwner,
    transferOwner: transferOwner,
    isOwner: isOwner,

    //host functions
    getHosts: getHosts,
    isHost: isHost,
    addHost: addHost,
    removeHost: removeHost,
    removeHostByIndex: removeHostByIndex,

    //server functions
    getServers: getServers,
    addServer: addServer,
    removeServer: removeServer,

    //host update channel functions
    addhostupdatechannel: addhostupdatechannel,
    removehostupdatechannel: removehostupdatechannel,
    gethostupdatechannels: gethostupdatechannels,
    updateHosts: updateHosts,

    //message sender
    sendmessage: sendmessage,
    sendcodemessage: sendcodemessage
}