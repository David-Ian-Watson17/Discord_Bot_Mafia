const Discord = require('discord.js');
const datahandler = require('./code/DataHandler.js');
const {VotingClientManager} = require('./code/classes/VotingClientManager.js');
const {VotingClient} = require('./code/classes/VotingClient.js');
const {VoterManager} = require('./code/classes/VoterManager.js');
const {returncodes, VoterTypes, VoteEndCheckerTypes} = require('./code/Constants.js');
const {err, VotingError} = require('./code/VotingError.js');

const admin = require('../../administration/administration.js');
const chatroomCode = require('../chatrooms/code.js');

/** The client this uses for discord events
 */
const client = require('../../client.js').client();

/** Initialize the module.
 */
const moduleStart = function(){
    console.log("Starting voting module!");
}

/*
    RETRIEVAL
*/

/** Retrieves the id of the voting client that belongs to a given name if it exists
 * @param {String} gameId 
 * @param {String} name 
 * @returns {(String|undefined)} The id
 */
const getVotingClientIdByName = function(gameId, name){
    var manager = datahandler.retrieveVotingClientManager(gameId);
    return manager.nameMap.get(name);
}

/** Retrieves the id of the chatroom that a voting client draws voters from
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @returns {String} The id
 */
const getChatroomSourceId = function(gameId, votingClientId){

    //retrieve the voting client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //if there is no voter source manager or it's not of the right type throw error
    if(!votingClient.voters.sources) throw new VotingError(err.VOTER_SOURCE_MANAGER_DOES_NOT_EXIST);
    if(!(votingClient.voters.sources.type == VoterTypes.CHATROOM_ACCOUNT)) throw new VotingError(err.VOTER_SOURCE_MANAGER_NOT_OF_CORRECT_TYPE);
    
    //return the chatroom source's id
    return votingClient.voters.sources.chatroomSource.id;
}

/** Retrieves the id of the voter that a user has access to
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {String} userId 
 * @returns {String} The voter id
 */
const getVoterIdForUserId = function(gameId, votingClientId, userId){
    //retrieve voting client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //retrieve the voter id
    return votingClient.voters.getVoterIdForDiscordUserId(userId);
}

/*
    VOTING SYSTEM
*/

/** Create a new Voting System
 * @param {String} gameId 
 * @param {String} name 
 * @param {String} votertype 
 */
const createVotingSystem = function(gameId, name){
    //retrieve voting manager for game
    var manager = datahandler.retrieveVotingClientManager(gameId);

    //create the client
    manager.createVotingClient(name);
}

/** Delete an existing Voting System
 * @param {String} gameId 
 * @param {String} votingClientId
 */
const deleteVotingSystem = function(gameId, votingClientId){
    //retrieve voting manager
    var manager = datahandler.retrieveVotingClientManager(gameId);

    //delete the client
    manager.deleteVotingClient(votingClientId);
}

/** Set the voting system name
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {String} newName
 */
const changeVotingSystemName = function(gameId, votingClientId, newName){
    //retrieve client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //set voting system name
    votingClient.changeName(newName);
}

/*
    VOTERS
*/

/** Retrieve the voter string for a voter
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {String} voterId 
 * @returns {String} The voter string
 */
const retrieveVoterString = function(gameId, votingClientId, voterId){
    //retrieve client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //retrieve the voter
    return votingClient.voters.getVoterByVoterId(voterId).toString();
}

/** Retrieve all voter strings for listing
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @returns {Array<String>} The voter strings
 */
 const retrieveVoterStrings = function(gameId, votingClientId){
    //retrieve client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //retrieve all voters
    var voters = [];
    votingClient.voters.cache.each(voter => {
        voters.push(voter.toString());
    });
    return voters;
}

/** Retrieve the profile embed for a voter
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {String} voterId 
 * @returns {Discord.MessageEmbed} The profile embed if it exists
 */
const retrieveVoterProfile = function(gameId, votingClientId, voterId){
    //retrieve client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //retrieve the voter
    var voter = votingClient.voters.cache.get(voterId);
    if(!voter) throw new VotingError(err.INVALID_VOTER_ID);

    //return profile
    return voter.toProfileEmbed();
}

/** Set the voting system voter type
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {String} votertype 
 */
 const setVoterType = function(gameId, votingClientId, votertype){
    //retrieve client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //set voter type
    votingClient.voters.setSourceManager(votertype);
}

/*
    VOTER SOURCES
*/

/** Add a voting role to a voting client if able
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {Discord.Role} role 
 */
const addVotingRole = function(gameId, votingClientId, role){
    //retrieve client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //verify source manager exists
    if(!votingClient.voters.sources) throw new VotingError(err.VOTER_SOURCE_MANAGER_DOES_NOT_EXIST);

    //add role
    votingClient.voters.sources.addVotingRole(role);
}

/** Remove a voting role from a voting client if able
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {String} roleId
 */
