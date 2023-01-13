const Discord = require('discord.js');
const datawriting = require('../../../../handlers/datahandler.js');
const {BaseVoteObject} = require('./BaseVoteObject.js');
const {VoterSource, DiscordRoleVoterSource, DiscordUserVoterSource, ChatroomVoterSource, ChatroomAccountVoterSource} = require('./VoterSource.js');
const {returncodes, Events, VoterTypes} = require('../Constants.js');
const {err, VotingError} = require('../VotingError.js');

/** A Voter Source Manager keeps track of all the sources a voter manager uses
 * @typedef {VoterSourceManager} VoterSourceManager
 */
 class VoterSourceManager extends BaseVoteObject{

    /** The type of VoterObjects this source manages
     * @type {String}
     */
    type;

    /** Create a new VoterSourceManager
     * @param {VotingClient} votingClient 
     * @param {String} type
     */
    constructor(votingClient, type){
        super(votingClient);
        this.type = type;
    }

    /** Destroy this VoterSourceManager
     */
    destroy(){
        this.deleteFile();
    }

    /** Return the voter objects of this manager
     * @returns {Discord.Collection<String, Object>}
     */
    fetchVoterObjects(){
        return {};
    }

    /** Retrieve the voter id for a discord user's id, or undefined if none
     * @param {String} userId 
     * @returns {(String|undefined)} The voter id
     */
    getVoterIdForDiscordUserId(userId){
        return userId;
    }

    /*
    Probably not good design, but putting every source manager specific function in here to throw errors.
    If any of these functions are called, it means that an attempt was made to call a function in a source manager of
    an incorrect type and it was redirected to the parent class.
    */

    addVotingRole(){
        throw new VotingError(err.VOTER_SOURCE_MANAGER_NOT_OF_CORRECT_TYPE);
    }

    removeVotingRole(){
        throw new VotingError(err.VOTER_SOURCE_MANAGER_NOT_OF_CORRECT_TYPE);
    }

    addWhitelistedUser(){
        throw new VotingError(err.VOTER_SOURCE_MANAGER_NOT_OF_CORRECT_TYPE);
    }

    removeWhitelistedUser(){
        throw new VotingError(err.VOTER_SOURCE_MANAGER_NOT_OF_CORRECT_TYPE);
    }

    addBlacklistedUser(){
        throw new VotingError(err.VOTER_SOURCE_MANAGER_NOT_OF_CORRECT_TYPE);
    }

    removeBlacklistedUser(){
        throw new VotingError(err.VOTER_SOURCE_MANAGER_NOT_OF_CORRECT_TYPE);
    }

    setChatroomSource(){
        throw new VotingError(err.VOTER_SOURCE_MANAGER_NOT_OF_CORRECT_TYPE);
    }

    addBlacklistedAccount(){
        throw new VotingError(err.VOTER_SOURCE_MANAGER_NOT_OF_CORRECT_TYPE);
    }

    removeBlacklistedAccount(){
        throw new VotingError(err.VOTER_SOURCE_MANAGER_NOT_OF_CORRECT_TYPE);
    }

    /** Converts this Source Manager to a JSON string
     * @returns {Object} The JSON String
     */
    toJSON(){
        var returnobject = {};
        returnobject.type = this.type;
        return returnobject;
    }

    /** (ABSTRACT) Store this manager in files
     */
    store(){
        
    }

    /** Delete this manager's files
     */
    deleteFile(){
        datawriting.deleteFile(this.votingClient.manager.game.id, `Voting/${this.votingClient.id}/Voters/VoterSources.json`);
    }

    /** Load a voting client's VoterSourceManager
     * @param {VotingClient} votingClient 
     * @returns {(DiscordUserVoterSourceManager|ChatroomAccountVoterSourceManager|null)} The Source Manager
     */
    static load(votingClient){

        //retrieve raw data
        var rawSourceManagerData = datawriting.retrieveData(votingClient.manager.game.id, `Voting/${votingClient.id}/Voters/VoterSources.json`);

        //verify it exists
        if(!rawSourceManagerData) return null;

        //parse the data
        var voterSourceManagerJson = JSON.parse(rawSourceManagerData);

        //create appropriate source
        switch(voterSourceManagerJson.type){
            case VoterTypes.DISCORD_USER:
                return DiscordUserVoterSourceManager.createFromJson(votingClient, voterSourceManagerJson);
            case VoterTypes.CHATROOM_ACCOUNT:
                return ChatroomAccountVoterSourceManager.createFromJson(votingClient, voterSourceManagerJson);
            default:
                return undefined;
        }
    }
}

