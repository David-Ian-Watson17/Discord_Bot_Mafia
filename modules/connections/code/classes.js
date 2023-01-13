const Discord = require('discord.js');
const admin = require('../../../administration/administration.js');
const datawriting = require('../../../handlers/datahandler.js');
const messagesending = require('../../../handlers/messagehandler.js');
const imagehandler = require('../../../handlers/imagehandler.js');
const {ConnectionError, err} = require('./ConnectionError.js');
const {ConnectionTypes} = require('./connectiontypes.js');
const {ModuleManager} = require('../../../classes/modulemanager.js');
const {Game} = require('../../../classes/game.js');

/** Connections are methods used to send messages from one place to another based on a condition.
 * @typedef {Connection} Connection
 */
class Connection{

    /** The id of the connection
     * @type {String}
     */
    id;

    /** The manager this connection belongs to
     * @type {ConnectionManager}
     */
    manager;

    /** The type of connection this is
     * @type {String}
     */
    type;
    
    /** Create a new connection
     * @param {String} id 
     * @param {ConnectionManager} manager
     * @param {String} type 
     */
    constructor(id, manager, type){
        this.id = id;
        this.manager = manager;
        this.type = type;
    }

    destroy(){
        this.deleteFile();
    }

    /** Convert this connection to a JSON string
     * @returns {Object}
     */
    toJSON(){
        var returnobject = {};
        returnobject.id = this.id;
        returnobject.type = this.type;
        return returnobject;
    }

    /** Store this connection
     * @param {Object} json 
     */
    store(json=JSON.stringify(this)){
        datawriting.putData(this.manager.game.id, `Connections/${this.id}/data.json`, json);
    }

    /** Delete this connection's files
     */
    deleteFile(){
        datawriting.deleteSubFolder(this.manager.game.id, `Connections/${this.id}`);
    }

    /** Load a specific connection's data
     * @param {ConnectionManager} manager
     * @param {String} connectionId
     * @returns {(Connection|undefined)}
     */
    static load(manager, connectionId){
        var rawdata = datawriting.retrieveData(manager.game.id, `Connections/${connectionId}/data.json`);
        if(!rawdata) return undefined;
        var parsedData = JSON.parse(rawdata);
        switch(parsedData.type){
            case ConnectionTypes.STANDARD:
                return StandardConnection.createFromJSON(manager, parsedData);
            case ConnectionTypes.ANONYMOUS:
                return AnonymousConnection.createFromJSON(manager, parsedData);
            case ConnectionTypes.SIGNAL:
                return SignalConnection.createFromJSON(manager, parsedData);
            case ConnectionTypes.USER:
                return UserConnection.createFromJSON(manager, parsedData);
            case ConnectionTypes.PARTIAL_CHANNEL:
                return PartialChannelConnection.createFromJSON(manager, parsedData);
            case ConnectionTypes.PARTIAL_USER:
                return PartialUserConnection.createFromJSON(manager, parsedData);
        }
    }
}

/** Channel connections send messages from one channel to another channel
 * @typedef {ChannelConnection} ChannelConnection
 */
class ChannelConnection extends Connection{

    /** The starting channel
     * @type {Discord.Channel}
     */
    startChannel;

    /** The ending channel
     * @type {Discord.Channel}
     */
    endChannel;

    /** Create a new channel connection
     * @param {String} id 
     * @param {ConnectionManager} manager
     * @param {String} type 
     * @param {Discord.Channel} startChannel
     * @param {Discord.Channel} endChannel
     */
    constructor(id, manager, type, startChannel, endChannel){
        super(id, manager, type);
        this.startChannel = startChannel;
        this.endChannel = endChannel;
    }

    destroy(){
        this.endEmitters();
        super.destroy();
    }

    /** Start responding to events
     */
    startEmitters(){
        this.manager.game.client.on('channelDelete', this.deletedChannelEvent);
    }

    /** Stop responding to events
     */
    endEmitters(){
        this.manager.game.client.off('channelDelete', this.deletedChannelEvent);
    }

    /** Channel deleted event
     * @param {Discord.Channel} channel 
     */
    deletedChannelEvent = (channel) => {
        if(this.startChannel.id == channel.id || this.endChannel.id == channel.id)
            this.manager.removeConnection(this.id);
    }

