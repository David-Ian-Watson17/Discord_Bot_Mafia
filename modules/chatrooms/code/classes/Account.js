const Discord = require('discord.js');

const datawriting = require('../../../../handlers/datahandler.js');
const admin = require('../../../../administration/administration.js');

const {BaseChatroomObject} = require('./BaseChatroomObject.js');
const {Events} = require('../events.js');
const {ChatroomError, err} = require('../ChatroomError.js');

/** An Account is the entity that can use the chatroom to send messages. Users have to login to accounts to interact with the chatroom.
 * @typedef {Account} Account
 */
 class Account extends BaseChatroomObject{

    /** The id of the account
     * @type {String}
     */
    id;

    /** The username for the account
     * @type {String}
     */
    username;
    
    /** The url of an image used as this account's profile picture
     * @type {String}
     */
    profilepicture;

    /** Whether this account is registered
     * @type {Boolean}
     */
    registered;

    /** The ids of all the users that have access to this account and their permissions
     * @type {Discord.Collection<String, UserPermissions>}
     */
    userPermissions;

    /** The ids of the terminals this account is bound to.
     * @type {Array<String>}
     */
    terminals;

    /** Whether this account can only post in its own terminals
     * @type {Boolean}
     */
    terminalbound;

    /** Create a new account, initializing its terminalbound status
     * @param {Chatroom} chatroom
     * @param {String} id 
     */
    constructor(chatroom, id, terminalbound, loading=false){
        super(chatroom);
        this.id = id;
        this.username = null;
        this.profilepicture = null;
        this.registered = false;
        this.userPermissions = new Discord.Collection();
        this.terminals = [];
        this.terminalbound = terminalbound;
        this.startEmitters();
        if(!loading){
            this.store();
        }
    }

    /** Destroy this account
     */
    destroy(){
        this.endEmitters();
        this.deleteFile();
    }

    /** Start the emitters for this account, keeping track of events
     */
    startEmitters(){
        this.chatroom.on(Events.TERMINAL_REMOVED, (chatroom, terminalId) => {if(this.terminals.includes(terminalId)) this.removeTerminal(terminalId);});
    }

    /** End the emitters for this account, stop keeping track of events
     */
    endEmitters(){
        this.chatroom.off(Events.TERMINAL_REMOVED, (chatroom, terminalId) => {if(this.terminals.includes(terminalId)) this.removeTerminal(terminalId);});
    }

    /** Bind this account to its terminals, forbidding it from sending messages elsewhere
     */
    bindToTerminals(){
        this.terminalbound = true;
        this.store();
    }

    /** Unbind this account from its terminals, allowing it to send messages elsewhere
     */
    unbindFromTerminals(){
        this.terminalbound = false;
        this.store();
    }

    /** Register the account
     * @param {String} requesterId
     * @param {String} username 
     * @param {String} profilepicture 
     * @returns {Number} The returncode, Good Execute or Insufficient Permissions
     */
    register(requesterId, username, profilepicture){

        console.log(profilepicture);

        //verify the username exists
        if(!this.chatroom.accounts.availableUsername(username)) throw new ChatroomError(err.USERNAME_ALREADY_TAKEN);

        //verify permissions level
        var userPermissions = this.userPermissions.get(requesterId);
        if(!admin.isAdmin(this.chatroom.manager.game.id, requesterId) && (!userPermissions || !(userPermissions.register))) throw new ChatroomError(err.INSUFFICIENT_PERMISSIONS);

        //set username and profile picture
        this.username = username;
        this.profilepicture = profilepicture;

        //set registered status to true
        this.registered = true;

        //emit event
        this.chatroom.emitAccountRegistered(this, requesterId);

        //store
        this.store();
    }

    /** Unregister the account
     * @param {String} requesterId
     * @returns {Number} The returncode, Good Execute or Insufficient Permissions
     */
    unregister(requesterId){

         //verify permissions level
         if(!admin.isAdmin(this.chatroom.manager.game.id, requesterId)) throw new ChatroomError(err.INSUFFICIENT_PERMISSIONS);

        //retrieve old data for event
        var oldUsername = this.username;
        var oldProfilePicture = this.profilepicture;

        //void username and profile picture
        this.username = null;
        this.profilepicture = null;

        //set registered status to false
        this.registered = false;

        //emit event
        this.chatroom.emitAccountUnregistered(this, oldUsername, oldProfilePicture, requesterId);

        //store
        this.store();
    }

    /** Change the username of this account
     * @param {String} requesterId
     * @param {String} username 
     */
    changeUsername(requesterId, username){

        //verify this account is registered
        if(!this.registered) return err.ACCOUNT_NOT_REGISTERED;

        //verify permissions level
        var userPermissions = this.userPermissions.get(requesterId);
        if(!admin.isAdmin(this.chatroom.manager.game.id, requesterId) && (!userPermissions || !(userPermissions.modify))) throw new ChatroomError(err.INSUFFICIENT_PERMISSIONS);

        //verify username isn't taken
        if(!this.chatroom.accounts.availableUsername(username)) throw new ChatroomError(err.USERNAME_ALREADY_TAKEN);

        //save old username for event
        var oldUsername = this.username;

        //set username
        this.username = username;

        //emit event
        this.chatroom.emitAccountUsernameChanged(this, oldUsername, requesterId);

        //store
        this.store();
    }

    /** Change the profile picture of this account
     * @param {String} requesterId
     * @param {String} profilepicture 
     */
    changeProfilePicture(requesterId, profilepicture){
        
        //verify this account is registered
        if(!this.registered) return err.ACCOUNT_NOT_REGISTERED;

        //verify permissions level
        var userPermissions = this.userPermissions.get(requesterId);
        if(!admin.isAdmin(this.chatroom.manager.game.id, requesterId) && (!userPermissions || !(userPermissions.modify))) return err.INSUFFICIENT_PERMISSIONS;

        //save old profile picture for event
        var oldProfilePicture = this.profilepicture;

        //set profile picture
        this.profilepicture = profilepicture;

        //emit event
        this.chatroom.emitAccountProfilePictureChanged(this, oldProfilePicture, requesterId);

        //store
        this.store();
    }

    /** Simple function to add user to this account. Does no event work, as the heavy lifting is performed by the chatroom
     * @param {String} userId 
     * @param {Boolean} post 
     * @param {Boolean} modify 
     * @param {Boolean} register 
     */
    addUser(userId, post, modify, register){
        var userPermissions = new UserPermissions(userId, post, modify, register);
        this.userPermissions.set(userId, userPermissions);
        this.store();
    }

    /** Simple function to remove user from this account. Does no event work, as the heavy lifting is performed by the chatroom
     * @param {String} userId 
     */
    removeUser(userId){
        this.userPermissions.delete(userId);
        this.store();
    }

    /** Edit a user's permissions when it comes to using this account
     * @param {String} userId 
     * @param {Object} newPermissions 
     */
    editUserPermissions(userId, newPermissions){

        //retrieve permissions for user
        var userPermissions = this.userPermissions.get(userId);
        if(!userPermissions) throw new ChatroomError(err.USER_NOT_BOUND_TO_ACCOUNT);

        //verify there is at least one permission
        if(!newPermissions || (newPermissions.post == undefined && newPermissions.modify == undefined && newPermissions.register == undefined)) throw new ChatroomError(err.MISSING_INFORMATION);

        //change relevant permissions
        if(!(newPermissions.post == undefined)){
            if(newPermissions.post) userPermissions.unmute();
            else userPermissions.mute();
        }
        if(!(newPermissions.modify == undefined)){
            if(newPermissions.modify) userPermissions.allowModification();
            else userPermissions.disallowModification();
        }
        if(!(newPermissions.register == undefined)){
            if(newPermissions.register) userPermissions.allowRegistration();
            else userPermissions.disallowRegistration();
        }

        //store
        this.store();
    }

    /** Add a terminal to this account
     * @param {Discord.Channel} terminal
     */
    addTerminal(terminal){

        //verify terminal is not already in account
        if(this.terminals.includes(terminal.id)) throw new ChatroomError(err.TERMINAL_ALREADY_BOUND_TO_ACCOUNT);

        //verify terminal is in chatroom or add if not
        if(!this.chatroom.terminals.has(terminal.id)){
            this.chatroom.addTerminal(terminal);
        }

        //add terminal to account
        this.terminals.push(terminal.id);

        //emit event
        this.chatroom.emitAccountUpdated(this);

        //store
        this.store();

    }

    /** Remove a terminal from this account
     * @param {String} terminalId 
     * @returns {Number} The returncode, Good Execute or Account Doesnt Have Terminal 
     */
    removeTerminal(terminalId){

        //verify terminal is in account
        if(!this.terminals.includes(terminalId)) throw new ChatroomError(err.TERMINAL_NOT_BOUND_TO_ACCOUNT);

        //remove terminal from account
        this.terminals.splice(this.terminals.indexOf(terminalId), 1);

        //emit event
        this.chatroom.emitAccountUpdated(this);

        //store
        this.store();
    }

    /** Converts this account to a string with its username and id
     * @returns {String} The string
     */
    toString(){
        if(this.registered){
            return `${this.username} (${this.id})`;
        }
        else{
            return `Unregistered (${this.id})`;
        }
    }

    /** Converts this account to an embed with its information
     * @returns {Discord.MessageEmbed} The profile embed
     */
    toProfileEmbed(){

        //set account id as title
        var title = `Account ${this.id}`;

        //set thumbnail to profile picture if registered, null otherwise
        var thumbnail = null;
        if(this.registered) thumbnail = this.profilepicture;

        //put registration information, as well as username in description if present
        var description = "";
        if(this.registered){
            description += `**${this.username}**\n`;
            description += `Registered!`;
        }
        else{
            description += `**UNREGISTERED**\n`;
        }

        //retrieve all users and add them to the user field value
        var userfieldvalue = "";
        this.userPermissions.each(userPermission => {
            var user = this.chatroom.manager.game.client.users.cache.get(userPermission.userId);
            if(user){
                userfieldvalue += `${user.username}#${user.discriminator}\n`;
                
                if(userPermission.post) userfieldvalue += `Post: true\n`;
                else userfieldvalue += `Post: false\n`;

                if(userPermission.modify) userfieldvalue += `Modify: true\n`;
                else userfieldvalue += `Modify: false\n`;

                if(userPermission.register) userfieldvalue += `Register: true\n`;
                else userfieldvalue += `Register: false\n`;

                userfieldvalue += '\n';
            }
        })

        //retrieve all terminals and add them to the terminal field value
        var terminalfieldvalue = "";
        this.terminals.forEach(terminalId => {
            var terminal = this.chatroom.manager.game.client.channels.cache.get(terminalId);
            if(terminal){
                terminalfieldvalue += `${terminal.name}\n`;
            }
        });

        //create embed
        var embed = new Discord.MessageEmbed()
            .setTitle(title)
            .setThumbnail(thumbnail)
            .setDescription(description)
            .addFields(
                {name: "Users", value: userfieldvalue, inline: true},
                {name: "Terminals", value: terminalfieldvalue, inline: true}
            );

        //return profile embed
        return embed;
    }

    /** Converts this account to its raw json constituants
     */
    toJSON(){
        var jsonAccount = {};
        jsonAccount.id = this.id;
        jsonAccount.registered = this.registered;
        jsonAccount.username = this.username;
        jsonAccount.profilepicture = this.profilepicture;
        jsonAccount.userPermissions = this.userPermissions;
        jsonAccount.terminals = this.terminals;
        jsonAccount.terminalbound = this.terminalbound;
        return jsonAccount;
    }

    /** Store this account
     */
    store(){
        datawriting.putData(this.chatroom.manager.game.id, `Chatrooms/${this.chatroom.id}/Accounts/Accounts/${this.id}.json`, JSON.stringify(this));
    }

    /** Delete this account's file
     */
    deleteFile(){
        datawriting.deleteFile(this.chatroom.manager.game.id, `Chatrooms/${this.chatroom.id}/Accounts/Accounts/${this.id}.json`);
    }

    /** Load a specific account
     * @param {Chatroom} chatroom
     * @param {String} accountId
     * @returns {(Account|undefined)} The account
     */
    static load(chatroom, accountId){
        
        //retrieve the data for the account
        var rawData = datawriting.retrieveData(chatroom.manager.game.id, `Chatrooms/${chatroom.id}/Accounts/Accounts/${accountId}.json`);

        //verify it exists
        if(!rawData) return undefined;

        //parse data
        var accountJson = JSON.parse(rawData);

        //create new account
        var account = new Account(chatroom, accountId, accountJson.terminalbound, true);

        //populate account
        account.registered = accountJson.registered;
        account.username = accountJson.username;
        account.profilepicture = accountJson.profilepicture;
        account.terminals = accountJson.terminals;
        accountJson.userPermissions.forEach(userPermissionJson => {
            var permissions = new UserPermissions(userPermissionJson.userId, userPermissionJson.post, userPermissionJson.modify, userPermissionJson.register);
            account.userPermissions.set(permissions.userId, permissions);
        });

        //return account
        return account;
    }
}

