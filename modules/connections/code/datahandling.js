const Discord = require('discord.js');
const admin = require('../../../administration/administration.js');
const { ConnectionManager } = require('./classes.js');
const {GameManager} = require('../../../classes/gamemanager.js');
const {Game} = require('../../../classes/game.js');

/** A collection of ConnectionManagers mapped to game ids
 * @type {Discord.Collection<String, ConnectionManager>}
 */
var ConnectionData = new Discord.Collection();

/** The game manager this module uses
 * @type {GameManager}
 */
const gamemanager = require('../../../gamemanager.js').gameManager();

/** Retrieve the connection manager for a given game
 * @param {String} gameId 
 * @returns {ConnectionManager}
 */
const retrieveManager = function(gameId){
    var connectionManager = ConnectionData.get(gameId);
    if(!connectionManager){
        var game = gamemanager.games.get(gameId);
        connectionManager = new ConnectionManager(game);
        ConnectionData.set(gameId, connectionManager);
    }
    return connectionManager;
}

/** Retrieve a specific connection for a given game
 * @param {String} gameId 
 * @param {String} connectionId 
 * @returns {Connection}
 */
const retrieveConnection = function(gameId, connectionId){
    var connectionManager = retrieveManager(gameId);
    return connectionManager.connections.get(connectionId);
}

/** Load all connections for all games
 */
 const loadAllConnections = function(){
    var gameIds = admin.getAllIds();
    gameIds.forEach(gameId => {
        var connectionManager = retrieveManager(gameId);
        connectionManager.loadConnections();
    });
}

//Load the connections
loadAllConnections();

module.exports = {
    retrieveManager: retrieveManager,
    retrieveConnection: retrieveConnection,
    loadAllConnections: loadAllConnections,
}