const Discord = require('discord.js');
const code = require('../code.js');
const { ConnectionTypes } = require('../code/connectiontypes.js');

module.exports = {
    data: {
        name: "signal",
        description: "Sends a predetermined signal to another, also predetermined, channel.",
        options: [
            {
                name: "user",
                description: "The user you'd like to ping in the signal.",
                type: Discord.Constants.ApplicationCommandOptionTypes.USER,
                required: true
            }
        ]
    },
    securitylevel: "none",
    serverreliance: "server",
    async execute(interaction, gameId, senderId, guild){
        var userId = interaction.options.getUser("user").id;
        var connections = code.retrieveAllConnections(gameId);
        var sentsignal = false;
        connections.each(connection => {
            if(connection.type == ConnectionTypes.SIGNAL && connection.startChannel.id == interaction.channel.id){
                code.signal(gameId, connection.id, userId);
                sentsignal = true;
            }
        });
        if(sentsignal) await code.replyToInteraction(interaction, "Sent signal!");
        else await code.replyToInteraction(interaction, "No signal to send!");
    },
    async retrieveAutocompletes(interaction, gameId){
        
    }
}