const removeVotingRole = function(gameId, votingClientId, roleId){
    //retrieve client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //verify source manager exists
    if(!votingClient.voters.sources) throw new VotingError(err.VOTER_SOURCE_MANAGER_DOES_NOT_EXIST);

    //remove role
    votingClient.voters.sources.removeVotingRole(roleId);
}

/** Add a whitelisted user to a voting client if able
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {Discord.User} user
 */
const addWhitelistedUser = function(gameId, votingClientId, user){
    //retrieve client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //verify source exists
    if(!votingClient.voters.sources) throw new VotingError(err.VOTER_SOURCE_MANAGER_DOES_NOT_EXIST);

    //add user
    votingClient.voters.sources.addWhitelistedUser(user);
}

/** Remove a whitelisted user from a voting client if able
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {String} userId 
 */
const removeWhitelistedUser = function(gameId, votingClientId, userId){
    //retrieve client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //verify source exists
    if(!votingClient.voters.sources) throw new VotingError(err.VOTER_SOURCE_MANAGER_DOES_NOT_EXIST);

    //remove user
    votingClient.voters.sources.removeWhitelistedUser(userId);
}

/** Add a blacklisted user to a voting client if able
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {Discord.User} user 
 */
const addBlacklistedUser = function(gameId, votingClientId, user){
    //retrieve client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //verify source exists
    if(!votingClient.voters.sources) throw new VotingError(err.VOTER_SOURCE_MANAGER_DOES_NOT_EXIST);

    //add user
    votingClient.voters.sources.addBlacklistedUser(user);
}

/** Remove a blacklisted user from a voting client if able
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {String} userId
 */
const removeBlacklistedUser = function(gameId, votingClientId, userId){
    //retrieve client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //verify source manager exists
    if(!votingClient.voters.sources) throw new VotingError(err.VOTER_SOURCE_MANAGER_DOES_NOT_EXIST);

    //remove user
    votingClient.voters.sources.removeBlacklistedUser(userId);
}

/** Set the chatroom source for a voting client if able
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {String} chatroomId 
 */
const setChatroomSource = function(gameId, votingClientId, chatroomId){
    //retrieve chatroom
    var chatroom = chatroomCode.getChatroomById(gameId, chatroomId);
    if(!chatroom) throw new VotingError(err.INVALID_VOTER_SOURCE);

    //retrieve client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //verify source manager exists
    if(!votingClient.voters.sources) throw new VotingError(err.VOTER_SOURCE_MANAGER_DOES_NOT_EXIST);

    //set source
    votingClient.voters.sources.setChatroomSource(chatroom);
}

/** Add a blacklisted account to a voting client if able
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {String} accountId 
 */
const addBlacklistedAccount = function(gameId, votingClientId, accountId){
    //retrieve client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //verify source manager exists
    if(!votingClient.voters.sources) throw new VotingError(err.VOTER_SOURCE_MANAGER_DOES_NOT_EXIST);

    //add account
    votingClient.voters.sources.addBlacklistedAccount(accountId);
}

/** Remove a blacklisted account from a voting client if able
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {String} accountId 
 */
const removeBlacklistedAccount = function(gameId, votingClientId, accountId){
    //retrieve client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //verify source manager exists
    if(!votingClient.voters.sources) throw new VotingError(err.VOTER_SOURCE_MANAGER_DOES_NOT_EXIST);

    //remove account
    votingClient.voters.sources.removeBlacklistedAccount(accountId);
}

/*
    VOTER EDITING
*/

/** Give a voter a special vote
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {String} voterId 
 * @param {String} voteId
 */
const giveSpecialVote = function(gameId, votingClientId, voterId, name){
    
    //retrieve voting client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //retrieve voter
    var voter = votingClient.voters.getVoterByVoterId(voterId);

    //create special vote
    voter.createSpecialVote(name);
}

/** Take a special vote away from a voter
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {String} voterId 
 * @param {String} voteId
 */
const takeSpecialVote = function(gameId, votingClientId, voterId, voteId){
    //retrieve voting client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //retrieve voter
    var voter = votingClient.voters.getVoterByVoterId(voterId);

    //remove special vote
    voter.removeSpecialVote(voteId);
}

/*
    VOTING
*/

/** Place a voter's standard vote on a target
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {String} voterId 
 * @param {String} targetId 
 */
const placeOwnStandardVote = function(gameId, votingClientId, voterId, targetId){
    
    //retrieve the voting client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //retrieve the voter
    var voter = votingClient.voters.getVoterByUserId(voterId);

    //place vote
    voter.placeStandardVote(targetId);
}

/** Place a special vote for a voter on a target
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {String} voterId 
 * @param {String} voteId 
 * @param {String} targetId 
 */
const placeOwnSpecialVote = function(gameId, votingClientId, voterId, voteId, targetId){

    //retrieve the voting client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //retrieve the voter
    var voter = votingClient.voters.getVoterByUserId(voterId);

    //place vote
    voter.placeSpecialVote(voteId, targetId);
}

