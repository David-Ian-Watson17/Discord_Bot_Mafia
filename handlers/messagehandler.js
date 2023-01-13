const Discord = require('discord.js');
const client = require('../client.js').client();
const {GameError, err} = require('../GameError.js');

const CHAR_LIMIT = 2000;
const ROOM_TO_GROW_LIMIT = 1980;
const generalmarkers = ["__", "~~"];
const codemarkers = ["```", "`"]
const asteriskmarkers = ["***", "**", "*"];

var sendMessageOnChannelIds = function(channelIds, content, attachments=[], embeds=[]){
    var channels = [];
    var unsuccessful = [];
    channelIds.forEach(channelId => {
        var channel = client.channels.cache.get(channelId);
        if(!channel) unsuccessful.push(channelId);
        else channels.push(channel);
    });
    sendMessageOnChannels(channels, content, attachments, embeds);
    return unsuccessful;
}

var sendMessageOnChannels = function(channels, content, attachments=[], embeds=[]){
    channels.forEach(channel => {
        sendMessageOnChannel(channel, content, attachments, embeds);
    })
}

//send a message on a channel normally
var sendMessageOnChannel = function(channel, content, attachments = [], embeds = []){
    
    //find out what is present
    var presentcounter = 0;
    if(content) presentcounter += 1;
    if(attachments) presentcounter += 2;
    if(embeds) presentcounter += 4;

    switch(presentcounter){
        case 1: //content only
            var msgarray = cutMessageProperly(content);
            for(i = 0; i < msgarray.length; i++){
                try{
                    channel.send(msgarray[i]);
                }catch(error){
                    console.error(error);
                    throw new GameError(err.ERROR_UNKNOWN);
                }
            }
            break;
        case 2: //attachments only
            try{
                channel.send({files: attachments});
            }catch(error){
                console.error(error);
                throw new GameError(err.ERROR_UNKNOWN);
            }
            break;
        case 3: //content and attachments
            var msgarray = cutMessageProperly(content);
            for(i = 0; i < (msgarray.length - 1); i++){
                try{
                    channel.send(msgarray[i]);
                }catch(error){
                    console.error(error);
                    throw new GameError(err.ERROR_UNKNOWN);
                }
            }
            try{
                channel.send({content: msgarray[msgarray.length - 1], files: attachments});
            }catch(error){
                console.error(error);
                throw new GameError(err.ERROR_UNKNOWN);
            }
            break;
        case 4: //embeds only
            try{
                channel.send({embeds: embeds});
            }catch(error){
                console.error(error);
                throw new GameError(err.ERROR_UNKNOWN);
            }
            break;
        case 5: //content and embeds
            var msgarray = cutMessageProperly(content);
            for(i = 0; i < (msgarray.length - 1); i++){
                try{
                    channel.send(msgarray[i]);
                }catch(error){
                    console.error(error);
                    throw new GameError(err.ERROR_UNKNOWN);
                }
            }
            try{
                channel.send({content: msgarray[msgarray.length - 1], embeds: embeds});
            }catch(error){
                console.error(error);
                throw new GameError(err.ERROR_UNKNOWN);
            }
            break;
        case 6: //attachments and embeds
            try{
                channel.send({files: attachments, embeds: embeds});
            }catch(error){
                console.error(error);
                throw new GameError(err.ERROR_UNKNOWN);
            }
            break;
        case 7: //content, attachments, and embeds
            var msgarray = cutMessageProperly(content);
            for(i = 0; i < (msgarray.length - 1); i++){
                try{
                    channel.send(msgarray[i]);
                }catch(error){
                    console.error(error);
                    throw new GameError(err.ERROR_UNKNOWN);
                }
            }
            try{
                channel.send({content: msgarray[msgarray.length - 1], files: attachments, embeds: embeds});
            }catch(error){
                console.error(error);
                throw new GameError(err.ERROR_UNKNOWN);
            }
            break;
        default: //uhhhh... aliens?
        throw new GameError(err.ERROR_UNKNOWN);
    }
}

var cutMessageProperly = function(content){
    if(content.length < CHAR_LIMIT){
        return [content];
    }

    var messagearray = [];

    while(content.length > CHAR_LIMIT){
        //make cut
        var cutoffstring = cutOffBeforeLimit(content);
        content = content.substring(cutoffstring.length);

        //check markers
        var unfinishedmarkers = checkMarkers(cutoffstring);
        unfinishedmarkers.forEach(marker => {
            cutoffstring += marker;
            content = marker + content;
        })

        //push cuts to array
        messagearray.push(cutoffstring);
    }

    //push the remaining string to the message array
    messagearray.push(content);

    //return the message array
    return messagearray;
}

var cutOffBeforeLimit = function(content){
    var cutofftext = cutOffByNewLines(content);
    if(cutofftext.length > 0) return cutofftext;

    cutofftext = cutOffBySpaces(content);
    if(cutofftext.length > 0) return cutofftext;

    cutofftext = cutOffAnywhere(content);
    return cutofftext;
}

