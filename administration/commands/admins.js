const Discord = require('discord.js');
const admin = require('../administration.js');

module.exports = {
    data: {
        name: "admins",
        description: "(Admin) Returns a list of all admins for a game, including the owner.",
        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        options: [
            
        ]
    },
    securitylevel: "admin",
    serverreliance: "optional",
    async execute(interaction, gameId){

        //retrieve the admins
        var admins = admin.getAdmins(gameId);

        //create message
        var message = "__ADMINS__";
        admins.forEach(admin => {
            message += `\n${admin.toString()}`;
        });

        //send message
        await interaction.reply({content: message, ephemeral: true});
    },
    async retrieveAutocompletes(interaction, gameId){
        return admin.autocompletesAllAdminedBy(interaction.user.id);
    }
}