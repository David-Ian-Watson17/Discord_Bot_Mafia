const Discord = require('discord.js');
const admin = require('../administration.js');

module.exports = {
    data: {
        name: "owner",
        description: "(Admin) Print the owner of a game.",
        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    },
    securitylevel: "admin",
    serverreliance: "optional",
    async execute(interaction, gameId){

        //retrieve owner
        var owner = admin.getOwner(gameId);

        //create message
        var message = "__OWNER__";
        message += `\n${owner.toString()}`;

        //send response
        await interaction.reply({content: message, ephemeral: true });
    },
    async retrieveAutocompletes(interaction, gameId){
        return admin.autocompletesAllAdminedBy(interaction.user.id);
    }
}