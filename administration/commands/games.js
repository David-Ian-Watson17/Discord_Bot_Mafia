const Discord = require('discord.js');
const admin = require('../administration.js');

module.exports = {
    data: {
        name: "games",
        description: "Returns a list of all games you are an admin or owner for.",
        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    },
    securitylevel: "none",
    serverreliance: "unnecessary",
    async execute(interaction, gameId){
        //retrieve games
        var games = admin.allGamesAdminedBy(interaction.user.id);

        //create message
        var message = "You have no games you are an owner or admin for yet!";
        if(!(games.size == 0)){
            message = "__GAMES__";
            games.each(game => {
                message += `\n${game.name} (${game.id})`;
            });
        }

        //send response
        await interaction.reply({content: message, ephemeral: true});
    },
    async retrieveAutocompletes(interaction, gameId){
        return [];
    }
}