/** Place a voter's standard vote on nobody
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {String} voterId 
 */
const noVoteOwnStandardVote = function(gameId, votingClientId, voterId){

    //retrieve the voting client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //retrieve voter
    var voter = votingClient.voters.getVoterByUserId(voterId);

    //place vote
    voter.noVoteStandardVote();
}

/** Place a special vote for a voter on nobody
 * @param {String} gameId 
 * @param {String} votingClientId
 * @param {String} voterId 
 * @param {String} voteId
 */
const noVoteOwnSpecialVote = function(gameId, votingClientId, voterId, voteId){

    //retrieve voting client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //retrieve the voter
    var voter = votingClient.voters.getVoterByUserId(voterId);

    //place vote
    voter.noVoteSpecialVote(voteId);
}

/** Remove a voter's standard vote
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {String} voterId
 */
const removeOwnStandardVote = function(gameId, votingClientId, voterId){

    //retrieve voting client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //retrieve voter
    var voter = votingClient.voters.getVoterByUserId(voterId);

    //remove vote
    voter.removeStandardVote();
}

/** Removes a special vote for a voter
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {String} voterId 
 * @param {String} voteId
 */
const removeOwnSpecialVote = function(gameId, votingClientId, voterId, voteId){

    //retrieve voting client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //retrieve voter
    var voter = votingClient.voters.getVoterByUserId(voterId);

    //remove vote
    voter.removeSpecialVote(voteId);
}

/** Retrieve the vote count of a running vote
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @returns {Discord.Collection<String, Object>}
 */
const getVoteCount = function(gameId, votingClientId){

    //retrieve voting client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //retrieve vote count
    return votingClient.votehandler.getVoteCount();
}

/*
    CHANNEL FUNCTIONS
*/

/** Add a channel to a system as a voting channel
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {Discord.Channel} channel 
 */
const addVotingChannel = function(gameId, votingClientId, channel){
    //retrieve voting client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //add channel
    votingClient.channels.addVotingChannel(channel);
}

/** Add a channel to a system as an update channel
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {Discord.Channel} channel 
 */
const addUpdateChannel = function(gameId, votingClientId, channel){
    //retrieve voting client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //add channel
    votingClient.channels.addUpdateChannel(channel);
}

/** Remove a voting channel from a system
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {String} channelId 
 */
const removeVotingChannel = function(gameId, votingClientId, channelId){
    //retrieve voting client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //remove channel
    votingClient.channels.removeVotingChannel(channelId);
}

/** Remove an update channel from a system
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {String} channelId 
 */
const removeUpdateChannel = function(gameId, votingClientId, channelId){
    //retrieve voting client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //remove channel
    votingClient.channels.removeUpdateChannel(channelId);
}

/** Remove a channel from a system entirely
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {String} channelId 
 */
const removeChannel = function(gameId, votingClientId, channelId){
    //retrieve voting client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //remove channel
    var haschannel = false;
    if(votingClient.channels.votingchannels.has(channelId)){
        votingClient.channels.removeVotingChannel(channelId);
        haschannel = true;
    }
    if(votingClient.channels.updatechannels.has(channelId)){
        votingClient.channels.removeUpdateChannel(channelId);
        haschannel = true;
    }
    if(!haschannel) throw new VotingError(err.CHANNEL_NOT_PRESENT);
}

/** Adds all channels from a given chatroom as voting channels if able. Returns the ones it couldn't add.
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @returns {Array<String>} The ids of the channels it couldn't import
 */
const importChannelsFromChatroomSource = function(gameId, votingClientId){
    //retrieve voting client
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //import
    return votingClient.channels.importVotingChannelsFromChatroomSource();
}

/*
    VOTE RUNNING
*/

/** Start a majority vote
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {Number} majority 
 */
const startMajorityVote = function(gameId, votingClientId, majority=null){
    //retrieve manager
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //start vote
    votingClient.votehandler.startVote(VoteEndCheckerTypes.MAJORITY, {majority: majority});
}

/** Start a plurality vote
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {Number} winners 
 */
const startPluralityVote = function(gameId, votingClientId, winners=null){
    //retrieve manager
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //start vote
    votingClient.votehandler.startVote(VoteEndCheckerTypes.PLURALITY, {winners: winners})
}

/** End a vote by automatically picking winners
 * @param {String} gameId 
 * @param {String} votingClientId 
 */
const endVote = function(gameId, votingClientId){
    //retrieve manager
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //end vote
    votingClient.votehandler.endVote();
}

/** End a vote by manually picking winners
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {String} winnerIds 
 */
const hammerVote = function(gameId, votingClientId, winnerIds){
    //retrieve manager
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //hammer vote
    votingClient.votehandler.hammerVote(winnerIds);
}

/** Cancel a vote, ending it with no winners
 * @param {String} gameId 
 * @param {String} votingClientId 
 */
