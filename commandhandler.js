/*
COMMAND HANDLER

This module prepares and executes slash commands for the bot.

Each slash command is expected to have:
data : the slash command
securitylevel : "owner", "host", "none"
serverreliance : "optional", "server", "name" (Must be "server" to allow autocompletes)
async execute(gameId, interaction) : Execute command code

Each slash command may additionally have:
retrieveAutocompletes(gameId, elementName) : Retrieve autocomplete options for a given elementName for the command
*/

const commandPath = './slashcommands';
const Discord = require('discord.js');
const { Routes } = require('discord-api-types/v9');
const { REST } = require('@discordjs/rest');
const fs = require('fs');
const admin = require('./code/administration.js');
const client = require('./client.js').client();
const token = require('./token.json').token;
const err = require('./universal_data/errorcodes.json');
const slashCommands = [];

//goodClearance
var goodClearance = function(gameId, userId, securityLevel){
    switch(securityLevel){
        case "owner":
            if(admin.isOwner(gameId, userId)) return true;
            return false;
        case "host":
            if(admin.isHost(gameId, userId)) return true;
            return false;
        case "none":
            return true;
    }
}

//getGameId
var getGameId = function(interaction, reliance){
    switch(reliance){
        case "optional":
            var name = interaction.options.getString('gamename');
            if(name == null){
                return admin.gameIdFromServerId(interaction.guildId);
            }
            else{
                return admin.gameIdFromName(name);
            }
        case "server":
            return admin.gameIdFromServerId(interaction.guildId);
        case "name":
            return admin.gameIdFromName(interaction.options.getString('gamename'));
        default:
            return -1;
    }
}

//readySlashCommands
var readySlashCommands = function(){
    //import slash commands
    client.slashCommands = new Discord.Collection();
    const commandSubpaths = fs.readdirSync(commandPath);
    commandSubpaths.forEach(subPath => {
        var slashCommandFiles = fs.readdirSync(`${commandPath}/${subPath}`).filter(file => file.endsWith('.js'));
        for(const file of slashCommandFiles) {
            try{
                //retrieve the command
                const command = require(`${commandPath}/${subPath}/${file}`);
                
                //check that command has requirements
                if(command.data && command.serverreliance && command.securitylevel){
                    
                    //add slash command
                    client.slashCommands.set(command.data.name, command);
                    slashCommands.push(command.data);
                }
                else{
                    console.log(`${file} file doesn't have all requirements!`);
                }
            }catch(error){console.log(error);}
        }
    });

    const rest = new REST({ version: '9' }).setToken(token);
    
    (async () => {
        try{
            console.log('Started refreshing Mafia Helper application (/) commands.');
    
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, "984304103268163615"),
                { body: slashCommands },
            );

            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: slashCommands }
            );
    
            console.log('Successfully reloaded application (/) commands.');
        }catch(error){
            console.error(error);
        }
    })();

    //command executer
    client.on('interactionCreate', async interaction => {
        if(interaction.isCommand()) await handleCommand(interaction);
        if(interaction.isAutocomplete()) await handleAutocomplete(interaction);
    });
}

var handleCommand = async function(interaction){
    //get command
    const command = client.slashCommands.get(interaction.commandName);

    //if command doesn't exist, return
    if(!command) return;

    //handle command
    try{
        //get game id
        var gameid = getGameId(interaction, command.serverreliance);

        //not a valid game, print error message and return
        if(gameid == -1){
            var reply = "";
            switch(command.serverreliance){
                case "server":
                    reply = "We couldn't find a game attached to this server! Add this server to a game to use this command.";
                    break;
                case "name":
                    reply = `We couldn't find a game by the name ${interaction.options.getString('gamename')}! Make sure your spelling is correct.`;
                    break;
                case "optional":
                    if(interaction.options.getString('gamename') == null){
                        reply = "We couldn't find a game attached to this server! Enter the name of a game or add this server to a game to use this command.";
                    }
                    else{
                        reply = `We couldn't find a game by the name ${interaction.options.getString('gamename')}! Make sure your spelling is correct.`;
                    }
                    break;
            }
            await interaction.reply({ content: reply, ephemeral: true }).catch(console.error);
            return;
        }

        //make sure user has correct clearance
        if(!goodClearance(gameid, interaction.user.id, command.securitylevel)){
            await interaction.reply({ content: "You don't have the necessary clearance to use that command!", ephemeral: true }).catch(console.error);
            return;
        }

        //execute command
        var returncode = await command.execute(gameid, interaction);
        
        //print returncode
        if(!interaction.replied){
            printReturnCode(interaction, returncode);
        }
    }catch(error){
        console.error(error);
        try{
            await interaction.reply({ content: "Something went wrong while trying to execute that command!", ephemeral: true }).catch(console.error);
        }
        catch(error){
            console.error(error);
        }
    }
}

var handleAutocomplete = async function(interaction){
    //get command
    const command = client.slashCommands.get(interaction.commandName);

    //if command doesn't exist, or has the wrong serverreliance, return
    if(!command || command.serverreliance != "server") return;

    try{
        //get gameId
        var gameId = getGameId(interaction, "server");
        if(gameId == -1) return;

        //check authority level
        if(!goodClearance(gameId, interaction.user.id, command.securitylevel)){
            await interaction.respond([]);
        } 

        //get autocompletes if they exist
        var autocompletes = await command.retrieveAutocompletes(gameId, interaction);
        if(autocompletes.length > 25){
            autocompletes.splice(25, autocompletes.length - 25);
        }

        //send responses
        const response = await interaction.respond(
            autocompletes.map(choice => ({ name: choice, value: choice })),
        );
    }catch(error){
        console.error(`No autocompletes for ${interaction.commandName}!`);
        return;
    }
}

var printReturnCode = async function(interaction, returncode){
    try{
        var replyset = { content: "", ephemeral: true };
        switch(returncode){
            case err.GOOD_EXECUTE:
                replyset.content = "Executed properly!";
                break;
            case err.ERROR_GENERIC_COMMAND_EXECUTE_FAIL:
            default:
                replyset.content = "Something went wrong!";
                break;
        }
        await interaction.reply(replyset).catch(console.error);
    }catch(error){
        console.error(error);
    }
}

module.exports = {  
    readySlashCommands: readySlashCommands
}