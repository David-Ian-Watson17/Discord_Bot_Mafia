const Discord = require('discord.js');
const chatroomCode = require('../../../chatrooms/code.js');
const ChatroomEvents = require('../../../chatrooms/code/events.js').Events;
const {Chatroom} = require('../../../chatrooms/code/classes/Chatroom.js');
const {Account} = require('../../../chatrooms/code/classes/Account.js');
const datawriting = require('../../../../handlers/datahandler.js');
const {BaseVoteObject} = require('./BaseVoteObject.js');
const {Events, VoterSourceTypes} = require('../Constants.js');
const {err, VotingError} = require('../VotingError.js');

/** A Voter Source is a place for voter managers to draw voters from
 * @typedef {VoterSource} VoterSource
 */
 class VoterSource extends BaseVoteObject{

    /** The id of this voter source
     * @type {String}
     */
     id;

     /** The type of this voter source
      * @type {String}
      */
     type;

    /** Create a new VoterSource
     * @param {VotingClient} votingClient 
     */
    constructor(votingClient, id, type){
        super(votingClient);
        this.id = id;
        this.type = type;
    }

    /** Destroy this Voter Source, deleting its files as well
     */
    destroy(){

    }

    /** Returns all voter objects obtainable by this source
     * @returns {Discord.Collection<String, Object>}
     */
    fetchVoterObjects(){
        return {};
    }

    /** Convert this voter source to a JSON string
     * @returns {Object}
     */
    toJSON(){
        var returnobject = {};
        returnobject.id = this.id;
        returnobject.type = this.type;
        return returnobject;
    }

    toString(){
        return `${this.id} (${this.type})`;
    }

    /** Create a voter source from Json
     * @param {VotingClient} votingClient 
     * @param {Object} voterSourceJson 
     */
    static createFromJSON(votingClient, voterSourceJson){
        if(!voterSourceJson) return undefined;
        switch(voterSourceJson.type){
            case VoterSourceTypes.DISCORD_ROLE_SOURCE:
                return DiscordRoleVoterSource.createFromJSON(votingClient, voterSourceJson);
            case VoterSourceTypes.DISCORD_USER_SOURCE:
                return DiscordUserVoterSource.createFromJSON(votingClient, voterSourceJson);
            case VoterSourceTypes.CHATROOM_SOURCE:
                return ChatroomVoterSource.createFromJSON(votingClient, voterSourceJson);
            case VoterSourceTypes.CHATROOM_ACCOUNT_SOURCE:
                return ChatroomAccountVoterSource.createFromJSON(votingClient, voterSourceJson);
            default:
                return undefined;
        }
    }
}

/** A DiscordRoleVoterSource is VoterSource that draws from a discord role for voter objects
 * @typedef {DiscordRoleVoterSource} DiscordRoleVoterSource
 */
class DiscordRoleVoterSource extends VoterSource{
    
    /** The client this source relies on for role updates
     * @type {Discord.Client}
     */
    client;

    /** The role this source draws from
     * @type {Discord.Role}
     */
    role;

    /** Create a new DiscordRoleVoterSource
     * @param {VotingClient} votingClient 
     * @param {Discord.Client} client 
     * @param {Discord.Role} role 
     */
    constructor(votingClient, client, id, role){
        super(votingClient, id, VoterSourceTypes.DISCORD_ROLE_SOURCE);
        this.client = client;
        this.role = role;
        this.startEmitters();
    }

    /** Destroy this source, ending its updates
     */
    destroy(foldername=null){
        this.endEmitters();
        super.destroy(foldername);
    }

    /** Start listening to updates
     */
    startEmitters(){
        this.client.on('guildMemberUpdate', this.memberUpdatedEvent);
        this.client.on('roleDelete', this.roleDeletedEvent);
    }

    /** Stop listening to updates
     */
    endEmitters(){
        this.client.off('guildMemberUpdate', this.memberUpdatedEvent);
        this.client.off('roleDelete', this.roleDeletedEvent);
    }

    /** Fetch a collection of the users this 
     * @returns {Discord.Collection<String, Discord.User>}
     */
    fetchVoterObjects(){
        //setup collection
        var userCollection = new Discord.Collection();

        //retrieve the user from each member
        this.role.members.each(member => {
            userCollection.set(member.user.id, member.user);
        });

        //return the collection
        return userCollection;
    }

    /** Role deleted, check if this role was the one deleted
     * @param {Discord.Role} role 
     */
    roleDeletedEvent = (role) => {

        //if the role is the same as this one
        if(this.role.id == role.id){
            this.endEmitters();
            this.role = null;
            this.votingClient.emitVoterSourceInvalidated(this);
        }
    }

    /** Member update, check for role addition or removal
     * @param {Discord.GuildMember} oldMember 
     * @param {Discord.GuildMember} newMember 
     */
    memberUpdatedEvent = (oldMember, newMember) => {
        
        //if the member had this role and it was removed
        if(oldMember.roles.cache.has(this.role.id) && !newMember.roles.cache.has(this.role.id)){
            this.votingClient.emitVoterSourceMembersRemoved(this);
        }

        //if the member didn't have this role and it was added
        if(newMember.roles.cache.has(this.role.id) && !oldMember.roles.cache.has(this.role.id)){
            this.votingClient.emitVoterSourceMembersAdded(this);
        }
    }

