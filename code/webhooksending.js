/*
WEBHOOK SENDING

This module is designed to phase out all the different modules used for sending messages on webhooks.
It handles all details of message sending.

Things needed to send on a channel: The channelid, a username, an avatar, message contents

sendOnChannels
sendOnChannel
sendOnWebhook
*/

const client = require('../client.js').client();
const err = require('../universal_data/errorcodes.json');

var setUpWebhookListening = function(){
    client.on('messageCreate', message => {
        if(message.author.bot) return;
        console.log("Webhook received message!");
    })
}

//sendOnChannels
//sends a given message on multiple channels using webhooks
//accepts a list of Ids belonging to the channels, a username and avatar to send the message under,
//the string content of the message, and any files and/or embeds to be sent
var sendOnChannels = function(channelIdList, username, avatar, content, attachments, embeds){
    //ensure channelIdList is an array
    if(!(Array.isArray(channelIdList)))
    {
        console.log("sendOnChannels: Expected type Array");
        return err.ERROR_INVALID_INPUT;
    }

    //send each channel id list to the channel sending function
    channelIdList.forEach(channelId => {
        sendOnChannel(channelId, username, avatar, content, attachments, embeds);
    })
}

//sendOnChannel
//sends a given message on a single channel using a webhook
//accepts the id of the channel, a username and avatar to send the message under,
//the string content of the message, and any files ando/or embeds to be sent
var sendOnChannel = function(channelId, username, avatar, content, attachments, embeds){
    //retrieve channel
    var channel = client.channels.cache.get(channelId);

    //verify real channel
    if(channel == undefined)
    {
        console.log(`sendOnChannel: No channel of id ${channelId} found.`);
        return;
    }

    //verify text based channel
    if(!channel.isText()){
        console.log(`sendOnChannel: Expected text based channel. Received channel of type ${channel.type}.`);
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
                        sendOnWebhook(hook, username, avatar, content, attachments, embeds);
                    }).catch(console.error);
            }
        }).catch(console.error);

}

//sendOnWebhook
//sends a message on a given webhook. accepts the webhook, a username and avatar for the webhook,
//the string content for the message, any files and any embeds to be sent
var sendOnWebhook = function(webhook, username, avatar, content=null, attachments=[], embeds=[]){

    //verify message contents
    if(content == "" || !(typeof content === 'string'))
        content = null;
    if(!Array.isArray(attachments))
        attachments = [];
    if(!Array.isArray(embeds))
        embeds = [];

    webhook.send({username: username, avatarURL: avatar, content: content, files: attachments, embeds: embeds}).catch(console.error);
}

module.exports = {
    sendOnChannels: sendOnChannels,
    sendOnChannel: sendOnChannel,
    setUpWebhookListening: setUpWebhookListening
}