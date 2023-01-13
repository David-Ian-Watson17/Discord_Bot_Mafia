const Discord = require('discord.js');
const code = require('../code.js');
const chatroomCode = require('../../chatrooms/code.js');
const {VoterTypes} = require('../code/Constants.js');
const {VotingError, err} = require('../code/VotingError.js');

module.exports = {
    data: {
        name: "voters",
        description: "(Admin) Commands related to voters.",
        options: [
            {
                name: "list",
                description: "(Admin) List all voters.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "private",
                        description: "Only show the list to yourself. Defaults to true.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.BOOLEAN,
                        required: false
                    }
                ]
            },
            {
                name: "voterprofile",
                description: "(Admin) Print a profile for a voter.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "voter",
                        description: "The voter",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true
                    }
                ]
            },
            {
                name: "settype",
                description: "(Admin) Set the voter type.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "votertype",
                        description: "The type of voters you want the voting system to use.",
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
                name: "votingroles",
                description: "(Admin) Commands related to voting roles.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
                options: [
                    {
                        name: "add",
                        description: "(Admin) Add a voting role to the system.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                        options: [
                            {
                                name: "role",
                                description: "The role you'd like to add.",
                                type: Discord.Constants.ApplicationCommandOptionTypes.ROLE,
                                required: true
                            }
                        ]
                    },
                    {
                        name: "remove",
                        description: "(Admin) Remove a voting role from the system.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                        options: [
                            {
                                name: "role",
                                description: "The role you'd like to remove.",
                                type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                                required: true,
                                autocomplete: true
                            }
                        ]
                    }
                ]
            },
            {
                name: "whitelistedusers",
                description: "(Admin) Commands related to whitelisted users.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
                options: [
                    {
                        name: "add",
                        description: "(Admin) Add a whitelisted user.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                        options: [
                            {
                                name: "user",
                                description: "The user you'd like to add as a whitelisted user.",
                                type: Discord.Constants.ApplicationCommandOptionTypes.USER,
                                required: true
                            }
                        ]
                    },
                    {
                        name: "remove",
                        description: "(Admin) Remove a whitelisted user.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                        options: [
                            {
                                name: "user",
                                description: "The user you'd like to remove as a whitelisted user.",
                                type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                                required: true,
                                autocomplete: true
                            }
                        ]
                    }
                ]
            },
            {
                name: "blacklistedusers",
                description: "(Admin) Commands related to blacklisted users.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
                options: [
                    {
                        name: "add",
                        description: "(Admin) Add a blacklisted user.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                        options: [
                            {
                                name: "user",
                                description: "The user you'd like to add as a blacklisted user.",
                                type: Discord.Constants.ApplicationCommandOptionTypes.USER,
                                required: true
                            }
                        ]
                    },
                    {
                        name: "remove",
                        description: "(Admin) Remove a blacklisted user.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                        options: [
                            {
                                name: "user",
                                description: "The user you'd like to remove as a blacklisted user.",
                                type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                                required: true
                            }
                        ]
                    }
                ]
            },
            {
                name: "chatroomsource",
                description: "(Admin) Commands related to the chatroom source.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
                options: [
                    {
                        name: "set",
                        description: "(Admin) Set the chatroom this system draws voter accounts from.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                        options: [
                            {
                                name: "chatroom",
                                description: "The chatroom you'd like to draw voter froms.",
                                type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                                required: true,
                                autocomplete: true
                            },
                            {
                                name: "importchannels",
                                description: "Would you like to import the chatroom's channels for users to vote in?",
                                type: Discord.Constants.ApplicationCommandOptionTypes.BOOLEAN,
                                required: false,
                            }
                        ]
                    }
                ]
            },
            {
                name: "blacklistedaccounts",
                description: "(Admin) Commands related to blacklisted accounts.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
                options: [
                    {
                        name: "add",
                        description: "(Admin) Add a blacklisted account.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                        options: [
                            {
                                name: "account",
                                description: "The account you'd like to blacklist.",
                                type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                                required: true,
                                autocomplete: true,
                            }
                        ]
                    },
                    {
                        name: "remove",
                        description: "(Admin) Remove a blacklisted account.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                        options: [
                            {
                                name: "account",
                                description: "The account you'd like to remove from the blacklist.",
                                type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                                required: true,
                                autocomplete: true,
                            }
                        ]
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
            case "votingroles":
                switch(interaction.options.getSubcommand()){
                    case "add":
                        var role = interaction.options.getRole("role");
                        code.addVotingRole(gameId, votingClientId, role);
                        await code.replyToInteraction(interaction, "Successfully added voting role!", true);
                        break;
                    case "remove":
                        var roleId = interaction.options.getString("role");
                        code.removeVotingRole(gameId, votingClientId, roleId);
                        await code.replyToInteraction(interaction, "Successfully removed voting role!", true);
                        break;
                }
                break;
            case "whitelistedusers":
                switch(interaction.options.getSubcommand()){
                    case "add":
                        var user = interaction.options.getUser("user");
                        code.addWhitelistedUser(gameId, votingClientId, user);
                        await code.replyToInteraction(interaction, "Successfully added user to whitelist!", true);
                        break;
                    case "remove":
                        var userId = interaction.options.getString("user");
                        code.removeWhitelistedUser(gameId, votingClientId, userId);
                        await code.replyToInteraction(interaction, "Successfully removed user from whitelist!", true);
                        break;
                }
                break;
            case "blacklistedusers":
                switch(interaction.options.getSubcommand()){
                    case "add":
                        var user = interaction.options.getUser("user");
                        code.addBlacklistedUser(gameId, votingClientId, user);
                        await code.replyToInteraction(interaction, "Successfully added user to blacklist!", true);
                        break;
                    case "remove":
                        var userId = interaction.options.getString("user");
                        code.removeBlacklistedUser(gameId, votingClientId, userId);
                        await code.replyToInteraction(interaction, "Successfully removed user from blacklist!", true);
                        break;
                }
                break;
            case "chatroomsource":
                switch(interaction.options.getSubcommand()){
                    case "set":
                        var chatroomId = interaction.options.getString("chatroom");
                        var importchannels = interaction.options.getBoolean("importchannels");

                        //try setting the chatroom source
                        try{
                            code.setChatroomSource(gameId, votingClientId, chatroomId);
                            await code.replyToInteraction(interaction, "Successfully set the chatroom source for this voting system!", true);
                        }catch(error){

                            //if it failed for a reason other than the chatroom being there, pass the error on
                            if(!(error instanceof VotingError) || !(error.votingerrorcode == err.VOTER_SOURCE_ALREADY_PRESENT)){
                                throw error;
                            }

                            //but if it failed because the chatroom was already a source, report that and move on to see if the channels are being imported
                            await code.replyToInteraction(interaction, "Chatroom is already a part of the voting system.", true);
                        }

                        //if the admin requested channels to be imported
                        if(importchannels){

                            //import the channels and retrieve all channels that weren't successfully made voting channels
                            var failedchannels = code.importChannelsFromChatroomSource(gameId, votingClientId);

                            //if there are no failed channels, report total success
                            if(failedchannels.length == 0){
                                await code.replyToInteraction(interaction, "Successfully imported all channels!", true);
                            }

                            //otherwise, report all channels that failed to import
                            else{
                                var responsestring = "Failed to import: ";
                                failedchannels.forEach(channelId => {
                                    if(failedchannels.indexOf(channelId) == (failedchannels.length - 1)){
                                        responsestring += `<#${channelId}>`;
                                    }
                                    else{
                                        responsestring += `<#${channelId}>, `;
                                    }
                                });
                                await code.replyToInteraction(interaction, responsestring, true);
                            }
                        }
                        break;
                }
                break;
            case "blacklistedaccounts":
                switch(interaction.options.getSubcommand()){
                    case "add":
                        var accountId = interaction.options.getString("account");
                        code.addBlacklistedAccount(gameId, votingClientId, accountId);
                        await code.replyToInteraction(interaction, "Successfully added account to blacklist!");
                        break;
                    case "remove":
                        var accountId = interaction.options.getString("account");
                        code.removeBlacklistedAccount(gameId, votingClientId, accountId);
                        await code.replyToInteraction(interaction, "Successfully removed account from blacklist!");
                        break;
                }
                break;
            default:
                switch(interaction.options.getSubcommand()){
                    case "list":
                        var private = interaction.options.getBoolean("private");
                        var voterstrings = code.retrieveVoterStrings(gameId, votingClientId);
                        var responsestring = "";
                        if(voterstrings.length == 0){
                            responsestring = "There are no voters in this system yet.";
                        }
                        else{
                            responsestring = "__Voters__";
                            voterstrings.forEach(voterstring => {
                                responsestring += `\n${voterstring}`;
                            });
                        }
                        if(!(private == undefined)) await code.replyToInteraction(interaction, responsestring, private);
                        else await code.replyToInteraction(interaction, responsestring);
                        break;
                    case "settype":
                        var votertype = interaction.options.getString("votertype");
                        code.setVoterType(gameId, votingClientId, votertype);
                        await code.replyToInteraction(interaction, "Successfully changed voter type!");
                        break;
                    case "voterprofile":
                        var voterId = interaction.options.getString("voter");
                        var profileembed = code.retrieveVoterProfile(gameId, votingClientId, voterId);
                        if(!profileembed){
                            await code.replyToInteraction(interaction, "Could not find that voter.", true);
                            return;
                        }
                        await interaction.reply({embeds: [profileembed], ephemeral: true});
                        break;
                }
        }
    },
    async retrieveAutocompletes(interaction, gameId, votingClientId){

        //retrieve the focusedvalue
        var focusedvalue = interaction.options.getFocused();

        //if we're retrieving the client id
        if(interaction.options.getFocused(true).name == "votingsystemname"){
            
            //retrieve what kind of sub command we're using
            switch(interaction.options.getSubcommand()){
                case "list":
                    return code.autocompletesAllVotingSystemIds(gameId, interaction.user.id, focusedvalue);
                case "settype":
                    return code.autocompletesAllVotingSystemIds(gameId, interaction.user.id, focusedvalue);
                case "voterprofile":
                    return code.autocompletesAllVotingSystemIds(gameId, interaction.user.id, focusedvalue);
                default:
                    switch(interaction.options.getSubcommandGroup(false)){
                        case "votingroles":
                            return code.autocompletesVotingSystemIdsByVoterType(gameId, interaction.user.id, VoterTypes.DISCORD_USER, interaction.options.getFocused());
                        case "whitelistedusers":
                            return code.autocompletesVotingSystemIdsByVoterType(gameId, interaction.user.id, VoterTypes.DISCORD_USER, interaction.options.getFocused());
                        case "blacklistedusers":
                            return code.autocompletesVotingSystemIdsByVoterType(gameId, interaction.user.id, VoterTypes.DISCORD_USER, interaction.options.getFocused());
                        case "chatroomsource":
                            return code.autocompletesVotingSystemIdsByVoterType(gameId, interaction.user.id, VoterTypes.CHATROOM_ACCOUNT, interaction.options.getFocused());
                        case "blacklistedaccounts":
                            return code.autocompletesVotingSystemIdsByVoterType(gameId, interaction.user.id, VoterTypes.CHATROOM_ACCOUNT, interaction.options.getFocused());
                        default:
                            return [];
                    }
                
            }
        }

        //otherwise, retrieving autocompletes for command options
        switch(interaction.options.getSubcommandGroup(false)){
            case "votingroles":
                return code.autocompletesVotingRoles(gameId, votingClientId, interaction.user.id, focusedvalue);
            case "whitelistedusers":
                return code.autocompletesWhitelistedUsers(gameId, votingClientId, interaction.user.id, focusedvalue);
            case "blacklistedusers":
                return code.autocompletesBlacklistedUsers(gameId, votingClientId, interaction.user.id, focusedvalue);
            case "chatroomsource":
                if(interaction.options.getSubcommand() == "set"){
                    return chatroomCode.adminAutocompletesAllChatrooms(gameId, interaction.user.id, focusedvalue);
                }
                return code.autocompletesChatroomSource(gameId, votingClientId, interaction.user.id, focusedvalue);
            case "blacklistedaccounts":
                if(interaction.options.getSubcommand() == "add"){
                    var chatroomId = code.getChatroomSourceId(gameId, votingClientId);
                    if(!chatroomId) return [];
                    return chatroomCode.adminAutocompletesRegisteredAccounts(gameId, chatroomId, interaction.user.id, focusedvalue);
                }
                return code.autocompletesBlacklistedAccounts(gameId, votingClientId, interaction.user.id, focusedvalue);
            default:
                switch(interaction.options.getSubcommand()){
                    case "voterprofile":
                        return code.autocompletesAllVoterIds(gameId, votingClientId, focusedvalue);
                    default:
                        return [];
                }
        }


    }
}