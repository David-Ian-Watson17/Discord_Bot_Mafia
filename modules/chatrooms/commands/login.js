const Discord = require('discord.js');
const code = require('../code.js');
const {ChatroomError, err} = require('../code/ChatroomError.js');

module.exports = {
    data: {
        name: "login",
        description: "Log into an account you have access to.",
        options: [
            {
                name: "account",
                description: "The account you'd like to log into.",
                type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                required: true,
                autocomplete: true,
            }
        ]
    },
    securitylevel: "none",
    serverreliance: "server",
    chatroomidreliance: "terminal",
    async execute(interaction, gameId, senderId, guild, chatroomId){
        //retrieve account Id
        var accountId = interaction.options.getString("account");

        //login
        code.login(gameId, chatroomId, senderId, accountId);

        //print success
        await code.replyToInteraction(interaction, "Successfully logged into account.");
    },
    async retrieveAutocompletes(interaction, gameId, chatroomId){
        var focusedvalue = interaction.options.getFocused();
        return code.userAutocompletesAllAccessibleAccounts(gameId, chatroomId, interaction.user.id, focusedvalue);
    }
}