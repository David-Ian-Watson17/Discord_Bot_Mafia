const Discord = require('discord.js');
const conn = require('../../code/connections.js');
const err = require('../../universal_data/errorcodes.json');

module.exports = {
    data: {
        name: "endconnection",
        description: "(Host Required) End the connection you started with /startconnection.",
        options: [
            {
                name: "end_channel",
                description: "The channel you'd like to end the connection on.",
                required: true,
                type: Discord.Constants.ApplicationCommandOptionTypes.CHANNEL,
                channelTypes: [Discord.Constants.ChannelTypes.GUILD_TEXT]
            }
        ]
    },
    serverreliance: "server",
    securitylevel: "host",
    async execute(gameId, interaction){
        var endChannel = interaction.options.getChannel("end_channel");
        var incompleteconnection = conn.connectionHandler[`${gameId}`].getUserIncompleteConnection(interaction.user.id);
        if(!incompleteconnection){
            await interaction.reply({ content: "You have no outstanding incomplete connections!", ephemeral: true }).catch(console.error);
            return err.ERROR_CONNECTION_NO_START_TO_FINISH;
        }
        var returncode = conn.connectionHandler[`${gameId}`].endConnection(endChannel.id, interaction.user.id);
        return returncode;
    }
}