    /** Send a message
     * @param {String} username 
     * @param {String} avatarURL 
     * @param {String} content 
     * @param {Array<String>} attachments 
     * @param {Array<Discord.MessageEmbed>} embeds 
     */
    send(username, avatarURL, content, attachments, embeds){
        messagesending.sendOnChannelWebhook(this.endChannel.id, username, avatarURL, content, attachments, embeds);
    }

    /** Convert this connection to its JSON string
     * @returns {Object}
     */
    toJSON(){
        var returnobject = super.toJSON();
        returnobject.startchannelid = this.startChannel.id;
        returnobject.endchannelid = this.endChannel.id;
        return returnobject;
    }

    /** Store this connection
     * @param {Object} json 
     */
    store(json=JSON.stringify(this)){
        super.store(json);
    }

    /** Delete this connection's files
     */
    deleteFile(){
        super.deleteFile();
    }
}

/** StandardConnections send all messages sent in a starting channel to an ending channel under the original discord user's username and avatar
 * @typedef {StandardConnection} StandardConnection
 */
class StandardConnection extends ChannelConnection{

    /** Create a standard connection
     * @param {String} id 
     * @param {ConnectionManager} manager 
     * @param {Discord.Channel} startChannel 
     * @param {Discord.Channel} endChannel 
     * @param {Boolean} loading 
     */
    constructor(id, manager, startChannel, endChannel, loading=false){
        super(id, manager, ConnectionTypes.STANDARD, startChannel, endChannel);
        if(!loading) this.store();
        if(loading) console.log(`Loaded connection ${id}`);
        this.startEmitters();
    }

    destroy(){
        this.endEmitters();
        super.destroy();
    }

    /** Start responding to events
     */
    startEmitters(){
        super.startEmitters();
        this.manager.game.client.on('messageCreate', this.checkMessage);
    }

    /** Stop responding to events
     */
    endEmitters(){
        super.endEmitters();
        this.manager.game.client.off('messageCreate', this.checkMessage);
    }

    /** Respond to a message creation event
     * @param {Discord.Message} message 
     */
    checkMessage = (message) => {
        try{
            if(message.author.bot) return;
            if(message.channel.id == this.startChannel.id){
                this.send(message);
            }
        }catch(error){
            console.error(error);
        }
    }

    /** Send a message
     * @param {Discord.Message} message 
     */
    send(message){
        super.send(message.author.username, message.author.avatarURL(), message.content, message.attachments.map(attachment => attachment.url), message.embeds);
    }

    /** Convert this connection to a JSON string
     * @returns {Object}
     */
    toJSON(){
        return super.toJSON();
    }

    /** Convert this connection to a string
     * @returns {String}
     */
    toString(){
        var startChannelString = "deleted-channel";
        if(this.startChannel){
            startChannelString = `${this.startChannel.guild.name}/${this.startChannel.name}`;
        }
        var endChannelString = "deleted-channel";
        if(this.endChannel){
            endChannelString = `${this.endChannel.guild.name}/${this.endChannel.name}`;
        }
        return `${this.id} : (Standard Connection) ${startChannelString} -> ${endChannelString}`;
    }

    /** Convert this connection to its full string
     * @returns {String}
     */
    toFullString(){
        return this.toString();
    }

    /** Store this connection
     */
    store(){
        super.store(JSON.stringify(this));
    }

    /** Delete this connection's files
     */
    deleteFile(){
        super.deleteFile();
    }

    /** Create a standard connection from a json string
     * @param {ConnectionManager} manager 
     * @param {Object} json 
     */
    static createFromJSON(manager, json){

        //retrieve channels
        var startChannel = manager.game.client.channels.cache.get(json.startchannelid);
        var endChannel = manager.game.client.channels.cache.get(json.endchannelid);

        //verify channels exist
        if(!startChannel || !endChannel) return undefined;

        //create connection
        var connection = new StandardConnection(json.id, manager, startChannel, endChannel, true);

        return connection;
    }
}

/** Anonymous Connections keep the identity of the sender hidden, replacing it with a determined pseudonym
 * @typedef {AnonymousConnection} AnonymousConnection
 */
class AnonymousConnection extends ChannelConnection{

    /** The username this connection uses on messages sent along it
     * @type {String}
     */
    username;

    /** The local url of the profile picture this connection uses on messages sent along it
     * @type {String}
     */
    profilepicture;

