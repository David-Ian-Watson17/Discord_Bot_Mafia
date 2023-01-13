const Discord = require('discord.js');
const code = require('../../code.js');
const {ConnectionTypes} = require('../../code/connectiontypes.js');

module.exports = {
    data: {
        name: "end",
        description: "End a connection.",
        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
        options: [
            {
                name: "standard",
                description: "End a started channel connection as a standard connection.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "connection",
                        description: "The connection you'd like to complete",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true,
                    },
                    {
                        name: "endchannel",
                        description: "The channel you'd like to complete it with.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.CHANNEL,
                        required: true,
                    }
                ]
            },
            {
                name: "anonymous",
                description: "End a started channel connection as an anonymous connection.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "connection",
                        description: "The connection you'd like to complete",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true,
                    },
                    {
                        name: "endchannel",
                        description: "The channel you'd like to complete it with.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.CHANNEL,
                        required: true,
                    },
                    {
                        name: "username",
                        description: "The username this connection sends messages under. Leave blank for ???",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: false,
                    },
                    {
                        name: "avatar",
                        description: "The avatar this connection sends messages under. Leave blank for ?",
                        type: Discord.Constants.ApplicationCommandOptionTypes.ATTACHMENT,
                        required: false,
                    }
                ]
            },
            {
                name: "signal",
                description: "End a started channel connection as a signal connection.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "connection",
                        description: "The connection you'd like to complete.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true,
                    },
                    {
                        name: "endchannel",
                        description: "The channel you'd like to complete it with.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.CHANNEL,
                        required: true,
                    },
                    {
                        name: "signal",
                        description: "The signal. #### will be replaced by user mentions. Leave blank for ####",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: false,
                    }
                ]
            },
            {
                name: "user",
                description: "End a started user connection as a user connection.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "connection",
                        description: "The connection you'd like to complete.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true,
                    },
                    {
                        name: "endchannel",
                        description: "The channel you'd like to complete it with.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                    }
                ]
            }
        ]
    },
    securitylevel: "admin",
    serverreliance: "server",
    async execute(interaction, gameId, senderId, guild){
        var connectionId = interaction.options.get("connection");
        switch(interaction.options.getSubcommand()){
            case "standard":
                var endChannel = interaction.options.getChannel("endchannel");
                code.completeStandardConnection(gameId, connectionId, endChannel);
                await code.replyToInteraction(interaction, "Successfully completed standard connection!");
                break;
            case "anonymous":
                var endChannel = interaction.options.getChannel("endchannel");
                var username = interaction.options.getString("username");
                var avatar = interaction.options.getAttachment("avatar");
                if(avatar) avatar = avatar.url;
                await code.completeAnonymousConnection(gameId, connectionId, endChannel, username, avatar);
                await code.replyToInteraction(interaction, "Successfully completed anonymous connection!");
                break;
            case "signal":
                var endChannel = interaction.options.getChannel("endchannel");
                var signal = interaction.options.getString("signal");
                code.completeSignalConnection(gameId, connectionId, endChannel, signal);
                await code.replyToInteraction(interaction, "Successfully completed signal connection!");
                break;
            case "user":
                var endChannel = interaction.options.getChannel("endchannel");
                code.completeUserConnection(gameId, connectionId, endChannel);
                await code.replyToInteraction(interaction, "Successfully completed user connection!");
                break;
        }
    },
    async retrieveAutocompletes(interaction, gameId){
        switch(interaction.options.getSubcommand()){
            case "user":
                return code.autocompletesSpecificTypeForAdmin(gameId, interaction.user.id, ConnectionTypes.PARTIAL_USER);
            default:
                return code.autocompletesSpecificTypeForAdmin(gameId, interaction.user.id, ConnectionTypes.PARTIAL_CHANNEL);
        }
    }
}