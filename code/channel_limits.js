const client = require('../client.js').client();
const Discord = require('discord.js');
const fs = require('fs');
const dir = './games';
const admin = require('./administration.js');

var setmessagelimit = function(gameid, channelid, limit)
{
    //check for numerical values for channel and limit
    if(!/^\d+$/.test(channelid) || !/^\d+$/.test(limit))
        return false;

    //check game exists
    if(!fs.existsSync(`${dir}/${gameid}/channelmessagelimits`))
        return false;

    fs.writeFileSync(`${dir}/${gameid}/channelmessagelimits/${channelid}.txt`, limit);

    return true;
}

var removemessagelimit = function(gameid, channelid)
{
    try{
        fs.unlinkSync(`${dir}/${gameid}/channelmessagelimits/${channelid}.txt`);
    }
    catch(err){
        console.error(err);
    }
}

var getchannelmessagelimits = function(gameid)
{
    var returnvalue = [];
    var channels = readdirSync(`${dir}/${gameid}/channelmessagelimits`);
    channels.forEach(function(channel) {
        returnvalue.push([channel.toString().replace('.txt', ""), fs.readFileSync(`${dir}/${gameid}/channelmessagelimits/${channel}`)]);
    });
    return returnvalue;
}

var getmessagelimit = function(gameid, channelid)
{
    if(fs.existsSync(`${dir}/${gameid}/channelmessagelimits/${channelid}.txt`))
    {
        var limit = fs.readFileSync(`${dir}/${gameid}/channelmessagelimits/${channelid}.txt`).toString();
        return limit;
    }

    return -1;
}

var cleanselimits = function(gameid)
{
    var channels = getchannelmessagelimits(gameid);
    for(var i = 0; i < channels.length; i++)
    {
        if(client.channels.cache.has(channels[i][0]) == false)
        {
            try{
                fs.unlinkSync(`${dir}/${gameid}/channelmessagelimits/${channels[i][0]}.txt`);
            }
            catch(err)
            {
                console.error(err);
            }
        }
    }
}

var checkLimits = function(channel)
{
    //channel isn't a guild text channel, ignore
    if(channel.type == 'DM')
        return;

    //get game id
    var gameid = admin.gameIdFromServerId(channel.guild.id);

    //no game in this server, ignore
    if(gameid == -1)
        return;

    //get limit for channel
    var limit = getmessagelimit(gameid, channel.id);

    //no limit, ignore
    if(limit == -1)
        return;   

    channel.messages.fetch({ limit: 100 }).then(messages => {
        if(messages.size > limit)
        {
            messages.last(messages.size - limit).forEach(function(item, index, array) {
                item.delete().then().catch(console.error);
            })
        }
    })
}

module.exports = {
    setmessagelimit: setmessagelimit,
    removemessagelimit: removemessagelimit,
    getchannelmessagelimits: getchannelmessagelimits,
    getmessagelimit: getmessagelimit,
    cleanselimits: cleanselimits,
    checkLimits: checkLimits
}