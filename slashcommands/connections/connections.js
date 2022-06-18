const { SlashCommandBuilder } = require('@discordjs/builders');
const conn = require('../../code/connections.js');
const admin = require('../../code/administration.js');
const err = require('../../universal_data/errorcodes.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('connections')
        .setDescription('(Host Required) List all connections for the game this server belongs to.')
        .addStringOption(option => 
            option.setName('gamename')
                .setDescription ('Name of the game you\'re looking for. Leave blank to use this server\'s game.')
                .setRequired(false)),
    securitylevel: "host",
    serverreliance: "optional",
    async execute(gameId, interaction) {
        //get game name
        var gameName = admin.getName(gameId);

        //retrieve connections
        var connectionArray = conn.connectionHandler[`${gameId}`].getAllCompleteConnections();

        //failure
        if(connectionArray === false){
            await interaction.reply({ content: "An error occurred while trying to retrieve connections!", ephemeral: true }).catch(console.error);
            return err.ERROR_GENERIC_COMMAND_EXECUTE_FAIL;
        }

        //craft reply
        if(connectionArray.length == 0){
            reply = `There are no connections for game ${gameName} yet!`;
        }
        else{
            reply = `CONNECTIONS: ${gameName}\n`;
            var index = 1;
            connectionArray.forEach(connection => {
                reply += `\n${index}: <#${connection.connection.startChannelId}> -> <#${connection.connection.endChannelId}> (${connection.connection.type})`;
                index++;
            });
        }
        await interaction.reply({ content: reply, ephemeral: true }).catch(console.error);
        return err.GOOD_EXECUTE;
    }
}