    /** Create a new anonymous connection. Won't be valid until init is called
     * @param {String} id 
     * @param {ConnectionManager} manager
     * @param {Discord.Channel} startChannel
     * @param {Discord.Channel} endChannel
     * @param {Boolean} loading 
     */
    constructor(id, manager, startChannel, endChannel){
        super(id, manager, ConnectionTypes.ANONYMOUS, startChannel, endChannel);
    }

    /** Assign the username and profile picture to this connection and validate
     * @param {String} username 
     * @param {String} profilepicture 
     */
    async init(username="???", profilepicture="https://i.imgur.com/B1PH30q.jpeg"){
        if(!username) username = "???";
        this.username = username;
        try{
            this.profilepicture = await imagehandler.getPermanentLink(this.manager.game.id, profilepicture);
        }catch(error){
            console.log(error);
            throw new ConnectionError(err.IMAGE_COULD_NOT_BE_UPLOADED);
        }
        this.store();
        this.startEmitters();
    }

    destroy(){
        this.endEmitters();
        super.destroy();
    }

    /** Start listening to events
     */
    startEmitters(){
        super.startEmitters();
        this.manager.game.client.on('messageCreate', this.checkMessage);
    }

    /** Stop listening to events
     */
    endEmitters(){
        super.endEmitters();
        this.manager.game.client.off('messageCreate', this.checkMessage);
    }

    /** Check to see if a message should be sent on this connection
     * @param {Discord.Message} message 
     */
    checkMessage = (message) => {
        try{
            if(message.author.bot) return;
            if(message.channel.id == this.startChannel.id){
                this.send(message);
            }
        }catch(error){
            console.error(error);
        }
    }

    /** Change the username that this connection sends under
     * @param {String} newUsername 
     */
    changeUsername(newUsername){
        this.username = newUsername;
        this.store();
    }

    /** Get the profile picture this connection sends under as an attachment
     * @returns {Discord.MessageAttachment}
     */
    getProfilePicture(){
        return this.profilepicture;
    }

    /** Change the profile picture that this connection sends under
     * @param {String} newProfilePicture 
     */
    async changeProfilePicture(newProfilePicture){
        try{
            this.profilepicture = await imagehandler.getPermanentLink(this.manager.game.id, newProfilePicture);
        }catch(error){
            console.log(error);
            throw new ConnectionError(err.IMAGE_COULD_NOT_BE_UPLOADED);
        }
        this.store();
    }

    /** Send a message on this connection
     * @param {Discord.Message} message 
     */
    send(message){
        super.send(this.username, this.profilepicture, message.content, message.attachments, message.embeds);
    }

    /** Converts this connection to a JSON string
     * @returns {Object}
     */
    toJSON(){
        var returnobject = super.toJSON();
        returnobject.username = this.username;
        returnobject.profilepicture = this.profilepicture;
        return returnobject;
    }

    /** Converts this connection to a descriptor string
     * @returns {String}
     */
    toString(){
        var startChannelString = "deleted-channel";
        if(this.startChannel){
            startChannelString = `${this.startChannel.guild.name}/${this.startChannel.name}`;
        }
        var endChannelString = "deleted-channel";
        if(this.endChannel){
            endChannelString = `${this.endChannel.guild.name}/${this.endChannel.name}`;
        }
        return `${this.id} : (Anonymous Connection | "${this.username}") ${startChannelString} -> ${endChannelString}`;
    }

    /** Converts this connection to its full descriptor string
     * @returns {String}
     */
    toFullString(){
        return this.toString();
    }

    /** Store this connection
     */
    store(){
        super.store(JSON.stringify(this));
    }

    /** Delete this connection's files
     */
    deleteFile(){
        super.deleteFile();
    }

    /** Create an anonymous connection from a JSON string
     * @param {ConnectionManager} manager
     * @param {Object} json 
     * @returns {(AnonymousConnection|undefined)}
     */
     static createFromJSON(manager, json){

        //retrieve channels
        var startChannel = manager.game.client.channels.cache.get(json.startchannelid);
        var endChannel = manager.game.client.channels.cache.get(json.endchannelid);

        //verify channels exist
        if(!startChannel || !endChannel) return undefined;

        //create connection
        var connection = new AnonymousConnection(json.id, manager, startChannel, endChannel);

        //populate username and profile picture
        connection.username = json.username;
        connection.profilepicture = json.profilepicture;
        
        //start its emitters
        connection.startEmitters();

        //return the new connection
        return connection;
    }
}

