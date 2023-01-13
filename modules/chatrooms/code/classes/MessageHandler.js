const Discord = require('discord.js');
const messagesending = require('../../../../handlers/messagehandler.js');

const {BaseChatroomObject} = require('./BaseChatroomObject.js');
const {Logger} = require('./Logger.js');
const {ChatroomError, err} = require('../ChatroomError.js');
const {Events} = require('../events.js');

/** MessageHandler is a class that takes care of sending all messages and updates out to the discord channels that serve as terminals
 * @typedef {MessageHandler} MessageHandler
 */
 class MessageHandler extends BaseChatroomObject{

    /** The logger this handler uses to record messages and events
     * @type {Logger}
     */
    logger;

    /** Create a new MessageHandler
     * @param {Chatroom} chatroom 
     */
    constructor(chatroom){
        super(chatroom);
        this.logger = new Logger(chatroom);
        this.startEmitters();
    }

    destroy(){
        this.endEmitters();
    }

    startEmitters(){
        this.chatroom.manager.game.client.on('messageCreate', this.messageReceived);
        this.chatroom.on(Events.ACCOUNT_REGISTERED, this.registerEvent);
        this.chatroom.on(Events.ACCOUNT_UNREGISTERED, this.unregisterEvent);
        this.chatroom.on(Events.ACCOUNT_USERNAME_CHANGED, this.usernameChangedEvent);
        this.chatroom.on(Events.ACCOUNT_PROFILE_PICTURE_CHANGED, this.profilePictureChangedEvent);
    }

    endEmitters(){
        this.chatroom.manager.game.client.off('messageCreate', this.messageReceived);
        this.chatroom.off(Events.ACCOUNT_REGISTERED, this.registerEvent);
        this.chatroom.off(Events.ACCOUNT_UNREGISTERED, this.unregisterEvent);
        this.chatroom.off(Events.ACCOUNT_USERNAME_CHANGED, this.usernameChangedEvent);
        this.chatroom.off(Events.ACCOUNT_PROFILE_PICTURE_CHANGED, this.profilePictureChangedEvent);
    }

    /** Send a message on all terminals
     * @param {String} content 
     * @param {Array<Object>} attachments 
     * @param {Array<Discord.MessageEmbed>} embeds 
     * @param {String} username 
     * @param {String} profilepicture 
     */
    broadcastMessage(content, attachments, embeds, username, profilepicture){

        //retrieve terminals
        var terminalIds = [];
        this.chatroom.terminals.each(terminal => {
            terminalIds.push(terminal.id);
        });
        
        //send message
        messagesending.sendOnChannelsWebhook(terminalIds, username, profilepicture, content, attachments, embeds);
    }

    /** Alert all terminals with an embed update
     * @param {Discord.MessageEmbed} embed 
     */
    broadcastAlert(embed){

        //retrieve terminals
        var terminalIds = [];
        this.chatroom.terminals.each(terminal => {
            terminalIds.push(terminal.id);
        });

        //send message
        messagesending.sendMessageOnChannelIds(terminalIds, null, null, [embed]);
    }

    /** Send a private message from one account's terminals to another
     * @param {Account} startingAccount 
     * @param {Account} targetAccount 
     * @param {String} content 
     */
    whisper(startingAccount, targetAccount, content){

        //verify the starting account and target account are registered
        if(!startingAccount.registered || !targetAccount.registered) throw new ChatroomError(err.ACCOUNT_NOT_REGISTERED);
        
        //verify the starting Account and targetAccount have terminals
        if(targetAccount.terminals.length == 0) throw new ChatroomError(err.TARGET_ACCOUNT_HAS_NO_TERMINALS);

        //retrieve terminals for starting account and target account, then subtract them from all terminals to get outside terminals
        var startingTerminals = startingAccount.terminals;
        var targetTerminals = targetAccount.terminals;
        var outsideTerminals = [];
        this.chatroom.terminals.each(terminal => {
            if(!startingTerminals.includes(terminal.id) && !targetTerminals.includes(terminal.id)){
                outsideTerminals.push(terminal.id);
            }
        });

        //create embeds
        var startingEmbed = new Discord.MessageEmbed()
            .setTitle("Whisper Sent")
            .setThumbnail(targetAccount.profilepicture)
            .setDescription(`*You whispered to ${targetAccount.username}...*\n\n${content}`);

        var targetEmbed = new Discord.MessageEmbed()
            .setTitle("Whisper Received")
            .setThumbnail(startingAccount.profilepicture)
            .setDescription(`*${startingAccount.username} is whispering to you...*\n\n${content}`);

        var outsideEmbed = new Discord.MessageEmbed()
            .setTitle("Whispering")
            .setThumbnail(startingAccount.profilepicture)
            .setDescription(`*${startingAccount.username} is whispering to ${targetAccount.username}*`);

        //send embeds
        messagesending.sendMessageOnChannelIds(startingTerminals, null, null, [startingEmbed]);
        messagesending.sendMessageOnChannelIds(targetTerminals, null, null, [targetEmbed]);
        messagesending.sendMessageOnChannelIds(outsideTerminals, null, null, [outsideEmbed]);
    }

    /** Event response for a message being sent
     * @param {Discord.Message} message 
     */
    messageReceived = (message) => {
        
        try{
            //verify the message was in a terminal
            if(!this.chatroom.terminals.has(message.channel.id)) return;

            //verify the message was sent by a user
            if(message.author.bot) return;

            //retrieve pertinent information
            var content = message.content;
            var attachments = [];
            message.attachments.each(attachment => {
                attachments.push(attachment.attachment);
            });
            var embeds = message.embeds;
            var author = message.author;
            var userId = message.author.id;
            var channel = message.channel;

            //delete message
            message.delete();

            //retrieve user
            try{
                var user = this.chatroom.accounts.getUser(userId);
            }catch(error){
                channel.send(`You must be a user of this chatroom to use this terminal! Ask an admin to be added.`)
                    .then(msg => setTimeout(() => msg.delete(), 5000));
                return;
            }

            //retrieve logged in account id
            var accountId = user.currentAccountId;

            try{
                var account = this.chatroom.accounts.getAccount(accountId);
            }catch(error){
                channel.send(`You are not logged in! User /login to choose an account you have access to.`)
                    .then(msg => setTimeout(() => msg.delete(), 5000));
                return;
            }

            //verify registered
            if(!account.registered){
                channel.send(`This account is not registered! If you have the permissions to, use /register to register your account, or contact an admin.`)
                    .then(msg => setTimeout(() => msg.delete(), 5000));
                return;
            }

            //verify the account can type here
            if(account.terminalbound && !account.terminals.includes(channel.id)){
                channel.send(`This account may not post in this terminal!`)
                    .then(msg => setTimeout(() => msg.delete(), 5000));
                return;
            }

            //verify user has post permissions
            var userPermissions = account.userPermissions.get(userId);
            if(!userPermissions || !userPermissions.post){
                channel.send(`You do not have permission to post using this account! Ask an admin if you think this is a mistake.`)
                    .then(msg => setTimeout(() => msg.delete(), 5000));
                return;
            }

            //send message
            this.broadcastMessage(content, attachments, embeds, account.username, account.profilepicture);

            //log message
            this.logger.logMessage(content, attachments, account, author);
        }catch(errorcode){
            console.log(errorcode);
        }
    }

    /** Response to a registration event, notify all terminals
     * @param {Object} data
     */
    registerEvent = (data) => {

        //parse data
        var account = data.account;
        var userId = data.requester;

        //create registration embed
        var registerembed = new Discord.MessageEmbed()
            .setTitle(`Account Registered`)
            .setThumbnail(account.profilepicture)
            .setDescription(`*${account.username} has joined the chatroom!*`);

        //broadcast registration
        this.broadcastAlert(registerembed);

        //retrieve user
        var user = this.chatroom.manager.game.client.users.cache.get(userId);

        //log registration
        this.logger.logRegistration(account.username, account.profilepicture, account, user);
    }

    /** Response to an unregistration event, notify all terminals
     * @param {Object} data
     */
    unregisterEvent = (data) => {

        //parse data
        var account = data.account;
        var username = data.username;
        var profilepicture = data.profilepicture;
        var userId = data.requester;

        //create unregistration embed
        var unregisterembed = new Discord.MessageEmbed()
            .setTitle(`Account Unregistered`)
            .setThumbnail(profilepicture)
            .setDescription(`*${username} has left the chatroom!*`);

        //broadcast unregistration
        this.broadcastAlert(unregisterembed);

        //retrieve user
        var user = this.chatroom.manager.game.client.users.cache.get(userId);

        //log unregistration
        this.logger.logUnregistration(username, profilepicture, account, user);
    }

    /** Response to username changed event, notify all terminals
     * @param {Object} data
     */
    usernameChangedEvent = (data) => {

        //parse data
        var account = data.account;
        var oldUsername = data.username;
        var userId = data.requester;

        //create username changed embed
        var usernameembed = new Discord.MessageEmbed()
            .setTitle(`Username Changed`)
            .setThumbnail(account.profilepicture)
            .setDescription(`*${oldUsername} changed their name to ${account.username}!*`);

        //broadcast username changed
        this.broadcastAlert(usernameembed);

        //retrieve user
        var user = this.chatroom.manager.game.client.users.cache.get(userId);

        //log username changed event
        this.logger.logUsernameChange(oldUsername, account.username, account, user);
    }

    /** Respone to profile picture changed event, notify all terminals
     * @param {Account} account 
     */
    profilePictureChangedEvent = (data) => {

        //parse data
        var account = data.account;
        var oldProfilePicture = data.profilepicture;
        var userId = data.requester;

        //create profile picture changed embed
        var profilepictureembed = new Discord.MessageEmbed()
            .setTitle(`Profile Picture Changed`)
            .setThumbnail(account.profilepicture)
            .setDescription(`*${account.username} changed their profile picture!*`);

        //broadcast change
        this.broadcastAlert(profilepictureembed);

        //retrieve user
        var user = this.chatroom.manager.game.client.users.cache.get(userId);

        //log change
        this.logger.logProfilePictureChange(oldProfilePicture, account.profilepicture, account, user);
    }
}

module.exports = {
    MessageHandler: MessageHandler
}