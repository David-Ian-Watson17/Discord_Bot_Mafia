const Discord = require('discord.js');
const admin = require('../administration.js');

module.exports = {
    data: {
        name: "servers",
        description: "(Admin) List all servers that are a part of a game.",
        options: [
            {
                name: "gamename",
                description: "The name of the game you want to list servers for.",
                type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                required: false,
                autocomplete: true
            }
        ]
    },
    securitylevel: "admin",
    serverreliance: "optional",
    async execute(interaction, gameId){

        //retrieve guilds
        var guilds = admin.getGuildsForId(gameId);

        //create message
        var message = "__SERVERS__";
        for(var i = 0; i < guilds.length; i++){
            message += `\n${guilds[i].name} (${guilds[i].id})`;
        }

        //send response
        await interaction.reply({content: message, ephemeral: true});
    },
    async retrieveAutocompletes(interaction, gameId){
        return admin.autocompletesAllAdminedBy(interaction.user.id);
    }
}