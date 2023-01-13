const Discord = require('discord.js');
const admin = require('../administration.js');

module.exports = {
    data: {
        name: 'addadmin',
        description: '(Owner) Add a user to your game as an admin.',
        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        options: [
            {
                name: 'user',
                description: "The user you'd like to add as an admin.",
                type: Discord.Constants.ApplicationCommandOptionTypes.USER,
                required: true
            },
            {
                name: 'gamename',
                description: "(Optional) The name of the game you'd like to add an admin to.",
                type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                required: false,
                autocomplete: true
            }
        ]
    },
    securitylevel: "owner",
    serverreliance: "optional",
    async execute(interaction, gameId, senderId){

        //retrieve user
        var newAdmin = interaction.options.getUser("user");

        //add admin
        admin.addAdmin(gameId, newAdmin, interaction.user.id);

        //report success
        await interaction.reply({content: `Successfully added ${newAdmin.toString()} as an admin!`, ephemeral: true});
    },
    retrieveAutocompletes(interaction, gameId){
        return admin.autocompletesAllOwnedBy(interaction.user.id);
    }
}