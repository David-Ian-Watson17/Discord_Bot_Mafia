const client = require('../../client.js').client();
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const permissions = require('../../code/permissions.js');
const errorcodes = require('../../universal_data/errorcodes.json');

module.exports = {
    name: ['saveclosed'],
    description: "(hosts only) (server only) Saves the state of the channel or category as its closed state.",
    usage: "<channel tag>(channel optional) <'category'>(optional) OR <'server'>(saves all channels in server)",
    erased: true,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //get channel(s) specified
        var channels = getChannels(message, args);

        if(channels == undefined) return errorcodes.ERROR_NOT_VALID_TARGET;

        //for each channel, save closed permissions
        for(var i = 0; i < channels.length; i++)
        {
            //variables for submitting perms to file
            var channelid = channels[i].id;
            var perms = [];

            //get permissions
            var overwrites = channels[i].permissionOverwrites.toJSON();
            for(var j = 0; j < overwrites.length; j++)
            {
                perms.push([overwrites[j].id, overwrites[j].allow.bitfield, overwrites[j].deny.bitfield]);
            }
            
            //set the permissions
            permissions.setclosedpermissions(gameid, channelid, perms);
        }

        return true;
    }
}

var getChannels = function(message, args)
{
    var channel = message.channel;

    if(args.length == 1)
    {
        return [channel];
    }

    if(args.length == 2)
    {
        if(args[1] == "server")
        {
            var channels = message.channel.guild.channels.cache.toJSON();
            return channels;
        }
        else if(args[1] == "category")
        {
            if(channel.parent == undefined || channel.type == "GUILD_CATEGORY")
            {
                return [channel];
            }
            else
            {
                return [channel.parent];
            }
        }
        else if(args[1].match(/<#\d+>/))
        {
            try{
                channel = client.channels.cache.get(args[1].replace(/[<>#]/g, ""))
                return [channel];
            }
            catch(error)
            {
                return undefined;
            }
        }
        else
        {
            return undefined;
        }
    }

    if(args[1] == 'category')
    {
        try{
            channel = client.channels.cache.get(args[2].replace(/[<>#]/g, ""));
            if(channel.parent == undefined || channel.type == "GUILD_CATEGORY")
            {
                return [channel];
            }
            else
            {
                return [channel.parent];
            }
        }
        catch(error)
        {
            return undefined;
        }
    }
    else if(args[2] == 'category')
    {
        try{
            channel = client.channels.cache.get(args[1].replace(/[<>#]/g, ""));
            if(channel.parent == undefined || channel.type == "GUILD_CATEGORY")
            {
                return [channel];
            }
            else
            {
                return [channel.parent];
            }
        }
        catch(error)
        {
            return undefined;
        }
    }

    return undefined;
}