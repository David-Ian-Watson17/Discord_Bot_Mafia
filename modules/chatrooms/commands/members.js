const Discord = require('discord.js');
const code = require('../code.js');
const {ChatroomError, err} = require('../code/ChatroomError.js');

module.exports = {
    data: {
        name: "members",
        description: "List all current member accounts for this chatroom that you can see.",
    },
    securitylevel: "none",
    serverreliance: "server",
    chatroomidreliance: "terminal",
    async execute(interaction, gameId, senderId, guild, chatroomId){
        //retrieve usernames
        var usernames = code.retrieveRegisteredAccountUsernames(gameId, chatroomId);

        //craft response string
        var responsestring = "";
        if(usernames.length == 0){
            responsestring = "There are no registered users currently in this chatroom.";
        }
        else{
            responsestring = "__Members__";
            usernames.forEach(username => {
                responsestring += `\n${username}`;
            });
        }

        //respond with string
        await code.replyToInteraction(interaction, responsestring);
    },
    async retrieveAutocompletes(interaction, gameId, chatroomId){
        
    }
}