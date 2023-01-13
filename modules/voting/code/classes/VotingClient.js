const Discord = require('discord.js');
const datawriting = require('../../../../handlers/datahandler.js');
const EventEmitter = require('events').EventEmitter;
const {VoterManager} = require('./VoterManager.js');
const {VoteManager} = require('./VoteManager.js');
const {ChannelManager} = require('./ChannelManager.js');
const {VoteHandler} = require('./VoteHandler.js');
const {returncodes, Events, VoterTypes} = require('../Constants.js');
const {err, VotingError} = require('../VotingError.js');

/** A VotingClient keeps track of an entire voting system for a game
 * @typedef {VotingClient} VotingClient
 */
 class VotingClient extends EventEmitter{

    /** The id of this VotingClient
     * @type {String}
     */
    id;

    /** The name this VotingClient goes by
     * @type {String}
     */
    name;

    /** The manager that holds this Voting Client
     * @type {VotingClientManager}
     */
    manager;

    /** The manager that deals with this client's voters
     * @type {VoterManager}
     */
    voters;

    /** The manager that deals with storing this client's votes
     * @type {VoteManager}
     */
    votes;

    /** The manager that deals with this client's channels
     * @type {ChannelManager}
     */
    channels;

    /** The handler that deals with running the vote
     * @type {VoteHandler}
     */
    votehandler;

    /** Create a new VotingClient
     * @param {VotingClientManager} manager
     * @param {Discord.Client} client
     * @param {String} id
     * @param {String} name
     * @param {Boolean} loading
     */
    constructor(manager, id, name, loading=false){
        super();

        //set VotingClientManager and client
        this.manager = manager;

        //set identifiers
        this.id = id;
        this.name = name;

        //create the managers if not loading, otherwise just leave them for loading
        if(loading){
            this.voters = null;
            this.channels = null;
            this.votes = null;
            this.votehandler = null;
        }
        else{
            this.voters = new VoterManager(this);
            this.channels = new ChannelManager(this);
            this.votes = new VoteManager(this);
            this.votehandler = new VoteHandler(this);
            this.store();
        }

        //start event listening
        this.startEmitters();
    }

    /** Destroy this Voting Client
     */
    destroy(){

        //sop listening to events
        this.endEmitters();

        //destroy the managers
        this.voters.destroy();

        //emit destruction
        this.emitVotingClientDestroyed();

        //remove from storage
        this.deleteFile();
    }

    /** Start responding to events
     */
    startEmitters(){
        
    }

    /** Stop responding to events
     */
    endEmitters(){
        
    }

    /** Change the name of this voting client if possible
     * @param {String} newName 
     */
    changeName(newName){
        //if the name is already taken, return
        if(this.manager.nameMap.has(newName)) throw new VotingError(err.VOTING_CLIENT_NAME_ALREADY_TAKEN);

        //make sure the manager knows what this manager's new name is
        this.manager.nameMap.delete(this.name);
        this.manager.nameMap.set(newName, this);

        //set the new name
        this.name = newName;

        //store this client
        this.store();
    }

    //EVENTS

    /** Voting Client Destroyed Event
     */
    emitVotingClientDestroyed(){
        this.emit(Events.VOTING_CLIENT_DESTROYED, this);
    }

    /** Vote Start Event
     */
    emitVoteStart(){
        this.emit(Events.VOTE_START, null);
    }

    /** Vote End Event
     * @param {Array<String>} winnerIds 
     */
    emitVoteEnd(winnerIds){
        this.emit(Events.VOTE_END, winnerIds);
    }

    /** Vote Paused Event
     */
    emitVotePaused(){
        this.emit(Events.VOTE_PAUSED, null);
    }

    /** Vote Resumed Event
     */
    emitVoteResumed(){
        this.emit(Events.VOTE_RESUMED, null);
    }

    /** Reset votes
     */
    emitVoteReset(){
        this.emit(Events.RESET_VOTING, null);
    }

    /** Vote Created Event
     * @param {Vote} vote 
     */
    emitVoteCreated(vote){
        this.emit(Events.VOTE_CREATED, vote);
    }

    /** Vote Deleted Event
     * @param {Vote}
     */
    emitVoteDeleted(vote){
        this.emit(Events.VOTE_DELETED, vote);
    }

    /** Vote Updated Event
     * @param {Vote} vote 
     */
    emitVoteUpdated(vote){
        this.emit(Events.VOTE_UPDATED, vote);
    }

    /** Vote Placed Event
     * @param {Vote} vote
     */
    emitVotePlaced(vote){
        this.emit(Events.VOTE_PLACED, vote);
    }

    /** Vote Removed Event
     * @param {Vote} vote
     */
    emitVoteRemoved(vote){
        this.emit(Events.VOTE_REMOVED, vote);
    }

    /** Voter Created Event
     * @param {Voter} voter 
     */
    emitVoterCreated(voter){
        this.emit(Events.VOTER_CREATED, voter);
    }

    /** Voter Deleted Event
     * @param {Voter} voter
     */
    emitVoterDeleted(voter){
        this.emit(Events.VOTER_DELETED, voter);
    }

    /** Voter Updated Event
     * @param {Voter} voter 
     */
    emitVoterUpdated(voter){
        this.emit(Events.VOTER_UPDATED, voter);
    }
    
    /** Emit a Voter Source Manager Update Event
     * @param {VoterSourceManager} voterSourceManager 
     */
    emitVoterSourceManagerUpdate(voterSourceManager){
        this.emit(Events.VOTER_SOURCE_MANAGER_UPDATE, voterSourceManager);
    }

    /** Voter Source Members Added Event
     * @param {VoterSource} voterSource 
     */
    emitVoterSourceMembersAdded(voterSource){
        this.emit(Events.VOTER_SOURCE_MEMBERS_ADDED, voterSource);
    }

    /** Voter Source Members Removed Event
     * @param {VoterSource} voterSource 
     */
    emitVoterSourceMembersRemoved(voterSource){
        this.emit(Events.VOTER_SOURCE_MEMBERS_REMOVED, voterSource);
    }

    /** Voter Source Invalidated Event
     * @param {VoterSource} voterSource
     */
    emitVoterSourceInvalidated(voterSource){
        this.emit(Events.VOTER_SOURCE_INVALIDATED, voterSource);
    }

    /** Reset Voting Event
     */
    emitResetVoting(){
        thihs.emit(Events.RESET_VOTING, null);
    }

    /** Convert this VotingClient to a json object
     * @returns {Object}
     */
    toJSON(){
        var returnobject = {};
        returnobject.id = this.id;
        returnobject.name = this.name;
        return returnobject;
    }

    /** Store the information for this VotingClient
     */
    store(){
        datawriting.putData(this.manager.game.id, `Voting/${this.id}/Information.json`, JSON.stringify(this));
    }

    /** Delete all files related to this manager
     */
    deleteFile(){
        datawriting.deleteSubFolder(this.manager.game.id, `Voting/${this.id}`);
    }

    /** Load a specific VotingClient
     * @param {VotingClientManager} votingClientManager
     * @param {String} clientId
     * @returns {(VotingClient|undefined)} The new VotingClient
     */
    static load(votingClientManager, clientId){

        //attempt to retrieve the raw data
        var votingClientJson;
        try{
            votingClientJson = JSON.parse(datawriting.retrieveData(votingClientManager.game.id, `Voting/${clientId}/Information.json`));
        }catch(error){

            //if could not retrieve data, report and delete residual files
            console.log("Could not find Voting Client information!");
            datawriting.deleteSubFolder(votingClientManager.game.id, `Voting/${clientId}`);

            //then return undefined
            return undefined;
        }

        //if could not retrieve data
        if(!votingClientJson){

            //report and delete residual files
            console.log("Data for Voting Client is not present!");
            datawriting.deleteSubFolder(votingClientManager.game.id, `Voting/${clientId}`);

            //then return undefined
            return undefined;
        }

        //create a new voting client with retrieved identifiers
        var votingClient = new VotingClient(votingClientManager, votingClientJson.id, votingClientJson.name, true);
        
        //load the managers for voting client
        votingClient.voters = VoterManager.load(votingClient);
        votingClient.channels = ChannelManager.load(votingClient);
        votingClient.votes = VoteManager.load(votingClient);
        votingClient.votehandler = VoteHandler.load(votingClient);

        //return the loaded voting client
        return votingClient;
    }
}

module.exports = {
    VotingClient: VotingClient
}