/** A Voter Source Manager that keeps track of discord users
 * @typedef {DiscordUserVoterSourceManager} DiscordUserVoterSourceManager
 */
class DiscordUserVoterSourceManager extends VoterSourceManager{

    /** The roles this manager uses
     * @type {Discord.Collection<String, DiscordRoleVoterSource>} 
     */
    votingRoles;

    /** The users this manager whitelists, allowing to vote despite roles
     * @type {Discord.Collection<String, DiscordUserVoterSource>}
     */
    whitelistedUsers;

    /** The users this manager blacklists, forbidding them from voting despite roles
     * @type {Discord.Collection<String, DiscordUserVoterSource>}
     */
    blacklistedUsers;

    /** Create a new DiscordUserVoterSourceManager
     * @param {VotingClient} votingClient 
     */
    constructor(votingClient, loading=false){
        super(votingClient, VoterTypes.DISCORD_USER);
        this.votingRoles = new Discord.Collection();
        this.whitelistedUsers = new Discord.Collection();
        this.blacklistedUsers = new Discord.Collection();
        this.startEmitters();
        if(!loading){
            this.store();
        }
    }

    /** Destroy this manager
     */
    destroy(){
        this.endEmitters();
        this.votingRoles.each(source => {
            source.destroy();
        });
        this.whitelistedUsers.each(source => {
            source.destroy();
        });
        this.blacklistedUsers.each(source => {
            source.destroy();
        });
        this.votingRoles.clear();
        this.whitelistedUsers.clear();
        this.blacklistedUsers.clear();
        super.destroy();
    }

    /** Start listening to update events
     */
    startEmitters(){
        this.votingClient.on(Events.VOTER_SOURCE_MEMBERS_ADDED, this.voterSourceMembersUpdate);
        this.votingClient.on(Events.VOTER_SOURCE_MEMBERS_REMOVED, this.voterSourceMembersUpdate);
        this.votingClient.on(Events.VOTER_SOURCE_INVALIDATED, this.voterSourceInvalidated);
    }

    /** Stop listening to update events
     */
    endEmitters(){
        this.votingClient.off(Events.VOTER_SOURCE_MEMBERS_ADDED, this.voterSourceMembersUpdate);
        this.votingClient.off(Events.VOTER_SOURCE_MEMBERS_REMOVED, this.voterSourceMembersUpdate);
        this.votingClient.off(Events.VOTER_SOURCE_INVALIDATED, this.voterSourceInvalidated);
    }

    /** Retrieve all valid voter objects from this manager
     * @returns {Discord.Collection<String, Discord.User>} The voter objects
     */
    fetchVoterObjects(){
        //create collection to hold users
        var userCollection = new Discord.Collection();

        //for each whitelisted voter
        this.whitelistedUsers.each(userSource => {
            var user = userSource.fetchVoterObjects();
            userCollection.set(user.id, user);
        });

        //for each voting role
        this.votingRoles.each(votingRoleSource => {

            //retrieve all users
            var users = votingRoleSource.fetchVoterObjects();

            //for each user
            users.each(user => {

                //if the collection doesn't have the user
                if(!userCollection.has(user.id)){

                    //add the user to the collection
                    userCollection.set(user.id, user);
                }
            });
        });

        //for each blacklisted voter
        this.blacklistedUsers.each(userSource => {

            //retrieve the user
            var user = userSource.fetchVoterObjects();

            //if the collection has the user
            if(userCollection.has(user.id)){

                //remove the user
                userCollection.delete(user.id);
            }
        });

        //return the collection
        return userCollection;
    }

