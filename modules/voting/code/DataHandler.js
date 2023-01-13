const Discord = require('discord.js');
const admin = require('../../../administration/administration.js');
const datawriting = require('../../../handlers/datahandler.js');
const {err, VotingError} = require('./VotingError.js');
const {VotingClientManager} = require('./classes/VotingClientManager.js');
const {VotingClient} = require('./classes/VotingClient.js');
const {GameManager} = require('../../../classes/gamemanager.js');
const {Game} = require('../../../classes/game.js');


/** The game manager this module uses to retrieve games
 * @type {GameManager}
 */
const gamemanager = require('../../../gamemanager.js').gameManager();

/** Holds all VoteManagerHolders for games
 * @type {Discord.Collection<String, VotingClientManager>};
 */
const votingClientManagers = new Discord.Collection();

//LOAD

/** Load all voting clients into this data handler
 */
const loadVotingClients = function(){

    //retrieve all game ids
    var gameIds = admin.getAllIds();

    //for each game
    gameIds.forEach(gameId => {

        //get the game
        var game = gamemanager.games.get(gameId);

        //create a manager, store it, and load all its voting clients
        var votingClientManager = new VotingClientManager(game);
        votingClientManagers.set(gameId, votingClientManager);
        votingClientManager.loadVotingClients();
    });
}

// Load the voting clients
loadVotingClients();

//RETRIEVAL

/** Retrieve a VotingClientManager
 * @param {String} gameId
 * @returns {VotingClientManager} The Voting Client Manager
 */
const retrieveVotingClientManager = function(gameId){

    //retrieve the game's voting client manager
    var manager = votingClientManagers.get(gameId);

    //if the game doesn't have one yet, create one
    if(!manager){
        var game = gamemanager.games.get(gameId);
        manager = new VotingClientManager(game);
        votingClientManagers.set(game.id, manager);
    }

    //return the manager
    return manager;
}

/** Retrieve a VotingClient
 * @param {String} gameId
 * @param {String} clientId
 * @returns {VotingClient} The Voting Client
 */
const retrieveVotingClient = function(gameId, clientId){

    //retrieve the game's voting client manager
    var manager = retrieveVotingClientManager(gameId);

    //retrieve the voting client
    var votingClient = manager.cache.get(clientId);

    //if the voting client didn't exist, throw an error
    if(!votingClient) throw new VotingError(err.INVALID_VOTING_CLIENT_ID);

    //return the voting client
    return votingClient;
}

module.exports = {
    retrieveVotingClientManager: retrieveVotingClientManager,
    retrieveVotingClient: retrieveVotingClient,
}