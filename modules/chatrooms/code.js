const Discord = require('discord.js');
const datahandler = require('./code/datahandler.js');
const { Chatroom } = require('./code/classes/Chatroom.js');
const {ChatroomError, err} = require('./code/ChatroomError.js');
const admin = require('../../administration/administration.js');
const imagehandler = require('../../handlers/imagehandler.js');

/** The client this module uses to receive discord events
 * @type {Discord.Client}
 */
const client = require('../../client.js').client();

/** Initialization of the module
 */
const moduleStart = function(){
    console.log("Starting chatroom module!");
}

/*
CHATROOMS FUNCTIONS
*/

/** Create a new chatroom with a given name
 * @param {String} gameId 
 * @param {String} chatroomName 
 */
const createChatroom = function(gameId, chatroomName){
    var chatroomManager = datahandler.retrieveChatroomManager(gameId);
    chatroomManager.createChatroom(chatroomName);
}

/** Delete a chatroom
 * @param {String} gameId 
 * @param {String} chatroomId 
 */
const deleteChatroom = function(gameId, chatroomId){
    var chatroomManager = datahandler.retrieveChatroomManager(gameId);
    chatroomManager.deleteChatroom(chatroomId);
}

/** Change the name of a chatroom
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @param {String} newName 
 */
const changeChatroomName = function(gameId, chatroomId, newName){

    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //change its name
    chatroom.changeName(newName);
}

/** Retrieve an array of all chatroom strings in a game
 * @param {String} gameId 
 * @returns {Array<String>} The chatroom strings
 */
const retrieveAllChatroomStrings = function(gameId){

    //retrieve chatroomManager
    var chatroomManager = datahandler.retrieveChatroomManager(gameId);

    //convert chatrooms to strings and return
    var chatroomStrings = [];
    chatroomManager.chatrooms.each(chatroom => {
        chatroomStrings.push(chatroom.toString());
    });
    return chatroomStrings;
}

/** Retrieve the profile embed for a chatroom
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @returns {Discord.MessageEmbed} The profile embed or undefined if the chatroom doesn't exist
 */
const retrieveChatroomProfile = function(gameId, chatroomId){

    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //return its profile embed
    return chatroom.toProfileEmbed();
}

/** Add a channel to a chatroom as a terminal
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @param {Discord.Channel} channel
 */
const addTerminalToChatroom = function(gameId, chatroomId, channel){

    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //add termial to chatroom
    chatroom.addTerminal(channel);
}

/** Remove a terminal from a chatroom by its id
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @param {String} channelId
 */
const removeTerminalFromChatroom = function(gameId, chatroomId, channelId){

    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //remove terminal from chatroom
    chatroom.removeTerminal(channelId);
}

/*
CHATROOMACCOUNTS FUNCTIONS
*/

/** Create a new account for a given chatroom
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @param {(Boolean|undefined)} terminalbound Whether the account will be able to post only in its own terminals
 * @returns {String} The string id of the new account
 */
const createAccount = function(gameId, chatroomId, terminalbound=undefined){
    
    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //create account
    if(terminalbound == undefined){
        return chatroom.accounts.createAccount();
    }
    return chatroom.accounts.createAccount(terminalbound);
}

/** Delete an account for a given chatroom
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @param {String} accountId 
 */
const deleteAccount = function(gameId, chatroomId, accountId){

    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //delete account
    chatroom.accounts.deleteAccount(accountId);
}

/** Change whether an account is bound to its terminals or can post in any terminal
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @param {String} accountId 
 * @param {String} terminalbound 
 */
const changeTerminalBoundStatusForAccount = function(gameId, chatroomId, accountId, terminalbound){
    
    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //retrieve account
    var account = chatroom.accounts.cache.get(accountId);
    if(!account) throw new ChatroomError(err.ACCOUNT_DOESNT_EXIST);

    //change status of account
    if(terminalbound) account.bindToTerminals();
    else account.unbindFromTerminals();
}

/** Change the username of an account
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @param {String} accountId 
 * @param {String} newUsername 
 */
