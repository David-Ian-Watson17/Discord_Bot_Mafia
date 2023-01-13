const Discord = require('discord.js');
const admin = require('../administration.js');

module.exports = {
    data: {
        name: "deletegame",
        description: "(Owner) Delete a game you own.",
        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        options: [
            {
                name: "gamename",
                description: "(Optional) The name of the game you want to delete.",
                type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                required: true,
                autocomplete: true
            }
        ]
    },
    securitylevel: "owner",
    serverreliance: "name",
    async execute(interaction, gameId){

        //delete the game
        admin.deleteGame(gameId, interaction.user.id);

        //report the success
        await interaction.reply({content: `Successfully deleted the game!`, ephemeral: true});
    },
    async retrieveAutocompletes(interaction, gameId){
        return admin.autocompletesAllAdminedBy(interaction.user.id);
    }
}