const Discord = require('discord.js');
const admin = require('../../administration/administration.js');
const datahandler = require('./code/datahandling.js');
const {ConnectionManager, Connection} = require('./code/classes.js');
const {ConnectionError, err} = require('./code/ConnectionError.js');
const { ConnectionTypes } = require('./code/connectiontypes.js');

/** Prep the connection module
 */
const moduleStart = function(){
    console.log("Starting connections module!");
}

/** Retrieve all the connections for a discord 
 * @param {String} gameId 
 * @returns {Discord.Collection<String, Connection>}
 */
const retrieveAllConnections = function(gameId){
    var connectionManager = datahandler.retrieveManager(gameId);
    return connectionManager.connections;
}

/** Create a new standard connection
 * @param {String} gameId 
 * @param {Discord.Channel} startChannel 
 * @param {Discord.Channel} endChannel 
 */
const createStandardConnection = function(gameId, startChannel, endChannel){
    var connectionManager = datahandler.retrieveManager(gameId);
    connectionManager.createStandardConnection(startChannel, endChannel);
}

/** Create a new anonymous connection
 * @param {String} gameId 
 * @param {Discord.Channel} startChannel 
 * @param {Discord.Channel} endChannel 
 * @param {String} username 
 * @param {String} avatarUrl 
 */
const createAnonymousConnection = async function(gameId, startChannel, endChannel, username, avatarUrl){
    var connectionManager = datahandler.retrieveManager(gameId);
    await connectionManager.createAnonymousConnection(startChannel, endChannel, username, avatarUrl);
}

/** Create a new signal connection
 * @param {String} gameId 
 * @param {Discord.Channel} startChannel 
 * @param {Discord.Channel} endChannel 
 * @param {String} signal 
 */
const createSignalConnection = function(gameId, startChannel, endChannel, signal="####"){
    var connectionManager = datahandler.retrieveManager(gameId);
    connectionManager.createSignalConnection(startChannel, endChannel, signal);
}

/** Create a new user connection
 * @param {String} gameId 
 * @param {Discord.User} startUser 
 * @param {Discord.Channel} endChannel 
 */
const createUserConnection = function(gameId, startUser, endChannel){
    var connectionManager = datahandler.retrieveManager(gameId);
    connectionManager.createUserConnection(startUser, endChannel);
}

/** Create a partial channel connection
 * @param {String} gameId 
 * @param {Discord.Channel} startChannel 
 */
const createPartialChannelConnection = function(gameId, startChannel){
    var connectionManager = datahandler.retrieveManager(gameId);
    connectionManager.createPartialChannelConnection(gameId, startChannel);
}

/** Create a partial user connection
 * @param {String} gameId 
 * @param {Discord.Channel} startUser 
 */
const createPartialUserConnection = function(gameId, startUser){
    var connectionManager = datahandler.retrieveManager(gameId);
    connectionManager.createPartialUserConnection(gameId, startUser);
}

/** Complete a partial channel connection as a standard connection
 * @param {String} gameId 
 * @param {String} connectionId 
 * @param {Discord.Channel} endChannel 
 */
const completeStandardConnection = function(gameId, connectionId, endChannel){
    var connectionManager = datahandler.retrieveManager(gameId);
    connectionManager.endStandardConnection(connectionId, endChannel);
}

/** Complete a partial channel connection as an anonymous connection
 * @param {String} gameId 
 * @param {String} connectionId 
 * @param {Discord.Channel} endChannel 
 * @param {String} username 
 * @param {String} avatarUrl 
 */
const completeAnonymousConnection = async function(gameId, connectionId, endChannel, username="???", avatarUrl="https://i.imgur.com/B1PH30q.jpeg"){
    var connectionManager = datahandler.retrieveManager(gameId);
    await connectionManager.endAnonymousConnection(connectionId, endChannel, username, avatarUrl);
}

/** Complete a partial channel connection as a signal connection
 * @param {String} gameId 
 * @param {String} connectionId 
 * @param {Discord.Channel} endChannel 
 * @param {String} signal 
 */
const completeSignalConnection = function(gameId, connectionId, endChannel, signal="####"){
    var connectionManager = datahandler.retrieveManager(gameId);
    connectionManager.endSignalConnection(connectionId, endChannel, signal);
}

/** Complete a partial user connection as a user connection
 * @param {String} gameId 
 * @param {String} connectionId 
 * @param {String} endChannel 
 */
const completeUserConnection = function(gameId, connectionId, endChannel){
    var connectionManager = datahandler.retrieveManager(gameId);
    connectionManager.endUserConnection(connectionId, endChannel);
}

/** Delete a connection
 * @param {String} gameId 
 * @param {String} connectionId 
 */
const deleteConnection = function(gameId, connectionId){
    var connectionManager = datahandler.retrieveManager(gameId);
    connectionManager.removeConnection(connectionId);
}

/** Change the username for an anonymous connection
 * @param {String} gameId 
 * @param {String} connectionId 
 * @param {String} username 
 */
const changeAnonymousConnectionUsername = function(gameId, connectionId, username){
    var connection = datahandler.retrieveConnection(gameId, connectionId);
    if(!connection) return;
    if(!(connection.type == ConnectionTypes.ANONYMOUS)) return;
    connection.changeUsername(username);
}

/** Change the avatar for an anonymous connection
 * @param {String} gameId 
 * @param {String} connectionId 
 * @param {String} avatarURL 
 * @returns 
 */
