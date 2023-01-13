const Discord = require('discord.js');
const datawriting = require('../../../../handlers/datahandler.js');
const messagesending = require('../../../../handlers/messagehandler.js');
const {BaseVoteObject} = require('./BaseVoteObject.js');
const {Vote} = require('./Vote.js');
const {returncodes, Events, VoterTypes} = require('../Constants.js');
const {err, VotingError} = require('../VotingError.js');
const {Chatroom} = require('../../../chatrooms/code/classes/Chatroom.js');

/** A Channel Manager takes care of managing all channels added to a voting system
 * @typedef {ChannelManager} ChannelManager
 */
class ChannelManager extends BaseVoteObject{

    /** The channels used to send global updates
     * @type {Discord.Collection<String, Discord.Channel>}
     */
    updatechannels;

    /** The channels used to receive votes
     * @type {Discord.Collection<String, Discord.Channel>}
     */
    votingchannels;

    /** Create a new ChannelManager
     * @param {VotingClient} votingClient 
     */
    constructor(votingClient, loading=false){
        super(votingClient);
        this.updatechannels = new Discord.Collection();
        this.votingchannels = new Discord.Collection();
        this.startEmitters();
        if(!loading){
            this.store();
        }
    }

    /** Destroy this ChannelManager
     */
    destroy(){
        this.votingchannels.each(channel => {
            this.votingClient.manager.channelMap.delete(channel.id);
        });
        this.votingchannels.clear();
        this.updatechannels.clear();
        this.endEmitters();
    }

    /** Start listening to events
     */
    startEmitters(){
        this.votingClient.on(Events.VOTE_PLACED, this.votePlacedEvent);
        this.votingClient.on(Events.VOTE_REMOVED, this.voteRemovedEvent);
        this.votingClient.manager.game.client.on('channelDelete', this.channelDeletedEvent);
    }

    /** Stop listening to events
     */
    endEmitters(){
        this.votingClient.off(Events.VOTE_PLACED, this.votePlacedEvent);
        this.votingClient.off(Events.VOTE_REMOVED, this.voteRemovedEvent);
        this.votingClient.manager.game.client.off('channelDelete', this.channelDeletedEvent);
    }

    /** Add a channel as an update channel
     * @param {Discord.Channel} channel 
     */
    addUpdateChannel(channel){
        
        //verify it's not already present
        if(this.updatechannels.has(channel.id)) throw new VotingError(err.CHANNEL_ALREADY_UPDATE_CHANNEL);

        //add it
        this.updatechannels.set(channel.id, channel);

        //store
        this.store();
    }

    /** Add a channel as a voting channel
     * @param {Discord.Channel} channel 
     */
    addVotingChannel(channel){

        //verify it's not already present
        if(this.votingchannels.has(channel.id)) throw new VotingError(err.CHANNEL_ALREADY_VOTING_CHANNEL);

        //verify it's not taken
        if(this.votingClient.manager.channelMap.has(channel.id)) throw new VotingError(err.CHANNEL_ALREADY_TAKEN);

        //claim it
        this.votingClient.manager.channelMap.set(channel.id, this.votingClient.id);

        //add it
        this.votingchannels.set(channel.id, channel);

        //store
        this.store();
    }

    /** Adds all channels from a chatroom as voting channels if possible
     * @returns {Array<String>} A list of any channels it was unable to add
     */
    importVotingChannelsFromChatroomSource(){
        //retrieve voter source manager
        var sources = this.votingClient.voters.sources;
        if(!sources) throw new VotingError(err.VOTER_SOURCE_MANAGER_DOES_NOT_EXIST);
        if(!sources.type == VoterTypes.CHATROOM_ACCOUNT) throw new VotingError(err.VOTER_SOURCE_MANAGER_NOT_OF_CORRECT_TYPE);

        //fetch chatroom
        var chatroomsource = sources.chatroomSource;
        if(!chatroomsource) throw new VotingError(err.INVALID_VOTER_SOURCE);
        var chatroom = chatroomsource.chatroom;

        //clear all current voting channels
        this.votingchannels.each(channel => {
            this.votingClient.manager.channelMap.delete(channel.id);
        });
        this.votingchannels.clear();

        //initialize return array
        var claimedchannels = [];

        //attempt to add all channels from chatroom
        chatroom.terminals.each(channel => {
            try{
                this.addVotingChannel(channel);
            }catch(error){
                claimedchannels.push(channel.id);
            }
        });

        //return array of channels unable to add
        return claimedchannels;
    }