    /** Retrieve the voter id for a discord user's id, or undefined if none
     * @param {String} userId 
     * @returns {(String|undefined)} The voter id
     */
    getVoterIdForDiscordUserId(userId){
        return userId;
    }

    /** Add a Discord Role to the list of sources this manager draws from
     * @param {Discord.Role} role 
     */
    addVotingRole(role){
        //verify that the role is not present
        if(this.votingRoles.has(role.id)) throw new VotingError(err.VOTER_SOURCE_ALREADY_PRESENT);
        
        //create source
        var source = new DiscordRoleVoterSource(this.votingClient, this.votingClient.manager.game.client, role.id, role);
        
        //add votingrole to manager
        this.votingRoles.set(source.id, source);
        
        //emit event
        this.votingClient.emitVoterSourceManagerUpdate(this);

        //store this manager
        this.store();
    }

    /** Remove a Discord Role from the list of sources this manager draws from
     * @param {String} roleId 
     */
    removeVotingRole(roleId){
        //retrieve source 
        var source = this.votingRoles.get(roleId);

        //verify that the role is present
        if(!source) throw new VotingError(err.VOTER_SOURCE_NOT_PRESENT);

        //remove role from manager
        this.votingRoles.delete(source.id, source);

        //destroy source
        source.destroy();

        //emit event
        this.votingClient.emitVoterSourceManagerUpdate(this);

        //store this manager
        this.store();
    }

    /** Add a Discord User to the list of whitelisted voters that are able to vote regardless of role
     * @param {Discord.User} user 
     */
    addWhitelistedUser(user){
        //verify the user is not present
        if(this.whitelistedUsers.has(user.id)) throw new VotingError(err.VOTER_SOURCE_ALREADY_PRESENT);

        //verify there's no conflict with blacklisted users
        if(this.blacklistedUsers.has(user.id)) throw new VotingError(err.VOTER_SOURCE_CONFLICT);

        //create new source
        var newSource = new DiscordUserVoterSource(this.votingClient, this.votingClient.manager.game.client, user.id, user);

        //add user to manager
        this.whitelistedUsers.set(newSource.id, newSource);

        //emit event
        this.votingClient.emitVoterSourceManagerUpdate(this);

        //store this manager
        this.store();
    }

    /** Remove a Discord User from the list of whitelisted voters that are able to vote regardless of role
     * @param {String} userId 
     * @returns {String} The returncode: Good Execute or Voter Source Not Present
     */
    removeWhitelistedUser(userId){
        //retrieve source
        var source = this.whitelistedUsers.get(userId);

        //verify that the source is present
        if(!source) throw new VotingError(err.VOTER_SOURCE_NOT_PRESENT);

        //remove user from manager
        this.whitelistedUsers.delete(userId);

        //destroy source
        source.destroy();

        //emit event
        this.votingClient.emitVoterSourceManagerUpdate(this);

        //store this manager
        this.store();
    }

    /** Add a Discord User to the list of blacklisted voters that are not able to vote regardless of role
     * @param {Discord.User} user 
     * @returns {String} The returncode: Good Execute or Voter Source Already Present
     */
    addBlacklistedUser(user){
        //verify the user is not present
        if(this.blacklistedUsers.has(user.id)) throw new VotingError(err.VOTER_SOURCE_ALREADY_PRESENT);

        //verify there's no conflict with whitlisted users
        if(this.whitelistedUsers.has(user.id)) throw new VotingError(err.VOTER_SOURCE_CONFLICT);

        //create new source
        var newSource = new DiscordUserVoterSource(this.votingClient, this.votingClient.manager.game.client, user.id, user);

        //add user to manager
        this.blacklistedUsers.set(newSource.id, newSource);

        //emit event
        this.votingClient.emitVoterSourceManagerUpdate(this);

        //store this manager
        this.store();
    }