/** UserPermissions determine what privileges a user has when interacting with an account.
 * @typedef {UserPermissions} UserPermissions
 */
 class UserPermissions{
    
    /** The id of the user
     * @type {String}
     */
    userId;

    /** The permission to post using the account
     * @type {Boolean}
     */
    post;

    /** The permission to edit an account once registered
     * @type {Boolean}
     */
    modify;

    /** The permission to register an account
     * @type {Boolean}
     */
    register;

    /** Create a new instance of user permissions
     * @param {String} userId 
     * @param {Boolean} post 
     * @param {Boolean} modify 
     * @param {Boolean} register 
     */
    constructor(userId, post, modify, register){
        this.userId = userId;
        this.post = post;
        this.modify = modify;
        this.register = register;
    }

    mute(){
        this.post = false;
    }

    unmute(){
        this.post = true;
    }

    disallowModification(){
        this.modify = false;
    }

    allowModification(){
        this.modify = true;
    }

    disallowRegistration(){
        this.register = false;
    }

    allowRegistration(){
        this.register = true;
    }

    toJSON(){
        var returnobject = {};
        returnobject.userId = this.userId;
        returnobject.post = this.post;
        returnobject.modify = this.modify;
        returnobject.register = this.register;
        return returnobject;
    }
}

module.exports = {
    Account: Account,
    UserPermissions: UserPermissions,
}