const changeAccountUsername = function(gameId, chatroomId, accountId, requesterId, newUsername){

    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //retrieve account
    var account = chatroom.accounts.cache.get(accountId);
    if(!account) throw new ChatroomError(err.ACCOUNT_DOESNT_EXIST);

    //change username
    account.changeUsername(requesterId, newUsername);
}

/** Change the profile picture of an account
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @param {String} accountId 
 * @param {String} newProfilePicture The temporary url of the new profile picture
 */
const changeAccountProfilePicture = async function(gameId, chatroomId, accountId, requesterId, newProfilePicture){

    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //retrieve account
    var account = chatroom.accounts.cache.get(accountId);
    if(!account) throw new ChatroomError(err.ACCOUNT_DOESNT_EXIST);

    //verify account is registered
    if(!account.registered) throw new ChatroomError(err.ACCOUNT_NOT_REGISTERED);

    //upload profile picture to permanent source
    var permanentProfilePictureUrl = await imagehandler.getPermanentLink(gameId, newProfilePicture);
    if(!permanentProfilePictureUrl || !(typeof permanentProfilePictureUrl === "string")) throw new ChatroomError(err.UNABLE_TO_UPLOAD_IMAGE);

    //change profile picture
    account.changeProfilePicture(requesterId, permanentProfilePictureUrl);
}

/** Retrieve all the toString results for the accounts in a chatroom
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @returns {Array<String>} The strings, or undefined if chatroom didn't exist
 */
const retrieveAllAccountStringsForChatroom = function(gameId, chatroomId){

    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //create an array to hold the strings
    var returnarray = [];

    //for each account
    chatroom.accounts.cache.each(account => {
        
        //add account.toString to array
        returnarray.push(account.toString());
    });

    //return array
    return returnarray;
}

/** Retrieve the profile embed for a given account
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @param {String} accountId 
 * @returns {Discord.MessageEmbed} The profile embed, or undefined if either the chatroom or account doesn't exist
 */
const retrieveAccountProfile = function(gameId, chatroomId, accountId){

    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //retrieve account
    var account = chatroom.accounts.cache.get(accountId);
    if(!account) throw new ChatroomError(err.ACCOUNT_DOESNT_EXIST);

    //return the profile for the account
    return account.toProfileEmbed();
}

/** Register an account, allowing it to interact with the chatroom
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @param {String} accountId 
 * @param {String} requesterId 
 * @param {String} username 
 * @param {String} profilepicture 
 */
const registerAccount = async function(gameId, chatroomId, accountId, requesterId, username, profilepicture){

    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //retrieve account
    var account = chatroom.accounts.cache.get(accountId);
    if(!account) throw new ChatroomError(err.ACCOUNT_DOESNT_EXIST);

    //retrieve permanent link for profile picture
    var permanentProfileLink = await imagehandler.getPermanentLink(gameId, profilepicture);
    if(!permanentProfileLink || !(typeof permanentProfileLink === "string")) throw new ChatroomError(err.UNABLE_TO_UPLOAD_IMAGE);
    
    //register account
    account.register(requesterId, username, permanentProfileLink);
}

/** Unregister an account, preventing it from interacting with the chatroom anymore
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @param {String} accountId 
 * @param {String} requesterId 
 */
const unregisterAccount = function(gameId, chatroomId, accountId, requesterId){

    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //retrieve account
    var account = chatroom.accounts.cache.get(accountId);
    if(!account) throw new ChatroomError(err.ACCOUNT_DOESNT_EXIST);

    //unregister
    return account.unregister(requesterId);
}

/** Add a user to an account, allowing them to login and use that account
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @param {String} accountId 
 * @param {String} userId 
 * @param {Object} permissions
 */
const addUserToAccount = function(gameId, chatroomId, accountId, userId, permissions){

    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //verify all permissions are present
    if(!permissions || permissions.post == undefined || permissions.modify == undefined || permissions.register == undefined) throw new ChatroomError(err.MISSING_INFORMATION);

    //add user to account
    chatroom.accounts.bindUserToAccount(accountId, userId, permissions.post, permissions.modify, permissions.register);
}

/** Remove a user from an account, logging them out if they are logged in, and preventing them from accessing the account
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @param {String} accountId 
 * @param {String} userId 
 */
