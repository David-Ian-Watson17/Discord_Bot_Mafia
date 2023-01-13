const Discord = require('discord.js');
const admin = require('../administration.js');

module.exports = {
    data: {
        name: "removeserver",
        description: "(Admin) Remove server from a game. Can also use this command if you are the server owner.",
        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    },
    securitylevel: "none",
    serverreliance: "server",
    async execute(interaction, gameId, senderId, guild){

        //remove guild
        admin.removeGuild(gameId, guild.id, interaction.user.id);

        //report success
        await interaction.reply({content: `Successfully removed this server from its game.`, ephemeral: true});
    },
    async retrieveAutocompletes(interaction, gameId){
        return [];
    }
}