    /** Converts this source to a JSON string
     * @returns {Object} The json string
     */
    toJSON(){
        var returnobject = super.toJSON()
        returnobject.guildid = this.role.guild.id;
        returnobject.roleid = this.role.id;
        return returnobject;
    }

    /** Returns the name of this role
     * @returns {String} The string
     */
    toString(){
        return this.role.name;
    }

    /** Create a DiscordRoleVoterSource from json
     * @param {VotingClient} votingClient 
     * @param {Object} roleSourceJson 
     * @returns {(DiscordRoleVoterSource|undefined)} The new source
     */
    static createFromJSON(votingClient, roleSourceJson){
        if(!roleSourceJson) return undefined;
        var guild = votingClient.manager.game.client.guilds.cache.get(roleSourceJson.guildid);
        if(!guild) return undefined;
        var role = guild.roles.cache.get(roleSourceJson.roleid);
        if(!role) return undefined;
        var newSource = new DiscordRoleVoterSource(votingClient, votingClient.manager.game.client, role.id, role);
        return newSource;
    }
}

/** A Voter Source that draws its voter from a discord user
 * @typedef {DiscordUserVoterSource} DiscordUserVoterSource
 */
class DiscordUserVoterSource extends VoterSource{

    /** The client this source uses to receive updates
     * @type {Discord.Client}
     */
    client;

    /** The user this keeps track of
     * @type {Discord.User}
     */
    user;

    /** Create a new DiscordUserVoterSource
     * @param {VotingClient} votingClient 
     * @param {String} id 
     * @param {Discord.User} user 
     */
    constructor(votingClient, client, id, user){
        super(votingClient, id, VoterSourceTypes.DISCORD_USER_SOURCE);
        this.client = client;
        this.user = user;
    }

    /** Destroy this source, ending its emitters
     */
    destroy(){
        this.endEmitters();
    }

    /** Start responding to events
     */
    startEmitters(){
        this.client.on('guildMemberRemove', this.memberRemovedEvent);
    }

    /** Stop responding to events
     */
    endEmitters(){
        this.client.off('guildMemberRemove', this.memberRemovedEvent);
    }

    /** Response to a member being removed
     * @param {Discord.GuildMember} member 
     */
    memberRemovedEvent = (member) => {

        //if it was this user and the user cannot be found in the client
        if(member.id == this.user.id && this.client.users.has(member.user.id)){
            
            //invalidate this source
            this.endEmitters();
            this.user = null;
            this.votingClient.emitVoterSourceInvalidated(this);
        }
    }

    /** Return the user this looks after
     * @returns {Discord.User} The user
     */
    fetchVoterObjects(){
        return this.user;
    }

    /** Convert this source to a JSON string
     * @returns {Object}
     */
    toJSON(){
        var returnobject = super.toJSON();
        returnobject.userId = this.user.id;
        return returnobject;
    }

    /** Returns the toString of the user this looks after 
     * @returns {String} The string
     */
    toString(){
        return `${this.user.username}#${this.user.discriminator}`;
    }

    /** Create a new user source from json
     * @param {Object} sourceJson 
     * @returns {(DiscordUserVoterSource|undefined)} The new source
     */
    static createFromJSON(votingClient, sourceJson){
        if(!sourceJson) return undefined;
        var user = votingClient.manager.game.client.users.cache.get(sourceJson.userId);
        if(!user) return undefined;
        return new DiscordUserVoterSource(votingClient, votingClient.manager.game.client, sourceJson.id, user);
    }
}

/** A Voter Source that draws its voters from the accounts of a chatroom
 * @typedef {ChatroomVoterSource} ChatroomVoterSource
 */
class ChatroomVoterSource extends VoterSource{
    
    /** The chatroom this voter source draws from
     * @type {Chatroom}
     */
    chatroom;

    /** Create a new ChatroomVoterSource
     * @param {VotingClient} votingClient 
     * @param {String} id 
     * @param {Chatroom} chatroom 
     */
    constructor(votingClient, id, chatroom){
        super(votingClient, id, VoterSourceTypes.CHATROOM_SOURCE);
        this.chatroom = chatroom;
    }

    /** Destroy this source, ending its emitters
     */
    destroy(){
        this.endEmitters();
    }

    /** Start listening to updates
     */
    startEmitters(){
        this.chatroom.on(ChatroomEvents.ACCOUNT_REGISTERED, this.accountCreatedEvent);
        this.chatroom.on(ChatroomEvents.ACCOUNT_UNREGISTERED, this.accountDeletedEvent);
        this.chatroom.on(ChatroomEvents.ACCOUNT_REMOVED, this.accountDeletedEvent);
        this.chatroom.on(ChatroomEvents.CHATROOM_DESTROYED, this.chatroomDeletedEvent);
    }

