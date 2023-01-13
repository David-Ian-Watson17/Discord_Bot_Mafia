const Discord = require('discord.js');
const code = require('../code.js');
const {ChatroomError, err} = require('../code/ChatroomError.js');

module.exports = {
    data: {
        name: "chatroomusers",
        description: "(Admin) Commands related to the discord users that have access to a chatroom.",
        options: [
            {
                name: "list",
                description: "(Admin) List all users that have access to a given chatroom.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            },
            {
                name: "profile",
                description: "(Admin) Print the complete profile for a user.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "user",
                        description: "The user you'd like to see the profile for.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true,
                    }
                ]
            }
        ]
    },
    securitylevel: "admin",
    serverreliance: "server",
    chatroomidreliance: "name",
    async execute(interaction, gameId, senderId, guild, chatroomId){
        switch(interaction.options.getSubcommand()){
            case "list":
                //retrieve user strings
                var userstrings = code.retrieveAllUserStringsForChatroom(gameId, chatroomId);

                //create response string
                var responsestring = "";
                if(userstrings.length == 0){
                    responsestring = "There are no users currently added to this chatroom.";
                }
                else{
                    responsestring = "__Users__";
                    userstrings.forEach(userstring => {
                        responsestring += `\n${userstring}`;
                    })
                }
            
                //send responsestring
                await code.replyToInteraction(interaction, responsestring);
                break;
            case "profile":
                //retrieve user id
                var userId = interaction.options.getString("user");
                
                //retrieve profile embed
                var embed = code.retrieveUserProfile(gameId, chatroomId, userId);

                //print embed
                await code.replyToInteractionWithEmbed(interaction, embed);
                break;
        }
    },
    async retrieveAutocompletes(interaction, gameId, chatroomId){
        return code.adminAutocompletesAllUsers(gameId, chatroomId, interaction.user.id, interaction.options.getFocused());
    }
}