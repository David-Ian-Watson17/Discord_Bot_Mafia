const Discord = require('discord.js');

const datawriting = require('../../../../handlers/datahandler.js');

const {BaseChatroomObject} = require('./BaseChatroomObject.js');
const {Account, UserPermissions} = require('./Account.js');
const {User} = require('./User.js');
const {ChatroomError, err} = require('../ChatroomError.js');
const {Events} = require('../events.js');

/** An AccountManager holds, adds, and deletes accounts
 * @typedef {AccountManager} AccountManager
 */
class AccountManager extends BaseChatroomObject{

    /** The collection of accounts
     * @type {Discord.Collection<String, Account>}
     */
    cache;

    /** The collection of users
     * @type {Discord.Collection<String, User>}
     */
    users;

    /** Create a new AccountManager
     * @param {Chatroom} chatroom
     */
    constructor(chatroom, loading=false){
        super(chatroom);
        this.cache = new Discord.Collection();
        this.users = new Discord.Collection();
        if(!loading){
            this.store();
        }
    }

    /** Destroy this account manager
     */
    destroy(){
        this.cache.each(account => {
            account.destroy();
        });
        this.users.each(user => {
            user.destroy();
        });
        this.deleteFile();
    }

    /** Retrieve a specific account
     * @param {String} accountId 
     * @returns {Account} The account
     */
    getAccount(accountId){
        var account = this.cache.get(accountId);
        if(!account) throw new ChatroomError(err.USER_DOESNT_EXIST);
        return account;
    }

    /** Retrieve a specific user
     * @param {String} userId 
     * @returns {User} The user
     */
    getUser(userId){
        var user = this.users.get(userId);
        if(!user) throw new ChatroomError(err.USER_DOESNT_EXIST);
        return user;
    }

    /** Generates an unused account id
     * @returns {String} The new id
     */
    generateNewId(){
        var newId = `${Math.floor(Math.random() * 10000)}`;
        while(this.cache.has(newId)){
            newId = `${Math.floor(Math.random() * 10000)}`;
        }
        return newId;
    }

    /** Returns whether a username is available or not
     * @param {String} username 
     * @returns {Boolean} True if the username is available
     */
    availableUsername(username){
        var account = this.cache.find(account => account.username == username);
        if(account) return false;
        return true;
    }

    /** Create a new account and add it to this manager
     * @param {Boolean} terminalbound
     * @returns {String} The id of the new account
     */
    createAccount(terminalbound=false){

        //create a new account
        var account = new Account(this.chatroom, this.generateNewId(), terminalbound);

        //add to manager
        this.cache.set(account.id, account);

        //emit event
        this.chatroom.emitAccountAdded(account);

        //return the id
        return account.id;
    }

    /** Delete an account and remove it from this manager
     * @param {String} accountId 
     */
    deleteAccount(accountId){

        //get the account
        var account = this.cache.get(accountId);

        //if the account is present
        if(account){

            //unbind any users from the account
            account.userPermissions.each((userPermission, userId) => {
                this.unbindUserFromAccount(accountId, userId);
            });

            //destroy the account and remove it from the manager
            account.destroy();
            this.cache.delete(accountId);

            //emit removal of account
            this.chatroom.emitAccountRemoved(account);

            //return
            return;
        }

        //return failure
        throw new ChatroomError(err.ACCOUNT_DOESNT_EXIST);
    }

    /** Give a user the ability to access an account
     * @param {String} accountId 
     * @param {String} userId 
     * @param {Boolean} post
     * @param {Boolean} modify
     * @param {Boolean} register
     */
    bindUserToAccount(accountId, userId, post, modify, register){

        //get account
        var account = this.cache.get(accountId);

        //verify account is present
        if(!account) throw new ChatroomError(err.ACCOUNT_DOESNT_EXIST);

        //if user isn't present, add them
        if(!this.users.has(userId)) this.users.set(userId, new User(this.chatroom, userId));

        //retrieve the user
        var user = this.users.get(userId);

        //add user to account
        account.addUser(userId, post, modify, register);

        //add account to user
        user.addAccount(accountId);
    }

    /** Take away the ability to access an account from a user
     * @param {String} accountId 
     * @param {String} userId 
     */
    unbindUserFromAccount(accountId, userId){

        //get account
        var account = this.cache.get(accountId);

        //verify account exists
        if(!account) throw new ChatroomError(err.ACCOUNT_DOESNT_EXIST);

        //retrieve user
        var user = this.users.get(userId);
        
        //verify user exists and has account
        if(!user || !user.accounts.includes(accountId)) throw new ChatroomError(err.USER_NOT_BOUND_TO_ACCOUNT);

        //remove account from user
        account.removeUser(userId);

        //remove user from account
        user.removeAccount(accountId);

        //if the user no longer has any accounts, remove them as a user
        if(user.accounts.length == 0){
            user.destroy();
            this.users.delete(userId);
        }
    }

    /** Convert this account manager to a JSON string
     * @returns {Object} The JSON string
     */
    toJSON(){
        return {};
    }

    /** Store this account manager
     */
    store(){
        datawriting.putData(this.chatroom.manager.game.id, `Chatrooms/${this.chatroom.id}/Accounts/Information.json`, JSON.stringify(this));
    }

    /** Delete this account manager
     */
    deleteFile(){
        datawriting.deleteSubFolder(this.chatroom.manager.game.id, `Chatrooms/${this.chatroom.id}/Accounts`);
    }

    /** Load a specific AccountManager
     * @param {Chatroom} chatroom 
     * @returns {AccountManager} The AccountManager
     */
    static load(chatroom){
        
        //create account manager
        var manager = new AccountManager(chatroom, true);

        //load each account
        var accountIds = datawriting.retrieveSubFolder(chatroom.manager.game.id, `Chatrooms/${chatroom.id}/Accounts/Accounts`).map(filename => filename.substring(0, filename.lastIndexOf('.')));

        //for each account id
        accountIds.forEach(accountId => {
            var account = Account.load(chatroom, accountId);
            if(account){
                manager.cache.set(accountId, account);
            }
        });

        //load each user
        var userIds = datawriting.retrieveSubFolder(chatroom.manager.game.id, `Chatrooms/${chatroom.id}/Accounts/Users`).map(filename => filename.substring(0, filename.lastIndexOf('.')));

        //for each user id
        userIds.forEach(userId => {
            var user = User.load(chatroom, userId);
            if(user){
                manager.users.set(userId, user);
            }
        });

        //return new account manager
        return manager;
    }
}

module.exports = {
    AccountManager: AccountManager,
}