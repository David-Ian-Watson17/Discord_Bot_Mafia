const Discord = require('discord.js');

const datawriting = require('../../../../handlers/datahandler.js');

const {BaseChatroomObject} = require('./BaseChatroomObject.js');
const {ChatroomError, err} = require('../ChatroomError.js');
const {Events} = require('../events.js');


/** A user is a discord user that has access to one or more accounts.
 * @typedef {User} User
 */
 class User extends BaseChatroomObject{
    
    /** The id of the user. Also their discord id
     * @type {String}
     */
    id;

    /** The accounts the user has access to
     * @type {Array<String>}
     */
    accounts;

    /** The id of the account the user is logged into
     * @type {String}
     */
    currentAccountId;

    /** Create a new user
     * @param {Chatroom} chatroom 
     * @param {String} id 
     * @param {Boolean} loading 
     */
    constructor(chatroom, id, loading=false){
        super(chatroom);
        this.id = id;
        this.accounts = [];
        this.currentAccountId = null;
        if(!loading){
            this.store();
        }
    }

    /** Destroy this user
     */
    destroy(){
        this.deleteFile();
    }

    /** Log in to an account
     * @param {String} accountId 
     */
    login(accountId){

        //if this user is already logged into that account, return
        if(this.currentAccountId == accountId) throw new ChatroomError(err.ALREADY_LOGGED_IN);

        //if this user doesn't have access to the account, return
        if(!this.accounts.includes(accountId)) throw new ChatroomError(err.USER_NOT_BOUND_TO_ACCOUNT);

        //set current account id to new id
        this.currentAccountId = accountId;

        //emit event
        this.chatroom.emitLogin(this);

        //store this user
        this.store();
    }

    /** Log out of whatever account this user is logged into
     */
    logout(){

        //if this user is not logged in, return
        if(!this.currentAccountId) throw new ChatroomError(err.NOT_LOGGED_IN);

        //set current account to null
        this.currentAccountId = null;

        //emit event
        this.chatroom.emitLogout(this);

        //store this user
        this.store();
    }

    /** Simple function to add account to this user. Chatroom does the heavy lifting
     * @param {String} accountId
     */
    addAccount(accountId){
        if(!this.accounts.includes(accountId)){
            this.accounts.push(accountId);
            this.store();
        }
    }

    /** Simple function to remove account from this user. Chatroom does the heavy lifting
     * @param {String} accountId 
     */
    removeAccount(accountId){
        if(this.currentAccountId == accountId) this.currentAccountId = null;
        if(this.accounts.includes(accountId)){
            this.accounts.splice(this.accounts.indexOf(accountId), 1);
            this.store();
        }   
    }

    /** Converts this user to a string with its username and id
     * @returns {String} The string
     */
    toString(){
        var user = this.chatroom.manager.game.client.users.cache.get(this.id);
        if(user){
            return `${user.username}#${user.discriminator}`;
        }
        else{
            return `#deleted-user (${this.id})`;
        }
    }

    /** Converts this user to an embed with its information
     * @returns {Discord.MessageEmbed} The profile embed
     */
    toProfileEmbed(){
        var title = "";
        var thumbnail = "";
        var description = "";

        //retrieve user and create title and thumbnail based on whether it exists
        var user = this.chatroom.manager.game.client.users.cache.get(this.id);
        if(user){
            title = `${user.username}#${user.discriminator} (${user.id})`;
            thumbnail = user.avatarURL();
        }
        else{
            title = `#deleted-user (${this.id})`;
            thumbnail = null;
        }

        //populate account field
        var accountfieldvalue = "";
        this.accounts.forEach(accountId => {
            var account = this.chatroom.accounts.cache.get(accountId);
            if(account){
                accountfieldvalue += `${account.toString()}\n`;
                var permissions = account.userPermissions.get(this.userId);
                if(permissions){
                    accountfieldvalue += `Can Post: ${permissions.post}\n`;
                    accountfieldvalue += `Can Modify: ${permissions.modify}\n`;
                    accountfieldvalue += `Can Register: ${permissions.register}\n`;
                }
            }
            else{
                accountfieldvalue += `#deleted-account (${accountId})\n`;
            }
            accountfieldvalue += `\n`;
        });

        //create embed
        var embed = new Discord.MessageEmbed()
            .setTitle(title)
            .setThumbnail(thumbnail)
            .addFields(
                {name: "Accounts", value: accountfieldvalue, inline: true}
            );

        //return embed
        return embed;
    }

    /** Converts this user to its raw JSON constituents
     */
    toJSON(){
        var userJson = {};
        userJson.id = this.id;
        userJson.accounts = this.accounts;
        userJson.currentAccountId = this.currentAccountId;
        return userJson;
    }

    /** Store this user
     */
    store(){
        datawriting.putData(this.chatroom.manager.game.id, `Chatrooms/${this.chatroom.id}/Accounts/Users/${this.id}.json`, JSON.stringify(this));
    }

    /** Delete this user's files
     */
    deleteFile(){
        datawriting.deleteFile(this.chatroom.manager.game.id, `Chatrooms/${this.chatroom.id}/Accounts/Users/${this.id}.json`);
    }

    /** Load a specific user
     * @param {Chatroom} chatroom
     * @param {String} userId
     * @returns {(User|undefined)} The user
     */
    static load(chatroom, userId){
        
        //retrieve the data
        var rawdata = datawriting.retrieveData(chatroom.manager.game.id, `Chatrooms/${chatroom.id}/Accounts/Users/${userId}.json`);

        //verify the data exists
        if(!rawdata) return undefined;

        //parse data
        var userJson = JSON.parse(rawdata);

        //create user
        var user = new User(chatroom, userId, true);

        //populate user
        user.accounts = userJson.accounts;
        user.currentAccountId = userJson.currentAccountId;

        //return the user
        return user;
    }
}

module.exports = {
    User: User,
}