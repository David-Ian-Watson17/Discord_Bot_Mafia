const {GameError} = require('../../../GameError.js');

class VotingError extends GameError{

    constructor(code){
        super(code);
    }
}

const codes = {
    ERROR_UNKNOWN: {code: "ERROR_UNKNOWN", message: "Something went wrong!"},
    INSUFFICIENT_PERMISSIONS: {code: "INSUFFICIENT_PERMISSIONS", message: "You don't have the permissions to use that command."},
    INVALID_VOTING_CLIENT_ID: {code: "INVALID_VOTING_CLIENT_ID", message: "Could not find that voting system."},
    INVALID_VOTER_ID: {code: "INVALID_VOTER_ID", message: "Could not find that voter."},
    INVALID_VOTER_TYPE: {code: "INVALID_VOTER_TYPE", message: "Could not recognize that voter type."},
    INVALID_VOTE_ID: {code: "INVALID_VOTE_ID", message: "Could not find that vote."},
    INVALID_TARGET_ID: {code: "INVALID_TARGET_ID", message: "Could not find your target."},
    VOTING_CLIENT_NAME_ALREADY_TAKEN: {code: "VOTING_CLIENT_NAME_ALREADY_TAKEN", message: "That name is already taken by another voting system."},
    CHANNEL_ALREADY_TAKEN: {code: "CHANNEL_ALREADY_TAKEN", message: "That channel is already being used as a voting channel by another voting system."},
    INVALID_VOTER_SOURCE: {code: "INVALID_VOTER_SOURCE", message: "Could not find that voter source."},
    VOTER_SOURCE_CONFLICT: {code: "VOTER_SOURCE_CONFLICT", message: "Could not add that voter source because it would have caused a conflict."},
    VOTER_SOURCE_ALREADY_PRESENT: {code: "VOTER_SOURCE_ALREADY_PRESENT", message: "That voter source is already being used."},
    VOTER_SOURCE_NOT_PRESENT: {code: "VOTER_SOURCE_NOT_PRESENT", message: "That voter source could not be found."},
    VOTER_SOURCE_MANAGER_DOES_NOT_EXIST: {code: "VOTER_SOURCE_MANAGER_DOES_NOT_EXIST", message: "This voting system is not yet set to use any type of voter."},
    VOTER_SOURCE_MANAGER_ALREADY_THAT_TYPE: {code: "VOTER_SOURCE_MANAGER_ALREADY_THAT_TYPE", message: "This voting system already uses voters of that type."},
    VOTER_SOURCE_MANAGER_NOT_OF_CORRECT_TYPE: {code: "VOTER_SOURCE_NOT_OF_CORRECT_TYPE", message: "This voting system does not use that kind of voter source."},
    YOU_ARE_NOT_A_VOTER: {code: "YOU_ARE_NOT_A_VOTER", message: "You are not recognized as a voter right now."},
    YOU_ARE_UNABLE_TO_VOTE: {code: "YOU_ARE_UNABLE_TO_VOTE", message: "You do not have permission to place your votes."},
    VOTE_ALREADY_PLACED_ON_TARGET: {code: "VOTE_ALREADY_PLACED_ON_TARGET", message: "You have already placed that vote on that target."},
    VOTE_NOT_PLACED: {code: "VOTE_NOT_PLACED", message: "You have not placed that vote."},
    VOTE_FROZEN: {code: "VOTE_FROZEN", message: "Cannot vote right now."},
    CANNOT_VOTE_FOR_TARGET: {code: "CANNOT_VOTE_FOR_TARGET", message: "You are not able to vote for that target."},
    CHANNEL_ALREADY_VOTING_CHANNEL: {code: "CHANNEL_ALREADY_VOTING_CHANNEL", message: "That channel is already a voting channel."},
    CHANNEL_ALREADY_UPDATE_CHANNEL: {code: "CHANNEL_ALREADY_UPDATE_CHANNEL", message: "That channel is already an update channel."},
    CHANNEL_NOT_VOTING_CHANNEL: {code: "CHANNEL_NOT_VOTING_CHANNEL", message: "That channel is not a voting channel."},
    CHANNEL_NOT_UPDATE_CHANNEL: {code: "CHANNEL_NOT_UPDATE_CHANNEL", message: "That channel is not an update channel."},
    CHANNEL_NOT_PRESENT: {code: "CHANNEL_NOT_PRESENT", message: "That channel is not a part of the voting system."},
    VOTE_ALREADY_RUNNING: {code: "VOTE_ALREADY_RUNNING", message: "This system currently has a vote running."},
    VOTE_NOT_RUNNING: {code: "VOTE_NOT_RUNNING", message: "This system does not have a vote running."},
    VOTE_ALREADY_ACTIVE: {code: "VOTE_ALREADY_ACTIVE", message: "This system's vote is not paused."},
    VOTE_NOT_ACTIVE: {code: "VOTE_NOT_ACTIVE", message: "This system's vote is paused."},
    NOT_MAJORITY_VOTE: {code: "NOT_MAJORITY_VOTE", message: "This is not running a majority vote!"},
    NOT_PLURALITY_VOTE: {code: "NOT_PLURALITY_VOTE", message: "This is not running a plurality vote!"},
    INVALID_VOTE_RUN_TYPE: {code: "INVALID_VOTE_RUN_TYPE", message: "That is not a valid type of vote."}
}

module.exports = {
    VotingError: VotingError,
    err: codes
}