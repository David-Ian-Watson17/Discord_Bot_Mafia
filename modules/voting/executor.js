const Discord = require('discord.js');
const code = require('./code.js');
const datahandler = require('./code/DataHandler.js');

const {err, VotingError} = require('./code/VotingError.js');

/** Adds managername as an option to a command or its subcommands. Has different methods for doing this
 * based on whether it's optional or mandatory
 * @param {Object} command 
 * @param {Boolean} optional 
 */
const addVotingSystemNameToCommand = function(command, optional){
    if(!command.options){
        command.options = [];
    }
    if(!command.type || command.type == Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP){
        if(command.options){
            command.options.forEach(option => {
                addVotingSystemNameToCommand(option);
            })
        }
    }
    if(command.type == Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND){
        for(var i = 0; i < command.options.length; i++){
            if(command.options[i].name == "votingsystemname"){
                command.options.splice(i, 1);
                i--;
            }
        }
        if(optional){
            var newoption = {
                name: "votingsystemname",
                description: "The name of the voting system (choose an autocomplete).",
                type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                required: false,
                autocomplete: true
            }
            command.options.push(newoption);
        }
        else{
            var newoption = {
                name: "votingsystemname",
                description: "The name of the voting system (choose an autocomplete).",
                type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                required: true,
                autocomplete: true
            }
            command.options.unshift(newoption);
        }
    }
}

/** Preps a command, adding or removing necessary parts of its data to prepare to be sent as an application command.
 * @param {Object} command 
 */
const prepCommand = function(command){
    if(command.votingclientidreliance){
        if(command.votingclientidreliance == "name"){
            addVotingSystemNameToCommand(command.data, false);
        }
        else if(command.votingclientidreliance == "optional"){
            addVotingSystemNameToCommand(command.data, true);
        }
    }
}

/** Retrieve manager id and then execute command
 * @param {Object} command 
 * @param {Discord.Interaction} interaction 
 * @param {String} gameId 
 * @param {String} senderId 
 * @param {Discord.Guild} guild 
 */
const execute = async function(command, interaction, gameId, senderId, guild){
    var clientId = null;
    var votingClientManager = datahandler.retrieveVotingClientManager(gameId);
    switch(command.votingclientidreliance){
        case "name":
            //retrieve the id from the name option
            clientId = interaction.options.getString("votingsystemname");

            //if the id doesn't exist or is invalid
            if(!votingClientManager.cache.has(clientId)){

                //report the failure and return
                if(!interaction.replied){
                    await interaction.reply({content: "You need to select a valid voting system!", ephemeral: true});
                }
                return;
            }
            break;
        case "channel":
            //retrieve the id from the channel
            clientId = votingClientManager.channelMap.get(interaction.channel.id);
            
            //if the id doesn't exist or is invalid
            if(!clientId || !votingClientManager.cache.has(clientId)){
                
                //report the failure and return
                if(!interaction.replied){
                    await interaction.reply({content: "You need to use this command in a valid channel!", ephemeral: true});
                }
                return;
            }
            break;
        case "optional":
            //attempt to retrieve the id from a name option
            clientId = interaction.options.getString("votingsystemname");

            //if the id doesn't exist or is invalid
            if(!clientId || !votingClientManager.cache.has(clientId)){

                //attempt to retrieve the id from a channel
                clientId = votingClientManager.channelMap.get(interaction.channel.id);
                
                //if the id still doesn't exist or is invalid
                if(!clientId || !votingClientManager.cache.has(clientId)){

                    //report the failure and return
                    if(!interaction.replied){
                        await interaction.reply({content: "You either need to enter a valid voting system or use this command in a valid channel."});
                    }
                    return;
                }
            }
            break;
        case "unnecessary":
            break;
    }
    try{
        await command.execute(interaction, gameId, senderId, guild, clientId);
    }catch(error){
        await code.replyToInteractionBasedOnReturnCode(interaction, error);
    }
}

/** Retrieve autocompletes
 * @param {Object} command 
 * @param {Discord.Interaction} interaction 
 * @param {String} gameId 
 * @returns {Array<Object>}
 */
const retrieveAutocompletes = async function(command, interaction, gameId){
    
    //if the option being focused is the name
    if(interaction.options.getFocused(true).name == "votingsystemname"){


        //if the command requires a certain type of voting client
        if(command.specificvotingclients == "yes"){

            //let the command handle autocompletes
            try{
                return await command.retrieveAutocompletes(interaction, gameId, null);
            }
            catch(error){
                return code.autocompletesError(error);
            }
        }

        //else return all votingsystem autocompletes
        try{
            return code.autocompletesAllVotingSystemIds(gameId, interaction.user.id, interaction.options.getFocused());
        }catch(error){
            return code.autocompletesError(error);
        }
    }
    else{
        var clientId = null;
        var votingClientManager = datahandler.retrieveVotingClientManager(gameId);
        switch(command.votingclientidreliance){
            case "name":
                //retrieve the id from the name option
                clientId = interaction.options.getString("votingsystemname");

                //if the id doesn't exist or is invalid
                if(!votingClientManager.cache.has(clientId)){

                    //report the failure and return
                    return ["You need to select a valid voting system!"];
                }
                break;
            case "channel":
                //retrieve the id from the channel
                clientId = votingClientManager.channelMap.get(interaction.channel.id);
                
                //if the id doesn't exist or is invalid
                if(!clientId || !votingClientManager.cache.has(clientId)){
                    
                    //report the failure and return
                    return ["You need to use this command in a valid channel!"];
                }
                break;
            case "optional":
                //attempt to retrieve the id from a name option
                clientId = interaction.options.getString("votingsystemname");

                //if the id doesn't exist or is invalid
                if(!clientId || !votingClientManager.cache.has(clientId)){

                    //attempt to retrieve the id from a channel
                    clientId = votingClientManager.channelMap.get(interaction.channel.id);
                    
                    //if the id still doesn't exist or is invalid
                    if(!clientId || !votingClientManager.cache.has(clientId)){

                        //report the failure and return
                        return ["Enter a valid voting system or use this in a valid channel!"];
                    }
                }
                break;
            case "unnecessary":
                break;
        }
        try{
            return await command.retrieveAutocompletes(interaction, gameId, clientId);
        }
        catch(error){
            return code.autocompletesError(error);
        }
    }
}

module.exports = {
    prepCommand: prepCommand,
    execute: execute,
    retrieveAutocompletes: retrieveAutocompletes
}