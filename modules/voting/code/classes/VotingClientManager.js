const Discord = require('discord.js');
const datawriting = require('../../../../handlers/datahandler.js');
const {VotingClient} = require('./VotingClient.js');
const {err, VotingError} = require('../VotingError.js');
const {ModuleManager} = require('../../../../classes/modulemanager.js');
const {Game} = require('../../../../classes/game.js');

/** A VotingClientManager is responsible for storing, loading, and retrieving VotingClients
 * @typedef {VotingClientManager} VotingClientManager
 */
 class VotingClientManager extends ModuleManager{

    /** The collection of VotingClients
     * @type {Discord.Collection<String, VotingClient>}
     */
    cache;

    /** A map of names to the id of the VotingClient they belong to
     * @type {Discord.Collection<String, String>}
     */
    nameMap;

    /** A map of channels to the id of the VotingClient they belong to
     * @type {Discord.Collection<String, String>} 
     */
    channelMap;

    /** Create a VotingClient Manager
     * @param {Game} game 
     */
    constructor(game){
        super(game, 'voting');
        this.cache = new Discord.Collection();
        this.nameMap = new Discord.Collection();
        this.channelMap = new Discord.Collection();
    }

    /** Destroy this VotingClient Manager
     */
    destroy(){
        //destroy all VotingClients
        this.cache.each(votingClient => {
            votingClient.destroy();
        })

        //clear the maps
        this.nameMap.clear();
        this.channelMap.clear();

        //delete the files
        if(datawriting.fileExists(this.game.id, `Voting`)){
            datawriting.deleteSubFolder(this.game.id, `Voting`);
        }
    }

    /** Generates a new id for a VotingClient
     * @returns {String} The id
     */
    generateNewVotingClientId(){
        var newId = Math.floor((Math.random() * 9999) + 1);
        while(this.cache.has(newId)){
            newId = Math.floor((Math.random() * 9999) + 1);
        }
        return `${newId}`;
    }

    /** Create a new VotingClient
     * @param {String} name
     */
    createVotingClient(name){

        //if the name is already taken, return error
        if(this.nameMap.has(name)) throw new VotingError(err.VOTING_CLIENT_NAME_ALREADY_TAKEN);
        
        //create a new id for the client
        var id = this.generateNewVotingClientId();

        //create the client
        var votingClient = new VotingClient(this, id, name);

        //add the client to the cache, nameMap, and files
        this.cache.set(id, votingClient);
        this.nameMap.set(name, id);
    }

    /** Delete a VotingClient
     * @param {String} clientId
     */
    deleteVotingClient(clientId){

        //retrieve the voting client from the cache
        var votingClient = this.cache.get(clientId);

        //if it doesn't exist, return error
        if(!votingClient) throw new VotingError(err.INVALID_VOTING_CLIENT_ID);

        //delete voting client
        this.cache.delete(clientId);
        this.nameMap.delete(votingClient.name);
        votingClient.destroy();
    }

    /** Load all voting clients
     */
    loadVotingClients(){
        var clientIds = datawriting.retrieveSubFolder(this.game.id, `Voting`);
        clientIds.forEach(clientId => {
            this.loadVotingClient(clientId);
        })
    }

    /** Load a voting client by its id
     * @param {String} clientId 
     */
    loadVotingClient(clientId){

        //retrieve voting client
        var votingClient = VotingClient.load(this, clientId);

        //if the voting client couldn't be loaded, report error and return
        if(!votingClient){
            console.log(`There was an error loading voting client #${clientId}`);
            return;
        }

        //set to cache and maps
        this.cache.set(clientId, votingClient);
        this.nameMap.set(votingClient.name);
    }
}

module.exports = {
    VotingClientManager: VotingClientManager
}