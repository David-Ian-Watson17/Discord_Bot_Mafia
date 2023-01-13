const Discord = require('discord.js');
const code = require('../code.js');
const {VoterTypes} = require('../code/Constants.js');
const {err} = require('../code/VotingError.js');

module.exports = {
    data: {
        name: "novote",
        description: "Place your vote on no one!",
    },
    securitylevel: "none",
    serverreliance: "server",
    votingclientidreliance: "channel",
    specificvotingclients: "no",
    async execute(interaction, gameId, senderId, guild, votingClientId){
        code.noVoteOwnStandardVote(gameId, votingClientId, senderId);
        await code.replyToInteraction(interaction, "Successfully placed vote!", true);
    },
    async retrieveAutocompletes(interaction, gameId, votingClientId){
        return code.autocompletesAllVoterIds(gameId, votingClientId, interaction.options.getFocused());
    }
}