/** A signal connection sends a pre-defined string that can be filled in with user tags. Requires use of the "signal" command
 * @typedef {SignalConnection} SignalConnection
 */
class SignalConnection extends ChannelConnection{

    /** The string this connection sends
     * @type {String}
     */
    signal;

    /** Create a new signal connection
     * @param {String} id 
     * @param {ConnectionManager} manager
     * @param {Discord.Channel} startChannel 
     * @param {Discord.Channel} endChannel 
     * @param {String} signal 
     */
    constructor(id, manager, startChannel, endChannel, signal="####", loading=false){
        super(id, manager, ConnectionTypes.SIGNAL, startChannel, endChannel);
        this.signal = signal;
        if(!loading) this.store();
        super.startEmitters();
    }

    destroy(){
        super.destroy();
    }

    /** Change the signal this uses
     * @param {String} newSignal 
     */
    changeSignal(newSignal){
        this.signal = newSignal;
        this.store();
    }

    /** Send the signal
     * @param {String} userId 
     */
    send(userId=null){
        if(!userId && this.signal.includes(`####`)) throw new ConnectionError(err.SIGNAL_REQUIRES_USER_MENTION);
        var signalmessage = this.signal.replace(/####/g, `<@${userId}>`);
        messagesending.sendMessageOnChannel(this.endChannel, signalmessage, [], []);
    }

    /** Converts this connection to a JSON string
     * @returns {Object}
     */
    toJSON(){
        var returnobject = super.toJSON();
        returnobject.signal = this.signal;
        return returnobject;
    }

    /** Convert this connection to a descriptor string
     * @returns {String}
     */
    toString(){
        var startChannelString = "deleted-channel";
        if(this.startChannel){
            startChannelString = `${this.startChannel.guild.name}/${this.startChannel.name}`;
        }
        var endChannelString = "deleted-channel";
        if(this.endChannel){
            endChannelString = `${this.endChannel.guild.name}/${this.endChannel.name}`;
        }
        return `${this.id} : (Signal Connection) ${startChannelString} -> ${endChannelString}`;
    }

    /** Convert this connection to its full descriptor string
     * @returns {String}
     */
    toFullString(){
        var startingstring = this.toString();
        startingstring += `\n${this.signal}`;
        return startingstring;
    }

    /** Store this connection
     */
    store(){
        super.store(JSON.stringify(this));
    }

    /** Delete this connection's files
     */
    deleteFile(){
        super.deleteFile();
    }

    /** Create a signal connection from a JSON string
     * @param {ConnectionManager} manager
     * @param {Object} json 
     * @returns {(SignalConnection|undefined)}
     */
    static createFromJSON(manager, json){

        //retrieve channels
        var startChannel = manager.game.client.channels.cache.get(json.startchannelid);
        var endChannel = manager.game.client.channels.cache.get(json.endchannelid);

        //verify channels exist
        if(!startChannel || !endChannel) return undefined;

        //create connection
        return new SignalConnection(json.id, manager, startChannel, endChannel, json.signal);
    }
}

/** A UserConnection takes all messages sent by a particular user in all channels for the game and sends them to a particular channel
 * @typedef {UserConnection} UserConnection
 */
class UserConnection extends Connection{

    /** The user this connection takes messages from
     * @type {Discord.User}
     */
    startUser;

    /** The channel this connection sends messages to
     * @type {Discord.Channel}
     */
    endChannel;

    /** Create a new user connection
     * @param {String} id 
     * @param {ConnectionManager} manager
     * @param {Discord.User} user
     * @param {Discord.Channel} channel 
     */
    constructor(id, manager, user, channel, loading=false){
        super(id, manager, ConnectionTypes.USER);
        this.startUser = user;
        this.endChannel = channel;
        if(!loading) this.store();
        this.startEmitters();
    }

    destroy(){
        this.endEmitters();
        super.destroy();
    }

    /** Start listening to events
     */
    startEmitters(){
        this.manager.game.client.on('messageCreate', this.checkMessage);
        this.manager.game.client.on('channelDelete', this.channelDeleteEvent);
    }
    
    /** Stop listening to events
     */
    endEmitters(){
        this.manager.game.client.off('messageCreate', this.checkMessage);
        this.manager.game.client.off('channelDelete', this.channelDeleteEvent);
    }

