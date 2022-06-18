/*
Chatroom

There is no way to make this feature not sound dumb, but it allows the creation of
anonymous chatrooms inside of discord. It's useful when you want to allow players
to communicate anonymously with other players on a larger scale while still allowing
them to use an alias. So... discord inside of discord...

Each user of the chatroom is given a channel as a client. They register themselves,
picking a username and profile picture, then may freely send messages on the channel which will be
transmitted to the other user client channels under their chosen username and profile picture.
They can interface with the chat service to change aspects about their client using commands, which
will not be transmitted.
*/

/*
Chatroom directory is under the name of the chatroom and contains 3 files

label.txt       (Holds the label printed at the top of the chatroom for every client)
clients.txt     (Holds the client channels that have access to the chatroom, as well 
                    as their username and a link to their profile picture)
log.txt         (Holds the log of all chats and client profile updates)

File formats:

label.txt
----------
Label

clients.txt
-----------
ClientChannel  Username  ProfilePicLink
ClientChannel (no additional information means an unregistered client that can't send or receive yet)
ClientChannel  Username  ProfilePicLink
...

log.txt
-----------
'Message'  ClientChannel  MessageContents
'Message'  ClientChannel  MessageContents
'ClientUpdate'  ClientChannel  NewUsername/NewProfilePic
...
*/

const client = require('../client.js').client();
const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');
const dir = './games';
const admin = require('./administration.js');
const connections = require('./connections.js');
const prefix = require('../universal_data/prefix.json').prefix;

/*
Chatroom Functions
*/

//creates a chatroom with a unique name, and all necessary files. if the name is taken, returns -1
var createChatroom = function(gameid, name){
    if(!fs.existsSync(`${dir}/${gameid}/chatrooms`))
        fs.mkdirSync(`${dir}/${gameid}/chatrooms`);

    if(fs.existsSync(`${dir}/${gameid}/chatrooms/${name}`))
        return -1;

    fs.writeFileSync(`${dir}/${gameid}/chatrooms/${name}/label.txt`, `${name}`);
    fs.writeFileSync(`${dir}/${gameid}/chatrooms/${name}/clients.txt`, "");
    fs.writeFileSync(`${dir}/${gameid}/chatrooms/${name}/log.txt`, "");
}

//deletes a chatroom by its name (not its label), removing its directory and all files
var deleteChatroom = function(gameid, name){
    if(!fs.existsSync(`${dir}/${gameid}/chatrooms/${name}`))
        return false;

    fs.rmdirSync(`${dir}/${gameid}/chatrooms/${name}`, {
        recursive: true,
    });
    return true;
}

//retrieves the names of all chatrooms by scanning directory names
var getChatrooms = function(gameid){
    var chatroomnames = [];
    if(!fs.existsSync(`${dir}/${gameid}/chatrooms`))
        return chatroomnames;

    chatroomnames = fs.readdirSync(`${dir}/${gameid}/chatrooms`);
    return chatroomnames;
}

//retrieves all clients attached to a particular chatroom, using the chatroom's unique name
//returns -1 if the chatroom doesn't exist
//returns an array of the form [[channelid, username, profilepiclink], ...] if the chatroom exists
var getChatroomchannels = function(gameid, name){
    var channels = [];
    if(!fs.existsSync(`${dir}/${gameid}/chatrooms/${name}/clients.txt`))
        return -1;

    var rawchatdata = fs.readFileSync(`${dir}/${gameid}/chatrooms/${name}/clients.txt`);
    var channeldata = rawchatdata.split("\n");
    channeldata.forEach(channelline => {
        channels.push(channelline.split("  "));
    })

    return channels;
}

//Client Functions

//adds a client to a particular chatroom using a chat name and a channel id. client will still need
//to be registered with a username and profile pic before being able to send/receive messages
//returns -1 if the chatroom doesn't exist
//returns -2 if the client has already been added to the chatroom
//returns true if the client is successfully added
var addClient = function(gameid, chatname, channelid){
    if(!fs.existsSync(`${dir}/${gameid}/chatrooms/${chatname}/clients.txt`))
        return -1;

    var rawchatdata = fs.readFileSync(`${dir}/${gameid}/chatrooms/${chatname}/clients.txt`);
    
    //scan to see if this client channel has already been added
    var channeldata = rawchatdata.split("\n");
    channeldata.forEach(channelline => {
        if(channelline.split("  ")[0] == channelid)
            return -2;
    })
    
    //add unregistered client to file
    fs.appendFileSync(`${dir}/${gameid}/chatrooms/${chatname}/clients.txt`, `${channelid}\n`);
    return true;
}