const cancelVote = function(gameId, votingClientId){
    //retrieve manager
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //cancel vote
    votingClient.votehandler.cancelVote();
}

/** Reset a vote, keeping it running but resetting all votes
 * @param {String} gameId 
 * @param {String} votingClientId 
 */
const resetVote = function(gameId, votingClientId){
    //retrieve manager
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //reset vote
    votingClient.votehandler.resetVote();
}

/** Pause a vote
 * @param {String} gameId 
 * @param {String} votingClientId 
 */
const pauseVote = function(gameId, votingClientId){
    //retrieve manager
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //pause vote
    votingClient.votehandler.pauseVote();
}

/** Resume a vote
 * @param {String} gameId 
 * @param {String} votingClientId 
 */
const resumeVote = function(gameId, votingClientId){
    //retrieve manager
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //resume vote
    votingClient.votehandler.resumeVote();
}

/** Change the majority of an active majority vote
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {Number} newMajority 
 */
const changeMajority = function(gameId, votingClientId, newMajority){
    //retrieve manager
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //retrieve end checker
    var endChecker = votingClient.votehandler.endChecker;
    if(!endChecker) throw new VotingError(err.VOTE_NOT_RUNNING);

    //verify correct end checker type
    if(!(endChecker.type == VoteEndCheckerTypes.MAJORITY)) throw new VotingError(err.NOT_MAJORITY_VOTE);

    //change majority
    endChecker.setMajority(newMajority);
}

/** Change the number of winners for an active plurality vote
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @param {Number} newPlurality 
 */
const changePlurality = function(gameId, votingClientId, newPlurality){
    //retrieve manager
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //retrieve end checker
    var endChecker = votingClient.votehandler.endChecker;
    if(!endChecker) throw new VotingError(err.VOTE_NOT_RUNNING);

    //verify correct end checker type
    if(!(endChecker.type == VoteEndCheckerTypes.PLURALITY)) throw new VotingError(err.NOT_PLURALITY_VOTE);

    //change plurality
    endChecker.setWinners(newPlurality);
}

/** Return the full vote count
 * @param {String} gameId 
 * @param {String} votingClientId 
 * @returns {String} The vote count string
 */
const getFullVoteCount = function(gameId, votingClientId){
    //retrieve manager
    var votingClient = datahandler.retrieveVotingClient(gameId, votingClientId);

    //return vote count
    return votingClient.votehandler.getFullVoteCount();
}

/*
    AUTOCOMPLETES
*/

/** Retrieve the autocompletes for all voting systems in a game
 * @param {String} gameId
 * @param {String} requesterId
 * @returns {Array<Object>} The autocompletes
 */
const autocompletesAllVotingSystemIds = function(gameId, requesterId, focusedvalue){
    //verify permissions
    if(!admin.isAdmin(gameId, requesterId)) throw new VotingError(err.INSUFFICIENT_PERMISSIONS);
    
    //autocompletes
    var autocompletes = [];

    //for each client in the manager
    var manager = datahandler.retrieveVotingClientManager(gameId);
    manager.cache.each(client => {
        autocompletes.push({name: client.name, value: client.id});
    });

    //return the autocompletes
    return autocompletes.filter(autocomplete => autocomplete.name.includes(focusedvalue));
}

/** Retrieves all voting system ids that employ a given voter type
 * @param {String} gameId 
 * @param {String} requesterId 
 * @param {String} type 
 * @returns {Array<Object>} The autocompletes
 */
 const autocompletesVotingSystemIdsByVoterType = function(gameId, requesterId, type, focusedvalue){
    //verify permission
    if(!admin.isAdmin(gameId, requesterId)) throw new VotingError(err.INSUFFICIENT_PERMISSIONS);
    
    //autocompletes
    var autocompletes = [];

    //fetch the manager
    var manager = datahandler.retrieveVotingClientManager(gameId);

    //fetch autocompletes based on voter type
    manager.cache.each(votingClient => {
        if(votingClient.voters.sources.type == type){
            autocompletes.push({name: votingClient.name, value: votingClient.id});
        }
    });

    //return autocompletes
    return autocompletes.filter(autocomplete => autocomplete.name.includes(focusedvalue));
}

/** Retrieves all voting system ids that employ a given handler type
 * @param {String} gameId 
 * @param {String} requesterId 
 * @param {String} type 
 * @returns {Array<Object>} The autocompletes
 */
const autocompletesVotingSystemIdsByHandlerType = function(gameId, requesterId, type, focusedvalue){
    //verify permission
    if(!admin.isAdmin(gameId, requesterId)) throw new VotingError(err.INSUFFICIENT_PERMISSIONS);

    //autocompletes
    var autocompletes = [];

    //fetch the manager
    var manager = datahandler.retrieveVotingClientManager(gameId);

    //fetch autocompletes based on handler type
    manager.cache.each(votingClient => {
        if(votingClient.votehandler.voteEndChecker && votingClient.votehandler.voteEndChecker.type == type){
            autocompletes.push({name: votingClient.name, value: votingClient.id});
        }
    });

    //return autocompletes
    return autocompletes.filter(autocomplete => autocomplete.name.includes(focusedvalue));
}

