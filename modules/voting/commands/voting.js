const Discord = require('discord.js');
const code = require('../code.js');
const {VoterTypes, VoteEndCheckerTypes} = require('../code/Constants.js');
const {err} = require('../code/VotingError.js');

module.exports = {
    data: {
        name: "voting",
        description: "(Admin) Commands related to active voting.",
        options: [
            {
                name: "start",
                description: "(Admin) Start a vote.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
                options: [
                    {
                        name: "majority",
                        description: "(Admin) Start a majority vote.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                        options: [
                            {
                                name: "majority",
                                description: "The majority. Leave blank for it to be calculated automatically.",
                                type: Discord.Constants.ApplicationCommandOptionTypes.INTEGER,
                                required: false,
                            }
                        ]
                    },
                    {
                        name: "plurality",
                        description: "(Admin) Start a plurality vote.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                        options: [
                            {
                                name: "winners",
                                description: "The number of winners for the vote.",
                                type: Discord.Constants.ApplicationCommandOptionTypes.INTEGER,
                                required: true,
                            }
                        ]
                    }
                ]
            },
            {
                name: "end",
                description: "(Admin) Have the voting system choose its winners immediately.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            },
            {
                name: "hammer",
                description: "(Admin) Choose winners for a vote manually. Fill no fields for no winner.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "winner",
                        description: "The winner of the vote.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: false,
                        autocomplete: true,
                    },
                    {
                        name: "winner2",
                        description: "The winner of the vote.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: false,
                        autocomplete: true,
                    },
                    {
                        name: "winner3",
                        description: "The winner of the vote.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: false,
                        autocomplete: true,
                    },
                    {
                        name: "winner4",
                        description: "The winner of the vote.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: false,
                        autocomplete: true,
                    },
                    {
                        name: "winner5",
                        description: "The winner of the vote.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: false,
                        autocomplete: true,
                    },
                    {
                        name: "winner6",
                        description: "The winner of the vote.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: false,
                        autocomplete: true,
                    }
                ]
            },
            {
                name: "reset",
                description: "(Admin) Reset a vote.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            },
            {
                name: "cancel",
                description: "(Admin) Reset a vote.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            },
            {
                name: "pause",
                description: "(Admin) Pause a vote.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            },
            {
                name: "resume",
                description: "(Admin) Resume a paused vote.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            },
            {
                name: "majority",
                description: "(Admin) Commands related to running majority votes.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
                options: [
                    {
                        name: "change",
                        description: "(Admin) Change the majority of a vote manually.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                        options: [
                            {
                                name: "majority",
                                description: "The new majority",
                                type: Discord.Constants.ApplicationCommandOptionTypes.INTEGER,
                                required: true,
                            }
                        ]
                    }
                ]
            },
            {
                name: "plurality",
                description: "(Admin) Commands related to running plurality votes.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
                options: [
                    {
                        name: "change",
                        description: "(Admin) Change the plurality of a vote.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                        options: [
                            {
                                name: "winners",
                                description: "The number of winners.",
                                type: Discord.Constants.ApplicationCommandOptionTypes.INTEGER,
                                required: true,
                            }
                        ]
                    }
                ]
            },
            {
                name: "fullvotecount",
                description: "(Admin) Print the full vote count, without hidden information.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "public",
                        description: "Should this be printed publicly in this channel? Defaults to false.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.BOOLEAN,
                        required: false,
                    }
                ]
            }
        ]
    },
    securitylevel: "admin",
    serverreliance: "server",
    votingclientidreliance: "name",
    specificvotingclients: "yes",
    async execute(interaction, gameId, senderId, guild, votingClientId){
        switch(interaction.options.getSubcommandGroup(false)){
            case "start":
                switch(interaction.options.getSubcommand()){
                    case "majority":
                        var majority = interaction.options.getInteger("majority");
                        code.startMajorityVote(gameId, votingClientId, majority);
                        await code.replyToInteraction(interaction, "Started a majority vote!");
                        break;
                    case "plurality":
                        var plurality = interaction.options.getInteger("winners");
                        code.startPluralityVote(gameId, votingClientId, plurality);
                        await code.replyToInteraction(interaction, "Started a plurality vote!");
                        break;
                }
                break;
            case "majority":
                switch(interaction.options.getSubcommand()){
                    case "change":
                        var majority = interaction.options.getInteger("majority");
                        code.changeMajority(gameId, votingClientId, majority);
                        await code.replyToInteraction(interaction, "Successfully changed majority!");
                        break;
                }
                break;
            case "plurality":
                switch(interaction.options.getSubcommand()){
                    case "change":
                        var plurality = interaction.options.getInteger("winners");
                        code.changePlurality(gameId, votingClientId, plurality);
                        await code.replyToInteraction(interaction, "Successfully changed plurality!");
                        break;
                }
                break;
            default:
                switch(interaction.options.getSubcommand()){
                    case "end":
                        code.endVote(gameId, votingClientId);
                        await code.replyToInteraction(interaction, "Successfully ended the vote!");
                        break;
                    case "hammer":
                        var winnerIds = [];
                        var winner1 = interaction.options.getString("winner");
                        var winner2 = interaction.options.getString("winner2");
                        var winner3 = interaction.options.getString("winner3");
                        var winner4 = interaction.options.getString("winner4");
                        var winner5 = interaction.options.getString("winner5");
                        var winner6 = interaction.options.getString("winner6");
                        if(!winner1){
                            winnerIds.push(null);
                        }
                        else{
                            winnerIds.push(winner1);
                            if(winner2) winnerIds.push(winner2);
                            if(winner3) winnerIds.push(winner3);
                            if(winner4) winnerIds.push(winner4);
                            if(winner5) winnerIds.push(winner5);
                            if(winner6) winnerIds.push(winner6);
                        }
                        code.hammerVote(gameId, votingClientId, winnerIds);
                        await code.replyToInteraction(interaction, "Successfully ended vote!");
                        break;
                    case "reset":
                        code.resetVote(gameId, votingClientId);
                        await code.replyToInteraction(interaction, "Successfully reset votes!");
                        break;
                    case "cancel":
                        code.cancelVote(gameId, votingClientId);
                        await code.replyToInteraction(interaction, "Successfully canceled vote!");
                        break;
                    case "pause":
                        code.pauseVote(gameId, votingClientId);
                        await code.replyToInteraction(interaction, "Successfully paused vote!");
                        break;
                    case "resume":
                        code.resumeVote(gameId, votingClientId);
                        await code.replyToInteraction(interaction, "Successfully resumed vote!");
                        break;
                    case "fullvotecount":
                        var votecountstring = code.getFullVoteCount(gameId, votingClientId);
                        await code.replyToInteraction(interaction, votecountstring);
                        break;
                }
        }
    },
    async retrieveAutocompletes(interaction, gameId, votingClientId){
        if(interaction.options.getFocused(true).name){
            switch(interaction.options.getSubcommandGroup(false)){
                case "majority":
                    return code.autocompletesVotingSystemIdsByHandlerType(gameId, interaction.user.id, VoteEndCheckerTypes.MAJORITY, interaction.options.getFocused());
                case "plurality":
                    return code.autocompletesVotingSystemIdsByHandlerType(gameId, interaction.user.id, VoteEndCheckerTypes.PLURALITY, interaction.options.getFocused());
                default:
                    return code.autocompletesAllVotingSystemIds(gameId, interaction.user.id, interaction.options.getFocused())
            }
        }

        switch(interaction.options.getSubcommand()){
            case "hammer":
                return code.autocompletesAllVoterIds(gameId, votingClientId, interaction.options.getFocused());
                break;
        }
    }
}