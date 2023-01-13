const Discord = require('discord.js');
const code = require('../code.js');
const {VoterTypes} = require('../code/Constants.js');
const {err} = require('../code/VotingError.js');

module.exports = {
    data: {
        name: "removevote",
        description: "Remove your vote."
    },
    securitylevel: "none",
    serverreliance: "server",
    votingclientidreliance: "channel",
    specificvotingclients: "no",
    async execute(interaction, gameId, senderId, guild, votingClientId){
        code.removeOwnStandardVote(gameId, votingClientId, senderId);
        await code.replyToInteraction(interaction, "Successfully removed vote!", true);
    },
    async retrieveAutocompletes(interaction, gameId, votingClientId){
        return code.autocompletesAllVoterIds(gameId, votingClientId, interaction.options.getFocused());
    }
}