/** Retrieve the autocompletes for all voting roles in a voting system
 * @param {String} gameId 
 * @param {String} clientId 
 * @param {String} requesterId 
 * @returns {Array<Object>} The autocompletes
 */
const autocompletesVotingRoles = function(gameId, clientId, requesterId, focusedvalue){
    //verify permissions
    if(!admin.isAdmin(gameId, requesterId)) throw new VotingError(err.INSUFFICIENT_PERMISSIONS);

    //autocompletes
    var autocompletes = [];

    //retrieve the client
    var votingClient = datahandler.retrieveVotingClient(gameId, clientId);
    
    //retrieve the voter source manager
    var sourceManager = votingClient.voters.sources;

    //verify the voter source manager is the appropriate type
    if(!(sourceManager.type == VoterTypes.DISCORD_USER)) return ["This voting system does not have voting roles."]

    //populate the autocompletes
    sourceManager.votingRoles.each(votingRoleSource => {
        autocompletes.push({name: `${votingRoleSource.toString()}`, value: `${votingRoleSource.id}`});
    });

    //return the autocompletes
    return autocompletes.filter(autocomplete => autocomplete.name.includes(focusedvalue));
}

/** Retrieve the autocompletes for all whitelisted users in a voting system
 * @param {String} gameId 
 * @param {String} clientId 
 * @param {String} requesterId 
 * @returns {Array<Object>} The autocompletes
 */
const autocompletesWhitelistedUsers = function(gameId, clientId, requesterId, focusedvalue){
    //verify permissions
    if(!admin.isAdmin(gameId, requesterId)) throw new VotingError(err.INSUFFICIENT_PERMISSIONS);

    //autocompletes
    var autocompletes = [];

    //retrieve the client
    var votingClient = datahandler.retrieveVotingClient(gameId, clientId);

    //retrieve the voter source manager
    var sourceManager = votingClient.voters.sources;

    //verify the voter source manager is the appropriate type
    if(!(sourceManager.type == VoterTypes.DISCORD_USER)) return ["This system does not have whitelisted users."];

    //populate the autocompletes
    sourceManager.whitelistedUsers.each(whitelistedUserSource => {
        autocompletes.push({name: whitelistedUserSource.toString(), value: whitelistedUserSource.id});
    });

    //return the autocompletes
    return autocompletes.filter(autocomplete => autocomplete.name.includes(focusedvalue));
}

/** Retrieve the autocompletes for all blacklisted users in a voting system
 * @param {String} gameId 
 * @param {String} clientId 
 * @param {String} requesterId 
 * @returns {Array<Object>} The autocompletes
 */
const autocompletesBlacklistedUsers = function(gameId, clientId, requesterId, focusedvalue){
    //verify permissions
    if(!admin.isAdmin(gameId, requesterId)) throw new VotingError(err.INSUFFICIENT_PERMISSIONS);

    //autocompletes
    var autocompletes = [];

    //retrieve the client
    var votingClient = datahandler.retrieveVotingClient(gameId, clientId);

    //retrieve the voter source manager
    var sourceManager = votingClient.voters.sources;

    //verify the voter source manager is the appropriate type
    if(!(sourceManager.type == VoterTypes.DISCORD_USER)) return ["This system does not have blacklisted users."];

    //populate the autocompletes
    sourceManager.blacklistedUsers.each(blacklistedUserSource => {
        autocompletes.push({name: blacklistedUserSource.toString(), value: blacklistedUserSource.id});
    });

    //return the autocompletes
    return autocompletes.filter(autocomplete => autocomplete.name.includes(focusedvalue));
}

/** Retrieve the autocompletes for the chatroom source in a voting system
 * @param {String} gameId 
 * @param {String} clientId 
 * @param {String} requesterId 
 * @returns {Array<Object>} The autocompletes
 */
const autocompletesChatroomSource = function(gameId, clientId, requesterId, focusedvalue){
    //verify permissions
    if(!admin.isAdmin(gameId, requesterId)) throw new VotingError(err.INSUFFICIENT_PERMISSIONS);

    //autocompletes
    var autocompletes = [];

    //retrieve the client
    var votingClient = datahandler.retrieveVotingClient(gameId, clientId);

    //retrieve the voter source manager
    var sourceManager = votingClient.voters.sources;

    //verify the voter source manager is the appropriate type
    if(!(sourceManager.type == VoterTypes.CHATROOM_ACCOUNT)) return ["This voting system does not use a chatroom."];

    //populate the autocompletes
    autocompletes.push({name: sourceManager.chatroomSource.toString(), value: sourceManager.chatroomSource.id});

    //return autocompletes
    return autocompletes.filter(autocomplete => autocomplete.name.includes(focusedvalue));
}

