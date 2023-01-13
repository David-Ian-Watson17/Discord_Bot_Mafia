const Discord = require('discord.js');
const code = require('../code.js');
const {ChatroomError, err} = require('../code/ChatroomError.js');

module.exports = {
    data: {
        name: "chatroomlog",
        description: "Retrieve the log for a chatroom",
        options: []
    },
    securitylevel: "admin",
    serverreliance: "server",
    chatroomidreliance: "name",
    async execute(interaction, gameId, senderId, guild, chatroomId){
        //retrieve log
        var log = code.retrieveLog(gameId, chatroomId);

        //print log
        await interaction.reply({content: `Retrieved the log!`, files: [new Discord.MessageAttachment(log, "log")], ephemeral: true});
    },
    async retrieveAutocompletes(interaction, gameId, chatroomId){

    }
}