const removeUserFromAccount = function(gameId, chatroomId, accountId, userId){

    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //remove user from account
    chatroom.accounts.unbindUserFromAccount(accountId, userId);
}

/** Edit a user's permissions in relation to an account
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @param {String} accountId 
 * @param {String} userId 
 * @param {Object} newPermissions 
 */
const editUserPermissionsForAccount = function(gameId, chatroomId, accountId, userId, newPermissions){

    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //retrieve account 
    var account = chatroom.accounts.cache.get(accountId);
    if(!account) throw new ChatroomError(err.ACCOUNT_DOESNT_EXIST);

    //change permissions
    account.editUserPermissions(userId, newPermissions);
}

/** Add a terminal to an account, allowing the account to send messages from there if terminalbound, and directing whispers there
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @param {String} accountId 
 * @param {Discord.Channel} terminal 
 */
const addTerminalToAccount = function(gameId, chatroomId, accountId, terminal){

    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //retrieve account
    var account = chatroom.accounts.cache.get(accountId);
    if(!account) throw new ChatroomError(err.ACCOUNT_DOESNT_EXIST);

    //add terminal to account
    account.addTerminal(terminal);
}

/** Remove a terminal from an account, forbidding the account from sending messages from there if terminalbound, and no longer directing whispers there
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @param {String} accountId 
 * @param {String} terminalId 
 */
const removeTerminalFromAccount = function(gameId, chatroomId, accountId, terminalId){
    
    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //retrieve account
    var account = chatroom.accounts.cache.get(accountId);
    if(!account) throw new ChatroomError(err.ACCOUNT_DOESNT_EXIST);

    //remove terminal from account
    account.removeTerminal(terminalId);
}

/*
CHATROOM USERS FUNCTIONS
*/

/** Retrieve the user strings for all users in a chatroom
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @returns {Array<String>} The strings
 */
const retrieveAllUserStringsForChatroom = function(gameId, chatroomId){

    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //retrieve all user strings
    var userstrings = [];
    chatroom.accounts.users.each(user => {
        userstrings.push(user.toString());
    });
    return userstrings;
}

/** Retrieve the profile embed for a user
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @param {String} userId 
 * @returns {Discord.MessageEmbed} The profile embed
 */
const retrieveUserProfile = function(gameId, chatroomId, userId){

    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //retrieve user
    var user = chatroom.accounts.users.get(userId);
    if(!user) throw new ChatroomError(err.USER_DOESNT_EXIST);

    //return user profile embed
    return user.toProfileEmbed();
}

/*
USER FUNCTIONS
*/

/** Login a user to an account they have access to.
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @param {String} userId 
 * @param {String} accountId 
 */
const login = function(gameId, chatroomId, userId, accountId){
    
    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //retrieve user
    var user = chatroom.accounts.users.get(userId);
    if(!user) throw new ChatroomError(err.USER_DOESNT_EXIST);

    //login
    user.login(accountId);
}

/** Logout a user.
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @param {String} userId 
 */
const logout = function(gameId, chatroomId, userId){

    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //retrieve user
    var user = chatroom.accounts.users.get(userId);
    if(!user) throw new ChatroomError(err.USER_DOESNT_EXIST);

    //logout
    user.logout();
}

/** Retrieve the usernames of all registered accounts
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @returns {Array<String>} The usernames
 */
const retrieveRegisteredAccountUsernames = function(gameId, chatroomId){

    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //retrieve all registered account usernames
    var usernamearray = [];
    chatroom.accounts.cache.each(account => {
        if(account.registered){
            usernamearray.push(account.username);
        }
    });

    //return the usernames
    return usernamearray;
}

/** Send a private message to another account's terminals
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @param {String} senderAccountId 
 * @param {String} targetAccountId 
 * @param {String} message 
 */