/** Retrieve the autocompletes for the blacklisted accounts in a voting system
 * @param {String} gameId 
 * @param {String} clientId 
 * @param {String} requesterId 
 * @returns {Array<Object>} The autocompletes
 */
const autocompletesBlacklistedAccounts = function(gameId, clientId, requesterId, focusedvalue){
    //verify permissions
    if(!admin.isAdmin(gameId, requesterId)) throw new VotingError(err.INSUFFICIENT_PERMISSIONS);

    //autocompletes
    var autocompletes = [];

    //retrieve the client
    var votingClient = datahandler.retrieveVotingClient(gameId, clientId);

    //retrieve the voter source manager
    var sourceManager = votingClient.voters.sources;

    //verify the voter source manager is the appropriate type
    if(!(sourceManager.type == VoterTypes.CHATROOM_ACCOUNT)) return ["This voting system does not use blacklisted accounts."]

    //populate the autocompletes
    sourceManager.blacklistedAccounts.each(accountSource => {
        autocompletes.push({name: accountSource.toString(), value: accountSource.id});
    });

    //return autocompletes
    return autocompletes.filter(autocomplete => autocomplete.name.includes(focusedvalue));
}

/** Retrieve the autocompletes for all voter ids in a voting system
 * @param {String} gameId
 * @param {String} clientId
 * @returns {Array<Object>} The autocompletes
 */
const autocompletesAllVoterIds = function(gameId, clientId, focusedvalue){
    //autocompletes
    var autocompletes = [];

    //retrieve the client
    var votingClient = datahandler.retrieveVotingClient(gameId, clientId);

    //populate the autocompletes
    votingClient.voters.cache.each(voter => {
        autocompletes.push({name: voter.toString(), value: voter.id});
    });

    //return autocompletes
    return autocompletes.filter(autocomplete => autocomplete.name.includes(focusedvalue));
}

/** Retrieve the autocompletes for all voter ids in a voting system that have at least one special vote
 * @param {String} gameId 
 * @param {String} clientId 
 * @param {String} requesterId 
 * @param {String} focusedvalue 
 * @returns {Array<Object>} The autocompletes
 */
const autocompletesAllVoterIdsWithSpecialVotes = function(gameId, clientId, requesterId, focusedvalue){
    //verify permissions
    if(!admin.isAdmin(gameId, requesterId)) throw new VotingError(err.INSUFFICIENT_PERMISSIONS);

    //autocompletes
    var autocompletes = [];

    //retrieve the client
    var votingClient = datahandler.retrieveVotingClient(gameId, clientId);

    //populate the autocompletes
    votingClient.voters.cache.each(voter => {
        if(voter.specialVotes.size > 0){
            autocompletes.push({name: voter.toString(), value: voter.id});
        }
    });

    //return filtered autocompletes
    return autocompletes.filter(autocomplete => autocomplete.name.includes(focusedvalue));
}

/** Retrieve the autocompletes for all voter ids in a system that are able to be voted for
 * @param {String} gameId 
 * @param {String} clientId 
 * @param {String} focusedvalue 
 * @returns {Array<Object>} The autocompletes
 */
const autocompletesAllVoterIdsThatAreVotable = function(gameId, clientId, focusedvalue){
    //autocompletes
    var autocompletes = [];

    //retrieve voting client
    var votingClient = datahandler.retrieveVotingClient(gameId, clientId);

    //populate autocompletes
    votingClient.voters.cache.each(voter => {
        if(voter.votable){
            autocompletes.push({name: voter.toString(), value: voter.id});
        }
    });

    //return autocompletes
    return autocompletes;
}

/** Retrieve the autocompletes for all vote ids in a voter
 * @param {String} gameId
 * @param {String} clientId
 * @param {String} voterId
 * @returns {Array<Object>} The autocompletes
 */
const autocompletesAllVoteIdsForVoter = function(gameId, clientId, voterId, focusedvalue){
    //autocompletes
    var autocompletes = [];

    //retrieve the client
    var votingClient = datahandler.retrieveVotingClient(gameId, clientId);
    
    //retrieve the voter
    var voter = votingClient.voters.getVoterByVoterId(voterId);

    //populate the autocompletes
    var standardvote = votingClient.votes.getVote(voter.standardVote);
    autocompletes.push({name: standardvote.toString(), value: standardvote.id});
    voter.specialVotes.each(voteId => {
        var vote = votingClient.votes.getVote(voteId);
        autocompletes.push({name: vote.toString(), value: vote.id});
    });

    //return autocompletes
    return autocompletes.filter(autocomplete => autocomplete.name.includes(focusedvalue));
}

/** Retrieve the autocompletes for all special vote ids a given voter has
 * @param {String} gameId 
 * @param {String} clientId 
 * @param {String} voterId
 * @param {String} requesterId
 * @param {String} focusedvalue
 * @returns {Array<Object>} The autocompletes 
 */
