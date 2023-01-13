const Discord = require('discord.js');
const admin = require('../administration.js');

module.exports = {
    data: {
        name: "removeadmin",
        description: "(Owner) Remove an admin from a game.",
        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        options: [
            {
                name: "admin",
                description: "The admin you'd like to remove from your game.",
                type: Discord.Constants.ApplicationCommandOptionTypes.USER,
                required: true
            },
            {
                name: "gamename",
                description: "(Optional) The name of the game you'd like to remove an admin from.",
                type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                required: false,
                autocomplete: true
            }
        ]
    },
    securitylevel: "owner",
    serverreliance: "optional",
    async execute(interaction, gameId){

        //retrieve the admin id
        var adminId = interaction.options.getUser("admin").id;

        //remove the admin
        admin.removeAdmin(gameId, adminId, interaction.user.id);

        //report success
        await interaction.reply({content: `Successfully removed <@${adminId}> as an admin.`, ephemeral: true});
    },
    async retrieveAutocompletes(interaction, gameId){
        return admin.autocompletesAllOwnedBy(interaction.user.id);
    }
}