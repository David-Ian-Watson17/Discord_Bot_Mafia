const Discord = require('discord.js');
const admin = require('../../administration/administration.js');
const code = require('./code.js');

const addChatroomNameToCommand = function(command, optional){
    if(!command.options){
        command.options = [];
    }
    if((!command.type && command.options.length > 0 && command.options[0].type == Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND) || (command.type && command.type == Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP)){
        command.options.forEach(option => {
            addChatroomNameToCommand(option);
        })
    }
    else{
        for(var i = 0; i < command.options.length; i++){
            if(command.options[i].name == "chatroomname"){
                command.options.splice(i, 1);
                i--;
            }
        }
        if(optional){
            var newoption = {
                name: "chatroomname",
                description: "The name of the chatroom.",
                type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                required: false,
                autocomplete: true
            }
            command.options.push(newoption);
        }
        else{
            var newoption = {
                name: "chatroomname",
                description: "The name of the chatroom.",
                type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                required: true,
                autocomplete: true
            }
            command.options.unshift(newoption);
        }
    }
}

const prepCommand = function(command){
    if(command.chatroomidreliance){
        if(command.chatroomidreliance == "name"){
            addChatroomNameToCommand(command.data, false);
        }
        else if(command.chatroomidreliance == "optional"){
            addChatroomNameToCommand(command.data, true);
        }
    }
}

module.exports = {
    prepCommand: prepCommand,
    async execute(command, interaction, gameId, senderId, guild){
        var chatroomId;
        switch(command.chatroomidreliance){
            case "name":
                //retrieve Id
                chatroomId = interaction.options.getString("chatroomname");
                if(!chatroomId){
                    await code.replyToInteraction(interaction, "You must enter a valid chatroom name to use this command.");
                    return;
                }
                break;
            case "optional":
                //retrieve Id
                chatroomId = interaction.options.getString("chatroomname");
                //if no name, retrieve from terminal
                if(!chatroomId){
                    chatroomId = code.retrieveChatroomIdByTerminal(gameId, interaction.channel.id);
                    if(!chatroomId){
                        await code.replyToInteraction(interaction, "Enter a valid chatroom name or use this command in a valid terminal.");
                        return;
                    }
                }
                break;
            case "terminal":
                //retrieve Id
                chatroomId = code.retrieveChatroomIdByTerminal(gameId, interaction.channel.id);
                if(!chatroomId){
                    await code.replyToInteraction(interaction, "You must use this command in a valid terminal.");
                    return;
                }
                break;
            case "unnecessary":
                chatroomId = undefined;
                break;
            default:
                await code.replyToInteraction(interaction, "This command is broken lol");
                return;
        }
        try{
            await command.execute(interaction, gameId, senderId, guild, chatroomId);
        }catch(errorcode){
            await code.replyToInteractionBasedOnReturnCode(interaction, errorcode);
        }
    },
    async retrieveAutocompletes(command, interaction, gameId){
        var focusedelement = interaction.options.getFocused(true);
        if(focusedelement.name == "chatroomname" && focusedelement.type == "STRING"){
            try{
                return await code.adminAutocompletesAllChatrooms(gameId, interaction.user.id, focusedelement.value);
            }catch(errorcode){
                return await code.autocompletesError(errorcode);
            }
        }
        else{
            var chatroomId;
            switch(command.chatroomidreliance){
                case "terminal":
                    chatroomId = code.retrieveChatroomIdByTerminal(gameId, interaction.channel.id);
                    if(!chatroomId){
                        return ["You must use this command in a valid terminal."];
                    }
                    break;
                case "name":
                    chatroomId = interaction.options.getString("chatroomname");
                    if(!chatroomId){
                        return ["Enter a valid chatroomname to view options."];
                    }
                    break;
                case "optional":
                    chatroomId = interaction.options.getString("chatroomname");
                    //get from terminal if name doesn't exist
                    if(!chatroomId){
                        chatroomId = code.retrieveChatroomIdByTerminal(gameId, interaction.channel.id);
                        if(!chatroomId){
                            return ["Enter a valid name or use this command in a valid terminal."];
                        }
                    }
                    break;
                case "unnecessary":
                    chatroomId = undefined;
                    break;
                default:
                    return ["This command is broken lol"];
            }
            try{
                return await command.retrieveAutocompletes(interaction, gameId, chatroomId);
            }catch(errorcode){
                return await code.autocompletesError(errorcode);
            }
        }
    }
}