    /** Stop listening to updates
     */
    endEmitters(){
        this.chatroom.off(ChatroomEvents.ACCOUNT_REGISTERED, this.accountCreatedEvent);
        this.chatroom.off(ChatroomEvents.ACCOUNT_UNREGISTERED, this.accountDeletedEvent);
        this.chatroom.off(ChatroomEvents.ACCOUNT_REMOVED, this.accountDeletedEvent);
        this.chatroom.off(ChatroomEvents.CHATROOM_DESTROYED, this.chatroomDeletedEvent);
    }

    /** Retrieves the accounts the chatroom looks after
     * @returns {Discord.Collection<String, Account>}
     */
    fetchVoterObjects(){
        var accountCollection = new Discord.Collection();
        this.chatroom.accounts.cache.each(account => {
            accountCollection.set(account.id, account);
        });
        return accountCollection.filter(account => account.registered);
    }

    /** Response to a chatroom being deleted
     * @param {Chatroom} chatroom
     */
    chatroomDeletedEvent = (chatroom) => {
        this.endEmitters();
        this.chatroom = null;
        this.emitVoterSourceInvalidated(this);
    }

    /** Response to an account being created
     * @param {Account} account 
     */
    accountCreatedEvent = (account) => {
        this.emitVoterSourceMembersAdded(this);
    }

    /** Response to an account being deleted
     * @param {Account} account 
     */
    accountDeletedEvent = (account) => {
        this.emitVoterSourceMembersRemoved(this);
    }

    /** Convert this voter source to a JSON string
     * @returns {Object} the JSON string
     */
    toJSON(){
        var returnobject = super.toJSON();
        returnobject.chatroomId = this.chatroom.id;
        return returnobject;
    }

    /** Returns the name of the chatroom this looks after
     */
    toString(){
        return this.chatroom.name;
    }

    /** Create a new ChatroomVoterSource from its JSON string
     * @param {VotingClient} votingClient 
     * @param {Object} sourceJson 
     * @returns {(ChatroomVoterSource|undefined)} The source
     */
    static createFromJSON(votingClient, sourceJson){
        if(!sourceJson) return undefined;
        var chatroom = chatroomCode.getChatroomById(votingClient.game.id, sourceJson.chatroomId);
        if(!chatroom) return undefined;
        return new ChatroomVoterSource(votingClient, sourceJson.id, chatroom);
    }
}

/** A Voter Source that keeps track of a single chatroom account
 * @typedef {ChatroomAccountVoterSource} ChatroomAccountVoterSource
 */
class ChatroomAccountVoterSource extends VoterSource{

    /** The account this source keeps track of
     * @type {Account}
     */
    account;

    /** Create a new ChatroomAccountVoterSource
     * @param {VotingClient} votingClient 
     * @param {String} id 
     * @param {Account} account 
     */
    constructor(votingClient, id, account){
        super(votingClient, id, VoterSourceTypes.CHATROOM_ACCOUNT_SOURCE);
        this.account = account;
    }

    /** Destroy this source, ending its emitters
     */
    destroy(){
        this.endEmitters();
    }

    /** Start listening to updates
     */
    startEmitters(){
        this.account.chatroom.on(Events.ACCOUNT_REMOVED, this.accountRemovedEvent);
    }

    /** Stop listening to updates
     */
    endEmitters(){
        this.account.chatroom.off(Events.ACCOUNT_REMOVED, this.accountRemovedEvent);
    }

    /** Return the account this source keeps track of
     * @returns {Account}
     */
    fetchVoterObjects(){
        return this.account;
    }

    /** Response to an account being removed
     * @param {Account} account 
     */
    accountRemovedEvent = (account) => {

        //if the account was the one this looks after
        if(this.account.id == account.id){
            
            //invalidate this source
            this.endEmitters();
            this.account = null;
            this.votingClient.emitVoterSourceInvalidated(this);
        }
    }

    /** Converts this source to a JSON string
     */
    toJSON(){
        var returnobject = super.toJSON();
        returnobject.chatroomId = this.account.chatroom.id;
        returnobject.accountId = this.account.id;
        return returnobject;
    }

    /** Returns the string for the account this looks after
     */
    toString(){
        return this.account.toString();
    }

    /** Create a new ChatroomAccountVoterSource from JSON
     * @param {Object} sourceJson
     * @returns {(ChatroomAccountVoterSource|undefined)} The source
     */
    static createFromJSON(votingClient, sourceJson){
        if(!sourceJson) return undefined;
        var chatroom = chatroomCode.getChatroomById(votingClient.game.id, sourceJson.chatroomId);
        if(!chatroom) return undefined;
        var account = chatroom.accounts.get(sourceJson.accountId);
        if(!account) return undefined;
        return new ChatroomAccountVoterSource(votingClient, sourceJson.id, account);
    }
}

module.exports = {
    VoterSource: VoterSource,
    DiscordRoleVoterSource: DiscordRoleVoterSource,
    DiscordUserVoterSource: DiscordUserVoterSource,
    ChatroomVoterSource: ChatroomVoterSource,
    ChatroomAccountVoterSource: ChatroomAccountVoterSource
}