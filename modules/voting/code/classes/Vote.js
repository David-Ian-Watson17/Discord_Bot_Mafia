const Discord = require('discord.js');
const datawriting = require('../../../../handlers/datahandler.js');
const {BaseVoteObject} = require('./BaseVoteObject.js');
const {returncodes, Events} = require('../Constants.js');
const {err, VotingError} = require('../VotingError.js');

/** A Vote is the unit that you place to vote
 * @typedef {Vote} Vote
 */
 class Vote extends BaseVoteObject{

    /*
    THINGS TO CHANGE:

    Allow dynamic freezing on startup
    */

    /** The id of the vote
     * @type {String}
     */
    id;

    /** The name of the vote
     * @type {String}
     */
    name;

    /** The id of the voter this belongs to
     * @type {String}
     */
    voterId;

    /** Whether or not this vote is placed
     * @type {Boolean}
     */
    placed;

    /** The id of the voter this vote is targeting
     * @type {String}
     */
    targetId;

    /** Create a new vote
     * @param {VotingClient} votingClient
     * @param {String} id
     * @param {String} name
     * @param {String} voterId
     * @param {Boolean} emitCreation
     */
    constructor(votingClient, id, name, voterId, loading=false){
        super(votingClient);
        this.id = id;
        this.name = name;
        this.voterId = voterId;

        this.placed = false;
        this.targetId = null;

        this.startEmitters();

        if(!loading){
            this.votingClient.emitVoteCreated(this);
            this.store();
        }
    }

    /** Destroy this vote
     */
    destroy(){
        this.endEmitters();
        this.deleteFile();
        this.votingClient.emitVoteDeleted(this);
    }

    /** Start the emitters to capture events from the VotingClient
     */
    startEmitters(){
        this.votingClient.on(Events.RESET_VOTING, this.resetVote);
    }

    /** End the emitters to stop capturing events from the VotingClient
     */
    endEmitters(){
        this.votingClient.off(Events.RESET_VOTING, this.resetVote);
    }

    /** Place the vote on another voter.
     * @param {String} targetId 
     */
    placeVote(targetId){

        //if voting is frozen, return
        if(!this.votingClient.votehandler.active) throw new VotingError(err.VOTE_FROZEN);

        //if vote is already placed on target, return
        if(this.placed && this.targetId == targetId) throw new VotingError(err.VOTE_ALREADY_PLACED_ON_TARGET);
        
        //if target voter doesn't exist, return
        if(!this.votingClient.voters.cache.has(targetId)) throw new VotingError(err.INVALID_TARGET_ID);
        
        //place vote
        this.targetId = targetId;
        this.placed = true;

        //emit event
        this.votingClient.emitVotePlaced(this);

        //store this vote
        this.store();
    }

    /** Place the vote on nobody
     */
    noVote(){
        
        //if voting is frozen, return
        if(!this.votingClient.votehandler.active) throw new VotingError(err.VOTE_FROZEN);

        //if vote is already placed on no one, return
        if(this.placed && this.targetId == null) throw new VotingError(err.VOTE_ALREADY_PLACED_ON_TARGET);

        //place vote
        this.targetId = null;
        this.placed = true;

        //emit event
        this.votingClient.emitVotePlaced(this);

        //store this vote
        this.store();
    }

    /** Remove the vote. Can be forced to break through frozen status.
     * @param {Boolean} force 
     */
    removeVote(force=false){

        //if voting is frozen and this isn't being forced, return
        if(!this.votingClient.votehandler.active && !force) throw new VotingError(err.VOTE_FROZEN);

        //if the vote is not placed, return
        if(!this.placed) throw new VotingError(err.VOTE_NOT_PLACED);

        //reset vote
        this.targetId = null;
        this.placed = false;

        //emit event
        this.votingClient.emitVoteRemoved(this);
        
        //store this vote
        this.store();
    }

    /** Event response to a RESET_VOTING event. Cancels this vote's placement.
     */
    resetVote = () => {
        this.targetId = null;
        this.placed = false;
        this.store();
    }

    /** Convert this vote to its identifying string
     * @returns {String} The string
     */
    toString(){
        return `${this.name}`;
    }

    /** Converts this vote to its full description string
     * @returns {String} The string
     */
    toFullString(){
        var fullstring = "";
        fullstring += `${this.name} (${this.id})`;
        if(this.placed){
            fullstring += `\nPlaced`;
            if(!this.targetId){
                descriptionString += `\nNo vote.`;
            }
            else{
                var voter = this.votingClient.voters.cache.get(this.targetId);
                fullstring += `\nVoted for ${voter.toString()}`;
            }
        }
        else{
            fullstring += `\nNot placed`;
        }
        return fullstring;
    }

    /** Convert this vote to a profile embed
     * @returns {Discord.MessageEmbed} The embed
     */
    toProfileEmbed(){

        //retrieve description
        var descriptionString = "";
        if(this.placed){
            descriptionString += "Placed\n";
            if(!this.targetId){
                descriptionString += "No Vote.";
            }
            else{
                var target = this.votingClient.voters.cache.get(this.voterId);
                descriptionString += `Target: ${target.toString()}`;
            }
        }

        //create embed
        var embed = new Discord.MessageEmbed()
            .setTitle(`${this.name} (${this.id})`)
            .setDescription(descriptionString);

        //return the embed
        return embed;
    }

    /** Convert this vote to a JSON string
     */
    toJSON(){
        var returnobject = {};
        returnobject.id = this.id;
        returnobject.name = this.name;
        returnobject.voterId = this.voterId;
        returnobject.placed = this.placed;
        returnobject.targetId = this.targetId;
        return returnobject;
    }

    /** Store this vote
     */
    store(){
        datawriting.putData(this.votingClient.manager.game.id, `Voting/${this.votingClient.id}/Votes/Votes/${this.id}.json`, JSON.stringify(this));
    }

    /** Delete this vote's file
     */
    deleteFile(){
        datawriting.deleteFile(this.votingClient.manager.game.id, `Voting/${this.votingClient.id}/Votes/Votes/${this.id}.json`);
    }

    /** Load a specific vote
     * @param {VotingClient} votingClient
     * @param {String} voteId
     * @returns {(Vote|undefined)}
     */
    static load(votingClient, voteId){
        try{
            //retrieve the data
            var rawdata = datawriting.retrieveData(votingClient.manager.game.id, `Voting/${votingClient.id}/Votes/Votes/${voteId}.json`);
            
            //if the file couldn't be found, return a non-existent object
            if(!rawdata) return undefined;
            
            //parse the data into a usable form
            var voteJson = JSON.parse(rawdata);

            //create a vote in loading mode
            var newVote = new Vote(votingClient, voteJson.id, voteJson.name, voteJson.voterId, true);

            //load information
            newVote.placed = voteJson.placed;
            newVote.targetId = voteJson.targetId;

            //return new vote
            return newVote;
        }catch(error){
            console.log("Couldn't load vote files.");
            return undefined;
        }
    }
}

module.exports = {
    Vote: Vote
}