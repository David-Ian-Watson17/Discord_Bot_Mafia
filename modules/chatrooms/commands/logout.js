const Discord = require('discord.js');
const code = require('../code.js');
const {ChatroomError, err} = require('../code/ChatroomError.js');

module.exports = {
    data: {
        name: "logout",
        description: "Log out of the account you are currently logged into."
    },
    securitylevel: "none",
    serverreliance: "server",
    chatroomidreliance: "terminal",
    async execute(interaction, gameId, senderId, guild, chatroomId){
        //logout user
        code.logout(gameId, chatroomId, senderId);

        //print success
        await code.replyToInteraction(interaction, "Successfully logged out.");
    },
    async retrieveAutocompletes(interaction, gameId, chatroomId){
        
    }
}