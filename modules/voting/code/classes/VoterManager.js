const Discord = require('discord.js');
const datawriting = require('../../../../handlers/datahandler.js');
const {BaseVoteObject} = require('./BaseVoteObject.js');
const {Voter} = require('./Voter.js');
const {VoterSourceManager, DiscordUserVoterSourceManager, ChatroomAccountVoterSourceManager} = require('./VoterSourceManager.js');
const {returncodes, Events, VoterTypes} = require('../Constants.js');
const {err, VotingError} = require('../VotingError.js');

/** The VoterManager stores and manages Voter objects
 * @typedef {VoterManager} VoterManager
 */
 class VoterManager extends BaseVoteObject{

    /** The type of voters this manager uses
     * @type {String}
     */
    votertype;

    /** A collection of votes
     * @type {Discord.Collection<String, Voter>}
     */
    cache;

    /** The source manager
     * @type {VoterSourceManager}
     */
    sources;
    
    /** Create a new VoteManager
     * @param {VotingClient} votingClient 
     */
    constructor(votingClient, loading=false){
        super(votingClient);

        //set to default the variables, cache, and sources
        this.votertype = null;
        this.cache = new Discord.Collection();
        this.sources = null;

        //start listening to events
        this.startEmitters();

        //if not loading, store
        if(!loading){
            this.store();
        }
    }

    /** Destroy this voter manager and all voters inside
     */
    destroy(){

        //stop listening to events
        this.endEmitters();

        //destroy all voters
        this.cache.each(voter => {
            voter.destroy();
        });

        //destroy all sources
        if(this.sources) this.sources.destroy();
    }

    /** Start listening to update events
     */
    startEmitters(){
        this.votingClient.on(Events.VOTER_SOURCE_MANAGER_UPDATE, this.sourceManagerUpdate);
    }

    /** Stop listening to update events
     */
    endEmitters(){
        this.votingClient.off(Events.VOTER_SOURCE_MANAGER_UPDATE, this.sourceManagerUpdate);
    }

    /** Retrieve the voter id a discord user is using
     * @param {String} userId 
     * @returns {(String|undefined)} The voter Id
     */
    getVoterIdForDiscordUserId(userId){
        if(!this.sources) return undefined;
        return this.sources.getVoterIdForDiscordUserId(userId);
    }

    /** Retrieve the voter belonging to a voter id
     * @param {String} voterId 
     */
    getVoterByVoterId(voterId){
        var voter = this.cache.get(voterId);
        if(!voter) throw new VotingError(err.INVALID_VOTER_ID);
        return voter;
    }

    /** Retrieve the voter belonging to a discord user id
     * @param {String} userId 
     */
    getVoterByUserId(userId){
        var voterId = this.getVoterIdForDiscordUserId(userId);
        var voter = this.cache.get(voterId);
        if(!voter) throw new VotingError(err.INVALID_VOTER_ID);
        return voter;
    }

    /** Set this manager's source manager
     * @param {String} type 
     */
    setSourceManager(type){
        switch(type){
            //create a discord user source manager
            case VoterTypes.DISCORD_USER:
                //set this votertype
                this.votertype = type;
                //if the sourcemanager is already of the discord user type, just return
                if(this.sources && this.sources.type == VoterTypes.DISCORD_USER) throw new VotingError(err.VOTER_SOURCE_MANAGER_ALREADY_THAT_TYPE);
                //for any other type of source manager, destroy it
                if(this.sources) this.sources.destroy();
                //then make a new one and report the success
                this.sources = new DiscordUserVoterSourceManager(this.votingClient);
                //store
                this.store();
                break;

            //create a chatroom account source manager
            case VoterTypes.CHATROOM_ACCOUNT:
                //set this votertype
                this.votertype = type;
                //if the sourcemanager is already of the chatroom account type, just return
                if(this.sources && this.sources.type == VoterTypes.CHATROOM_ACCOUNT) throw new VotingError(err.VOTER_SOURCE_MANAGER_ALREADY_THAT_TYPE);
                //for any other type of source manager, destroy it
                if(this.sources) this.sources.destroy();
                //then make a new one and report the success
                this.sources = new ChatroomAccountVoterSourceManager(this.votingClient);
                //store
                this.store();
                break;

            //unrecognized type
            default:
                throw new VotingError(err.INVALID_VOTER_TYPE);
        }
    }

    /** Fetch voter objects from all sources
     */
    fetchVoters(){
        if(!this.sources) return;
        var voterObjects = this.sources.fetchVoterObjects();
        if(!voterObjects) return;
        voterObjects.each(voterObject => {
            if(!this.cache.has(voterObject.id)){
                var voter = new Voter(this.votingClient, voterObject.id, this.votertype, voterObject);
                this.cache.set(voter.id, voter);
            }
        });
    }

    /** Cleanse the voters in this manager that don't belong to a source
     */
    cleanseVoters(){
        if(!this.sources) return;
        var voterObjects = this.sources.fetchVoterObjects();
        if(!voterObjects) return;
        this.cache.each(voter => {
            if(!voterObjects.has(voter.id)){
                this.cache.delete(voter.id);
                voter.destroy();
            }
        });
    }

    /** Response to a VoterSourceManager update event
     * @param {VoterSourceManager} sourceManager 
     */
    sourceManagerUpdate = (sourceManager) => {
        this.cleanseVoters();
        this.fetchVoters();
    }

    /** Convert this manager to a JSON string
     * @returns {Object} The string
     */
    toJSON(){
        var returnobject = {};
        return returnobject;
    }

    /** Store this VoterManager
     */
    store(){
        datawriting.putData(this.votingClient.manager.game.id, `Voting/${this.votingClient.id}/Voters/Information.json`, JSON.stringify(this));
    }

    /** Load a specific VoterManager
     * @param {VotingClient} votingClient 
     * @returns {VoterManager} The manager
     */
    static load(votingClient){

        //create a new VoterManager in loading mode
        var newVoterManager = new VoterManager(votingClient, true);

        //retrieve the voter manager and populate
        try{
            //retrieve the voter manager information
            var voterManagerJson = JSON.parse(datawriting.retrieveData(votingClient.manager.game.id, `Voting/${votingClient.id}/Voters/Information.json`));
        }catch(error){
            //if error occurs, store defaults
            console.log("Information file for VoterManager did not exist. Storing defaults.");
            newVoterManager.store();
        }
        
        //retrieve voter ids
        var voterIds = datawriting.retrieveSubFolder(votingClient.manager.game.id, `Voting/${votingClient.id}/Voters/Voters`).map(filename => filename.substring(0, filename.lastIndexOf('.')));
        
        //for each voter id
        voterIds.forEach(voterId => {

            //load the voter and keep
            var voter = Voter.load(votingClient, voterId);
            if(voter){
                newVoterManager.cache.set(voterId, voter);
            }
        });

        //retrieve voter source information
        newVoterManager.sources = VoterSourceManager.load(votingClient);

        //if there was a voter source, copy its type over here
        if(newVoterManager.sources){
            newVoterManager.votertype = newVoterManager.sources.type;
        }

        //refresh voters
        newVoterManager.cleanseVoters();
        newVoterManager.fetchVoters();

        //return the manager
        return newVoterManager;
    }
}

module.exports = {
    VoterManager: VoterManager
}