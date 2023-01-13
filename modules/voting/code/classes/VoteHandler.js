const Discord = require('discord.js');
const datawriting = require('../../../../handlers/datahandler.js');
const {BaseVoteObject} = require('./BaseVoteObject.js');
const {VoteEndChecker, MajorityVoteEndChecker, PluralityVoteEndChecker} = require('./VoteEndChecker.js');
const {err, VotingError} = require('../VotingError.js');
const {Events, VoteEndCheckerTypes} = require('../Constants.js');

/** A VoteHandler keeps track of placed votes and determines whether a vote is active
 * @typedef {VoteHandler} VoteHandler
 */
class VoteHandler extends BaseVoteObject{

    /** Whether this handler is running a vote currently
     * @type {Boolean}
     */
    running;

    /** Whether this handler is active
     * @type {Boolean}
     */
    active;

    /** The placed votes
     * @type {Discord.Collection<String, Array<String>>}
     */
    votes;

    /** The end checker this handler uses to figure out when the vote is done
     * @type {VoteEndChecker}
     */
    voteEndChecker;

    /** Create a new VoteHandler
     * @param {VotingClient} votingClient 
     */
    constructor(votingClient){
        super(votingClient);
        this.running = false;
        this.active = false;
        this.votes = new Discord.Collection();
        this.voteEndChecker = null;
        this.startEmitters();
    }

    /** Destroy this VoteHandler
     */
    destroy(){
        this.endEmitters();
        this.running = false;
        this.active = false;
        this.votes.clear();
        if(this.voteEndChecker) this.voteEndChecker.destroy();
    }

    /** Start listening to events
     */
    startEmitters(){
        this.votingClient.on(Events.VOTE_DELETED, this.voteDeletedEvent);
        this.votingClient.on(Events.VOTE_PLACED, this.votePlacedEvent);
        this.votingClient.on(Events.VOTE_REMOVED, this.voteRemovedEvent);
        this.votingClient.on(Events.VOTE_END, this.endVoteEvent);
    }

    /** Stop listening to events
     */
    endEmitters(){
        this.votingClient.off(Events.VOTE_DELETED, this.voteDeletedEvent);
        this.votingClient.off(Events.VOTE_PLACED, this.votePlacedEvent);
        this.votingClient.off(Events.VOTE_REMOVED, this.voteRemovedEvent);
        this.votingClient.off(Events.VOTE_END, this.endVoteEvent);
    }

    /** Retrieves the vote count in the form of a string
     * @returns {String} The vote count string
     */
    getVoteCount(){
        if(!this.running) throw new VotingError(err.VOTE_NOT_RUNNING);

        //prepare the return string
        var returnstring = "__Votecount__\n";

        this.votes.each((votearray, targetId) => {
            
            //prepare individual string
            var individualstr = "";

            try{
                //add target to individual string
                var target = this.votingClient.voters.getVoterByVoterId(targetId);
                individualstr += target.toString();

                //initialize the array of votes and count
                var votestring = "";
                var count = 0;

                //for each vote
                votearray.forEach(voteId => {

                    //retrieve the vote
                    var vote = this.votingClient.votes.getVote(voteId);

                    //retrieve the vote's voter
                    var voter = this.votingClient.voters.getVoterByVoterId(vote.voterId);

                    //add vote
                    votestring += `${voter.toString()}: 1`;

                    //increment count
                    count++;

                    if(!(votearray.indexOf(voteId) == (votearray.length - 1))) votestring += ", ";
                });

                //add the count
                individualstr += ` ${count}: (`;

                //add the vote string
                individualstr += votestring;

                //add the ending parentheses
                individualstr += ")\n";
            }catch(error){individualstr = `Problem detected with votes for a target!`;}

            //add individual string
            returnstring += individualstr;
        });

        //return the vote count
        return returnstring;
    }


