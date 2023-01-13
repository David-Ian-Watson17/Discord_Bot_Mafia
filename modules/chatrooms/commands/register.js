const Discord = require('discord.js');
const code = require('../code.js');
const {ChatroomError, err} = require('../code/ChatroomError.js');

module.exports = {
    data: {
        name: "register",
        description: "Register your current account with a username and profile picture.",
        options: [
            {
                name: "username",
                description: "The username you'd like your account to have.",
                type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                required: true,
            },
            {
                name: "profilepicture",
                description: "The profile picture you'd like your account to have.",
                type: Discord.Constants.ApplicationCommandOptionTypes.ATTACHMENT,
                required: true,
            }
        ]
    },
    securitylevel: "none",
    serverreliance: "server",
    chatroomidreliance: "terminal",
    async execute(interaction, gameId, senderId, guild, chatroomId){
        
        //retrieve username and profile picture
        var username = interaction.options.getString("username");
        var profilepicture = interaction.options.getAttachment("profilepicture").url;

        //retrieve logged in account id
        var accountId = code.retrieveLoggedInAccountId(gameId, chatroomId, senderId);

        //register account
        await code.registerAccount(gameId, chatroomId, accountId, senderId, username, profilepicture);

        //print success
        await code.replyToInteraction(interaction, "Successfully registered account!");
    },
    async retrieveAutocompletes(interaction, gameId, chatroomId){
        
    }
}