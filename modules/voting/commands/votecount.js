const Discord = require('discord.js');
const code = require('../code.js');
const {VoterTypes} = require('../code/Constants.js');
const {err} = require('../code/VotingError.js');

module.exports = {
    data: {
        name: "votecount",
        description: "Prints the current votecount."
    },
    securitylevel: "none",
    serverreliance: "server",
    votingclientidreliance: "channel",
    specificvotingclients: "no",
    async execute(interaction, gameId, senderId, guild, votingClientId){
        var votecountstr = code.getVoteCount(gameId, votingClientId);
        await code.replyToInteraction(interaction, votecountstr, false);
    },
    async retrieveAutocompletes(interaction, gameId, votingClientId){
        
    }
}