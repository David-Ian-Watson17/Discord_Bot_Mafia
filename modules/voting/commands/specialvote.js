const Discord = require('discord.js');
const code = require('../code.js');
const {VoterTypes} = require('../code/Constants.js');
const {err} = require('../code/VotingError.js');

module.exports = {
    data: {
        name: "specialvote",
        description: "Commands related to the placement of your special votes.",
        options: [
            {
                name: "place",
                description: "Place a special vote you have access to.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "vote",
                        description: "The vote you'd like to place.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true
                    },
                    {
                        name: "target",
                        description: "Your target.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true
                    }
                ]
            },
            {
                name: "remove",
                description: "Remvoe a special vote you have access to.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "vote",
                        description: "The vote you'd like to remove.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true
                    }
                ]
            },
            {
                name: "novote",
                description: "Place a special vote you have access to on no one.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "vote",
                        description: "The vote you'd like to place.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true
                    }
                ]
            }
        ]
    },
    securitylevel: "none",
    serverreliance: "server",
    votingclientidreliance: "channel",
    specificvotingclients: "no",
    async execute(interaction, gameId, senderId, guild, votingClientId){
        switch(interaction.options.getSubcommand()){
            case "place":
                var voteId = interaction.options.getString("vote");
                var targetId = interaction.options.getString("target");
                code.placeOwnSpecialVote(gameId, votingClientId, senderId, voteId, targetId);
                await code.replyToInteraction(interaction, "Successfully placed vote!");
                break;
            case "remove":
                var voteId = interaction.options.getString("vote");
                code.removeOwnSpecialVote(gameId, votingClientId, senderId, voteId);
                await code.replyToInteraction(interaction, "Successfully removed vote!");
                break;
            case "novote":
                var voteId = interaction.options.getString("vote");
                code.noVoteOwnSpecialVote(gameId, votingClientId, senderId, voteId);
                await code.replyToInteraction(interaction, "Successfully placed vote!");
                break;
        }
    },
    async retrieveAutocompletes(interaction, gameId, votingClientId){
        var focusedvalue = interaction.options.getFocused();
        switch(interaction.options.getFocused(true).name){
            case "vote":
                return code.autocompletesAllSpecialVoteIdsForUser(gameId, votingClientId, interaction.user.id, focusedvalue);
            case "target":
                return code.autocompletesAllVoterIds(gameId, votingClientId, focusedvalue);
        }
    }
}