    /** Remove a Discord User from the list of blacklisted voters that are not able to vote regardless of role
     * @param {String} userId 
     * @returns {String} The returncode: Good Execute or Voter Source Not Present
     */
    removeBlacklistedUser(userId){
        //retrieve source
        var source = this.blacklistedUsers.get(userId);

        //verify that the source is present
        if(!source) throw new VotingError(err.VOTER_SOURCE_NOT_PRESENT);

        //remove user from manager
        this.blacklistedUsers.delete(userId);

        //destroy source
        source.destroy();

        //emit event
        this.votingClient.emitVoterSourceManagerUpdate(this);

        //store this manager
        this.store();
    }

    /** Event Response to a Voter Source having members changed
     * @param {VoterSource} voterSource 
     */
    voterSourceMembersUpdate = (voterSource) => {
       this.emitVoterSourceManagerUpdate(this);
    }

    /** Event Response to a Voter Source being invalidated
     * @param {VoterSource} voterSource 
     */
    voterSourceInvalidated = (voterSource) => {
        //if the source is a voting role source
        if(this.votingRoles.has(voterSource.id)){
            
            //remove the source
            this.votingRoles.delete(voterSource.id);

            //destroy the source
            voterSource.destroy();

            //emit update
            this.votingClient.emitVoterSourceManagerUpdate(this);

            //store
            this.store();
        }

        //if the source is a whitelisted user source
        else if(this.whitelistedUsers.has(voterSource.id)){

            //remove the source
            this.whitelistedUsers.delete(voterSource.id);

            //destroy the source
            voterSource.destroy();

            //emit update
            this.votingClient.emitVoterSourceManagerUpdate(this);

            //store
            this.store();
        }

        //if the source is a blacklisted user source
        else if(this.blacklistedUsers.has(voterSource.id)){

            //remove the source
            this.blacklistedUsers.delete(voterSource.id);

            //destroy the source
            voterSource.destroy();

            //emit update
            this.votingClient.emitVoterSourceManagerUpdate(this);

            //store
            this.store();
        }
    }

    /** Converts this manager to a JSON string
     * @returns {Object}
     */
    toJSON(){
        var returnobject = super.toJSON();
        returnobject.votingRoles = this.votingRoles;
        returnobject.whitelistedUsers = this.whitelistedUsers;
        returnobject.blacklistedUsers = this.blacklistedUsers;
        return returnobject;
    }

    /** Store this manager
     */
    store(){
        datawriting.putData(this.votingClient.manager.game.id, `Voting/${this.votingClient.id}/Voters/VoterSources.json`, JSON.stringify(this));
    }

    /** Create a new DiscordUserVoterSourceManager
     * @param {VotingClient} votingClient 
     * @param {Object} managerJson 
     * @returns {DiscordUserVoterSourceManager} The Source Manager
     */
    static createFromJson(votingClient, managerJson){

        //create the new manager
        var newManager = new DiscordUserVoterSourceManager(votingClient, true);

        //load all voting roles
        managerJson.votingRoles.forEach(sourceJson => {
            var source = DiscordRoleVoterSource.createFromJSON(votingClient, sourceJson);
            if(source) newManager.votingRoles.set(source.id, source);
        });

        //load all whitelisted users
        managerJson.whitelistedUsers.forEach(sourceJson => {
            var source = DiscordUserVoterSource.createFromJSON(votingClient, sourceJson);
            if(source) newManager.whitelistedUsers.set(source.id, source);
        });

        //load all blacklisted users
        managerJson.blacklistedUsers.forEach(sourceJson => {
            var source = DiscordUserVoterSource.createFromJSON(votingClient, sourceJson);
            if(source) newManager.blacklistedUsers.set(source.id, source);
        });

        //return the new manager
        return newManager;
    }
}

/** A Voter Source Manager that keeps track of chatroom accounts
 * @typedef {ChatroomAccountVoterSourceManager} ChatroomAccountVoterSourceManager
 */
