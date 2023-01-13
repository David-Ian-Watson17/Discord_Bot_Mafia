const Discord = require('discord.js');
const code = require('../../code.js');
const {ConnectionTypes} = require('../../code/connectiontypes.js');

module.exports = {
    data: {
        name: "edit",
        description: "Edit a connection.",
        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
        options: [
            {
                name: "anonymous",
                description: "Edit an anonymous connection.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "connection",
                        description: "The connection you'd like to modify.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true
                    },
                    {
                        name: "username",
                        description: "The new username. Leave blank to keep the old.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: false
                    },
                    {
                        name: "avatar",
                        description: "The new avatar. Leave blank to keep the old.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.ATTACHMENT,
                        required: false
                    }
                ]
            },
            {
                name: "signal",
                description: "Edit a signal connection.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "connection",
                        description: "The connection you'd like to modify.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true
                    },
                    {
                        name: "signal",
                        description: "The new signal.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true
                    }
                ]
            }
        ]
    },
    securitylevel: "admin",
    serverreliance: "server",
    async execute(interaction, gameId, senderId, guild){
        var subCommand = interaction.options.getSubcommand();
        var connectionId = interaction.options.getString("connection");
        switch(subCommand){
            case "anonymous":
                var username = interaction.options.getString("username");
                var avatar = interaction.options.getAttachment("avatar");
                if(username){
                    code.changeAnonymousConnectionUsername(gameId, connectionId, username);
                    await code.replyToInteraction(interaction, `Successfully changed username of connection to ${username}!`);
                }
                if(avatar){
                    avatar = avatar.url;
                    await code.changeAnonymousConnectionAvatar(gameId, connectionId, avatar);
                    await code.replyToInteraction(interaction, `Successfully changed avatar of connection!`);
                }
                break;
            case "signal":
                var signal = interaction.options.getString("signal");
                code.changeSignalConnectionSignal(gameId, connectionId, signal);
                break;
        }
    },
    async retrieveAutocompletes(interaction, gameId){
        var subCommand = interaction.options.getSubcommand();
        switch(subCommand){
            case "anonymous":
                return code.autocompletesSpecificTypeForAdmin(gameId, interaction.user.id, ConnectionTypes.ANONYMOUS);
            case "signal":
                return code.autocompletesSpecificTypeForAdmin(gameId, interaction.user.id, ConnectionTypes.SIGNAL);
        }
    }
}