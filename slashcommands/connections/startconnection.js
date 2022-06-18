const Discord = require('discord.js');
const conn = require('../../code/connections.js');
const err = require('../../universal_data/errorcodes.json');

module.exports = {
    data: {
        name: "startconnection",
        description: "(Host Required) Start a connection that you can complete with /endconnection.",
        options: [
            {
                name: "standard",
                description: "(Host Required) Start a standard connection that you can complete with /endconnection.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "start_channel",
                        description: "The channel you'd like to start the connection from.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.CHANNEL,
                        required: true
                    }
                ]
            },
            {
                name: "anonymous",
                description: "(Host Required) Start an anonymous connection that you can complete with /endconnection.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "start_channel",
                        description: "The channel you'd like to start the connection from.",
                        required: true,
                        type: Discord.Constants.ApplicationCommandOptionTypes.CHANNEL
                    },
                    {
                        name: "username",
                        description: "The username you'd like messages to be sent under. Leave blank for '???'",
                        required: false,
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING
                    },
                    {
                        name: "avatar",
                        description: "The avatar you'd like messages to be sent under. Leave empty for ? symbol",
                        required: false,
                        type: 11 //attachment
                    }
                ]
            },
            {
                name: "signal",
                description: "(Host Required) Start a signal connection that you can complete with /endconnection.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "start_channel",
                        description: "The channel you'd like to start the connection from.",
                        required: true,
                        type: Discord.Constants.ApplicationCommandOptionTypes.CHANNEL
                    },
                    {
                        name: "signal",
                        description: "The signal sent on /signal. '####' represents the user mentioned. '####' default.",
                        required: false,
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING
                    }
                ]
            }
        ]
    },
    serverreliance: "server",
    securitylevel: "host",
    async execute(gameId, interaction){
        var subcommand = interaction.options.getSubcommand(false);
        var startChannel = interaction.options.getChannel('start_channel');
        var returncode;
        switch(subcommand){
            case "standard":
                returncode = conn.connectionHandler[`${gameId}`].startStandardConnection(startChannel.id, interaction.user.id);
                break;
            case "anonymous":
                var username = interaction.options.getString('username');
                var avatar = interaction.options.getAttachment('avatar');
                if(avatar) avatar = avatar.url;
                returncode = conn.connectionHandler[`${gameId}`].startAnonymousConnection(startChannel.id, interaction.user.id, username, avatar);
                break;
            case "signal":
                var signal = interaction.options.getString('signal');
                returncode = conn.connectionHandler[`${gameId}`].startSignalConnection(startChannel.id, interaction.user.id, signal);
                break;
            default:
                interaction.reply({content: "Such power! That should have been IMPOSSIBLE!", ephemeral: true}).catch(console.error);
                returncode = err.GOOD_EXECUTE;
        }
        return returncode;
    }
}