    /** Respond to a message being sent
     * @param {Discord.Message} message 
     */
    checkMessage = (message) => {
        try{
            if(message.author.bot) return;
            if(message.author.id == this.startUser.id && admin.hasGuild(this.manager.game.id, message.guild.id)){
                this.send(message);
            }       
        }catch(error){
            console.error(error);
        }
    }

    /** Send a message on this connection
     * @param {Discord.Message} message 
     */
    send(message){
        messagesending.sendOnChannelWebhook(this.endChannel.id, message.author.username, message.author.avatarURL(), message.content, message.attachments.map(attachment => attachment.url), message.embeds);
    }

    /** Response to a channel being deleted
     * @param {Discord.Channel} channel 
     */
    channelDeleteEvent = (channel) => {
        if(this.endChannel.id == channel.id){
            this.manager.removeConnection(this.id);
        }
    }

    /** Convert this connection to a JSON string
     * @returns {Object}
     */
    toJSON(){
        var returnobject = super.toJSON();
        returnobject.startuserid = this.startUser.id;
        returnobject.endchannelid = this.endChannel.id;
        return returnobject;
    }

    /** Convert this connection to its descriptor string
     * @returns {Object}
     */
    toString(){
        return `${this.id} : (User Connection) ${this.startUser.username}#${this.startUser.discriminator} -> ${this.endChannel.guild.name}/${this.endChannel.name}`;
    }

    /** Convert this connection to its full descriptor string
     * @returns {Object}
     */
    toFullString(){
        return this.toString();
    }

    /** Store this connection
     */
    store(){
        super.store(JSON.stringify(this));
    }

    /** Delete this connection's files
     */
    deleteFile(){
        super.deleteFile();
    }

    /** Create a user connection from a JSON string
     * @param {ConnectionManager} manager
     * @param {Object} json 
     * @returns {(UserConnection|undefined)} The new connection
     */
    static createFromJSON(manager, json){

        //retrieve user and channel
        var user = manager.game.client.users.cache.get(json.startuserid);
        var channel = manager.game.client.channels.cache.get(json.endchannelid);

        //verify user and channel exist
        if(!user || !channel) return undefined;

        //create user connection with json information
        return new UserConnection(json.id, manager, user, channel, true);
    }
}

/** A PartialChannelConnection is incomplete and needs to be finished
 * @typedef {PartialChannelConnection} PartialChannelConnection
 */
class PartialChannelConnection extends Connection{
    
    /** The channel that starts the connection
     * @type {Discord.Channel}
     */
    startChannel;

    /** Create a new partial channel connection
     * @param {String} id
     * @param {ConnectionManager} manager
     * @param {Discord.Channel} startChannel
     */
    constructor(id, manager, startChannel, loading=false){
        super(id, manager, ConnectionTypes.PARTIAL_CHANNEL);
        this.startChannel = startChannel;
        if(!loading) this.store();
    }

    destroy(){
        super.destroy();
    }

    /** Convert this connection to JSON string
     * @returns {Object}
     */
    toJSON(){
        var returnobject = super.toJSON();
        returnobject.startchannelid = this.startChannel.id;
        return returnobject;
    }

    /** Convert this connection to its descriptor string
     * @returns {String}
     */
    toString(){
        var startingstring = "deleted-channel";
        if(this.startChannel){
            startingstring = `${this.startChannel.guild.name}/${this.startChannel.name}`;
        }
        return `${this.id}: (Partial Channel Connection) ${startingstring} -> ???`;
    }

    /** Convert this connection to its full descriptor string
     * @returns {String}
     */
    toFullString(){
        return this.toString();
    }

    /** Store this connection
     */
    store(){
        super.store(JSON.stringify(this));
    }

    /** Delete this connection's files
     */
    deleteFile(){
        super.deleteFile();
    }

    /** Create a PartialChannelConnection from json
     * @param {ConnectionManager} manager 
     * @param {Object} json 
     * @returns {(PartialChannelConnection|undefined)}
     */
    static createFromJSON(manager, json){

        //retrieve the channel
        var channel = manager.game.client.channels.cache.get(json.startchannelid);

        //if the channel doesn't exist, return undefined
        if(!channel) return undefined;

        //return the partial connection
        return new PartialChannelConnection(json.id, manager, channel, true);
    }
}

/** A PartialChannelConnection is incomplete and needs to be finished
 * @typedef {PartialUserConnection} PartialUserConnection
 */
class PartialUserConnection extends Connection{

