const Discord = require('discord.js');
const {BaseVoteObject} = require('./BaseVoteObject.js');
const {Events, VoteEndCheckerTypes} = require('../Constants.js');

const datawriting = require('../../../../handlers/datahandler.js');

/** A VoteEndChecker keeps track of ending a vote
 * @typedef {VoteEndChecker} VoteEndChecker
 */
class VoteEndChecker extends BaseVoteObject{

    /** The type of this vote checker
     * @type {String}
     */
    type;
    
    /** Create a new VoteEndChecker
     * @param {VotingClient} votingClient 
     * @param {String} type 
     */
    constructor(votingClient, type){
        super(votingClient);
        this.type = type;
    }

    /** (ABSTRACT) Send a message via update channels to indicate vote is starting
     */
    sendStartMessage(){

    }

    /** (ABSTRACT) Check whether the vote is over
     * @param {Discord.Collection<String, Array<String>>} votes
     */
    checkEnding(votes){
        
    }

    /** (ABSTRACT) Automatically choose winners
     * @param {Discord.Collection<String, Array<String>>} votes 
     */
    autoEnd(votes){

    }

    /** Convert this VoteChecker to a JSON string
     * @returns {Object}
     */
    toJSON(){
        var returnobject = {};
        returnobject.type = this.type;
        return returnobject;
    }

    /** (ABSTRACT) Store this VoteChecker
     */
    store(){

    }

    /** Load a VoteEndChecker from files for a voting client
     * @param {VotingClient} votingClient 
     * @returns {(VoteEndChecker|null)}
     */
    static load(votingClient){
        //retrieve data
        var rawVoteEndCheckerData = datawriting.retrieveData(votingClient.manager.game.id, `Voting/${votingClient.id}/Handling/EndChecking.json`);

        //verify it exists
        if(!rawVoteEndCheckerData) return null;

        //parse data
        var voteEndCheckerJson = JSON.parse(rawVoteEndCheckerData);
        
        //based on type, create checker
        switch(voteEndCheckerJson.type){
            case VoteEndCheckerTypes.MAJORITY:
                return MajorityVoteEndChecker.createFromJson(votingClient, voteEndCheckerJson);
            case VoteEndCheckerTypes.PLURALITY:
                return PluralityVoteEndChecker.createFromJson(votingClient, voteEndCheckerJson);
        }
    }
}

/** A MajorityVoteEndChecker ends voting based on a majority.
 * @typedef {MajorityVoteEndChecker} MajorityVoteEndChecker
 */
class MajorityVoteEndChecker extends VoteEndChecker{

    /** The majority
     * @type {Number}
     */
    majority;

    /** Whether majority was manually set or automatically calculated
     * @type {Boolean}
     */
    manuallyset;

    /** Create a new MajorityVoteEndChecker
     * @param {VotingClient} votingClient 
     * @param {Number} majority 
     */
    constructor(votingClient, majority=null, loading=false){
        super(votingClient, VoteEndCheckerTypes.MAJORITY);
        if(!loading){
            if(majority){
                this.majority = majority;
                this.manuallyset = true;
            }
            else{
                this.calculateMajority(true);
                this.manuallyset = false;
            }
            this.store();
        }
        else{
            this.majority = null;
            this.manuallyset = false;
        }
        this.startEmitters();
    }

    /** Destroy this EndChecker
     */
    destroy(){
        this.endEmitters();
    }

    /** Start listening to events
     */
    startEmitters(){
        this.votingClient.on(Events.VOTE_CREATED, this.votesChanged);
        this.votingClient.on(Events.VOTE_DELETED, this.votesChanged);
        this.votingClient.on(Events.VOTE_UPDATED, this.votesChanged);
    }

    /** Stop listening to events
     */
    endEmitters(){
        this.votingClient.off(Events.VOTE_CREATED, this.votesChanged);
        this.votingClient.off(Events.VOTE_DELETED, this.votesChanged);
        this.votingClient.off(Events.VOTE_UPDATED, this.votesChanged);
    }

    /** Send a message via update channels to indicate vote is starting
     */
    sendStartMessage(){
        this.votingClient.channels.sendUpdate(`**Started voting! Majority is ${this.majority}.**`);
    }

    /** Check if this vote is over
     * @param {Discord.Collection<String, Array<String>>}
     */
    checkEnding(votes){

        //initialize collection to hold vote counts
        var targetweights = new Discord.Collection();

        //populate with each target's vote counts
        votes.each((votearray, targetId) => {
            try{
                var count = 0;
                votearray.forEach(voteId => {
                    var vote = this.votingClient.votes.getVote(voteId);
                    count++;
                });
                targetweights.set(targetId, count);
            }catch(error){
                console.log(error);
            }
        });

        //find winners if any
        var winners = [];
        targetweights.each((weight, targetId) => {
            if(weight >= this.majority){
                winners.push(targetId);
            }
        });

        //if there are winners emit ending
        if(winners.length > 0){
            this.votingClient.emitVoteEnd(winners);
        }
    }

    /** Automatically end
     * @param {Discord.Collection<String, Array<String>>} votes 
     */
    autoEnd(votes){
        this.votingClient.emitVoteEnd([null]);
    }

    //MAJORITY SPECIFIC

    /** Set the majority of this checker
     * @param {Number} majority 
     */
    setMajority(majority){

        //validify the majority
        if(majority < 0) majority = 1;

        //if called, this is manually set
        this.manuallyset = true;

        //set majority if it changed
        if(!(this.majority == majority)){
            this.majority = majority;
            this.votingClient.channels.sendUpdate(`**Majority has been changed to ${this.majority}!**`);
        }
    }

