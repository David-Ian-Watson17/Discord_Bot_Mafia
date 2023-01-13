const Discord = require('discord.js');
const datawriting = require('../../../../handlers/datahandler.js');
const chatroomCode = require('../../../chatrooms/code.js');
const {BaseVoteObject} = require('./BaseVoteObject.js');
const {Vote} = require('./Vote.js');
const {returncodes, Events, VoterTypes} = require('../Constants.js');
const {err, VotingError} = require('../VotingError.js');

/** Represents a voter, a user that can place votes
 * @typedef {Voter} Voter
 */
 class Voter extends BaseVoteObject{

    /** The id of the voter
     * @type {String}
     */
    id;

    /** The type of the voter
     * @type {String}
     */
    type;

    /** The object that this voter represents
     * @type {Object}
     */
    voterObject;

    /** Whether this voter can place any of their votes
     * @type {Boolean}
     */
    canVote;

    /** Whether this voter can have votes placed on them
     * @type {Boolean}
     */
    votable;

    /** Only applicable in certain kinds of votes. How many more votes are needed to be considered a winner.
     * @type {Number}
     */
    lovedModifier;

    /** The id of the standard vote this voter uses
     * @type {String}
     */
    standardVote;

    /** Any special vote ids this voter may have access to
     * @type {Array<String>}
     */
    specialVotes;

    /** Create a new Voter
     * @param {VotingClient} votingClient 
     * @param {String} id 
     * @param {Object} voterObject
     */
    constructor(votingClient, id, type, voterObject, loading=false){
        super(votingClient);

        //set identifiers
        this.id = id;
        this.type = type;
        this.voterObject = voterObject;

        //set modifiers to default values
        this.canVote = true;
        this.votable = true;
        this.lovedModifier = 0;

        //set default states for votes
        this.standardVote = null;
        this.specialVotes = [];

        //if not created in loading mode, create a standard vote for this voter, store, and emit creation
        if(!loading){
            this.standardVote = this.votingClient.votes.createVote("standard", this.id);
            this.store();
            this.votingClient.emitVoterCreated(this);
        }
    }

    /** Destroy this voter and remove its files
     */
    destroy(){

        //destroy standard vote
        try{
            this.votingClient.votes.deleteVote(this.standardVote);
        }catch(error){console.log(error)}
        
        //destroy all special votes
        this.specialVotes.forEach(voteId => {
            try{
                this.votingClient.votes.deleteVote(voteId);
            }catch(error){console.log(error)}
        })

        //delete file
        this.deleteFile();

        //emit event
        this.votingClient.emitVoterDeleted(this);
    }

    /** Set this voter's loved modifier
     * @param {Number} newModifier 
     */
    setLovedModifier(newModifier){
        if(this.lovedModifier == newModifier) return;
        this.lovedModifier = newModifier;
        this.votingClient.emitVoterUpdated(this);
        this.store();
    }

    /** +1 to this voter's loved modifier
     */
    addLovedPoint(){
        this.lovedModifier++;
        this.votingClient.emitVoterUpdated(this);
        this.store();
    }

    /** -1 to this voter's loved modifier
     */
    addHatedPoint(){
        this.lovedModifier--;
        this.votingClient.emitVoterUpdated(this);
        this.store();
    }

    /** Allow this voter to place its votes
     */
    allowVoting(){
        if(this.canVote) return;
        this.canVote = true;
        this.votingClient.emitVoterUpdated(this);
        this.store();
    }

    /** Prevent this voter from placing its votes
     */
    disallowVoting(){
        if(!this.canVote) return;
        this.canVote = false;
        this.votingClient.emitVoterUpdated(this);
        this.store();
    }

    /** Allow this voter to be voted for
     */
    allowBeingVoted(){
        if(this.votable) return;
        this.votable = true;
        this.votingClient.emitVoterUpdated(this);
        this.store();
    }

    /** Prevent this voter from being voted for
     */
    disallowBeingVoted(){
        if(!this.votable) return;
        this.votable = false;
        this.votingClient.emitVoterUpdated(this);
        this.store();
    }

    /** Retrieve this voter's standard vote
     */
    getStandardVote(){
        var vote = this.votingClient.votes.cache.get(this.standardVote);
        return vote;
    }

    /** Retrieve a specific special vote this voter has access to
     * @param {String} voteId
     */
    getSpecialVote(voteId){
        if(!this.specialVotes.includes(voteId)) throw new VotingError(err.INVALID_VOTE_ID);
        var vote = this.votingClient.votes.cache.get(voteId);
        return vote;
    }
    
    /** Create a new special vote for this voter to use
     * @param {String} name
     */
    createSpecialVote(name){
        var newVoteId = this.votingClient.votes.createVote(name, this.id);
        this.specialVotes.push(newVoteId);
        this.store();
    }

    /** Delete a special vote belonging to this voter
     * @param {String} id 
     */
    deleteSpecialVote(id){
        for(var i = 0; i < this.specialVotes.length; i++){
            if(this.specialVotes[i] == id){
                this.specialVotes.splice(i, 1);
                this.votingClient.votes.deleteVote(id);
                this.store();
                return;
            }
        }
        throw new VotingError(err.INVALID_VOTE_ID);
    }

    /** Place this voter's standard vote
     * @param {String} targetId 
     */
    placeStandardVote(targetId){
        if(!this.canVote) throw new VotingError(err.YOU_ARE_UNABLE_TO_VOTE);
        var vote = this.votingClient.votes.getVote(this.standardVote);
        vote.placeVote(targetId);
    }

    /** Place a special vote belonging to this voter
     * @param {String} voteId
     * @param {String} targetId
     */
    placeSpecialVote(voteId, targetId){
        if(!this.canVote) throw new VotingError(err.YOU_ARE_UNABLE_TO_VOTE);
        if(!this.specialVotes.includes(voteId)) throw new VotingError(err.INVALID_VOTE_ID);
        var vote = this.votingClient.votes.getVote(voteId);
        vote.placeVote(targetId);
    }

    /** Remove this voter's standard vote
     */
    removeStandardVote(){
        if(!this.canVote) throw new VotingError(err.YOU_ARE_UNABLE_TO_VOTE);
        var vote = this.votingClient.votes.getVote(this.standardVote);
        vote.removeVote();
    }

    /** Remove a special vote belonging to this voter
     * @param {String} voteId 
     */
    removeSpecialVote(voteId){
        if(!this.canVote) throw new VotingError(err.YOU_ARE_UNABLE_TO_VOTE);
        if(!this.specialVotes.includes(voteId)) throw new VotingError(err.INVALID_VOTE_ID);
        var vote = this.votingClient.votes.getVote(voteId);
        vote.removeVote();
    }

    /** Place this voter's standard vote on no one
     */
    noVoteStandardVote(){
        if(!this.canVote) throw new VotingError(err.YOU_ARE_UNABLE_TO_VOTE);
        var vote = this.votingClient.votes.getVote(this.standardVote);
        vote.noVote();
    }

    /** Place a special vote belonging to this voter on no one
     * @param {String} voteId 
     */
    noVoteSpecialVote(voteId){
        if(!this.canVote) throw new VotingError(err.YOU_ARE_UNABLE_TO_VOTE);
        if(!this.specialVotes.includes(voteId)) throw new VotingError(err.INVALID_VOTE_ID);
        var vote = this.votingClient.votes.getVote(voteId);
        vote.noVote();
    }

    /** Converts this voter to a string
     * @returns {String} The string
     */
    toString(){
        if(this.type == VoterTypes.DISCORD_USER){
            return `${this.voterObject.username}#${this.voterObject.discriminator}`;
        }
        else if(this.type == VoterTypes.CHATROOM_ACCOUNT){
            return this.voterObject.username;
        }
    }

    /** Converts this voter to a profile embed
     * @returns {Discord.MessageEmbed} The embed
     */
    toProfileEmbed(){

        //retrieve the description string
        var descriptionString = "";
        if(this.canVote) descriptionString += `Can Vote\n`;
        else descriptionString += `Cannot Vote\n`;
        if(this.votable) descriptionString += `Can Be Voted For\n`;
        else descriptionString += `Cannot Be Voted For\n`;
        descriptionString += `Loved Modifier: ${this.lovedModifier}`;

        //retrieve the vote fields
        var standardvotevalue = "";
        var standardVote = this.votingClient.votes.getVote(this.standardVote);
        standardvotevalue = standardVote.toFullString();

        var specialvotefieldvalue = "";
        if(this.specialVotes.length == 0) specialvotefieldvalue = "No special votes.";
        else{
            this.specialVotes.forEach(voteId => {
                var specialVote = this.votingClient.votes.getVote(voteId);
                specialvotefieldvalue += `${specialVote.toFullString()}`;
            })
        }

        //create the embed
        var embed = new Discord.MessageEmbed()
            .setTitle(`${this.toString()} (${this.id})`)
            .setDescription(descriptionString)
            .addFields([
                {name: "Standard Vote", value: standardvotevalue},
                {name: "Special Votes", value: specialvotefieldvalue}
            ]);

        //return the embed
        return embed;
    }

    /** Convert this voter's information to a JSON string sans votes
     */
    toJSON(){
        var returnobject = {};
        returnobject.id = this.id;
        returnobject.type = this.type;
        switch(this.type){
            case VoterTypes.DISCORD_USER:
                returnobject.userId = this.voterObject.id;
                break;
            case VoterTypes.CHATROOM_ACCOUNT:
                returnobject.chatroomId = this.voterObject.chatroom.id;
                returnobject.accountId = this.voterObject.id;
                break;
        }
        returnobject.canVote = this.canVote;
        returnobject.votable = this.votable;
        returnobject.lovedModifier = this.lovedModifier;
        returnobject.standardVote = this.standardVote;
        returnobject.specialVotes = this.specialVotes;
        return returnobject;
    }

    /** Store this voter
     */
    store(){
        datawriting.putData(this.votingClient.manager.game.id, `Voting/${this.votingClient.id}/Voters/Voters/${this.id}.json`, JSON.stringify(this));
    }

    /** Delete this voter's folder
     */
    deleteFile(){
        datawriting.deleteFile(this.votingClient.manager.game.id, `Voting/${this.votingClient.id}/Voters/Voters/${this.id}.json`);
    }

    /** Load a specific voter
     * Some Notes:
     * This does not delete the voter if the voter object could not be found. It trusts the VoterManager
     * to clear out the dead weight.
     * @param {VotingClient} votingClient 
     * @param {String} voterId 
     * @returns {(Voter|undefined)} The voter
     */
    static load(votingClient, voterId){

        //retrieve the raw data for the voter
        var voterRawData = datawriting.retrieveData(votingClient.manager.game.id, `Voting/${votingClient.id}/Voters/Voters/${voterId}.json`);

        //if the file doesn't exist, return
        if(!voterRawData) return undefined;

        //parse the data
        var voterJson = JSON.parse(voterRawData);

        //retrieve the voter object
        var voterObject = null;
        switch(voterJson.type){
            case VoterTypes.DISCORD_USER:
                var user = votingClient.manager.game.client.users.cache.get(voterJson.userId);
                if(!user) break;
                voterObject = user;
                break;
            case VoterTypes.CHATROOM_ACCOUNT:
                var chatroom = chatroomCode.getChatroomById(votingClient.manager.game.id, voterJson.chatroomId);
                if(!chatroom) break;
                var account = chatroom.accounts.cache.get(voterJson.accountId);
                if(!account) break;
                voterObject = account;
                break;
        }

        //create voter
        var voter = new Voter(votingClient, voterId, voterJson.type, voterObject, true);

        //populate voter modifiers
        voter.lovedModifier = voterJson.lovedModifier;
        voter.canVote = voterJson.canVote;
        voter.votable = voterJson.votable;

        //populate voter ids
        voter.standardVote = voterJson.standardVote;
        voter.specialVotes = voterJson.specialVotes;

        //return the voter
        return voter;
    }
}

module.exports = {
    Voter: Voter
}