    /** The user that starts the connection
     * @type {Discord.User}
     */
    startingUser;

    /** Create a partial connection
     * @param {String} id 
     * @param {ConnectionManager} manager 
     * @param {Discord.User} startingUser
     */
    constructor(id, manager, startingUser, loading=false){
        super(id, manager, ConnectionTypes.PARTIAL_USER);
        this.startingUser = startingUser;
        if(!loading) this.store();
    }

    destroy(){
        super.destroy();
    }

    /** Convert this connection to a JSON string
     * @returns {Object}
     */
    toJSON(){
        var returnobject = super.toJSON();
        returnobject.startinguserid = this.startingUser.id;
        return returnobject;
    }

    /** Convert this connection to its descriptor string
     * @returns {String}
     */
    toString(){
        var startingstring = `${this.startingUser.username}#${this.startingUser.discriminator}`;
        return `${this.id} : (Partial User Connection) ${startingstring} -> ???`;
    }

    /** Convert this connection to its full descriptor string
     * @returns {String}
     */
    toFullString(){
        return this.toString();
    }

    /** Store this connection
     */
    store(){
        super.store(JSON.stringify(this));
    }

    /** Delete this connection's files
     */
    deleteFile(){
        super.deleteFile();
    }

    /** Create a PartialChannelConnection from json
     * @param {ConnectionManager} manager 
     * @param {Object} json 
     * @returns {(PartialUserConnection|undefined)}
     */
     static createFromJSON(manager, json){

        //retrieve the channel
        var user = manager.game.client.users.cache.get(json.startinguserid);

        //if the channel doesn't exist, return undefined
        if(!user) return undefined;

        //return the partial connection
        return new PartialUserConnection(json.id, manager, user, true);
    }
}

/** The ConnectionManager handles all connections for a game
 * @typedef {ConnectionManager} ConnectionManager
 */
class ConnectionManager extends ModuleManager{

    /** The connections this manager holds
     * @type {Discord.Collection<String, Connection>}
     */
    connections;

    /** The ids for all standard connections this manager holds
     * @type {Array<String>}
     */
    standardids;

    /** The ids for all anonymous connections this manager holds
     * @type {Array<String>}
     */
    anonymousids;

    /** The ids for all signal connections this manager holds
     * @type {Array<String>}
     */
    signalids;

    /** The ids for all user connections this manager holds
     * @type {Array<String>}
     */
    userids;

    /** The ids for all partial channel connections this manager holds
     * @type {Array<String>}
     */
    partialchannelids;

    /** The ids for all partial user connections this manager holds
     * @type {Array<String>}
     */
    partialuserids;

    /** Create a connection manager
     * @param {Game} game
     */
    constructor(game){
        super(game, 'connections');
        this.connections = new Discord.Collection();
        this.standardids = [];
        this.anonymousids = [];
        this.signalids = [];
        this.userids = [];
        this.partialchannelids = [];
        this.partialuserids = [];
    }

    destroy(){
        this.connections.each(connection => {
            connection.destroy();
        })
    }

    /** Create a new id that hasn't been used
     * @returns {String}
     */
    generateNewId(){
        var newId = `${Math.floor(Math.random() * 1000000)}`;
        while(this.connections.has(newId)){
            newId = `${Math.floor(Math.random() * 1000000)}`;
        }
        return newId;
    }

    /** Retrieve all connections of a specific type
     * @param {String} type 
     * @returns {Discord.Collection<String, Connection>} The connections
     */
    retrieveTypeOfConnection(type){
        var connections = new Discord.Collection();
        switch(type){
            case ConnectionTypes.STANDARD:
                this.standardids.forEach(id => {
                    connections.set(id, this.connections.get(id));
                });
                break;
            case ConnectionTypes.ANONYMOUS:
                this.anonymousids.forEach(id => {
                    connections.set(id, this.connections.get(id));
                });
                break;
            case ConnectionTypes.SIGNAL:
                this.signalids.forEach(id => {
                    connections.set(id, this.connections.get(id));
                });
                break;
            case ConnectionTypes.USER:
                this.userids.forEach(id => {
                    connections.set(id, this.connections.get(id));
                });
                break;
            case ConnectionTypes.PARTIAL_CHANNEL:
                this.partialchannelids.forEach(id => {
                    connections.set(id, this.connections.get(id));
                });
                break;
            case ConnectionTypes.PARTIAL_USER:
                this.partialuserids.forEach(id => {
                    connections.set(id, this.connections.get(id));
                });
                break;
        }
        return connections;
    }

