const datawriting = require('../../../../handlers/datahandler.js');

const {BaseChatroomObject} = require('./BaseChatroomObject.js');

/** A Logger records events in a chatroom and reports who made them
 * @typedef {Logger} Logger
 */
class Logger extends BaseChatroomObject{
    
    /** Create a logger
     * @param {Chatroom} chatroom 
     */
    constructor(chatroom){
        super(chatroom);

        //if the log doesn't exist, create it 
        if(!datawriting.fileExists(this.chatroom.manager.game.id, `Chatrooms/${this.chatroom.id}/Log.txt`)){
            datawriting.putData(this.chatroom.manager.game.id, `Chatrooms/${this.chatroom.id}/Log.txt`, "");
        }
    }

    /** Retrieve the log
     * @returns {String} The file path
     */
    retrieveLog(){
        return datawriting.retrieveFilePath(this.chatroom.manager.game.id, `Chatrooms/${this.chatroom.id}/Log.txt`);
    }

    /** Log a message
     * @param {String} message 
     * @param {Array<String>} attachmentURLs 
     * @param {Account} account 
     * @param {Discord.User} user 
     */
    logMessage(message, attachmentURLs, account, user){
        try{
            var line = `${user.username}#${user.discriminator} (${user.id}) as ${account.username} (${account.id}): ${message}`;
            attachmentURLs.forEach(attachment => {
                line += ` ${attachment}`;
            });
            this.log(line);
        }catch(error){
            console.log(error);
        }
    }

    /** Log a registration
     * @param {String} username 
     * @param {String} profilepicture 
     * @param {Account} account 
     * @param {Discord.User} user 
     */
    logRegistration(username, profilepicture, account, user){
        try{
            this.log(`> ${user.username}#${user.discriminator} (${user.id}) registered account ${account.id} with the username "${username}" and the profile picture ${profilepicture}`);
        }catch(error){
            console.log(error);
        }
    }

    /** Log an unregistration
     * @param {String} username 
     * @param {String} profilepicture 
     * @param {Account} account 
     * @param {Discord.User} user 
     */
    logUnregistration(username, profilepicture, account, user){
        try{
            this.log(`> ${user.username}#${user.discriminator} (${user.id}) unregistered account ${account.id} (${username})`);
        }catch(error){
            console.log(error);
        }
    }

    /** Log a username change
     * @param {String} oldUsername 
     * @param {String} newUsername 
     * @param {Account} account 
     * @param {Discord.User} user 
     */
    logUsernameChange(oldUsername, newUsername, account, user){
        try{
            this.log(`> ${user.username}#${user.discriminator} (${user.id}) changed the username of ${oldUsername} (${account.id}) to ${newUsername}`);
        }catch(error){
            console.log(error);
        }
    }

    /** Log a profile picture change
     * @param {String} oldProfilePicture 
     * @param {String} newProfilePicture 
     * @param {Account} account 
     * @param {Discord.User} user 
     */
    logProfilePictureChange(oldProfilePicture, newProfilePicture, account, user){
        try{
            this.log(`> ${user.username}#${user.discriminator} (${user.id}) changed the profilepicture of ${account.username} (${account.id}) from ${oldProfilePicture} to ${newProfilePicture}`);
        }catch(error){
            console.log(error);
        }
    }

    /** Log a general line
     * @param {String} line 
     */
    log(line){
        datawriting.appendData(this.chatroom.manager.game.id, `Chatrooms/${this.chatroom.id}/Log.txt`, `${line}\n`);
    }
}

module.exports = {
    Logger: Logger,
}