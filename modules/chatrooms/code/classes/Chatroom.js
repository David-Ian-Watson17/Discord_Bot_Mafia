const Discord = require('discord.js');
const EventEmitter = require('events').EventEmitter;

const datawriting = require('../../../../handlers/datahandler.js');
const {AccountManager} = require('./AccountManager.js');
const {Account} = require('./Account.js');
const {User} = require('./User.js');
const {MessageHandler} = require('./MessageHandler.js');
const {ChatroomError, err} = require('../ChatroomError.js');
const {Events} = require('../events.js');
const {Game} = require('../../../../classes/game.js');

/** A Chatroom
 * @typedef {Chatroom} Chatroom
 */
 class Chatroom extends EventEmitter{

    /** The manager this chatroom is governed by
     * @type {ChatroomManager}
     */
    manager;

    /** The id of this chatroom
     * @type {String}
     */
    id;

    /** The name of this chatroom
     * @type {String}
     */
    name;

    /** The accounts this chatroom holds
     * @type {AccountManager}
     */
    accounts;

    /** The terminals this chatroom holds
     * @type {Discord.Collection<String, Discord.Channel>}
     */
    terminals;

    /** The message handler for this chatroom
     * @type {MessageHandler}
     */
    messagehandler;

    /** Create a new chatroom
     * @param {ChatroomManager} manager
     * @param {String} id 
     * @param {String} name 
     */
    constructor(manager, id, name, loading=false){
        super();
        this.manager = manager;
        this.id = id;
        this.name = name;
        this.accounts = null;
        this.messagehandler = new MessageHandler(this);
        this.terminals = new Discord.Collection();
        if(!loading){
            this.accounts = new AccountManager(this);
            this.store();
        }
        this.startEmitters();
    }

    /** Clean up this chatroom as a final act
     */
    destroy(){
        this.endEmitters();
        this.messagehandler.destroy();
        this.accounts.destroy();
        this.terminals.clear();
        this.deleteFile();
    }

    startEmitters(){
        this.manager.game.client.on('channelDelete', channel => {if(this.terminals.has(channel.id)) this.removeTerminal(channel.id);});
    }

    endEmitters(){
        this.manager.game.client.off('channelDelete', channel => {if(this.terminals.has(channel.id)) this.removeTerminal(channel.id);});
    }

    /** Change the name of this chatroom
     * @param {String} newName 
     */
    changeName(newName){
        //verify the name is free
        if(this.manager.nameMapping.has(newName)) throw new ChatroomError(err.CHATROOM_NAME_TAKEN);

        //claim name
        this.manager.nameMapping.set(newName, this.id);

        //erase old name
        this.manager.nameMapping.delete(this.name);

        //change name
        this.name = newName;

        //store
        this.store();
    }
    
    /** Add a channel to this manager as a terminal
     * @param {Discord.Channel} channel
     */
    addTerminal(channel){

        //verify it doesn't already belong to this chatroom
        if(this.terminals.has(channel.id)) throw new ChatroomError(err.TERMINAL_ALREADY_EXISTS);

        //verify the manager hasn't already placed it
        if(this.manager.terminalMapping.has(channel.id)) throw new ChatroomError(err.TERMINAL_ALREADY_TAKEN);

        //add terminal to manager mapping
        this.manager.terminalMapping.set(channel.id, this.id);

        //add terminal to chatroom
        this.terminals.set(channel.id, channel);

        //emit event
        this.emitTerminalAdded(channel.id);

        //store
        this.store();
    }

    /** Remove a channel from this manager as a terminal based on its id
     * @param {String} channelId 
     */
    removeTerminal(channelId){

        //verify it belongs to this chatroom
        if(!this.terminals.has(channelId)) throw new ChatroomError(err.TERMINAL_DOESNT_EXIST);

        //remove the terminal from the chatroom
        this.terminals.delete(channelId);

        //remove the terminal from the manager's terminal mapping
        this.manager.terminalMapping.delete(channelId);

        //emit event
        this.emitTerminalRemoved(channelId);

        //store
        this.store();
    }

    /** Convert this chatroom to a string with its name and id
     * @returns {String} The string
     */
    toString(){
        return `${this.name} (${this.id})`;
    }

    /** Convert this chatroom to its profile embed for display purposes
     * @returns {Discord.MessageEmbed} The profile embed
     */
    toProfileEmbed(){
        
        //retrieve title and description
        var title = `${this.name} (${this.id})`;
        var description = "";
        
        //get pertinent information for each account
        var accountfieldvalue = "";
        if(this.accounts.cache.size == 0) accountfieldvalue = "There are no accounts in this chatroom.";
        this.accounts.cache.each(account => {
            accountfieldvalue += `${account.toString()}\n`;
        });

        //get pertinent information for each user
        var userfieldvalue = "";
        if(this.accounts.users.size == 0) userfieldvalue = "There are no users in this chatroom.";
        this.accounts.users.each(user => {
            userfieldvalue += `${user.toString()}\n`;
        })

        //get pertinent information for each terminal
        var terminalfieldvalue = "";
        if(this.terminals.size == 0) terminalfieldvalue = "There are no terminals in this chatroom.";
        this.terminals.each(terminal => {
            terminalfieldvalue += `${terminal.guild.name} / #${terminal.name}\n`;
        });

        //create embed and return
        var embed = new Discord.MessageEmbed()
            .setTitle(title)
            .setDescription(description)
            .addFields(
                {name: "Accounts", value: accountfieldvalue},
                {name: "Users", value: userfieldvalue},
                {name: "Terminals", value: terminalfieldvalue}
            );

        return embed;
    }

    /** Function used to stringify this chatroom's core information
     * @returns {Object}
     */
    toJSON(){
        var returnobject = {};
        returnobject.id = this.id;
        returnobject.name = this.name;
        returnobject.terminals = [];
        this.terminals.each((terminal, terminalId) => {
            returnobject.terminals.push(terminalId);
        });
        return returnobject;
    }

    /** Store this chatroom in files
     */
    store(){
        datawriting.putData(this.manager.game.id, `Chatrooms/${this.id}/Information.json`, JSON.stringify(this));
    }

    /** Delete this chatroom's files
     */
    deleteFile(){
        datawriting.deleteSubFolder(this.manager.game.id, `Chatrooms/${this.id}`);
    }

    /** Load a specific chatroom
     * @param {ChatroomManager} manager 
     * @param {String} chatroomId 
     * @returns {(Chatroom|undefined)} The chatroom
     */
    static load(manager, chatroomId){

        //retrieve the raw data
        var rawdata = datawriting.retrieveData(manager.game.id, `Chatrooms/${chatroomId}/Information.json`);

        //if it doesn't exist, return null
        if(!rawdata) return undefined;

        //parse data
        var jsonChatroom = JSON.parse(rawdata);

        //create new chatroom
        var chatroom = new Chatroom(manager, chatroomId, jsonChatroom.name, true);

        //load terminals
        jsonChatroom.terminals.forEach(terminalId => {
            var channel = chatroom.manager.game.client.channels.cache.get(terminalId);
            if(channel){
                chatroom.terminals.set(channel.id, channel);
                manager.terminalMapping.set(channel.id, chatroomId);
            }
        });

        //load account manager
        chatroom.accounts = AccountManager.load(chatroom);

        //return the newly made chatroom
        return chatroom;
    }

    /*
    EVENT EMITTING
    */

    emitChatroomDestroyed(){
        this.emit(Events.CHATROOM_DESTROYED, this);
    }

    emitChatroomUpdated(){
        this.emit(Events.CHATROOM_UPDATED, this);
    }

    emitTerminalAdded(terminalId){
        this.emit(Events.TERMINAL_ADDED, {chatroom: this, terminalId: terminalId});
    }

    emitTerminalRemoved(terminalId){
        this.emit(Events.TERMINAL_REMOVED, {chatroom: this, terminalId: terminalId});
    }

    emitAccountAdded(account){
        this.emit(Events.ACCOUNT_ADDED, account);
    }

    emitAccountRemoved(account){
        this.emit(Events.ACCOUNT_REMOVED, account);
    }

    emitAccountUpdated(account){
        this.emit(Events.ACCOUNT_UPDATED, account);
    }

    emitAccountRegistered(account, requesterId){
        this.emit(Events.ACCOUNT_REGISTERED, {account: account, requester: requesterId});
    }

    emitAccountUnregistered(account, oldUsername, oldProfilePicture, requesterId){
        this.emit(Events.ACCOUNT_UNREGISTERED, {account: account, username: oldUsername, profilepicture: oldProfilePicture, requester: requesterId});
    }

    emitAccountUsernameChanged(account, oldUsername, requesterId){
        this.emit(Events.ACCOUNT_USERNAME_CHANGED, {account: account, username: oldUsername, requester: requesterId});
    }

    emitAccountProfilePictureChanged(account, oldProfilePicture, requesterId){
        this.emit(Events.ACCOUNT_PROFILE_PICTURE_CHANGED, {account: account, profilepicture: oldProfilePicture, requester: requesterId});
    }

    emitUserAddedToAccount(account, user){
        this.emit(Events.USER_ADDED_TO_ACCOUNT, {account: account, user: user});
    }

    emitUserRemovedFromAccount(account, user){
        this.emit(Events.USER_REMOVED_FROM_ACCOUNT, {account: account, user: user});
    }

    emitUserPermissionsChanged(account){
        this.emit(Events.USER_PERMISSIONS_CHANGED, account);
    }

    emitUserCreated(user){
        this.emit(Events.USER_CREATED, user);
    }

    emitUserDeleted(user){
        this.emit(Events.USER_DELETED, user);
    }

    emitLogin(user){
        this.emit(Events.LOGIN, user);
    }

    emitLogout(user){
        this.emit(Events.LOGOUT, user);
    }
}

module.exports = {
    Chatroom: Chatroom
}