    /** Create a new standard connection
     * @param {Discord.Channel} startChannel 
     * @param {Discord.Channel} endChannel 
     */
    createStandardConnection(startChannel, endChannel){
        var connection = new StandardConnection(this.generateNewId(), this, startChannel, endChannel);
        this.connections.set(connection.id, connection);
        this.standardids.push(connection.id);
    }

    /** Create a new anonymous connection
     * @param {Discord.Channel} startChannel 
     * @param {Discord.Channel} endChannel 
     * @param {String} username 
     * @param {String} profilepicture 
     */
    async createAnonymousConnection(startChannel, endChannel, username, profilepicture){
        var connection = new AnonymousConnection(this.generateNewId(), this, startChannel, endChannel);
        await connection.init(username, profilepicture);
        this.connections.set(connection.id, connection);
        this.anonymousids.push(connection.id);
    }

    /** Create a new signal connection
     * @param {Discord.Channel} startChannel 
     * @param {Discord.Channel} endChannel
     * @param {String} signal 
     */
    createSignalConnection(startChannel, endChannel, signal=null){
        var connection;
        if(signal) connection = new SignalConnection(this.generateNewId(), this, startChannel, endChannel, signal);
        else connection = new SignalConnection(this.generateNewId(), this, startChannel, endChannel);
        this.connections.set(connection.id, connection);
        this.signalids.push(connection.id);
    }

    /** Create a new user connection
     * @param {Discord.User} user
     * @param {Discord.Channel} endChannel 
     */
    createUserConnection(user, endChannel){
        var connection = new UserConnection(this.generateNewId(), this, user, endChannel);
        this.connections.set(connection.id, connection);
        this.userids.push(connection.id);
    }

    /** Start a channel connection
     * @param {Discord.Channel} startChannel
     */
    startChannelConnection(startChannel){
        var connection = new PartialChannelConnection(this.generateNewId(), this, startChannel);
        this.connections.set(connection.id, connection);
        this.partialchannelids.push(connection.id);
    }

    /** Start a user connection
     * @param {Discord.User} user 
     */
    startUserConnection(user){
        var connection = new PartialUserConnection(this.generateNewId(), this, user);
        this.connections.set(connection.id, connection);
        this.partialuserids.push(connection.id);
    }

    /** Complete a partial channel connection as a standard connection
     * @param {String} connectionId 
     * @param {Discord.Channel} endChannel 
     */
    endStandardConnection(connectionId, endChannel){

        //retrieve the partial connection and ensure it's of the correct type
        var partialconnection = this.connections.get(connectionId);
        if(!partialconnection || !(partialconnection instanceof PartialChannelConnection)) return;

        //create a standard connection based off the partial connection's information
        var standardconnection = new StandardConnection(partialconnection.id, partialconnection.manager, partialconnection.startChannel, endChannel);
        
        //replace the partial connection with the standard connection
        this.connections.set(connectionId, standardconnection);

        //remove the connection id from partial connections and add it to standard connections
        this.partialchannelids.splice(this.partialchannelids.indexOf(connectionId), 1);
        this.standardids.push(connectionId);
    }

    /** Complete a partial channel connection as an anonymous connection
     * @param {String} connectionId 
     * @param {Discord.Channel} endChannel 
     * @param {String} username 
     * @param {String} profilepicture 
     */
    async endAnonymousConnection(connectionId, endChannel, username=null, profilepicture=null){

        //retrieve the partial connection and ensure it's of the right type
        var partialconnection = this.connections.get(connectionId);
        if(!partialconnection || !(partialconnection instanceof PartialChannelConnection)) return;

        //create an anonymous connection based off the partial connection's information
        var anonymousconnection = new AnonymousConnection(partialconnection.id, partialconnection.manager, partialconnection.startChannel, endChannel);
        await anonymousconnection.init(username, profilepicture);

        //replace the partial connection with the anonymous connection
        this.connections.set(connectionId, anonymousconnection);

        //remove the connection id from partial connections and add it to anonymous connections
        this.partialchannelids.splice(this.partialchannelids.indexOf(connectionId), 1);
        this.anonymousids.push(connectionId);
    }