const autocompletesAllSpecialVoteIdsForVoter = function(gameId, clientId, voterId, requesterId, focusedvalue){
    //verify permissions
    if(!admin.isAdmin(gameId, requesterId)) throw new VotingError(err.INSUFFICIENT_PERMISSIONS);
    
    //the autocompletes
    var autocompletes = [];

    //retrieve the client
    var votingClient = datahandler.retrieveVotingClient(gameId, clientId);

    //retrieve the voter
    var voter = votingClient.voters.getVoterByVoterId(voterId);

    //populate the autocompletes
    voter.specialVotes.forEach(voteId => {
        var vote = votingClient.votes.getVote(voteId);
        autocompletes.push({name: vote.toString(), value: vote.id});
    });

    //return autocompletes
    return autocompletes.filter(autocomplete => autocomplete.name.includes(focusedvalue));
}

/** Retrieve the autocompletes for all special vote ids the requester has
 * @param {String} gameId 
 * @param {String} clientId 
 * @param {String} requesterId 
 * @param {String} focusedvalue 
 * @returns {Array<Object>} The autocompletes
 */
const autocompletesAllSpecialVoteIdsForUser = function(gameId, clientId, requesterId, focusedvalue){
    //the autocompletes
    var autocompletes = [];

    //retrieve the client
    var votingClient = datahandler.retrieveVotingClient(gameId, clientId);

    //retrieve the voter
    var voter = votingClient.voters.getVoterByUserId(requesterId);

    //populate the autocompletes
    voter.specialVotes.forEach(voteId => {
        var vote = votingClient.votes.getVote(voteId);
        autocompletes.push({name: vote.toString(), value: vote.id});
    });

    //return autocompletes
    return autocompletes.filter(autocomplete => autocomplete.name.includes(focusedvalue));
}

/** Retrieve autocompletes for all channels that are part of a voting system.
 * @param {String} gameId 
 * @param {String} clientId 
 * @param {String} requesterId 
 * @returns {Array<Object>} The autocompletes
 */
const autocompletesAllChannels = function(gameId, clientId, requesterId, focusedvalue){
    //verify permissions
    if(!admin.isAdmin(gameId, requesterId)) throw new VotingError(err.INSUFFICIENT_PERMISSIONS);

    //initialize autocompletes
    var autocompletes = [];

    //retrieve the client
    var votingClient = datahandler.retrieveVotingClient(gameId, clientId);

    //initialize collection to hold channel information
    var channelmodifiers = new Discord.Collection();

    //track voting channels
    votingClient.channels.votingchannels.each(channel => {
        channelmodifiers.set(channel.id, {channel: channel, modifier: "voting"});
    });

    //track update channels
    votingClient.channels.updatechannels.each(channel => {
        if(channelmodifiers.has(channel.id)) channelmodifiers.set(channel.id, {channel: channel, modifier: "both"});
        else channelmodifiers.set(channel.id, {channel: channel, modifier: "updates"});
    });

    //for each modifier
    channelmodifiers.each(object => {
        var string = object.channel.name;
        switch(object.modifier){
            case "voting":
                string += " <Voting>";
                break;
            case "updates":
                string += " <Updates>";
                break;
            case "both":
                string += " <Voting/Updates>";
                break;
        }
        autocompletes.push({name: string, value: object.channel.id});
    });

    //return filtered autocompletes
    return autocompletes.filter(autocomplete => autocomplete.name.includes(focusedvalue));
}

/** Returns autocompletes based on errors
 * @param {Object} errorcode 
 * @returns {Array<String>} The autocompletes
 */
const autocompletesError = function(errorcode){
    if(!(errorcode instanceof VotingError)){
        return ["An error occurred!"];
    }
    switch(errorcode.votingerrorcode){
        case err.INVALID_VOTING_CLIENT_ID.code:
            return ["Could not find a valid voting system to associate with this command!"];
        case err.INVALID_VOTER_ID.code:
            return ["Enter a valid voter to see options."];
        case err.INVALID_VOTE_ID.code:
            return ["Enter a valid vote to see options."];
        case err.VOTER_SOURCE_MANAGER_DOES_NOT_EXIST.code:
            return ["This voting system is not set up to use any voter type."];
        case err.VOTER_SOURCE_NOT_PRESENT.code:
            return ["Enter a valid voter source to see options."];
        case err.VOTER_SOURCE_MANAGER_NOT_OF_CORRECT_TYPE.code:
            return ["This voting system does not use that kind of voter source."];
        case err.INSUFFICIENT_PERMISSIONS.code:
            return ["You must be an admin to use that command."];
        default:
            return ["A voting error occurred!"];
    }
}

/*
    RETURN CODE PRINTING
*/

/** Print a customized message based on the returncode entered in response to an interaction.
 * @param {Discord.Interaction} interaction 
 * @param {Object} returncode 
 */