    /** Retrieve the vote count in the form of a string. Includes hidden elements.
     * @returns {String} The vote count string
     */
    getFullVoteCount(){
        //prepare the return string
        var returnstring = "__Votecount__\n";

        this.votes.each((votearray, targetId) => {
            
            //prepare individual string
            var individualstr = "";

            try{
                //add target to individual string
                var target = this.votingClient.voters.getVoterByVoterId(targetId);
                individualstr += target.toString();

                //initialize the array of votes and count
                var votestring = "";
                var count = 0;

                //for each vote
                votearray.forEach(voteId => {

                    //retrieve the vote
                    var vote = this.votingClient.votes.getVote(voteId);

                    //retrieve the vote's voter
                    var voter = this.votingClient.voters.getVoterByVoterId(vote.voterId);

                    //add vote
                    votestring += `${voter.toString()}: 1`;

                    //increment count
                    count++;

                    if(!(votearray.indexOf(voteId) == (votearray.length - 1))) votestring += ", ";
                });

                //add the count
                individualstr += ` ${count}: (`;

                //add the vote string
                individualstr += votestring;

                //add the ending parentheses
                individualstr += ")\n";
            }catch(error){individualstr = `Problem detected with votes for a target!`;}

            //add individual string
            returnstring += individualstr;
        });

        //return the vote count
        return returnstring;
    }

    /** Start a vote
     * @param {String} votetype 
     * @param {Object} information 
     */
    startVote(votetype, information){

        //if this handler is already running, throw error
        if(this.running) throw new VotingError(err.VOTE_ALREADY_RUNNING);

        //clear votes
        this.votes.clear();
        this.votingClient.emitVoteReset();

        //create vote checker
        switch(votetype){
            case VoteEndCheckerTypes.MAJORITY:
                this.voteEndChecker = new MajorityVoteEndChecker(this.votingClient, information.majority);
                break;
            case VoteEndCheckerTypes.PLURALITY:
                this.voteEndChecker = new PluralityVoteEndChecker(this.votingClient, information.winners);
                break;
            default:
                throw new VotingError(err.INVALID_VOTE_RUN_TYPE);
        }

        //set running and active
        this.running = true;
        this.active = true;

        //emit event
        this.votingClient.emitVoteStart();

        //notify start
        this.voteEndChecker.sendStartMessage();

        //store
        this.store();
    }

    /** Instruct the vote end checker to make a decision on who should win at the time and end the vote
     */
    endVote(){

        //if there isn't a vote running, it can't be ended lol
        if(!this.running) throw new VotingError(err.VOTE_NOT_RUNNING);

        //ask endChecker to auto end
        this.voteEndChecker.autoEnd(this.votes);
    }

    /** End a vote
     * @param {Array<String>} winnerIds
     */
    hammerVote(winnerIds){

        //if there isn't a vote running, it can't be ended lol
        if(!this.running) throw new VotingError(err.VOTE_NOT_RUNNING);

        //shut down voting
        this.active = false;
        this.running = false;

        //start crafting response
        var responsestring = "";

        //response for no winner
        if(winnerIds.length == 1 && winnerIds[0] == null){
            responsestring += "**Voting has ended with no one being declared the winner.**";
        }

        //response for at least one winner
        else{
            responsestring += "**Voting has ended, with "

            //response for one winner
            if(winnerIds.length == 1){
                var voter = this.votingClient.voters.getVoterByVoterId(winnerIds[0]);
                responsestring += `${voter.toString()} being declared the winner!**`;
            }

            //response for multiple winners
            else{
                winnerIds.forEach(winnerId => {
                    var voter = this.votingClient.voters.getVoterByVoterId(winnerId);
                    if(winnerIds.indexOf(winnerId) == (winnerIds.length - 1)){
                        responsestring += `and ${voter.toString()} being declared the winners!**`;
                    }
                    else{
                        if(winnerIds.length == 2){
                            responsestring += `${voter.toString()} `;
                        }
                        else{
                            responsestring += `${voter.toString()}, `;
                        }
                    }
                });
            }
        }
        
        //send update
        this.votingClient.channels.sendUpdate(responsestring);

        this.store();
    }

    /** Pause a vote
     */
    pauseVote(){
        if(!this.running) throw new VotingError(err.VOTE_NOT_RUNNING);
        if(!this.active) throw new VotingError(err.VOTE_NOT_ACTIVE);
        this.active = false;
        this.votingClient.emitVotePaused();
        this.votingClient.channels.sendUpdate(`**Voting has been paused!**`);
        this.store();
    }

    /** Resume a vote
     */
    resumeVote(){
        if(!this.running) throw new VotingError(err.VOTE_NOT_RUNNING);
        if(this.active) throw new VotingError(err.VOTE_ALREADY_ACTIVE);
        this.active = true;
        this.votingClient.emitVoteResumed();
        this.votingClient.channels.sendUpdate(`**Voting has been resumed!**`);
        this.store();
    }

