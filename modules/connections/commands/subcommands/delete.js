const Discord = require('discord.js');
const code = require('../../code.js');

module.exports = {
    data: {
        name: "delete",
        description: "Delete a connection",
        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        options: [
            {
                name: "connection",
                description: "The connection you'd like to delete.",
                type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                required: true,
                autocomplete: true
            }
        ]
    },
    securitylevel: "admin",
    serverreliance: "server",
    async execute(interaction, gameId, senderId, guild){
        var connectionId = interaction.options.getString("connection");
        code.deleteConnection(gameId, connectionId);
        await code.replyToInteraction(interaction, "Successfully deleted the connection!");
    },
    async retrieveAutocompletes(interaction, gameId){
        return code.autocompletesAllConnectionsForAdmin(gameId, interaction.user.id);
    }
}