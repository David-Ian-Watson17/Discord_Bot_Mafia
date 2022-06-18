const Discord = require('discord.js');
const conn = require('../../code/connections.js');
const err = require('../../universal_data/errorcodes.json');

module.exports = {
    data: {
        name: "scrapconnection",
        description: "(Host Required) Scrap a connection you started that you don't want to finish."
    },
    serverreliance: "server",
    securitylevel: "host",
    async execute(gameId, interaction){
        var requester = interaction.user.id;
        var returncode = conn.connectionHandler[`${gameId}`].scrapStartedConnection(requester);
        if(returncode == err.ERROR_CONNECTION_NO_START_TO_FINISH){
            await interaction.reply({content: "You had no started connection to scrap!", ephemeral: true}).catch(console.error);
        }
        if(returncode == err.GOOD_EXECUTE){
            await interaction.reply({content: "Interaction scrapped!", ephemeral: true}).catch(console.error).catch(console.error);
        }
        return returncode;
    }
}