    /** Cancel a vote
     */
    cancelVote(){
        if(!this.running) throw new VotingError(err.VOTE_NOT_RUNNING);
        this.active = false;
        this.running = false;
        this.votingClient.channels.sendUpdate(`**Voting has been canceled!**`);
        this.store();
    }

    /** Reset a vote
     */
    resetVote(){
        this.votingClient.emitVoteReset();
        this.votes.clear();
        this.votingClient.channels.sendUpdate(`**Voting has been reset!**`);
        this.store();
    }

    //EVENT RESPONSE

    /** If a vote is placed, add it to handler if not present and then check for ending
     * @param {Vote} vote 
     */
    votePlacedEvent = (vote) => {

        //if it's the first vote on the target create entry for target
        if(!this.votes.has(vote.targetId)){
            this.votes.set(vote.targetId, []);
        }

        //check if the vote's been placed before and remove it if it had
        this.votes.each((votearray, targetId) => {
            if(votearray.includes(vote.id)){
                votearray.splice(votearray.indexOf(vote.id), 1);
                if(votearray.length == 0){
                    this.votes.delete(targetId);
                }
            }
        })

        //get votes for vote's target and push vote
        var votesfor = this.votes.get(vote.targetId);
        if(!votesfor.includes(vote.id)){
            votesfor.push(vote.id);
        }

        //if there's a vote end checker, check for the ending
        if(this.voteEndChecker){
            this.voteEndChecker.checkEnding(this.votes);
        }

        this.store();
    }

    /** If a vote is removed, remove it from the handler
     * @param {Vote} vote 
     */
    voteRemovedEvent = (vote) => {
        this.votes.each((targetvotes, targetId) => {
            if(targetvotes.includes(vote.id)){
                targetvotes.splice(targetvotes.indexOf(vote.id), 1);
                if(targetvotes.length == 0){
                    this.votes.delete(targetId);
                }
            }
        });

        this.store();
    }

    /** If a vote is deleted, remove it from the handler if present
     * @param {Vote} vote 
     */
    voteDeletedEvent = (vote) => {
        this.votes.each(targetvotes => {
            if(targetvotes.includes(vote.id)){
                targetvotes.splice(targetvotes.indexOf(vote.id), 1);
            }
        });

        this.store();
    }

    /** Response to voteEndChecker triggering an End Event
     * @param {Array<String>} winnerIds 
     */
    endVoteEvent = (winnerIds) => {
        try{
            this.hammerVote(winnerIds);
        }catch(error){
            console.log("ERROR: Voting System declared a non-voter the winner without external prompt.");
        }
    }

    /** Convert this VoteHandler to its JSON string
     * @returns {Object} The string
     */
    toJSON(){
        var returnobject = {};
        returnobject.running = this.running;
        returnobject.active = this.active;
        returnobject.votes = {};
        this.votes.each((voteArray, targetId) => {
            returnobject.votes[`${targetId}`] = voteArray;
        })
        return returnobject;
    }

    /** Store this vote handler in its files
     */
    store(){
        datawriting.putData(this.votingClient.manager.game.id, `Voting/${this.votingClient.id}/Handling/Information.json`, JSON.stringify(this));
    }

    /** Load a specific voting client's VoteHandler from its file
     * @param {VotingClient} votingClient 
     */
    static load(votingClient){

        //create new VoteHandler
        var voteHandler = new VoteHandler(votingClient);

        //retrieve information
        var rawData = datawriting.retrieveData(votingClient.manager.game.id, `Voting/${votingClient.id}/Handling/Information.json`);

        //if the information doesn't exist
        if(!rawData){
            //alert error and store defaults
            console.log("Could not find VoteHandler information, storing defaults.");
            voteHandler.store();

            //return the vote handler
            return voteHandler;
        }

        //parse data
        var jsonVoteManager = JSON.parse(rawData);

        //load data
        voteHandler.active = jsonVoteManager.active;
        voteHandler.running = jsonVoteManager.running;
        var targetIds = Object.keys(jsonVoteManager.votes);
        targetIds.forEach(targetId => {
            voteHandler.votes.set(targetId, jsonVoteManager.votes[`${targetId}`]);
        })
        voteHandler.voteEndChecker = VoteEndChecker.load(votingClient);

        //if couldn't obtain the end checker, shut down the handler if active
        if(!voteHandler.voteEndChecker){
            voteHandler.active = false;
            voteHandler.running = false;
            voteHandler.store();
        }

        //return new handler
        return voteHandler;
    }
}

module.exports = {
    VoteHandler: VoteHandler
}