var cutOffByNewLines = function(content){
    var cutoffcontent = "";

    //split by new lines
    var splices = content.split("\n");

    //first segment before new line is too long, just return
    if(splices[0].length > ROOM_TO_GROW_LIMIT) return "";

    //add lines until it would be too long to add another
    while(cutoffcontent.length + splices[0].length <= ROOM_TO_GROW_LIMIT){
        cutoffcontent += splices.shift();
        cutoffcontent += "\n";
    }

    //return cut
    return cutoffcontent;
}

var cutOffBySpaces = function(content){
    var cutoffcontent = "";

    //split by spaces
    var splices = content.split(" ");

    //first segment before new line is too long, just  return
    if(splices[0].length >= ROOM_TO_GROW_LIMIT) return "";
    
    //add words until it would be too long to add another
    while(cutoffcontent.length + splices[0].length < ROOM_TO_GROW_LIMIT){
        cutoffcontent += splices.shift();
        cutoffcontent += " ";
    }

    //return cut
    return cutoffcontent;
}

var cutOffAnywhere = function(content){
    //frick it, they want one long word, you won't respect where they want it cut
    var cutoffcontent = content.substring(0, ROOM_TO_GROW_LIMIT);

    //return cut
    return cutoffcontent;
}

//sendOnChannels
//sends a given message on multiple channels using webhooks
//accepts a list of Ids belonging to the channels, a username and avatar to send the message under,
//the string content of the message, and any files and/or embeds to be sent
var sendOnChannelsWebhook = function(channelIdList, username, avatar, content, attachments, embeds){
    //ensure channelIdList is an array
    if(!(Array.isArray(channelIdList)))
    {
        console.log("sendOnChannels: Expected type Array");
        throw new GameError(err.INVALID_VALUE);
    }

    //send each channel id list to the channel sending function
    var returncodes = [];
    channelIdList.forEach(channelId => {
        var returncode = sendOnChannelWebhook(channelId, username, avatar, content, attachments, embeds);
        returncodes.push(returncode);
    })

    return returncodes;
}

//sendOnChannel
//sends a given message on a single channel using a webhook
//accepts the id of the channel, a username and avatar to send the message under,
//the string content of the message, and any files ando/or embeds to be sent
var sendOnChannelWebhook = function(channelId, username, avatar, content, attachments, embeds){
    //retrieve channel
    var channel = client.channels.cache.get(channelId);

    //verify real channel
    if(channel == undefined)
    {
        console.log(`sendOnChannel: No channel of id ${channelId} found.`);
        throw new GameError(err.INVALID_CHANNEL_ID);
    }

    //verify text based channel
    if(!channel.isText()){
        console.log(`sendOnChannel: Expected text based channel. Received channel of type ${channel.type}.`);
        throw new GameError(err.INVALID_TYPE);
    }

    
    //fetch webhooks
    channel.fetchWebhooks()
        .then(hooks => {
            //only use one hook
            var foundhook = false;
            
            //search for a hook instantiated by the client
            hooks.forEach(hook => {
                //found a hook instantiated by the client
                if(hook.client.user.id == client.user.id && foundhook == false)
                {
                    foundhook = true;

                    //send message
                    sendOnWebhook(hook, username, avatar, content, attachments, embeds);
                }
            });

            //no hook found, create new one
            if(foundhook == false){
                channel.createWebhook("Mafia Helper")
                    .then(hook => {

                        //send message
                        return sendOnWebhook(hook, username, avatar, content, attachments, embeds);
                    }).catch(console.error);
            }
        }).catch(console.error);
}

/** Sends a message on a given webhook. Accepts the webhook, a username, and avatar for the webhook,
 * as well as the string content for the message, any files, and any embeds for the message
 * @param {Discord.Webhook} webhook 
 * @param {String} username 
 * @param {String} avatar 
 * @param {String} content 
 * @param {Array<Discord.MessageAttachment>} attachments 
 * @param {Array<Discord.MessageEmbed>} embeds 
 * @returns 
 */
var sendOnWebhook = function(webhook, username, avatar, content=null, attachments=[], embeds=[]){

    //verify message contents
    if(!(typeof username === 'string'))
        username = "";
    if(!(typeof avatar === 'string'))
        avatar = "";
    if(content == "" || !(typeof content === 'string'))
        content = null;
    if(!Array.isArray(attachments))
        attachments = [];
    if(!Array.isArray(embeds))
        embeds = [];

    try{
        webhook.send({username: username, avatarURL: avatar, content: content, files: attachments, embeds: embeds}).catch(console.error);
    }catch(error){
        console.error(error);
        throw new GameError(err.ERROR_UNKNOWN);
    }
}

module.exports = {
    cutMessageProperly: cutMessageProperly,
    sendMessageOnChannelIds: sendMessageOnChannelIds,
    sendMessageOnChannels: sendMessageOnChannels,
    sendMessageOnChannel: sendMessageOnChannel,
    sendOnChannelsWebhook: sendOnChannelsWebhook,
    sendOnChannelWebhook: sendOnChannelWebhook,
}