    /** Automatically calculate the majority of this checker
     */
    calculateMajority(initialization=false){

        //if called, this isn't manually set anymore
        this.manuallyset = false;

        //count up the total weight in votes
        var totalvalue = 0;
        this.votingClient.votes.cache.each(vote => {
            totalvalue += 1;
        });

        //calculate majority
        var newmajority = Math.floor(((totalvalue / 2) + 1));

        //set majority if it's changed or set
        if(!(newmajority == this.majority)){
            this.majority = newmajority;

            //if this was a change, notify of change
            if(!initialization){
                this.votingClient.channels.sendUpdate(`**Majority has been changed to ${this.majority}!**`);
            }
        }
    }

    /** Response to an event related to a vote being added, deleted, or modified
     */
    votesChanged = () => {
        if(!this.manuallyset){
            this.calculateMajority();
        }
    }

    /** Converts this MajorityVoteChecker to its JSON string
     * @returns {Object} The string
     */
    toJSON(){
        var returnobject = super.toJSON();
        returnobject.majority = this.majority;
        returnobject.manuallyset = this.manuallyset;
        return returnobject;
    }

    /** Store this MajorityVoteChecker in files
     */
    store(){
        datawriting.putData(this.votingClient.manager.game.id, `Voting/${this.votingClient.id}/Handling/EndChecking.json`, JSON.stringify(this));
    }

    /** Create a MajorityVoteChecker from its JSON string
     * @param {VotingClient} votingClient 
     * @param {Object} voteEndCheckerJson 
     */
    static createFromJson(votingClient, voteEndCheckerJson){
        //create new end checker
        var endChecker = new MajorityVoteEndChecker(votingClient, null, true);

        //populate the end checker
        endChecker.majority = voteEndCheckerJson.majority;
        endChecker.manuallyset = voteEndCheckerJson.manuallyset;

        //return the end checker
        return endChecker;
    }
}

/** A Plurality vote selects a certain number of winners based on who has the most votes
 * @typedef {PluralityVoteEndChecker} PluralityVoteEndChecker
 */
class PluralityVoteEndChecker extends VoteEndChecker{

    /** The number of winners
     * @type {Number}
     */
    winners;

    /** Create a new PluralityVoteEndChecker
     * @param {VotingClient} votingClient 
     * @param {Number} winners
     */
    constructor(votingClient, winners, loading=false){
        super(votingClient, VoteEndCheckerTypes.PLURALITY);
        this.winners = winners;
        if(!loading){
            this.store();
        }
    }

    /** Send a message via update channels to indicate vote is starting
     */
    sendStartMessage(){
        this.votingClient.channels.sendUpdate(`Started voting! The ${this.winners} recipients with the most votes will be selected.`);
    }

    /** Plurality never ends based on criteria
     * @param {Discord.Collection<String, Array<String>>} votes
     */
    checkEnding(votes){

    }

    /** Automatically pick the voters with the most votes
     * @param {Discord.Collection<String, Array<String>>} votes 
     */
    autoEnd(votes){

        //initialize the recipients collection
        var recipients = new Discord.Collection();

        //for each target
        votes.each((voteArray, targetId) => {

            //if the target is no one
            if(targetId == null){
                //WE DON'T CARE
            }

            //if there aren't enough winners yet, add recipient
            else if(recipients.size < this.winners){
                recipients.set(targetId, voteArray.length);
            }

            //otherwise
            else{
                //figure out the item with the least votes currently
                var leastvotes = recipients.first();
                var leasttarget = recipients.firstKey();
                recipients.each((recipientId, recipientVotes) => {
                    if(recipientVotes < leastvotes){
                        leastvotes = recipientVotes;
                        leasttarget = recipientId;
                    }
                });

                //if the least votes are less than for this recipient, replace
                if(leastvotes < voteArray.length){
                    recipients.delete(leasttarget);
                    recipients.set(targetId, voteArray.length);
                }
            }
        });

        //create winner array
        var winnerarray = [];
        recipients.each((votes, targetId) => {
            winnerarray.push(targetId);
        })

        //emit ending with winners
        this.votingClient.emitVoteEnd(winnerarray);
    }

    //PLURALITY SPECIFIC

    /** Set the number of winners
     * @param {Number} winners 
     */
    setWinners(winners){
        if(winners != this.winners){
            this.winners = winners;
            this.votingClient.channels.sendUpdate(`**The number of winners has been changed to ${this.winners}!**`);
        }
    }

    //UTILITIES

    /** Converts this vote end checker to a string
     * @returns {Object} The string
     */
    toJSON(){
        var returnobject = super.toJSON();
        returnobject.winners = this.winners;
        return returnobject;
    }

    /** Store this vote end checker in files
     */
    store(){
        datawriting.putData(this.votingClient.manager.game.id, `Voting/${this.votingClient.id}/Handling/EndChecking.json`, JSON.stringify(this));
    }

    /** Create a PluralityVoteEndChecker from its JSON string
     * @param {VotingClient} votingClient 
     * @param {Object} voteEndCheckerJson 
     */
    static createFromJson(votingClient, voteEndCheckerJson){

        //create the end checker
        var endChecker = new PluralityVoteEndChecker(votingClient, voteEndCheckerJson.winners);

        //return the end checker
        return endChecker;
    }
}

module.exports = {
    VoteEndChecker: VoteEndChecker,
    MajorityVoteEndChecker: MajorityVoteEndChecker,
    PluralityVoteEndChecker: PluralityVoteEndChecker
}