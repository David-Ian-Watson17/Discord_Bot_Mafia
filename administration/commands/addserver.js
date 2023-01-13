const Discord = require('discord.js');
const admin = require('../administration.js');

module.exports = {
    data: {
        name: "addserver",
        description: "(Admin) Must be server owner to use. Add the server you use this in to a game.",
        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        options: [
            {
                name: "gamename",
                description: "The name of the game you'd like to add this server to.",
                type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                required: true,
                autocomplete: true
            }
        ]
    },
    securitylevel: "admin",
    serverreliance: "name",
    async execute(interaction, gameId, senderId, guild){

        //add the guild
        admin.addGuild(gameId, guild, senderId);

        //report success
        await interaction.reply({content: `Successfully added ${guild.name} to your game!`, ephemeral: true});
    },
    async retrieveAutocompletes(interaction, gameId){
        return admin.autocompletesAllAdminedBy(interaction.user.id);
    }
}