class ChatroomAccountVoterSourceManager extends VoterSourceManager{

    /** The chatroom source this keeps track of
     * @type {ChatroomVoterSource}
     */
    chatroomSource;

    /** The accounts this manager has blacklisted
     * @type {Discord.Collection<String, ChatroomAccountVoterSource>}
     */
    blacklistedAccounts;

    /** Create a new ChatroomAccountVoterSourceManager
     * @param {VotingClient} votingClient
     */
    constructor(votingClient, loading=false){
        super(votingClient, VoterTypes.CHATROOM_ACCOUNT);
        this.chatroomSource = null;
        this.blacklistedAccounts = new Discord.Collection();
        this.startEmitters();
        if(!loading){
            this.store();
        }
    }

    /** Destroy this manager and end its emitters
     */
    destroy(){
        this.endEmitters();
        super.destroy();
    }

    /** Start listening to update events
     */
    startEmitters(){
        this.votingClient.on(Events.VOTER_SOURCE_MEMBERS_ADDED, this.voterSourceMembersUpdate);
        this.votingClient.on(Events.VOTER_SOURCE_MEMBERS_REMOVED, this.voterSourceMembersUpdate);
        this.votingClient.on(Events.VOTER_SOURCE_INVALIDATED, this.voterSourceInvalidated);
    }

    /** End listening to update events
     */
    endEmitters(){
        this.votingClient.on(Events.VOTER_SOURCE_MEMBERS_ADDED, this.voterSourceMembersUpdate);
        this.votingClient.on(Events.VOTER_SOURCE_MEMBERS_REMOVED, this.voterSourceMembersUpdate);
        this.votingClient.on(Events.VOTER_SOURCE_INVALIDATED, this.voterSourceInvalidated);
    }

    /** Retrieve all valid voter objects from this manager
     * @returns {Discord.Collection<String, Account>} The voter objects
     */
    fetchVoterObjects(){

        //store accounts in this object
        var accounts;

        //retrieve all accounts from the chatroom
        if(this.chatroomSource){
            accounts = this.chatroomSource.fetchVoterObjects();
        }

        //for each blacklisted account source
        this.blacklistedAccounts.each(accountSource => {

            //retrieve the account
            var account = accountSource.fetchVoterObjects();

            //if the accounts have the account
            if(accounts.has(account.id)){

                //remove the account from the accounts
                accounts.delete(account.id);
            }
        });

        //return the accounts
        return accounts;
    }

    /** Retrieve the voter id for a discord user's id, or undefined if none
     * @param {String} userId 
     * @returns {(String|undefined)} The voter id
     */
    getVoterIdForDiscordUserId(userId){
        if(!this.chatroomSource) return undefined;
        var user = this.chatroomSource.chatroom.accounts.users.get(userId);
        if(!user) return undefined;
        return user.currentAccountId;
    }

    /** Set this manager's chatroomSource
     * @param {Chatroom} chatroom 
     */
    setChatroomSource(chatroom){
        
        //If there's already a source
        if(this.chatroomSource){

            //if the source is the same, return
            if(this.chatroomSource.id == chatroom.id) throw new VotingError(err.VOTER_SOURCE_ALREADY_PRESENT);
            
            //else destroy the old source
            this.chatroomSource.destroy();
        }

        //create a new source
        var newChatroomSource = new ChatroomVoterSource(this.votingClient, chatroom.id, chatroom);

        //set this managers source
        this.chatroomSource = newChatroomSource;

        //and emit creation
        this.votingClient.emitVoterSourceManagerUpdate(this);

        //store
        this.store();
    }

