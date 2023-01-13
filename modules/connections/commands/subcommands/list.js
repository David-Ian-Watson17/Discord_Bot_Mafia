const Discord = require('discord.js');
const code = require('../../code.js');
const messagesending = require('../../../../handlers/messagehandler.js');

module.exports = {
    data: {
        name: "list",
        description: "Lists all connections with their attributes. Sends additional messages as needed.",
        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    },
    securitylevel: "admin",
    serverreliance: "server",
    async execute(interaction, gameId, senderId, guild){
        //retrieve connections
        var connections = code.retrieveAllConnections(gameId);

        //if there are no connections
        if(connections.size == 0){
            //inform as such and return
            await interaction.reply({content: "This game has no connections.", ephemeral: true});
            return;
        }

        //otherwise start response
        var replymessage = "__CONNECTIONS__";

        //for each connection
        connections.each(connection => {

            //add it to reply
            replymessage += `\n\n${connection.toFullString()}`;
        });

        //cut response if too long
        var replies = messagesending.cutMessageProperly(replymessage);

        //reply with first response (or full response if short enough)
        await interaction.reply({content: replies[0], ephemeral: false});
        
        //follow up with additional necessary responses
        for(var i = 1; i < replies.length; i++){
            await interaction.followUp(replies[i]);
        }
    },
    async retrieveAutocompletes(interaction, gameId){
        
    }
}