const Discord = require('discord.js');
const code = require('../../code.js');

module.exports = {
    data: {
        name: "start",
        description: "Start a connection.",
        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
        options: [
            {
                name: "channel",
                description: "Start a connection with a channel.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "startchannel",
                        description: "The channel to start the connection with.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.CHANNEL,
                        required: true,
                    }
                ]
            },
            {
                name: "user",
                description: "Start a connection with a user.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "startuser",
                        description: "The user to start the connection with.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.USER,
                        required: true,
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
            case "channel":
                var startChannel = interaction.options.getChannel("startchannel");
                code.createPartialChannelConnection(gameId, startChannel);
                await code.replyToInteraction(interaction, "Successfully started a channel connection!");
                break;
            case "user":
                var startUser = interaction.options.getUser("startuser");
                code.createPartialUserConnection(gameId, startUser);
                await code.replyToInteraction(interaction, "Successfully started a user connection!");
                break;
        }
    },
    async retrieveAutocompletes(interaction, gameId){
        
    }
}