const changeAnonymousConnectionAvatar = async function(gameId, connectionId, avatarURL){
    var connection = datahandler.retrieveConnection(gameId, connectionId);
    if(!connection) return;
    if(!(connection.type == ConnectionTypes.ANONYMOUS)) return;
    await connection.changeProfilePicture(avatarURL);
}

/** Change the signal sent by a signal connection
 * @param {String} gameId 
 * @param {String} connectionId 
 * @param {String} signal 
 */
const changeSignalConnectionSignal = function(gameId, connectionId, signal){
    var connection = datahandler.retrieveConnection(gameId, connectionId);
    if(!connection) return;
    if(!(connection.type == ConnectionTypes.SIGNAL)) return;
    connection.changeSignal(signal);
}

/** Send a signal on a signal connection
 * @param {String} gameId 
 * @param {String} connectionId 
 * @param {String} pingedId 
 */
const signal = function(gameId, connectionId, pingedId=null){
    var connection = datahandler.retrieveConnection(gameId, connectionId);
    if(!connection) return;
    if(!(connection.type == ConnectionTypes.SIGNAL)) return;
    connection.send(pingedId);
}

/** Retrieve autocompletes for all connections
 * @param {String} gameId 
 * @param {String} requesterId 
 * @returns {Array<Object>} The autocompletes
 */
const autocompletesAllConnectionsForAdmin = function(gameId, requesterId){
    if(!admin.isAdmin(gameId, requesterId)) throw new ConnectionError(err.INSUFFICIENT_PERMISSIONS);
    var autocompleteArray = [];
    var connectionManager = datahandler.retrieveManager(gameId);
    var connections = connectionManager.connections;
    connections.each(connection => {
        autocompleteArray.push({name: connection.toString(), value: connection.id});
    })
    return autocompleteArray;
}

/** Retrieve autocompletes for a specific type of connections
 * @param {String} gameId 
 * @param {String} requesterId 
 * @param {String} type 
 * @returns {Array<Object>} The autocompletes
 */
const autocompletesSpecificTypeForAdmin = function(gameId, requesterId, type){
    if(!admin.isAdmin(gameId, requesterId)) throw new ConnectionError(err.INSUFFICIENT_PERMISSIONS);
    var autocompleteArray = [];
    var connectionManager = datahandler.retrieveManager(gameId);
    var connections = connectionManager.retrieveTypeOfConnection(type);
    connections.each(connection => {
        autocompleteArray.push({name: connection.toString(), value: connection.id});
    });
    return autocompleteArray;
}

/** Return autocompletes for an error occurring
 * @param {Object} errorcode 
 * @returns {Array<String>} The autocompletes
 */
const autocompletesError = function(errorcode){
    switch(errorcode.code){
        case err.CONNECTION_DOESNT_EXIST:
            return ["Could not find that connection!"];
        case err.INSUFFICIENT_PERMISSIONS:
            return ["You do not have permission to use that command."];
        case err.NOT_STANDARD_CONNECTION:
            return ["Choose a valid standard connection!"];
        case err.NOT_ANONYMOUS_CONNECTION:
            return ["Choose a valid anonymous connection!"];
        case err.NOT_SIGNAL_CONNECTION:
            return ["Choose a valid signal connection!"];
        case err.NOT_USER_CONNECTION:
            return ["Choose a valid user connection!"];
        case err.NOT_CHANNEL_CONNECTION:
            return ["Choose a valid channel connection!"];
        default:
            return ["Something went wrong!"];
    }
}

/** Reply to an interaction based on an error code
 * @param {Discord.Interaction} interaction 
 * @param {Object} returncode 
 */
const replyToInteractionBasedOnReturnCode = async function(interaction, returncode){
    if(returncode instanceof ConnectionError){
        await replyToInteraction(interaction, returncode.message);
    }
    else{
        await replyToInteraction(interaction, "Something went wrong!");
        console.log(returncode);
    }
}

/** Reply to an interaction with a string
 * @param {Discord.Interaction} interaction 
 * @param {String} string 
 * @param {Boolean} ephemeral 
 */
const replyToInteraction = async function(interaction, string, ephemeral=true){
    if(!interaction.replied){
        await interaction.reply({content: string, ephemeral: ephemeral});
    }
    else{
        await interaction.editReply((await interaction.fetchReply()).content + `\n${string}`);
    }
}

module.exports = {
    moduleStart: moduleStart,
    //retrieval
    retrieveAllConnections: retrieveAllConnections,
    //creation
    createStandardConnection: createStandardConnection,
    createAnonymousConnection: createAnonymousConnection,
    createSignalConnection: createSignalConnection,
    createUserConnection: createUserConnection,
    createPartialChannelConnection: createPartialChannelConnection,
    createPartialUserConnection: createPartialUserConnection,
    completeStandardConnection: completeStandardConnection,
    completeAnonymousConnection: completeAnonymousConnection,
    completeSignalConnection: completeSignalConnection,
    completeUserConnection: completeUserConnection,
    //deletion
    deleteConnection: deleteConnection,
    //editing
    changeAnonymousConnectionUsername: changeAnonymousConnectionUsername,
    changeAnonymousConnectionAvatar: changeAnonymousConnectionAvatar,
    changeSignalConnectionSignal: changeSignalConnectionSignal,
    //usage
    signal: signal,
    //autocompletes
    autocompletesAllConnectionsForAdmin: autocompletesAllConnectionsForAdmin,
    autocompletesSpecificTypeForAdmin: autocompletesSpecificTypeForAdmin,
    autocompletesError: autocompletesError,
    //interaction replying
    replyToInteraction: replyToInteraction,
    replyToInteractionBasedOnReturnCode: replyToInteractionBasedOnReturnCode
}