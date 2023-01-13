/** BaseChatroomObject contains a chatroom for all objects belonging to a chatroom to have ready access to events.
 * @typedef {BaseChatroomObject} BaseChatroomObject
 */
 class BaseChatroomObject{

    /** The chatroom this object belongs to.
     */
    chatroom;

    /** Create a BaseChatroomObject
     * @param {Chatroom} chatroom 
     */
    constructor(chatroom){
        this.chatroom = chatroom;
    }
}

module.exports = {
    BaseChatroomObject: BaseChatroomObject,
}