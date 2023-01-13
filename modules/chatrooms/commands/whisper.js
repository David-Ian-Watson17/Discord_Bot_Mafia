const Discord = require('discord.js');
const code = require('../code.js');
const {ChatroomError, err} = require('../code/ChatroomError.js');

module.exports = {
    data: {
        name: "whisper",
        description: "Whisper to another member of the chatroom.",
        options: [
            {
                name: "target",
                description: "The member you'd like to whisper to.",
                type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                required: true,
                autocomplete: true,
            },
            {
                name: "message",
                description: "The message you'd like to send.",
                type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                required: true,
            }
        ]
    },
    securitylevel: "none",
    serverreliance: "server",
    chatroomidreliance: "terminal",
    async execute(interaction, gameId, senderId, guild, chatroomId){
        
        //retrieve sender id
        var senderAccountId = code.retrieveLoggedInAccountId(gameId, chatroomId, senderId);

        //retrieve target id
        var targetAccountId = interaction.options.getString("target");

        //retrieve message
        var message = interaction.options.getString("message");

        //send whisper
        code.whisper(gameId, chatroomId, senderAccountId, targetAccountId, message);

        //print success
        await code.replyToInteraction(interaction, "Whisper sent.", true);
    },
    async retrieveAutocompletes(interaction, gameId, chatroomId){
        var focusedvalue = interaction.options.getFocused();
        return code.userAutocompletesAllViewableAccounts(gameId, chatroomId, interaction.user.id, focusedvalue);
    }
}