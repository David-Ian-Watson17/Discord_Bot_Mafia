const Discord = require('discord.js');
const admin = require('../administration.js');

module.exports = {
    data: {
        name: "setimagechannel",
        description: "(Admin) Set the image channel for a game.",
        options: [
            {
                name: "channel",
                description: "(Admin) The channel the game will use to store images.",
                type: Discord.Constants.ApplicationCommandOptionTypes.CHANNEL,
                required: true
            }
        ]
    },
    securitylevel: "admin",
    serverreliance: "server",
    async execute(interaction, gameId){

        //get channel
        var channel = interaction.options.getChannel("channel");

        //set channel
        admin.setImageChannel(gameId, channel, interaction.user.id);

        //report success
        await interaction.reply({content: `Changed image channel to <#${channel.id}>.`, ephemeral: true});
    },
    async retrieveAutocompletes(interaction, gameId){
        
    }
}