    /** Complete a partial channel connection as a signal connection
     * @param {String} connectionId 
     * @param {Discord.Channel} endChannel 
     * @param {String} signal 
     */
    endSignalConnection(connectionId, endChannel, signal=null){
        
        //retrieve the partial connection and ensure it's of the right type
        var partialconnection = this.connections.get(connectionId);
        if(!partialconnection || !(partialconnection instanceof PartialChannelConnection)) return;

        //create a signal connection based off the partial connection's information
        var signalconnection = new SignalConnection(partialconnection.id, partialconnection.manager, partialconnection.startChannel, endChannel, signal);
        
        //replace the partial connection with the signal connection
        this.connections.set(connectionId, signalconnection);

        //remove the connection id from partial connections and add it to signal connections
        this.partialchannelids.splice(this.partialchannelids.indexOf(connectionId), 1);
        this.signalids.push(connectionId);
    }

    /** Complete a partial user connection as a user connection
     * @param {String} connectionId 
     * @param {Discord.Channel} endChannel 
     */
    endUserConnection(connectionId, endChannel){

        //retrieve the partial connection and ensure it's of the right type
        var partialconnection = this.connections.get(connectionId);
        if(!partialconnection || !(partialconnection instanceof PartialUserConnection)) return;

        //create a user connection based off the partial connection's information
        var userconnection = new UserConnection(partialconnection.id, partialconnection.manager, partialconnection.startingUser, endChannel);

        //replace the partial connection with the user connection
        this.connection.set(connectionId, userconnection);

        //remove the connection id from partial connections and add it to user connections
        this.partialchannelids.splice(this.partialchannelids.indexOf(connectionId), 1);
        this.userids.push(connectionId);
    }

    /** Remove a specific connection
     * @param {String} connectionId 
     */
    removeConnection(connectionId){
        var connection = this.connections.get(connectionId);
        if(!connection) return;
        var type = connection.type;
        connection.destroy();
        this.connections.delete(connectionId);
        switch(type){
            case ConnectionTypes.STANDARD:
                this.standardids.splice(this.standardids.indexOf(connectionId), 1);
                break;
            case ConnectionTypes.ANONYMOUS:
                this.anonymousids.splice(this.anonymousids.indexOf(connectionId), 1);
                break;
            case ConnectionTypes.SIGNAL:
                this.signalids.splice(this.signalids.indexOf(connectionId), 1);
                break;
            case ConnectionTypes.USER:
                this.userids.splice(this.userids.indexOf(connectionId), 1);
                break;
            case ConnectionTypes.PARTIAL_CHANNEL:
                this.partialchannelids.splice(this.partialchannelids.indexOf(connectionId), 1);
                break;
            case ConnectionTypes.PARTIAL_USER:
                this.partialuserids.splice(this.partialuserids.indexOf(connectionId), 1);
                break;
        }
    }

    /** Load all connections from files
     */
    loadConnections(){
        var connectionIds = datawriting.retrieveSubFolder(this.game.id, `Connections`);
        connectionIds.forEach(connectionId => {
            var connection = Connection.load(this, connectionId);
            if(connection){
                this.connections.set(connectionId, connection);
                switch(connection.type){
                    case ConnectionTypes.STANDARD:
                        this.standardids.push(connectionId);
                        break;
                    case ConnectionTypes.ANONYMOUS:
                        this.anonymousids.push(connectionId);
                        break;
                    case ConnectionTypes.SIGNAL:
                        this.signalids.push(connectionId);
                        break;
                    case ConnectionTypes.USER:
                        this.userids.push(connectionId);
                        break;
                    case ConnectionTypes.PARTIAL_CHANNEL:
                        this.partialchannelids.push(connectionId);
                        break;
                    case ConnectionTypes.PARTIAL_USER:
                        this.partialuserids.push(connectionId);
                        break;
                }
            }
        });
    }

    toJSON(){
        return {};
    }
}

module.exports = {
    Connection: Connection,
    StandardConnection: StandardConnection,
    AnonymousConnection: AnonymousConnection,
    SignalConnection: SignalConnection,
    UserConnection: UserConnection,
    PartialChannelConnection: PartialChannelConnection,
    PartialUserConnection: PartialUserConnection,
    ConnectionManager: ConnectionManager,
}