    /** Add account to blacklist
     * @param {String} account 
     */
    addBlacklistedAccount(accountId){

        //verify it's not already in blacklist
        if(this.blacklistedAccounts.has(accountId)) throw new VotingError(err.VOTER_SOURCE_ALREADY_PRESENT);

        //verify this chatroom source exists
        if(!this.chatroomSource) throw new VotingError(err.INVALID_VOTER_SOURCE);

        //retrieve the account from the chatroom
        var account = this.chatroomSource.chatroom.accounts.get(accountId);

        //verify the account exists
        if(!account) throw new VotingError(err.INVALID_VOTER_SOURCE);

        //create new source
        var accountSource = new ChatroomAccountVoterSource(this.votingClient, account.id, account);

        //add source
        this.blacklistedAccounts.set(accountId, accountSource);

        //emit addition
        this.votingClient.emitVoterSourceManagerUpdate(this);

        //store
        this.store();
    }

    /** Remove account from blacklist
     * @param {String} accountId 
     */
    removeBlacklistedAccount(accountId){

        //retrieve source
        var accountSource = this.blacklistedAccounts.get(accountId);

        //verify it exists
        if(!accountSource) throw new VotingError(err.VOTER_SOURCE_NOT_PRESENT);

        //destroy source
        accountSource.destroy();

        //remove source
        this.blacklistedAccounts.delete(accountId);

        //emit removal
        this.votingClient.emitVoterSourceManagerUpdate(this);

        //store
        this.store();
    }

    /** Voter Source Members Update Event
     * @param {VoterSource} voterSource 
     */
    voterSourceMembersUpdate = (voterSource) => {
        //If the voter source was updated
        this.votingClient.emitVoterSourceManagerUpdate(this);
    }

    /** Voter Source Invalidated Event
     * @param {VoterSource} voterSource 
     */
    voterSourceInvalidated = (voterSource) => {
        //If the voter source is the chatroom voter source
        if(voterSource instanceof ChatroomVoterSource){

            //destroy the chatroom source and all account sources
            this.chatroomSource.destroy();
            this.blacklistedAccounts.each(accountSource => {
                accountSource.destroy();
            });

            //clear sources out of memory
            this.blacklistedAccounts.clear();
            this.chatroomSource = null;

            //emit event
            this.votingClient.emitVoterSourceManagerUpdate(this);

            //store
            this.store();
        }

        //if the voter source is a blacklisted account source
        else if(this.blacklistedAccounts.has(voterSource.id)){

            //remove and destroy the source
            this.blacklistedAccounts.delete(voterSource.id);
            voterSource.destroy();

            //emit event
            this.votingClient.emitVoterSourceManagerUpdate(this);

            //store
            this.store();
        }
    }

    /** Convert this manager to a JSON string
     * @returns {Object}
     */
    toJSON(){
        var returnobject = super.toJSON();
        returnobject.chatroomSource = this.chatroomSource;
        returnobject.blacklistedAccounts = this.blacklistedAccounts;
        return returnobject;
    }

    /** Store this manager
     */
    store(){
        datawriting.putData(this.votingClient.manager.game.id, `Voting/${this.votingClient.id}/Voters/VoterSources.json`, JSON.stringify(this));
    }

    /** Create a new DiscordUserVoterSourceManager
     * @param {VotingClient} votingClient 
     * @param {Object} managerJson 
     * @returns {ChatroomAccountVoterSourceManager} The Source Manager
     */
    static createFromJson(votingClient, managerJson){

        //create the new manager
        var newManager = new ChatroomAccountVoterSourceManager(votingClient, true);

        //load the chatroom source
        if(managerJson.chatroomSource){
            newManager.chatroomSource = ChatroomVoterSource.createFromJSON(votingClient, managerJson.chatroomSource);
        }

        //load the blacklisted account sources
        managerJson.blacklistedAccounts.forEach(sourceJson => {
            var source = ChatroomAccountVoterSource.createFromJSON(votingClient, sourceJson);
            if(source) newManager.blacklistedAccounts.set(source.id, source);
        });

        //Return the new manager
        return newManager;
    }
}

module.exports = {
    VoterSourceManager: VoterSourceManager,
    DiscordUserVoterSourceManager: DiscordUserVoterSourceManager,
    ChatroomAccountVoterSourceManager: ChatroomAccountVoterSourceManager
}