    /** Remove a channel as an update channel
     * @param {String} channelId 
     */
    removeUpdateChannel(channelId){

        //verify it's present
        if(!this.updatechannels.has(channelId)) throw new VotingError(err.CHANNEL_NOT_UPDATE_CHANNEL);

        //remove it
        this.updatechannels.delete(channelId);

        //store
        this.store();
    }

    /** Remove a channel as a voting channel
     * @param {String} channelId
     */
    removeVotingChannel(channelId){

        //verify it's present
        if(!this.votingchannels.has(channelId)) throw new VotingError(err.CHANNEL_NOT_VOTING_CHANNEL);

        //remove it
        this.votingchannels.delete(channelId);

        //unclaim it
        this.votingClient.manager.channelMap.delete(channelId);

        //store
        this.store();
    }

    /** Send a message on all update channels
     * @param {String} message 
     * @param {Array<Object>} attachments 
     * @param {Array<Discord.MessageEmbed>} embeds 
     */
    sendUpdate(message, attachments=null, embeds=null){
        var channelIds = [];
        this.updatechannels.each(channel => {
            channelIds.push(channel.id);
        });
        messagesending.sendMessageOnChannelIds(channelIds, message, attachments, embeds);
    }

    //EVENT RESPONSE

    /** Response to a vote being placed
     * @param {Vote} vote 
     */
    votePlacedEvent = (vote) => {
        var voter = this.votingClient.voters.cache.get(vote.voterId);
        if(vote.targetId){
            var target = this.votingClient.voters.cache.get(vote.targetId);
            this.sendUpdate(`${voter.toString()} voted for ${target.toString()}.`);
        }
        else{
            this.sendUpdate(`${voter.toString()} placed a no vote.`);
        }
    }

    /** Response to a vote being removed
     * @param {Vote} vote 
     */
    voteRemovedEvent = (vote) => {
        var voter = this.votingClient.voters.cache.get(vote.voterId);
        this.sendUpdate(`${voter.toString()} removed their vote.`);
    }

    /** Response to a channel being deleted
     * @param {Discord.Channel} channel 
     */
    channelDeletedEvent = (channel) => {
        var store = false;
        if(this.updatechannels.has(channel.id)){
            this.updatechannels.delete(channel.id);
            store = true;
        }
        if(this.votingchannels.has(channel.id)){
            this.votingchannels.delete(channel.id);
            this.votingClient.manager.channelMap.delete(channel.id);
            store = true;
        }
        if(store) this.store();
    }

    //UTILITIES

    /** Convert this manager to a JSON string
     * @returns {Object} The JSON string
     */
    toJSON(){
        var returnobject = {};
        
        //retrieve update channels
        var updatechannels = [];
        this.updatechannels.each(channel => {
            updatechannels.push(channel.id);
        });

        //retrieve voting channels
        var votingchannels = [];
        this.votingchannels.each(channel => {
            votingchannels.push(channel.id);
        });

        returnobject.updatechannels = updatechannels;
        returnobject.votingchannels = votingchannels;
        
        return returnobject;
    }

    /** Store this channel manager in its files
     */
    store(){
        datawriting.putData(this.votingClient.manager.game.id, `Voting/${this.votingClient.id}/Channels/Information.json`, JSON.stringify(this));
    }

    /** Load a specific ChannelManager from files
     * @param {VotingClient} votingClient 
     * @returns {ChannelManager}
     */
    static load(votingClient){

        //create manager
        var channelManager = new ChannelManager(votingClient, true);
        
        //retrieve raw data
        var rawData = datawriting.retrieveData(votingClient.manager.game.id, `Voting/${votingClient.id}/Channels/Information.json`);
        
        //if the file didn't exist, report error
        if(!rawData){
            console.log("Unable to load Channel Manager! Storing defaults.");
            channelManager.store();
        }

        //otherwise, load data
        else{
            //interpret data
            var jsonManager = JSON.parse(rawData);

            //load data
            jsonManager.updatechannels.forEach(channelId => {
                var channel = votingClient.manager.game.client.channels.cache.get(channelId);
                if(channel){
                    channelManager.updatechannels.set(channelId, channel);
                }
            });

            jsonManager.votingchannels.forEach(channelId => {
                var channel = votingClient.manager.game.client.channels.cache.get(channelId);
                if(channel){
                    channelManager.votingchannels.set(channelId, channel);
                    votingClient.manager.channelMap.set(channelId, votingClient.id);
                }
            });
        }

        //return the newly made manager
        return channelManager;
    }
}

module.exports = {
    ChannelManager: ChannelManager
}