const whisper = function(gameId, chatroomId, senderAccountId, targetAccountId, message){
    
    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //retrieve both accounts
    var senderAccount = chatroom.accounts.cache.get(senderAccountId);
    var targetAccount = chatroom.accounts.cache.get(targetAccountId);

    //verify accounts exist
    if(!senderAccount) throw new ChatroomError(err.NOT_LOGGED_IN);
    if(!targetAccount) throw new ChatroomError(err.ACCOUNT_DOESNT_EXIST);

    //send whisper
    chatroom.messagehandler.whisper(senderAccount, targetAccount, message);
}

/*
LOG FUNCTIONS
*/

/** Retrieve the log
 * @param {String} gameId 
 * @param {String} chatroomId 
 */
const retrieveLog = function(gameId, chatroomId){
    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //retrieve log file
    return chatroom.messagehandler.logger.retrieveLog();
}

/*
HELPERS
*/

/** Retrieve the id of the chatroom a terminal belongs to.
 * @param {String} gameId 
 * @param {String} terminalId 
 * @returns {(String|undefined)} The id of the chatroom, or undefined if no such chatroom exists
 */
const retrieveChatroomIdByTerminal = function(gameId, terminalId){

    //retrieve chatroom manager
    var chatroomManager = datahandler.retrieveChatroomManager(gameId);

    //retrieve id
    return chatroomManager.terminalMapping.get(terminalId);
}

/** Retrieve the account id of the account a user is currently logged into.
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @param {String} userId 
 * @returns {String} The id
 */
const retrieveLoggedInAccountId = function(gameId, chatroomId, userId){

    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //retrieve user
    var user = chatroom.accounts.users.get(userId);
    if(!user) throw new ChatroomError(err.USER_DOESNT_EXIST);

    //verify logged in
    if(!user.currentAccountId) throw new ChatroomError(err.NOT_LOGGED_IN);

    //retrieve currentAccountId
    return user.currentAccountId;
}

/*
RAW RETRIEVAL
*/

/** Retrieve a chatroom by its id
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @returns {(Chatroom|undefined)} The chatroom or undefined if not found 
 */
const getChatroomById = function(gameId, chatroomId){
    return datahandler.retrieveChatroom(gameId, chatroomId);
}

/** Retrieve a chatroom by its name
 * @param {String} gameId 
 * @param {String} chatroomName 
 * @returns {(Chatroom|undefined)} The chatroom or undefined if not found
 */
const getChatroomByName = function(gameId, chatroomName){
    var chatroomManager = datahandler.retrieveChatroomManager(gameId);
    var chatroomId = chatroomManager.nameMapping.get(chatroomName);
    if(!chatroomId) return undefined;
    return chatroomManager.chatrooms.get(chatroomId);
}

/** Retrieve a chatroom by one of its terminals
 * @param {String} gameId 
 * @param {String} terminalId 
 * @returns {(Chatroom|undefined)} The chatroom or undefined if not found
 */
const getChatroomByTerminalId = function(gameId, terminalId){
    var chatroomManager = datahandler.retrieveChatroomManager(gameId);
    var chatroomId = chatroomManager.terminalMapping.get(terminalId);
    if(!chatroomId) return undefined;
    return chatroomManager.chatrooms.get(chatroomId);
}

/** Returns autocompletes for all chatrooms in a game
 * @param {String} gameId 
 * @param {String} senderId 
 * @param {String} focusedvalue 
 */
const adminAutocompletesAllChatrooms = function(gameId, senderId, focusedvalue){

    //verify permissions
    if(!admin.isAdmin(gameId, senderId)) throw new ChatroomError(err.INSUFFICIENT_PERMISSIONS);

    //retrieve chatroom manager
    var chatroomManager = datahandler.retrieveChatroomManager(gameId);
    
    //return chatroom ids
    var autocompletes = [];
    chatroomManager.chatrooms.each(chatroom => {
        autocompletes.push({name: chatroom.toString(), value: chatroom.id});
    });
    return autocompletes.filter(chatroomstring => chatroomstring.name.includes(focusedvalue));
}

/** Returns autocompletes for all accounts in a chatroom
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @param {String} senderId 
 * @param {String} focusedvalue 
 */
