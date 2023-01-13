const Discord = require('discord.js');
const admin = require('../administration.js');

module.exports = {
    data: {
        name: "creategame",
        description: "Create a new game with yourself as the owner.",
        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        options: [
            {
                name: "gamename",
                description: "The name of your new game.",
                type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                required: true
            }
        ]
    },
    securitylevel: "none",
    serverreliance: "unnecessary",
    async execute(interaction, gameId, senderId){

        //get the name
        var gameName = interaction.options.getString('gamename');

        //create the game
        admin.createGame(gameName, interaction.user);

        //report success
        await interaction.reply({content: `Successfully created game "${gameName}"!`, ephemeral: true});
    },
    async retrieveAutocompletes(interaction, gameId){
        return [];
    }
}