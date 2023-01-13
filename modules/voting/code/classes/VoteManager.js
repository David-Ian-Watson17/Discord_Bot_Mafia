const Discord = require('discord.js');
const datawriting = require('../../../../handlers/datahandler.js');
const {err, VotingError} = require('../VotingError.js');
const {BaseVoteObject} = require('./BaseVoteObject.js');
const {Vote} = require('./Vote.js');

/** A VoteManager stores and manages votes
 * @typedef {VoteManager} VoteManager
 */
class VoteManager extends BaseVoteObject{

    /** The votes
     * @type {Discord.Collection<String, Vote>}
     */
    cache;

    /** Create a new VoteManager
     * @param {VotingClient} votingClient 
     */
    constructor(votingClient){
        super(votingClient);
        this.cache = new Discord.Collection();
    }

    destroy(){
        this.cache.each(vote => {
            vote.destroy();
        });
        this.cache.clear();
    }

    /** Generate and return an unused vote id
     * @returns {String} The new id
     */
    generateNewVoteId(){
        var newId = `${Math.floor(Math.random() * 100000)}`;
        while(this.cache.has(newId)){
            newId = `${Math.floor(Math.random() * 100000)}`;
        }
        return newId;
    }

    /** Retrieve a vote
     * @param {String} voteId 
     * @returns {Vote}
     */
    getVote(voteId){
        var vote = this.cache.get(voteId);
        if(!vote) throw new VotingError(err.INVALID_VOTE_ID);
        return vote;
    }

    /** Create a new vote for a voter. Returns the id of the new vote
     * @param {String} voterId 
     * @returns {String} The id of the new vote
     */
    createVote(name, voterId){
        var vote = new Vote(this.votingClient, this.generateNewVoteId(), name, voterId);
        this.cache.set(vote.id, vote);
        return vote.id;
    }

    /** Delete an existing vote.
     * @param {String} voteId
     */
    deleteVote(voteId){
        var vote = this.cache.get(voteId);
        if(!vote) throw new VotingError(err.INVALID_VOTE_ID);
        vote.destroy();
        this.cache.delete(voteId);
    }

    /** Convert this vote manager to a JSON string
     * @returns {Object} The string
     */
    toJSON(){
        var returnobject = {};
        return returnobject;
    }

    /** Store this vote manager in its information file
     */
    store(){
        datawriting.putData(this.votingClient.manager.game.id, `Voting/${this.votingClient.id}/Votes/Information.json`, JSON.stringify(this));
    }

    /** Load this vote manager from its information files
     * @param {VotingClient} votingClient
     * @returns {VoteManager} The manager
     */
    static load(votingClient){

        //create new VoteManager default
        var voteManager = new VoteManager(votingClient);

        //retrieve information
        var voteManagerRawData = datawriting.retrieveData(votingClient.manager.game.id, `Voting/${votingClient.id}/Votes/Information.json`);

        //if the information doesn't exist
        if(!voteManagerRawData){
            //report error and store defaults
            console.error("Could not retrieve Vote Manager information from files.");
            voteManager.store();
        }

        //if the information does exist
        else{
            //parse it
            var voteManagerJson = JSON.parse(voteManagerRawData);

            //currently nothing to do with it
        }

        //retrieve all voteIds
        var voteIds = datawriting.retrieveSubFolder(votingClient.manager.game.id, `Voting/${votingClient.id}/Votes/Votes`).map(voteFileName => voteFileName.substring(0, voteFileName.lastIndexOf('.')));
        
        //load each vote
        voteIds.forEach(voteId => {
            var vote = Vote.load(votingClient, voteId);
            if(vote){
                voteManager.cache.set(voteId, vote);
            }
        });

        //return the newly made vote manager
        return voteManager;
    }
}

module.exports = {
    VoteManager: VoteManager
}