const adminAutocompletesAllAccounts = function(gameId, chatroomId, senderId, focusedvalue){

    //verify permissions
    if(!admin.isAdmin(gameId, senderId)) throw new ChatroomError(err.INSUFFICIENT_PERMISSIONS);

    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //return matching accounts
    var autocompletes = [];
    chatroom.accounts.cache.each(account => {
        autocompletes.push({name: `${account.toString()}`, value: `${account.id}`});
    });
    return autocompletes.filter(accountstring => accountstring.name.includes(focusedvalue));
}

/** Returns autocompletes for all accounts that are unregistered in a chatroom
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @param {String} senderId 
 * @param {String} focusedvalue 
 */
const adminAutocompletesUnregisteredAccounts = function(gameId, chatroomId, senderId, focusedvalue){

    //verify permissions
    if(!admin.isAdmin(gameId, senderId)) throw new ChatroomError(err.INSUFFICIENT_PERMISSIONS);

    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //return matching accounts
    var autocompletes = [];
    chatroom.accounts.cache.each(account => {
        if(!account.registered){
            autocompletes.push({name: `${account.toString()}`, value: `${account.id}`});
        }
    });
    return autocompletes.filter(accountstring => accountstring.name.includes(focusedvalue));
}

/** Returns autocompletes for all accounts that are registered in a chatroom
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @param {String} senderId 
 * @param {String} focusedvalue 
 */
const adminAutocompletesRegisteredAccounts = function(gameId, chatroomId, senderId, focusedvalue){

    //verify permissions
    if(!admin.isAdmin(gameId, senderId)) throw new ChatroomError(err.INSUFFICIENT_PERMISSIONS);

    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //return matching accounts
    var autocompletes = [];
    chatroom.accounts.cache.each(account => {
        if(account.registered){
            autocompletes.push({name: `${account.toString()}`, value: `${account.id}`});
        }
    });
    return autocompletes.filter(accountstring => accountstring.name.includes(focusedvalue));
}

/** Retrieve autocompletes for all users
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @param {String} senderId 
 * @param {String} focusedvalue 
 * @returns {Array<Object>}
 */
const adminAutocompletesAllUsers = function(gameId, chatroomId, senderId, focusedvalue){

    //verify permissions
    if(!admin.isAdmin(gameId, senderId)) throw new ChatroomError(err.INSUFFICIENT_PERMISSIONS);

    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //retrieve autocompletes
    var autocompletes = [];
    chatroom.accounts.users.each(user => {
        autocompletes.push({name: `${user.toString()}`, value: user.id});
    });

    //return filtered autocompletes
    return autocompletes.filter(autocomplete => autocomplete.name.includes(focusedvalue));
}

/** Returns autocompletes for all users an account can be accessed by
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @param {String} senderId 
 * @param {String} accountId 
 * @param {String} focusedvalue 
 */
const adminAutocompletesUsersFromAccount = function(gameId, chatroomId, senderId, accountId, focusedvalue){

    //verify permissions
    if(!admin.isAdmin(gameId, senderId)) throw new ChatroomError(err.INSUFFICIENT_PERMISSIONS);

    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //retrieve account
    var account = chatroom.accounts.getAccount(accountId);

    //retrieve users
    var autocompletes = [];
    account.userPermissions.each(userPerms => {
        var user = chatroom.accounts.users.get(userPerms.userId);
        if(user){
            autocompletes.push({name: user.toString(), value: user.id});
        }
    });
    return autocompletes.filter(user => user.name.includes(focusedvalue))
}

/** Returns autocompletes for all terminals a chatroom has access to.
 * @param {String} gameId 
 * @param {String} chatroomid 
 * @param {String} senderId 
 * @param {String} focusedvalue 
 */
const adminAutocompletesTerminalFromChatroom = function(gameId, chatroomId, senderId, focusedvalue){

    //verify permissions
    if(!admin.isAdmin(gameId, senderId)) throw new ChatroomError(err.INSUFFICIENT_PERMISSIONS);
    
    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //return terminals that match
    var autocompletes = [];
    chatroom.terminals.each(terminal => {
        autocompletes.push({name: `${terminal.guild.name} / #${terminal.name}`, value: `${terminal.id}`});
    });
    return autocompletes.filter(terminal => terminal.name.includes(focusedvalue));
}

