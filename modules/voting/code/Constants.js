/** Voting Events
 */
const Events = {
    "VOTING_CLIENT_DESTROYED": "votingClientDestroyed",
    "VOTE_START": "voteStart",
    "VOTE_END": "voteEnd",
    "VOTE_PAUSED": "votePaused",
    "VOTE_RESUMED": "voteResumed",
    "VOTE_CREATED": "voteCreated",
    "VOTE_DELETED": "voteDeleted",
    "VOTE_PLACED": "votePlaced",
    "VOTE_REMOVED": "voteRemoved",
    "VOTE_UPDATED": "voteUpdated",
    "VOTER_CREATED": "voterCreated",
    "VOTER_DELETED": "voterDeleted",
    "VOTER_UPDATED": "voterUpdated",
    "VOTER_SOURCE_MANAGER_UPDATE": "voterSourceManagerUpdate",
    "VOTER_SOURCE_MEMBERS_ADDED": "voterSourceMembersAdded",
    "VOTER_SOURCE_MEMBERS_REMOVED": "voterSourceMembersRemoved",
    "VOTER_SOURCE_INVALIDATED": "voterSourceInvalidated",
    "RESET_VOTING": "resetVoting"
}

/** The types of voters
 */
const VoterTypes = {
    "DISCORD_USER": "DISCORD_USER",
    "CHATROOM_ACCOUNT": "CHATROOM_ACCOUNT"
}

const VoteEndCheckerTypes = {
    "MAJORITY": "MAJORITY",
    "PLURALITY": "PLURALITY"
}

/** The types of voter sources
 */
const VoterSourceTypes = {
    "DISCORD_ROLE_SOURCE": "DISCORD_ROLE_SOURCE",
    "DISCORD_USER_SOURCE": "DISCORD_USER_SOURCE",
    "CHATROOM_SOURCE": "CHATROOM_SOURCE",
    "CHATROOM_ACCOUNT_SOURCE": "CHATROOM_ACCOUNT_SOURCE"
}

module.exports = {
    Events: Events,
    VoterTypes: VoterTypes,
    VoteEndCheckerTypes: VoteEndCheckerTypes,
    VoterSourceTypes: VoterSourceTypes,
}