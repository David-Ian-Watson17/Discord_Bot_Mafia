const Discord = require('discord.js');
const code = require('../code.js');
const {VoterTypes} = require('../code/Constants.js');
const {err, VotingError} = require('../code/VotingError.js');

module.exports = {
    data: {
        name: "votechannels",
        description: "(Admin) Commands related to the channels used by a voting system.",
        options: [
            {
                name: "add",
                description: "(Admin) Add a channel as a voting or update channel.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "channel",
                        description: "The channel you'd like to add.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.CHANNEL,
                        required: true
                    },
                    {
                        name: "roles",
                        description: "Is it for accepting votes or posting updates?",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        choices: [
                            {name: "Voting Only", value: "voting"},
                            {name: "Updates Only", value: "updates"},
                            {name: "Both Voting and Updates", value: "both"}
                        ]
                    }
                ]
            },
            {
                name: "edit",
                description: "(Admin) Edit what roles a channel has in a system.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "channel",
                        description: "The channel you'd like to edit.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true,
                    },
                    {
                        name: "roles",
                        description: "The roles you'd like the channel to have.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        choices: [
                            {name: "Voting Only", value: "voting"},
                            {name: "Updates Only", value: "updates"},
                            {name: "Both", value: "both"}
                        ]
                    }
                ]
            },
            {
                name: "remove",
                description: "(Admin) Remove a channel from a voting system entirely.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "channel",
                        description: "(Admin) The channel you'd like to remove.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true
                    }
                ]
            },
            {
                name: "import",
                description: "(Admin) Using a chatroom as your voter source? Use its channels for voting.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND
            },
            {
                name: "list",
                description: "(Admin) List all vote channels and their roles.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND
            }
        ]
    },
    securitylevel: "admin",
    serverreliance: "server",
    votingclientidreliance: "name",
    specificvotingclients: "yes",
    async execute(interaction, gameId, senderId, guild, votingClientId){
        switch(interaction.options.getSubcommand()){
            case "add":
                //retrieve channel and modifier
                var channel = interaction.options.getChannel("channel");
                var modifier = interaction.options.getString("roles");

                //add based on modifier
                switch(modifier){
                    case "voting":
                        code.addVotingChannel(gameId, votingClientId, channel);
                        await code.replyToInteraction(interaction, `Successfully added <#${channel.id}> as a voting channel.`);
                        break;
                    case "updates":
                        code.addUpdateChannel(gameId, votingClientId, channel);
                        await code.replyToInteraction(interaction, `Successfully added <#${channel.id}> as an update channel.`);
                        break;
                    case "both":
                        try{
                            code.addUpdateChannel(gameId, votingClientId, channel);
                            await code.replyToInteraction(interaction, `Successfully added <#${channel.id}> as an update channel.`);
                        }catch(error){ await code.replyToInteractionBasedOnReturnCode(interaction, error); }
                        try{
                            code.addVotingChannel(gameId, votingClientId, channel);
                            await code.replyToInteraction(interaction, `Successfully added <#${channel.id}> as a voting channel.`);
                        }catch(error){ await code.replyToInteractionBasedOnReturnCode(interaction, error); }
                        break;
                }
                break;
            case "edit":
                //retrieve id for channel and update modifier
                var channelId = interaction.options.getString("channel");
                var modifier = interaction.options.getString("roles");

                //retrieve channel
                var channel = interaction.client.channels.cache.get(channelId);

                //variable to make sure something is sent in reply
                var changemade = false;

                //modify roles based on user input
                switch(modifier){
                    case "voting":

                        //try to remove as an update channel, if failed, only report if it was for a reason other than not being an update channel
                        try{
                            code.removeUpdateChannel(gameId, votingClientId, channelId);
                            changemade = true;
                            await code.replyToInteraction(interaction, `<#${channelId}> will no longer send updates.`, true);
                        }catch(error){
                            if(!(error instanceof VotingError) || !(error.votingerrorcode == err.CHANNEL_NOT_UPDATE_CHANNEL.code)) await code.replyToInteractionBasedOnReturnCode(interaction, error);
                        }

                        //try to add as a voting channel, if failed, only report if it was for a reason other than already being a voting channel
                        try{
                            code.addVotingChannel(gameId, votingClientId, channel);
                            changemade = true;
                            await code.replyToInteraction(interaction, `<#${channelId}> will now receive votes.`, true);
                        }catch(error){
                            if(!(error instanceof VotingError) || !(error.votingerrorcode == err.CHANNEL_ALREADY_VOTING_CHANNEL.code)) await code.replyToInteractionBasedOnReturnCode(interaction, error);
                        }
                        break;
                    case "updates":

                        //try to remove as voting channel, if failed only report if it was for a reason other than not being a voting channel
                        try{
                            code.removeVotingChannel(gameId, votingClientId, channelId);
                            changemade = true;
                            await code.replyToInteraction(interaction, `<#${channelId}> will no longer receive votes.`, true);
                        }catch(error){
                            if(!(error instanceof VotingError) || !(error.votingerrorcode == err.CHANNEL_NOT_VOTING_CHANNEL.code)) await code.replyToInteractionBasedOnReturnCode(interaction, error);
                        }

                        //try to add as an update channel, if failed, only report if it was for a reason other than already being an update channel
                        try{
                            code.addUpdateChannel(gameId, votingClientId, channel);
                            changemade = true;
                            await code.replyToInteraction(interaction, `<#${channelId}> will now send updates.`, true);
                        }catch(error){
                            if(!(error instanceof VotingError) || !(error.votingerrorcode == err.CHANNEL_ALREADY_UPDATE_CHANNEL.code)) await code.replyToInteractionBasedOnReturnCode(interaction, error); 
                        }
                        break;
                    case "both":

                        //try to add as update channel, if failed, only report if it was for a reason other than already being an update channel
                        try{
                            code.addUpdateChannel(gameId, votingClientId, channel);
                            changemade = true;
                            await code.replyToInteraction(interaction, `<#${channelId}> will now send updates.`, true);
                        }catch(error){
                            if(!(error instanceof VotingError) || !(error.votingerrorcode == err.CHANNEL_ALREADY_UPDATE_CHANNEL.code)) await code.replyToInteractionBasedOnReturnCode(interaction, error);
                        }

                        //try to add as voting channel, if failed, only report if it was for a reason other than already being a voting channel
                        try{
                            code.addVotingChannel(gameId, votingClientId, channel);
                            changemade = true;
                            await code.replyToInteraction(interaction, `<#${channelId}> will now receive votes.`, true);
                        }catch(error){
                            if(!(error instanceof VotingError) || !(error.votingerrorcode == err.CHANNEL_ALREADY_VOTING_CHANNEL.code)) await code.replyToInteractionBasedOnReturnCode(interaction, error); 
                        }
                        break;
                }

                //if there wasn't a change made, report
                if(!changemade) await code.replyToInteraction(interaction, "The channel is already set to perform those roles!", true);
                break;
            case "remove":
                var channelId = interaction.options.getString("channel");
                code.removeChannel(gameId, votingClientId, channelId);
                await code.replyToInteraction(interaction, `Successfully removed <#${channelId}> from the voting system!`);
                break;
            case "import":
                var failedchannels = code.importChannelsFromChatroomSource(gameId, votingClientId);
                if(failedchannels.length == 0){
                    await code.replyToInteraction(interaction, "Successfully imported all channels from chatroom!", true);
                }
                else{
                    var replystring = "Failed to import channels:";
                    failedchannels.forEach(channelId => {
                        if(failedchannels.indexOf(channelId) == (failedchannels.length - 1)){
                            replystring += ` <#${channelId}>`;
                        }
                        else{
                            replystring += ` <#${channelId}>,`;
                        }
                    });
                    await code.replyToInteraction(interaction, replystring, true);
                }
                break;
        }
    },
    async retrieveAutocompletes(interaction, gameId, votingClientId){
        
        //if the request is for the voting system name
        if(interaction.options.getFocused(true).name == "votingsystemname"){
            switch(interaction.options.getSubcommand()){
                case "import":
                    return code.autocompletesVotingSystemIdsByVoterType(gameId, interaction.user.id, VoterTypes.CHATROOM_ACCOUNT, interaction.options.getFocused());
                default:
                    return code.autocompletesAllVotingSystemIds(gameId, interaction.user.id, interaction.options.getFocused());
            }
        }

        //otherwise
        return code.autocompletesAllChannels(gameId, votingClientId, interaction.user.id, interaction.options.getFocused());
    }
}