const Discord = require('discord.js');
const admin = require('../administration.js');

module.exports = {
    data: {
        name: "changeowner",
        description: "(Owner) Give ownership of a game to another user.",
        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        options: [
            {
                name: "user",
                description: "The user you'd like to make owner of the game.",
                type: Discord.Constants.ApplicationCommandOptionTypes.USER,
                required: true
            },
            {
                name: "gamename",
                description: "(Optional) The name of the game you'd like to transfer.",
                type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                required: false,
                autocomplete: true
            }
        ]
    },
    securitylevel: "owner",
    serverreliance: "optional",
    async execute(interaction, gameId){

        //get the new owner
        var newOwner = interaction.options.getUser("user");
        
        //change the owner
        admin.changeOwner(gameId, newOwner, interaction.user.id);

        //notify of change
        await interaction.reply({content: `You successfully gave ownership of the game to ${newOwner.toString()}`, ephemeral: true});

    },
    async retrieveAutocompletes(interaction, gameId){
        return admin.autocompletesAllOwnedBy(interaction.user.id);
    }
}