//remove a client from a chatroom based off its channel id
//returns -1 if the chatroom clients file doesn't exist
var removeClient = function(gameid, chatid, channelid){
    if(!fs.existsSync(`${dir}/${gameid}/chatrooms/${chatname}/clients.txt`))
        return -1;

    var rawchatdata = fs.readFileSync(`${dir}/${gameid}/chatrooms/${chatname}/clients.txt`);
    var channeldata = rawchatdata.split("\n");

    //find channelid
    var channelidstring = "";
    channeldata.forEach(channelline => {
        if(channelline.split("  ")[0] == channelid)
            channelidstring = `${channelline}\n`;
    });

    fs.writeFileSync(`${dir}/${gameid}/chatrooms/${chatname}.txt`, rawchatdata.replace(channelidstring, ""));
}

//retrieve all clients from a chatroom
//returns -1 if the chatroom clients file doesn't exist
//on success, returns an array of format [[channel id, username, profile pic link], ...]
var getClients = function(gameid, chatid){
    if(!fs.existsSync(`${dir}/${gameid}/chatrooms/${chatname}/clients.txt`))
        return -1;

    var clients = [];

    var rawchatdata = fs.readFileSync(`${dir}/${gameid}/chatrooms/${chatname}/clients.txt`);
    var channeldata = rawchatdata.split("\n");

    channeldata.forEach(channelline => {
        clients.push(channelline.split("  "));
    })

    return clients;
}

//changes the username attached to a client, or adds one if there isn't currently one attached
//returns -1 if the chatroom clients file doesn't exist
//returns -2 if the username matches the channel id
var changeClientUsername = function(gameid, chatname, channelid, newusername){
    if(!fs.existsSync(`${dir}/${gameid}/chatrooms/${chatname}/clients.txt`))
        return -1;

    if(channelid == newusername)
        return -2;

    var rawchatdata = fs.readFileSync(`${dir}/${gameid}/chatrooms/${chatname}/clients.txt`);
    var channeldata = rawchatdata.split("\n");

    //get a string to store the old channel line and the new one after username replacement
    var oldchannelline = "";
    var newchannelline = "";

    //cycle through clients to find the right channel
    channeldata.forEach(channelline => {
        var channellinedata = channelline.split("  ");

        //if client's channel id matches, found correct channel
        if(channellinedata[0] == channelid)
        {
            oldchannelline = channelline;
            if(channellinedata.length < 2)
            {
                newchannelline = `${oldchannelline}  ${newusername}`;
            }
            else
            {
                newchannelline = oldchannelline.replace(channellinedata[1], newusername);
            }
        }
    })

    //replace old channel line in file
    fs.writeFileSync(`${dir}/${gameid}/chatrooms/${chatname}/clients.txt`, rawchatdata.replace(oldchannelline, newchannelline));
}

//changes the profile pict link attached to a client, or adds one if there isn't one currently attached
//returns -1 if the chatroom's clients file doesn't exist
//returns -2 if the profile pic does not have a valid image extension
var changeClientProfilePic = function(gameid, chatname, channelid, newprofilepiclink){
    if(!fs.existsSync(`${dir}/${gameid}/chatrooms/${chatname}/clients.txt`))
        return -1;

    if(!/\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(newprofilepiclink))
        return -2;

    var rawchatdata = fs.readFileSync(`${dir}/${gameid}/chatrooms/${chatname}/clients.txt`);
    var channeldata = rawchatdata.split("\n");

    //get a string to store the old channel line and the new one after profile pic replacement
    var oldchannelline = "";
    var newchannelline = "";

    //cycle through clients to find the right channel
    channeldata.forEach(channelline => {
        var channellinedata = channelline.split("  ");

        //if client's channel id matches, found correct channel
        if(channellinedata[0] == channelid)
        {
            oldchannelline = channelline;
            if(channellinedata.length < 3)
            {
                newchannelline = `${oldchannelline}  ${newprofilepiclink}`;
            }
            else
            {
                newchannelline = oldchannelline.replace(channellinedata[2], newprofilepiclink);
            }
        }
    })

    //replace old channel line in file
    fs.writeFileSync(`${dir}/${gameid}/chatrooms/${chatname}/clients.txt`, rawchatdata.replace(oldchannelline, newchannelline));
}

//Broadcast Functions
var clientsentmessage = function(gameid, chatid, channelid, message){
    if(message.content.startsWith(prefix))
    {

    }

    broadcast(gameid, chatid, channelid, message)
}

var broadcast = function(gameid, chatid, channelid, message){
    
}

var checkchats = function(message){
    
}