const replyToInteractionBasedOnReturnCode = async function(interaction, returncode){

    if(returncode instanceof VotingError){
        await replyToInteraction(interaction, returncode.message, true);
    }
    else{
        await replyToInteraction(interaction, "An error has occurred!", true);
        console.log(returncode);
    }
}

/** Reply to an interaction with a response message, edits reply if it's already been sent
 * @param {Discord.Interaction} interaction 
 * @param {String} string 
 * @param {Boolean} ephemeral 
 */
const replyToInteraction = async function(interaction, string, ephemeral=true){
    if(!interaction.replied){
        await interaction.reply({content: string, ephemeral: ephemeral});
    }
    else{
        await interaction.editReply(`${await interaction.fetchReply()}\n${string}`);
    }
}

module.exports = {
    //initialize the module
    moduleStart: moduleStart,

    //retrieval
    getVotingClientIdByName: getVotingClientIdByName,
    getChatroomSourceId: getChatroomSourceId,
    getVoterIdForUserId: getVoterIdForUserId,

    //voting system
    createVotingSystem: createVotingSystem,
    deleteVotingSystem: deleteVotingSystem,
    changeVotingSystemName: changeVotingSystemName,

    //voter manager functions
    retrieveVoterString: retrieveVoterString,
    retrieveVoterStrings: retrieveVoterStrings,
    retrieveVoterProfile: retrieveVoterProfile,
    setVoterType: setVoterType,

    //voter source functions
    addVotingRole: addVotingRole,
    removeVotingRole: removeVotingRole,
    addWhitelistedUser: addWhitelistedUser,
    removeWhitelistedUser: removeWhitelistedUser,
    addBlacklistedUser: addBlacklistedUser,
    removeBlacklistedUser: removeBlacklistedUser,
    setChatroomSource: setChatroomSource,
    addBlacklistedAccount: addBlacklistedAccount,
    removeBlacklistedAccount: removeBlacklistedAccount,

    //voter functions
    giveSpecialVote: giveSpecialVote,
    takeSpecialVote: takeSpecialVote,

    //vote placement
    placeOwnStandardVote: placeOwnStandardVote,
    placeOwnSpecialVote: placeOwnSpecialVote,
    noVoteOwnStandardVote: noVoteOwnStandardVote,
    noVoteOwnSpecialVote: noVoteOwnSpecialVote,
    removeOwnStandardVote: removeOwnStandardVote,
    removeOwnSpecialVote: removeOwnSpecialVote,
    getVoteCount: getVoteCount,

    //channels
    addVotingChannel: addVotingChannel,
    addUpdateChannel: addUpdateChannel,
    removeVotingChannel: removeVotingChannel,
    removeUpdateChannel: removeUpdateChannel,
    removeChannel: removeChannel,
    importChannelsFromChatroomSource: importChannelsFromChatroomSource,

    //vote running
    startMajorityVote: startMajorityVote,
    startPluralityVote: startPluralityVote,
    endVote: endVote,
    hammerVote: hammerVote,
    resetVote: resetVote,
    cancelVote: cancelVote,
    pauseVote: pauseVote,
    resumeVote: resumeVote,
    changeMajority: changeMajority,
    changePlurality: changePlurality,
    getFullVoteCount: getFullVoteCount,

    //autocompletes
    autocompletesAllVotingSystemIds: autocompletesAllVotingSystemIds,
    autocompletesVotingSystemIdsByVoterType: autocompletesVotingSystemIdsByVoterType,
    autocompletesVotingSystemIdsByHandlerType: autocompletesVotingSystemIdsByHandlerType,
    autocompletesVotingRoles: autocompletesVotingRoles,
    autocompletesWhitelistedUsers: autocompletesWhitelistedUsers,
    autocompletesBlacklistedUsers: autocompletesBlacklistedUsers,
    autocompletesChatroomSource: autocompletesChatroomSource,
    autocompletesBlacklistedAccounts: autocompletesBlacklistedAccounts,
    autocompletesAllVoterIds: autocompletesAllVoterIds,
    autocompletesAllVoterIdsWithSpecialVotes: autocompletesAllVoterIdsWithSpecialVotes,
    autocompletesAllVoterIdsThatAreVotable: autocompletesAllVoterIdsThatAreVotable,
    autocompletesAllVoteIdsForVoter: autocompletesAllVoteIdsForVoter,
    autocompletesAllSpecialVoteIdsForVoter: autocompletesAllSpecialVoteIdsForVoter,
    autocompletesAllSpecialVoteIdsForUser: autocompletesAllSpecialVoteIdsForUser,
    autocompletesAllChannels: autocompletesAllChannels,
    autocompletesError: autocompletesError,
    
    //response
    replyToInteractionBasedOnReturnCode: replyToInteractionBasedOnReturnCode,
    replyToInteraction: replyToInteraction,
}