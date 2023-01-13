const Discord = require('discord.js');

const datawriting = require('../../../../handlers/datahandler.js');

const {Chatroom} = require('./Chatroom.js');
const {ChatroomError, err} = require('../ChatroomError.js');
const {Events} = require('../events.js');
const {ModuleManager} = require('../../../../classes/modulemanager.js');
const {Game} = require('../../../../classes/game.js');


/** A Chatroom Manager
 * @typedef {ChatroomManager} ChatroomManager
 */
 class ChatroomManager extends ModuleManager{

    /** The chatrooms this manager governs
     * @type {Discord.Collection<String, Chatroom>}
     */
    chatrooms;

    /** A mapping of names to chatroom ids
     * @type {Discord.Collection<String, String>}
     */
    nameMapping;

    /** A mapping of channel ids to chatroom ids
     * @type {Discord.Collection<String, String>}
     */
    terminalMapping;

    /** Create a new chatroom manager for a given game Id
     * @param {Game} game
     */
    constructor(game){
        super(game, 'chatrooms');
        this.chatrooms = new Discord.Collection();
        this.nameMapping = new Discord.Collection();
        this.terminalMapping = new Discord.Collection();
        this.loadAllChatrooms();
    }

    /** Generate a new chatroom Id
     * @returns {String}
     */
    generateChatroomId(){
        var newId = Math.floor(Math.random() * 10000);
        while(this.chatrooms.has(newId)){
            newId = Math.floor(Math.random() * 10000);
        };
        return `${newId}`;
    }

    /** Create a new chatroom
     * @param {String} name 
     */
    createChatroom(name){

        //if the name is already taken, return failure
        if(this.nameMapping.has(name)) throw new ChatroomError(err.CHATROOM_NAME_TAKEN);

        //create chatroom
        var newChatroom = new Chatroom(this, this.generateChatroomId(), name);

        //claim name
        this.nameMapping.set(name, newChatroom.id);

        //add chatroom to manager
        this.chatrooms.set(newChatroom.id, newChatroom);
    }

    /** Delete a chatroom
     * @param {String} chatroomId 
     */
    deleteChatroom(chatroomId){

        //get chatroom
        var chatroom = this.chatrooms.get(chatroomId);
        if(!chatroom) throw new ChatroomError(err.CHATROOM_DOESNT_EXIST);

        //retrieve name
        var name = chatroom.name;

        //destroy the chatroom
        chatroom.destroy();

        //remove the chatroom from this manager
        this.chatrooms.delete(chatroomId);

        //free name
        this.nameMapping.delete(name);

        //free terminals
        this.terminalMapping.each((value, key) => {
            if(value == chatroomId){
                this.terminalMapping.delete(key);
            }
        })
    }

    /** Load all the chatrooms that belong to the game this manager governs into this manager from files
     */
    loadAllChatrooms(){

        //retrieve chatroom ids
        var chatroomIds = datawriting.retrieveSubFolder(this.game.id, `Chatrooms`);

        //for each chatroom id
        chatroomIds.forEach(chatroomId => {

            //load chatroom
            var chatroom = Chatroom.load(this, chatroomId);

            //set
            if(chatroom){
                this.chatrooms.set(chatroomId, chatroom);
                this.nameMapping.set(chatroom.name, chatroomId);
            }
        });
    }
}

module.exports = {
    ChatroomManager: ChatroomManager
}