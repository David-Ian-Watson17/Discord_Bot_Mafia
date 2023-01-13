const Discord = require('discord.js');
const code = require('../../code.js');
const channeltypes = require('../../code/channeltypes.js').channeltypes;

module.exports = {
    data: {
        name: "create",
        description: "Create a connection.",
        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
        options: [
            {
                name: "standard",
                description: "Standard Connection: Sends messages under original username and profile.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "startchannel",
                        description: "The channel to send all messages from.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.CHANNEL,
                        required: true,
                        channelTypes: channeltypes
                    },
                    {
                        name: "endchannel",
                        description: "The channel to send messages to.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.CHANNEL,
                        required: true,
                        channelTypes: channeltypes
                    }
                ]
            },
            {
                name: "anonymous",
                description: "Anonymous Connection: Sends messages under prescribed username and avatar.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "startchannel",
                        description: "The channel to send all messages from.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.CHANNEL,
                        required: true,
                        channelTypes: channeltypes
                    },
                    {
                        name: "endchannel",
                        description: "The channel to send messages to.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.CHANNEL,
                        required: true,
                        channelTypes: channeltypes,
                    },
                    {
                        name: "username",
                        description: "The username, defaults to '???'",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: false
                    },
                    {
                        name: "avatar",
                        description: "The avatar, defaults to a picture of a question mark.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.ATTACHMENT,
                        required: false
                    }
                ]
            },
            {
                name: "signal",
                description: "Signal Connection: Send a pre-defined signal with /signal.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "startchannel",
                        description: "The channel to send the signal from.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.CHANNEL,
                        required: true,
                        channelTypes: channeltypes
                    },
                    {
                        name: "endchannel",
                        description: "The channel to send the signal to.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.CHANNEL,
                        required: true,
                        channelTypes: channeltypes
                    },
                    {
                        name: "signal",
                        description: "The signal. #### will be filled in by whoever is pinged. Defaults ####.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: false
                    }
                ]
            },
            {
                name: "user",
                description: "User Connection: Send all messages sent in a game by a user to a channel.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "user",
                        description: "The user you'd like to capture all messages by.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.USER,
                        required: true
                    },
                    {
                        name: "channel",
                        description: "The channel you'd like to send all messages to.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.CHANNEL,
                        required: true,
                        channelTypes: channeltypes
                    }
                ]
            }
        ]
    },
    securitylevel: "admin",
    serverreliance: "server",
    async execute(interaction, gameId, senderId, guild){
        var subCommand = interaction.options.getSubcommand();
        switch(subCommand){
            case "standard":
                var startChannel = interaction.options.getChannel("startchannel");
                var endChannel = interaction.options.getChannel("endchannel");
                code.createStandardConnection(gameId, startChannel, endChannel);
                await code.replyToInteraction(interaction, "Successfully created connection!");
                break;
            case "anonymous":
                var startChannel = interaction.options.getChannel("startchannel");
                var endChannel = interaction.options.getChannel("endchannel");
                var username = interaction.options.getString("username");
                var rawavatar = interaction.options.getAttachment("avatar");
                console.log(username);
                var avatar = undefined;
                if(rawavatar){
                    avatar = rawavatar.url;
                }
                await code.createAnonymousConnection(gameId, startChannel, endChannel, username, avatar);
                await code.replyToInteraction(interaction, "Successfully created connection!");
                break;
            case "signal":
                var startChannel = interaction.options.getChannel("startchannel");
                var endChannel = interaction.options.getChannel("endchannel");
                var signal = interaction.options.getString("signal");
                if(!signal) signal = "####";
                code.createSignalConnection(gameId, startChannel, endChannel, signal)
                await code.replyToInteraction(interaction, "Successfully created connection!");
                break;
            case "user":
                var user = interaction.options.getUser("user");
                var channel = interaction.options.getChannel("channel");
                code.createUserConnection(gameId, user, channel);
                await code.replyToInteraction(interaction, "Successfully created connection!");
                break;
            default:
        }
    },
    async retrieveAutocompletes(interaction, gameId){

    }
}