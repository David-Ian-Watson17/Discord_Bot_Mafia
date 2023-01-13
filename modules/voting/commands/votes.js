const Discord = require('discord.js');
const code = require('../code.js');
const {VoterTypes} = require('../code/Constants.js');
const {err} = require('../code/VotingError.js');

module.exports = {
    data: {
        name: "votes",
        description: "(Admin) Commands related to votes and their modifiers.",
        options: [
            {
                name: "give",
                description: "(Admin) Give a voter a special vote.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "voter",
                        description: "The voter",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true
                    },
                    {
                        name: "name",
                        description: "The name of the special vote.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true
                    }
                ]
            },
            {
                name: "take",
                description: "(Admin) Take a special vote away from a voter.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "voter",
                        description: "The voter",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true,
                    },
                    {
                        name: "vote",
                        description: "The vote you'd like to take away.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true,
                    }
                ]
            },
            {
                name: "modify",
                description: "(Admin) Modify a voter's standard or special vote.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "voter",
                        description: "The voter",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true,
                    },
                    {
                        name: "vote",
                        description: "The vote you'd like to modify",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true,
                    }
                ]
            }
        ]
    },
    securitylevel: "admin",
    serverreliance: "server",
    votingclientidreliance: "name",
    specificvotingclients: "no",
    async execute(interaction, gameId, senderId, guild, votingClientId){
        switch(interaction.options.getSubcommand()){
            case "give":

                //retrieve voter
                var voterId = interaction.options.getString("voter");
                var name = interaction.options.getString("name");

                //give special vote
                var returncode = code.giveSpecialVote(gameId, votingClientId, voterId, name);
                
                //print returncode
                await code.replyToInteractionBasedOnReturnCode(interaction, returncode);
                break;
            case "take":

                //retrieve voter and vote
                var voterId = interaction.options.getString("voter");
                var voteId = interaction.options.getString("vote");

                //take vote
                var returncode = code.takeSpecialVote(gameId, votingClientId, voterId, voteId);

                //print returncode
                await code.replyToInteractionBasedOnReturnCode(interaction, returncode);
                break;
            case "modify":
                
                //print nonexistence
                await code.replyToInteraction(interaction, "Feature not implemented yet.", true);
                break;
        }
    },
    async retrieveAutocompletes(interaction, gameId, votingClientId){

        //retrieve the current value of the focused option
        var focusedvalue = interaction.options.getFocused();

        //based on the subcommand
        switch(interaction.options.getSubcommand()){
            case "give":
                return code.autocompletesAllVoterIds(gameId, votingClientId, focusedvalue);
            case "take":
                if(interaction.options.getFocused(true).name == "voter"){
                    return code.autocompletesAllVoterIdsWithSpecialVotes(gameId, votingClientId, interaction.user.id, focusedvalue);
                }
                else{
                    return code.autocompletesAllSpecialVoteIdsForVoter(gameId, votingClientId, interaction.options.getString("voter"), interaction.user.id, focusedvalue);
                }
            case "modify":
                if(interaction.options.getFocused(true).name == "voter"){
                    return code.autocompletesAllVoterIds(gameId, votingClientId, focusedvalue);
                }
                else{
                    return code.autocompletesAllVoteIdsForVoter(gameId, votingClientId, interaction.options.getString("voter"), focusedvalue);
                }
        }
    }
}