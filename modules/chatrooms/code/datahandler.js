const Discord = require('discord.js');
const admin = require('../../../administration/administration.js');
const {ChatroomManager} = require('./classes/ChatroomManager.js');
const {Chatroom} = require('./classes/Chatroom.js');
const {ChatroomError, err} = require('./ChatroomError.js');
const {GameManager} = require('../../../classes/gamemanager.js');
const {Game} = require('../../../classes/game.js');

/**The chatroom data
 * @type {Discord.Collection<String, ChatroomManager>}
 */
const ChatroomData = new Discord.Collection();

/** The gamemanager used for chatrooms
 * @type {GameManager}
 */
const gamemanager = require('../../../gamemanager.js').gameManager();

/** Loads all chatrooms for all games
 */
const loadAllChatrooms = function(){

    //retrieve all game ids
    var gameIds = admin.getAllIds();

    //load chatrooms for all games
    gameIds.forEach(gameId => {
        var game = gamemanager.games.get(gameId);
        var chatroomManager = new ChatroomManager(game);
        ChatroomData.set(game.id, chatroomManager);
    });
}

/** Load all chatrooms
 */
loadAllChatrooms();

//raw retrieval functions

/** Returns the chatroom manager for a specific game
 * @param {String} gameId 
 * @returns {ChatroomManager} The manager
 */
var retrieveChatroomManager = function(gameId){
    var chatroomManager = ChatroomData.get(gameId);
    if(!chatroomManager){
        var game = gamemanager.games.get(gameId);
        chatroomManager = new ChatroomManager(game);
        ChatroomData.set(gameId, chatroomManager);
    }
    return chatroomManager;
}

/** Retrieve the chatroom based on id
 * @param {String} gameId 
 * @param {String} chatroomId 
 * @returns {Chatroom} The chatroom the id is for
 */
 var retrieveChatroom = function(gameId, chatroomId){

    //if there is no chatroom manager for game, create one
    if(!ChatroomData.has(gameId)) ChatroomData.set(gameId, new ChatroomManager(client, gameId));

    //retrieve the chatroom manager for the game
    var chatroomManager = ChatroomData.get(gameId);

    //retrieve the chatroom
    var chatroom = chatroomManager.chatrooms.get(chatroomId);

    //if the chatroom doesnt exist, throw error
    if(!chatroom) throw new ChatroomError(err.CHATROOM_DOESNT_EXIST);

    //return the chatroom
    return chatroom;
}


module.exports = {
    loadAllChatrooms: loadAllChatrooms,
    retrieveChatroomManager: retrieveChatroomManager,
    retrieveChatroom: retrieveChatroom,
}