/** Returns autocompletes for all terminals an account is bound to.
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @param {String} senderId 
 * @param {String} accountId 
 * @param {String} focusedvalue 
 */
const adminAutocompletesTerminalFromAccount = function(gameId, chatroomId, accountId, focusedvalue){

    //retrieve chatrom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //retrieve account
    var account = chatroom.accounts.getAccount(accountId);

    //retrieve terminals
    var autocompletes = [];
    account.terminals.forEach(terminalId => {
        var channel = client.channels.cache.get(terminalId);
        autocompletes.push({name: `${channel.guild.name} / #${channel.name}`, value: terminalId});
    });

    //return the autocompletes
    return autocompletes.filter(channelname => channelname.name.includes(focusedvalue));
}

/** Returns autocompletes of all accounts that a user has access to.
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @param {String} senderId 
 * @param {String} focusedvalue 
 */
const userAutocompletesAllAccessibleAccounts = function(gameId, chatroomId, senderId, focusedvalue){
    
    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //retrieve user
    var user = chatroom.accounts.getUser(senderId);

    //create array to hold autocompletes
    var autocompletes = [];

    //for each user account
    user.accounts.forEach(accountId => {
        try{
            var account = chatroom.accounts.getAccount(accountId);
            autocompletes.push({name: `${account.toString()}`, value: `${account.id}`});
        }catch(error){}
    });

    //return the autocompletes
    return autocompletes.filter(autocomplete => autocomplete.name.includes(focusedvalue));
}

/** Returns autocompletes of all accounts that are members in a chatroom that a user can view (other than the one he's logged into)
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @param {String} senderId 
 * @param {String} focusedvalue 
 */
const userAutocompletesAllViewableAccounts = function(gameId, chatroomId, senderId, focusedvalue){
    
    //retrieve chatroom
    var chatroom = datahandler.retrieveChatroom(gameId, chatroomId);

    //retrieve user
    var user = chatroom.accounts.getUser(senderId);

    //retrieve user account
    var accountId = user.currentAccountId;
    if(!accountId) throw new ChatroomError(err.NOT_LOGGED_IN);

    //retrieve sender account
    var account = chatroom.accounts.getAccount(accountId);

    //verify account registered
    if(!account.registered) throw new ChatroomError(err.ACCOUNT_NOT_REGISTERED)
    
    //retrieve all registered accounts
    var registeredaccounts = chatroom.accounts.cache.filter(account => (account.registered && !(account.id == accountId)));

    //return autocompletes for all account
    var autocompletes = [];
    registeredaccounts.each(account => {
        autocompletes.push({name: account.toString(), value: account.id});
    })
    return autocompletes.filter(autocomplete => autocomplete.name.includes(focusedvalue));
}

/** Respond to an error in retrieving autocompletes
 * @param {Error} errorcode 
 */
const autocompletesError = function(errorcode){
    if(errorcode instanceof ChatroomError){
        switch(errorcode.chatroomerrorcode){
            case err.CHATROOM_DOESNT_EXIST.code:
                return ["Could not find a chatroom to associate with this command!"];
            case err.INSUFFICIENT_PERMISSIONS.code:
                return ["You don't have permission to use this command."];
            case err.ACCOUNT_DOESNT_EXIST.code:
                return ["Could not find an account to associate with this command!"];
            case err.USER_DOESNT_EXIST:
                return ["You are not a user in this chatroom."];
            case err.NOT_LOGGED_IN:
                return ["You are not logged in!"];
            case err.ACCOUNT_NOT_REGISTERED:
                return ["This account is not registered!"];
        }
    }
    return ["An error occurred!"];
}

/*
INTERACTION RESPONSE
*/

/** Reply to an interaction with a message. Will edit existing reply if already replied to.
 * @param {Discord.Interaction} interaction 
 * @param {String} message 
 * @param {Boolean} ephemeral 
 */
const replyToInteraction = async function(interaction, message, ephemeral=true){
    try{
        await interaction.reply({content: message, ephemeral: ephemeral});
    }catch(error){
        await interaction.editReply((await interaction.fetchReply()).content + `\n${message}`);
    }
}

