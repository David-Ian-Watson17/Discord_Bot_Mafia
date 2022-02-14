const client = require('../../client.js').client();
const Discord = require('discord.js');
const admin = require('../../code/administration.js');
const permissions = require('../../code/permissions.js');
const errorcodes = require('../../universal_data/errorcodes.json');

module.exports = {
    name: ['close'],
    description: "(hosts only) (server only) Closes the selected channel. If there is no closed state, checks for category closed state, or you can specify category.",
    usage: "<channel tag>(channel optional) <'category'>(optional) OR <'server'>(changes all channels in server if they have a saved state)",
    erased: true,
    securitylevel: "host",
    gameidreliance: "server",
    execute(message, args, gameid)
    {
        //get specified channel(s)
        var channels = getChannels(message, args);

        if(channels == undefined) return errorcodes.ERROR_NOT_VALID_TARGET;

        for(var i = 0; i < channels.length; i++)
        {
            //get channel id
            var channelid = channels[i].id;

            //get the closed permissions for specified channel
            var perms = permissions.getclosedpermissions(gameid, channelid);

            //make sure you have perms
            if(perms != null)
            {

                var permsarray = [];

                //apply the perms
                for(var j = 0; j < perms.length; j++)
                {
                    //skips the perms phase if a valid role or user wasn't found
                    var skip = false;

                    //verify a role or user exists
                    var userrole = channels[i].guild.roles.cache.get(perms[j][0]);
                    if(userrole == undefined || userrole == null)
                    {
                        userrole = channels[i].guild.members.cache.get(perms[j][0]);
                        if(userrole == undefined || userrole == null)
                        {
                            skip = true;
                        }
                    }

                    //set up perms if valid role or user was found
                    if(skip == false)
                    {
                        var roleuserid = perms[j][0];
                        var allowperms = permissions.convertbitmap(perms[j][1]);
                        var denyperms = permissions.convertbitmap(perms[j][2]);
                        permsarray.push({ id: roleuserid, allow: allowperms, deny: denyperms });
                    }
                }

                channels[i].overwritePermissions(permsarray);
            }
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
            var returnvalue = [];
            var channels = message.channel.guild.channels.cache.toJSON();
            for(var i = 0; i < channels.length; i++)
            {
                if(channels[i].type == "GUILD_CATEGORY")
                {
                    returnvalue.push(channels[i]);
                }
            }
            for(var i = 0; i < channels.length; i++)
            {
                if(channels[i].type != "GUILD_CATEGORY")
                {
                    returnvalue.push(channels[i]);
                }
            }
            return returnvalue;
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