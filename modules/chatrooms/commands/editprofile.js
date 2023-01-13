const Discord = require('discord.js');
const code = require('../code.js');
const {ChatroomError, err} = require('../code/ChatroomError.js');

module.exports = {
    data: {
        name: "editprofile",
        description: "Change your account's current username or profile picture.",
        options: [
            {
                name: "username",
                description: "New username for your account.",
                type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                required: false,
            },
            {
                name: "profilepicture",
                description: "New profile picture for your account.",
                type: Discord.Constants.ApplicationCommandOptionTypes.ATTACHMENT,
                required: false,
            }
        ]
    },
    securitylevel: "none",
    serverreliance: "server",
    chatroomidreliance: "terminal",
    async execute(interaction, gameId, senderId, guild, chatroomId){
        //retrieve account id for logged in account
        var accountId = code.retrieveLoggedInAccountId(gameId, chatroomId, senderId);

        //retrieve edit information
        var username = interaction.options.getString("username");
        var profilepictureattachment = interaction.options.getAttachment("profilepicture");

        //if username was changed, change
        if(username){
            try{
                code.changeAccountUsername(gameId, chatroomId, accountId, senderId, username);
                await code.replyToInteraction(interaction, `Successfully changed username to ${username}!`);
            }catch(errorcode){
                await code.replyToInteraction(interaction, "Failed to change username: ");
                await code.replyToInteractionBasedOnReturnCode(interaction, errorcode);
            }
        }

        //if profile picture was changed, change
        if(profilepictureattachment){
            try{
                code.changeAccountProfilePicture(gameId, chatroomId, accountId, senderId, profilepictureattachment.url);
                await code.replyToInteraction(interaction, `Successfully changed profile picture!`);
            }catch(errorcode){
                await code.replyToInteraction(interaction, "Failed to change profile picture: ");
                await code.replyToInteractionBasedOnReturnCode(interaction, errorcode);
            }
        }
    },
    async retrieveAutocompletes(interaction, gameId, chatroomId){
        
    }
}