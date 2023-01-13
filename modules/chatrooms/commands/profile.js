const Discord = require('discord.js');
const code = require('../code.js');
const {ChatroomError, err} = require('../code/ChatroomError.js');

module.exports = {
    data: {
        name: "profile",
        description: "View your user profile.",
    },
    securitylevel: "none",
    serverreliance: "server",
    chatroomidreliance: "terminal",
    async execute(interaction, gameId, senderId, guild, chatroomId){
        //retrieve user profile
        var profileembed = code.retrieveUserProfile(gameId, chatroomId, senderId);
        
        //reply with profile embed
        await code.replyToInteractionWithEmbed(interaction, profileembed);
    },
    async retrieveAutocompletes(interaction, gameId, chatroomId){
        
    }
}