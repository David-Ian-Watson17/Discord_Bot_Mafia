const Discord = require('discord.js');
const code = require('../code.js');
const {VoterTypes} = require('../code/Constants.js');
const {err} = require('../code/VotingError.js');

module.exports = {
    data: {
        name: "vote",
        description: "Place your vote!",
        options: [
            {
                name: "target",
                description: "The target you'd like to vote for.",
                type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                required: true,
                autocomplete: true
            }
        ]
    },
    securitylevel: "none",
    serverreliance: "server",
    votingclientidreliance: "channel",
    specificvotingclients: "no",
    async execute(interaction, gameId, senderId, guild, votingClientId){
        var targetId = interaction.options.getString("target");
        code.placeOwnStandardVote(gameId, votingClientId, senderId, targetId);
        await code.replyToInteraction(interaction, "Successfully placed vote!");
    },
    async retrieveAutocompletes(interaction, gameId, votingClientId){
        return code.autocompletesAllVoterIds(gameId, votingClientId, interaction.options.getFocused());
    }
}