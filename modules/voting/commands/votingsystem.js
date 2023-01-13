const Discord = require('discord.js');
const code = require('../code.js');
const {VoterTypes} = require('../code/Constants.js');
const {err} = require('../code/VotingError.js');

module.exports = {
    data: {
        name: "votingsystem",
        description: "(Admin) Commands related to the larger voting system.",
        options: [
            {
                name: "create",
                description: "(Admin) Create a new voting system responsible for all parts of a vote.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "name",
                        description: "The name of the new voting system.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true
                    },
                    {
                        name: "votertype",
                        description: "The type of voters the new voting system will use.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        choices: [
                            {name: "discord users", value: VoterTypes.DISCORD_USER},
                            {name: "chatroom accounts", value: VoterTypes.CHATROOM_ACCOUNT}
                        ]
                    }
                ]
            },
            {
                name: "delete",
                description: "(Admin) Delete an existing voting system.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "votingsystemname",
                        description: "The name of the voting system you'd like to remove.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true
                    }
                ]
            },
            {
                name: "edit",
                description: "(Admin) Delete an existing voting system.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "votingsystemname",
                        description: "The name of the voting system you'd like to edit.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true
                    },
                    {
                        name: "newname",
                        description: "If you'd like to change the name, enter the new one here.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true
                    }
                ]
            }
        ]
    },
    securitylevel: "admin",
    serverreliance: "server",
    votingclientidreliance: "unnecessary",
    specificvotingclients: "no",
    async execute(interaction, gameId, senderId, guild, votingClientId){
        switch(interaction.options.getSubcommand()){
            case "create":
                var name = interaction.options.getString("name");
                var voterType = interaction.options.getString("votertype");

                console.log(name);
                console.log(voterType);

                //create the voting system
                code.createVotingSystem(gameId, name);

                //notify success
                await code.replyToInteraction(interaction, "Successfully created voting system!", true);

                //retrieve the client id
                votingClientId = code.getVotingClientIdByName(gameId, name);

                //set the voter type
                code.setVoterType(gameId, votingClientId, voterType);

                //report success
                await code.replyToInteraction(interaction, "Set the voter type.", true);
                break;
            case "delete":
                votingClientId = interaction.options.getString("votingsystemname");

                //delete the voting system
                code.deleteVotingSystem(gameId, votingClientId);

                //report success
                await code.replyToInteraction(interaction, "Successfully deleted voting system.");
                break;
            case "edit":
                votingClientId = interaction.options.getString("votingsystemname");
                var name = interaction.options.getString("newname");

                //if the name is to be changed
                if(name){

                    //change the name
                    code.changeVotingSystemName(gameId, votingClientId, name);
                    
                    //report success
                    await code.replyToInteraction(interaction, `Changed the name of the voting system to ${name}!`);
                }

                else{
                    await code.replyToInteraction(interaction, "Why would you waste my time like this?");
                }
                break;
            default:
                break;
        }
    },
    async retrieveAutocompletes(interaction, gameId, votingClientId){
        
    }
}