/** Reply to an interaction with an embed.
 * @param {Discord.Interaction} interaction 
 * @param {Discord.MessageEmbed} embed 
 * @param {Boolean} ephemeral 
 */
const replyToInteractionWithEmbed = async function(interaction, embed, ephemeral=true){
    if(!interaction.replied){
        await interaction.reply({embeds: [embed], ephemeral: ephemeral});
    }
}

/** Provide a predetermined reply for a given returncode
 * @param {Discord.Interaction} interaction 
 * @param {Number} returncode 
 * @param {Boolean} ephemeral 
 */
const replyToInteractionBasedOnReturnCode = async function(interaction, errorcode){
    if(errorcode instanceof ChatroomError){
        await replyToInteraction(interaction, errorcode.message, true);
    }
    else{
        await replyToInteraction(interaction, "Something went wrong!", true);
        console.log(errorcode);
    }
}

module.exports = {
    moduleStart: moduleStart,

    //chatrooms functions
    createChatroom: createChatroom,
    deleteChatroom: deleteChatroom,
    changeChatroomName: changeChatroomName,
    retrieveAllChatroomStrings: retrieveAllChatroomStrings,
    retrieveChatroomProfile: retrieveChatroomProfile,
    addTerminalToChatroom: addTerminalToChatroom,
    removeTerminalFromChatroom: removeTerminalFromChatroom,

    //chatroomaccounts functions
    createAccount: createAccount,
    deleteAccount: deleteAccount,
    changeTerminalBoundStatusForAccount: changeTerminalBoundStatusForAccount,
    changeAccountUsername: changeAccountUsername,
    changeAccountProfilePicture: changeAccountProfilePicture,
    retrieveAllAccountStringsForChatroom: retrieveAllAccountStringsForChatroom,
    retrieveAccountProfile: retrieveAccountProfile,
    registerAccount: registerAccount,
    unregisterAccount: unregisterAccount,
    addUserToAccount: addUserToAccount,
    removeUserFromAccount: removeUserFromAccount,
    editUserPermissionsForAccount: editUserPermissionsForAccount,
    addTerminalToAccount: addTerminalToAccount,
    removeTerminalFromAccount: removeTerminalFromAccount,

    //chatroomusers functions
    retrieveAllUserStringsForChatroom: retrieveAllUserStringsForChatroom,
    retrieveUserProfile: retrieveUserProfile,

    //user functions
    login: login,
    logout: logout,
    retrieveRegisteredAccountUsernames: retrieveRegisteredAccountUsernames,
    whisper: whisper,

    //log functions
    retrieveLog: retrieveLog,

    //helpers
    retrieveChatroomIdByTerminal: retrieveChatroomIdByTerminal,
    retrieveLoggedInAccountId: retrieveLoggedInAccountId,

    //raw retrieval
    getChatroomById: getChatroomById,
    getChatroomByName: getChatroomByName,
    getChatroomByTerminalId: getChatroomByTerminalId,

    //autocompletes
    adminAutocompletesAllChatrooms: adminAutocompletesAllChatrooms,
    adminAutocompletesAllAccounts: adminAutocompletesAllAccounts,
    adminAutocompletesRegisteredAccounts: adminAutocompletesRegisteredAccounts,
    adminAutocompletesUnregisteredAccounts: adminAutocompletesUnregisteredAccounts,
    adminAutocompletesAllUsers: adminAutocompletesAllUsers,
    adminAutocompletesUsersFromAccount: adminAutocompletesUsersFromAccount,
    adminAutocompletesTerminalFromChatroom: adminAutocompletesTerminalFromChatroom,
    adminAutocompletesTerminalFromAccount: adminAutocompletesTerminalFromAccount,
    userAutocompletesAllAccessibleAccounts: userAutocompletesAllAccessibleAccounts,
    userAutocompletesAllViewableAccounts: userAutocompletesAllViewableAccounts,
    autocompletesError: autocompletesError,

    //interaction response
    replyToInteraction: replyToInteraction,
    replyToInteractionWithEmbed: replyToInteractionWithEmbed,
    replyToInteractionBasedOnReturnCode: replyToInteractionBasedOnReturnCode,
}