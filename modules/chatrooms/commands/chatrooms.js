const Discord = require('discord.js');
const code = require('../code.js');
const {ChatroomError, err} = require('../code/ChatroomError.js');

module.exports = {
    data: {
        name: "chatrooms",
        description: "Commands related to chatroom information.",
        options: [
            {
                name: "create",
                description: "(Admin) Create a new chatroom.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "name",
                        description: "The name you'd like to call the chatroom.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                    }
                ]
            },
            {
                name: "delete",
                description: "(Admin) Delete an existing chatroom.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "chatroomname",
                        description: "The chatroom you'd like to delete.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true,
                    }
                ]
            },
            {
                name: "edit",
                description: "(Admin) Edit an existing chatroom.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "chatroomname",
                        description: "The chatroom you'd like to edit.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true,
                    },
                    {
                        name: "name",
                        description: "The new name of the chatroom.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: false,
                    }
                ]
            },
            {
                name: "list",
                description: "(Admin) List all chatrooms in the game this server belongs to.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            },
            {
                name: "profile",
                description: "Print the profile embed for a chatroom.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "chatroomname",
                        description: "The chatroom you'd like to print the profile for.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true,
                    }
                ]
            },
            {
                name: "addterminal",
                description: "Add a channel to a chatroom as a terminal",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "chatroomname",
                        description: "The chatroom you'd like to add a terminal to.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true,
                    },
                    {
                        name: "terminal",
                        description: "The channel you'd like to add as a terminal.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.CHANNEL,
                        required: true,
                    }
                ]
            },
            {
                name: "removeterminal",
                    description: "Remove a terminal from a chatroom.",
                    type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                    options: [
                        {
                            name: "chatroomname",
                            description: "The chatroom you'd like to remove a terminal from.",
                            type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                            required: true,
                            autocomplete: true,
                        },
                        {
                            name: "terminal",
                            description: "The terminal you'd like to remove.",
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
    chatroomidreliance: "unnecessary",
    async execute(interaction, gameId, senderId, guild, chatroomId){
        switch(interaction.options.getSubcommand()){
            case "create":
                //retrieve name
                var name = interaction.options.getString("name");

                //create chatroom
                code.createChatroom(gameId, name);

                //report success
                await code.replyToInteraction(interaction, "Successfully created chatroom!");
                break;
            case "delete":
                //retrieve the chatroom id
                var chatroomId = interaction.options.getString("chatroomname");

                //delete chatroom
                code.deleteChatroom(gameId, chatroomId);

                //report success
                await code.replyToInteraction(interaction, "Successfully deleted chatroom.");
                break;
            case "edit":
                //retrieve the chatroom id of the chatroom needing to be changed
                var chatroomId = interaction.options.getString("chatroomname");

                //retrieve name
                var newName = interaction.options.getString("name");
                
                //if name is to be changed
                if(newName){

                    //change the name
                    code.changeChatroomName(gameId, chatroomId, newName);

                    //print success
                    await code.replyToInteraction(interaction, "Successfully changed the name of the chatroom.");
                }
                else{
                    await code.replyToInteraction(interaction, "Well what did you want me for if nothing, dingus? :yourmommmypp:");
                }
                break;
            case "list":
                //retrieve all chatroom strings
                var chatroomStrings = code.retrieveAllChatroomStrings(gameId);

                //create response string
                var responsestring = "";
                if(chatroomStrings.length == 0){
                    responsestring = "There are no chatrooms yet in this game!";
                }
                else{
                    responsestring = "__Chatrooms__";
                    chatroomStrings.forEach(chatroomString => {
                        responsestring += `\n${chatroomString}`;
                    });
                }

                //reply with the strings
                await code.replyToInteraction(interaction, responsestring);
                break;
            case "profile":
                //retrieve chatroom Id
                var chatroomId = interaction.options.getString("chatroomname");

                //retrieve profile embed
                var embed = code.retrieveChatroomProfile(gameId, chatroomId);

                //respond with embed
                await code.replyToInteractionWithEmbed(interaction, embed);
                break;
            case "addterminal":
                //retrieve chatroom Id
                var chatroomId = interaction.options.getString("chatroomname");
                
                //retrieve channel
                var channel = interaction.options.getChannel("terminal");

                //add terminal to chatroom
                code.addTerminalToChatroom(gameId, chatroomId, channel);

                //report success
                await code.replyToInteraction(interaction, `Successfully added <#${channel.id}> to chatroom.`);
                break;
            case "removeterminal":
                //retrieve chatroom Id
                var chatroomId = interaction.options.getString("chatroomname");

                //retrieve channel id
                var channelId = interaction.options.getString("terminal");

                //remove terminal from chatroom
                code.removeTerminalFromChatroom(gameId, chatroomId, channelId);

                //report success
                await code.replyToInteraction(interaction, `Successfully removed <#${channelId}> from chatroom.`);
                break;
        }
    },
    async retrieveAutocompletes(interaction, gameId, chatroomId){
        var focusedvalue = interaction.options.getFocused();
        switch(interaction.options.getSubcommand()){
            case "delete":
                return code.adminAutocompletesAllChatrooms(gameId, interaction.user.id, focusedvalue);
                break;
            case "edit":
                return code.adminAutocompletesAllChatrooms(gameId, interaction.user.id, focusedvalue);
                break;
            case "profile":
                return code.adminAutocompletesAllChatrooms(gameId, interaction.user.id, focusedvalue);
                break;
            case "addterminal":
                return code.adminAutocompletesAllChatrooms(gameId, interaction.user.id, focusedvalue);
                break;
            case "removeterminal":
                //if it's for chatroom id
                if(interaction.options.getFocused(true).name == "chatroomname"){
                    return code.adminAutocompletesAllChatrooms(gameId, interaction.user.id, focusedvalue);
                }

                //if it's for terminal id
                return code.adminAutocompletesTerminalFromChatroom(gameId, interaction.options.getString("chatroomname"), interaction.user.id, focusedvalue);
                break;
        }
    }
}