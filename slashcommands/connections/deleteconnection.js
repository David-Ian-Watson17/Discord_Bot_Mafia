const Discord = require('discord.js');
const conn = require('../../code/connections.js');
const err = require('../../universal_data/errorcodes.json');

module.exports = {
    data: {
        name: 'deleteconnection',
        description: 'Delete a given connection for this server.',
        options: [
            {
                name: 'connection',
                description: 'The connection you\'d like to delete.',
                type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                required: true,
                autocomplete: true
            }
        ]
    },
    serverreliance: "server",
    securitylevel: "host",
    async execute(gameId, interaction){
        try{
            var connectionstring = interaction.options.getString('connection');
            connectionstring = connectionstring.split(" ")[0];
            var index = connectionstring.replace(/\D/g, '');
            index--;
            return conn.connectionHandler[`${gameId}`].removeConnectionAtIndex(index);
        }catch(error){
            console.error(error);
        }
    },
    async retrieveAutocompletes(gameId, interaction){
        try{
            var value = interaction.options.getFocused(true).value;
            var connections = conn.connectionHandler[`${gameId}`].getAllCompleteConnections();
            var returnoptions = [];
            var index = 1;
            connections.forEach(connection => {
                var connectionstring = connection.connection.toString();
                if(connectionstring.includes(value) || index.toString().includes(value))
                {
                    returnoptions.push(`${index} : ${connectionstring}`);
                }
                index++;
            })
        }catch(error){
            console.error(error);
            return [];
        }
        return returnoptions;
    }
}