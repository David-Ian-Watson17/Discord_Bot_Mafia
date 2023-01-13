/*
COMMANDHANDLER

This file is dedicated to importing commands from command directories and performing command execution and error checking, 
as well as running any support roles commands need
*/
const fs = require('fs');
const path = require('path');
const Discord = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const admin = require('../administration/administration.js');
const {GameError, err} = require('../GameError.js');

const DEBUG = false;

/** CommandHandler manages the pushing of application commands to the bot itself, as well as handling chat input command interactions that come in
 * @typedef {CommandHandler} CommandHandler
 */
class CommandHandler{

    /** The client this handler uses to process discord events
     * @type {Discord.Client}
     */
    client;

    /** An array of the slash command information
     * @type {Array<Object>}
     */
    slashCommands;

    /** Create a new Command Handler
     * @param {Discord.Client} client 
     */
    constructor(client){
        this.client = client;
        this.slashCommands = [];
        this.client.moduleCommandHandlers = new Discord.Collection();
        this.client.commandNameToModuleMap = new Discord.Collection();
    }

    //retrieveCommand

    /** Retrieve command data from a command folder, requires a module name and path. Can optionally retrieve a custom executor for a module to pass commands from that module through before they execute
     * @param {String} commandpath 
     * @param {String} modulename 
     * @param {String} customexecutorpath 
     */
    retrieveModuleCommands(commandpath, modulename, customexecutorpath){

        //verify the module name is not already present
        if(this.client.moduleCommandHandlers.has(modulename)){
            console.log(`Failed to load commands for module ${modulename}. Conflicting name.`);
            return;
        }

        //create a new modulecommandhandler for this module
        var mCH = new ModuleCommandHandler(customexecutorpath);

        //add the modulecommandhandler to the client's collection
        this.client.moduleCommandHandlers.set(modulename, mCH);

        //retrieve the command files
        var commandfiles = fs.readdirSync(path.join(__dirname, commandpath));

        //prep the command with necessary information
        commandfiles.forEach(file => {

            //if the file is in fact a file
            if(this.isFile(path.join(__dirname, `${commandpath}/${file}`))){
                try{

                    //retrieve the command
                    var command = require(`${commandpath}/${file}`);

                    //if it fulfills the requirements
                    if(this.requirementsMet(command)){

                        //if the command name is already in the map, modify the name to have the module name in front
                        if(this.client.commandNameToModuleMap.has(command.data.name)){
                            command.data.name = `${modulename}${command.data.name}`;

                            //if that wasn't enough to set it apart, increment a following number until it's fine
                            if(this.client.commandNameToModuleMap.has(command.data.name)){
                                var oldname = command.data.name;
                                var i = 0;
                                while(this.client.commandNameToModuleMap.has(command.data.name)){
                                    command.data.name = `${oldname}${i}`;
                                    i++;
                                }
                            }
                        }
                        
                        //check to see if it needs a game name option as prep work
                        switch(command.serverreliance){
                            case "optional":
                                this.addGameNameOption(command.data, true);
                                break;
                            case "name":
                                this.addGameNameOption(command.data, false);
                                break;
                            default:
                        }

                        //add the command to the module command handler it belongs to
                        mCH.addCommand(command);

                        //push the command data to the slash commands array
                        this.slashCommands.push(command.data);

                        //set the name map entry
                        this.client.commandNameToModuleMap.set(`${command.data.name}`, `${modulename}`);
                    }
                }catch(error){
                    console.log(error);
                }
            }
        });
    }

    /** Send this class's slashCommands to the bot
     */
    updateCommands(){

        //retrieve REST
        const rest = new REST({ version: '9' }).setToken(require('../token.json').token);

        //refresh application commands
        (async () => {
            try{
                console.log('Started refreshing application (/) commands.');

                //if in debug mode
                if(DEBUG){

                    //put them into test guild
                    await rest.put(
                        Routes.applicationGuildCommands(this.client.user.id, "981286460449783809"),
                        { body: this.slashCommands }
                    );
                }

                //if not in debug mode
                else{

                    //upload them to the main bot
                    await rest.put(
                        Routes.applicationCommands(this.client.user.id),
                        { body: this.slashCommands }
                    );
                }

                console.log('Successfully reloaded application (/) commands.');
            }catch(error){
                console.error(error);
            }
        })();
    }

    /** Sends commands to the bot using updateCommands and then starts the interaction checker
     */
    startHandler(){

        //send commands to the bot
        this.updateCommands();

        //start checking for interactions
        this.client.on('interactionCreate', async interaction => {
            if(interaction.isCommand()) await this.handleCommand(interaction);
            if(interaction.isAutocomplete()) await this.handleAutocomplete(interaction);
        });
    }

    /** In order to function, commands with a serverreliance of "name" or "optional" need an option of type STRING and name "gamename".
     * This function adds that option to every subcommand in a command recursively
     * @param {Object} command 
     * @param {Boolean} optional 
     */
    addGameNameOption(command, optional){
        //if there isn't an options array in place, set one up
        if(!command.options){
            command.options = [];
        }

        //if the command is a subcommand...
        if(!command.type || command.type == Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND){
            //delete any options already named "gamename"
            for(var i = 0; i < command.options.length; i++){
                if(command.options[i].name == "gamename"){
                    command.options.splice(i, 1);
                    i--;
                }
            }
            //setup new option for "gamename" depending on whether it's optional or not
            var newoption;
            if(optional){
                newoption = {
                    name: "gamename",
                    description: "(Optional) The name of the game.",
                    type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                    required: false,
                    autocomplete: true
                }
                //optional stuff gets added to the end to abide by discord's need for required things to be first
                command.options.push(newoption);
            }
            else{
                newoption = {
                    name: "gamename",
                    description: "The name of the game.",
                    type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                    required: true,
                    autocomplete: true
                }
                //mandatory stuff gets added to the front to abide by discord's need for required things to be first
                command.options.unshift(newoption);
            }
        }

        //if it's a sub command group...
        else if(command.type == Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP){
            //repeat the process for each option
            command.options.forEach(option => {
                this.addGameNameOption(option);
            });
        }
    }

    /** Obtains the id for a game based off its serverreliance among other factors
     * @param {Discord.Interaction} interaction 
     * @returns {(String|undefined)} The id if found, or undefined if not
     */
    retrieveGameId(interaction){

        //retrieve the command name
        const commandName = interaction.commandName;

        //retrieve the module name
        const moduleName = this.client.commandNameToModuleMap.get(commandName);
        if(!moduleName) return undefined;

        //retrieve the module command handler
        var mCH = this.client.moduleCommandHandlers.get(moduleName)
        if(!mCH) return undefined;

        //retrieve the command
        var command = mCH.slashCommands.get(commandName);
        if(!command) return undefined;

        //obtain serverreliance
        var serverreliance = command.serverreliance;

        //retrieve gameId from the interaction based on command's serverreliance
        var gameId;
        var guildId;
        var name;
        switch(serverreliance){
            case "server":
                guildId = interaction.guild.id;
                gameId = admin.getIdForGuild(guildId);
                return gameId;
            case "name":
                gameId = interaction.options.getString("gamename");
                return gameId;
            case "optional":
                gameId = interaction.options.getString("gamename");
                if(gameId){
                    return gameId;
                }
                guildId = interaction.guild.id;
                gameId = admin.getIdForGuild(guildId);
                return gameId;
            case "unnecessary":
                return "unneeded";
            default:
                return undefined;
        }
    }

    /** Verifies a requester's clearance to use a given command
     * @param {Discord.Interaction} interaction 
     * @param {String} gameId 
     * @param {String} senderId 
     * @returns {Boolean} Returns true if the requester has necessary clearance to use this command, false otherwise
     */
    verifySecurityClearance(interaction, gameId, senderId){

        //if the gameId is unneeded, then it's a command that anyone can use
        if(gameId == "unneeded"){
            return true;
        }

        //get command name
        const commandName = interaction.commandName;

        //get module name
        const moduleName = this.client.commandNameToModuleMap.get(commandName);
        if(!moduleName) return false;

        //get module handler
        const mCH = this.client.moduleCommandHandlers.get(moduleName);
        if(!mCH) return false;

        //get command
        var command = mCH.slashCommands.get(commandName);
        if(!command) return false;

        //obtain security level
        var securitylevel = command.securitylevel;
        
        //determine if requester's security level is good enough
        switch(securitylevel){
            case "owner":
                if(admin.isOwner(gameId, senderId)){
                    return true;
                }
                return false;
            case "admin":
                if(admin.isAdmin(gameId, senderId)){
                    return true;
                }
                return false;
            case "none":
                return true;
            default:
                console.error(`Invalid security level detected: ${securitylevel}`);
                return false;
        }
    }

    /** Accepts an incoming command interaction and processes it
     * @param {Discord.Interaction} interaction 
     */
    async handleCommand(interaction){
        
        //get command name
        const commandName = interaction.commandName;

        //get module name
        const moduleName = this.client.commandNameToModuleMap.get(commandName);
        if(!moduleName) return;

        //get module handler
        const mCH = this.client.moduleCommandHandlers.get(moduleName);
        if(!mCH) return;

        //get command
        const command = mCH.slashCommands.get(commandName);
        if(!command) return;

        //get send information
        const senderId = interaction.user.id;
        var guild = undefined;
        if(interaction.member){
            guild = interaction.member.guild;
        }

        //handle command
        try{
            
            //retrieve the game id
            var gameId = this.retrieveGameId(interaction);

            //if there is no game id
            if(!gameId){
                await interaction.reply({content: "Could not determine a valid game to associate with that command!", ephemeral: true});
                return;
            }

            //if the user has sufficient clearance for the command, execute it
            if(this.verifySecurityClearance(interaction, gameId, senderId)){

                //execute command
                await mCH.execute(command, interaction, gameId, senderId, guild);

                //make sure the interaction is replied to in some way if the command or module executor didn't handle it
                if(!interaction.replied){
                    await interaction.reply({content: "The command executed without errors.", ephemeral: true});
                }
            }
        }catch(error){
            this.handleError(interaction, error);
        }
    }

    /** Accepts an incoming autocomplete interaction and processes it
     * @param {Discord.Interaction} interaction 
     * @returns 
     */
    async handleAutocomplete(interaction){

        //get command name
        const commandName = interaction.commandName;

        //get module name
        const moduleName = this.client.commandNameToModuleMap.get(commandName);
        if(!moduleName){
            await interaction.respond([]);
            return;
        }

        //get module handler
        const mCH = this.client.moduleCommandHandlers.get(moduleName);
        if(!mCH){
            await interaction.respond([]);
            return;
        }

        //get command
        const command = mCH.slashCommands.get(commandName);
        if(!command){
            await interaction.respond([]);
            return;
        }

        //check if it's for a gamename
        var focusedelement = interaction.options.getFocused(true);
        if(focusedelement.name == "gamename" && focusedelement.type == "STRING"){
            var autocompletearray = [];
            switch(command.securitylevel){
                case "admin":
                    autocompletearray = admin.autocompletesAllAdminedBy(interaction.user.id).filter(game => game.name.startsWith(focusedelement.value));
                    break;
                case "owner":
                    autocompletearray = admin.autocompletesAllOwnedBy(interaction.user.id).filter(game => game.name.startsWith(focusedelement.value));
                    break;
                default:
            }
            try{
                await interaction.respond(autocompletearray);
            }catch(error){
                console.error(error);
                if(!interaction.replied){
                    await interaction.respond([]);
                }
            }
            return;
        }

        //handle autocomplete
        try{
            //retrieve game id
            var gameId = this.retrieveGameId(interaction);

            //retrieve autocompletes array
            var autocompletes = await mCH.retrieveAutocompletes(command, interaction, gameId);

            //trim to proper length
            if(autocompletes.length > 25){
                autocompletes.splice(25, autocompletes.length - 25);
            }

            //if the autocompletes are properly formatted already, format and send
            if(autocompletes[0] && autocompletes[0].name && autocompletes[0].value){
                
                //ensure each name is of a proper length
                autocompletes.forEach(autocomplete => {
                    if(autocomplete.name.length > 100){
                        autocomplete.name = `${autocomplete.name.substring(0, 97)}...`;
                    }
                })
                await interaction.respond(
                    autocompletes
                );
            }

            //otherwise, respond with a map of the individual values to both name and value
            else{
                autocompletes.forEach(autocomplete => {
                    if(autocomplete.length > 100) autocomplete = `${autocomplete.substring(0, 97)}...`;
                })
                await interaction.respond(
                    autocompletes.map(choice => ({ name: choice, value: choice})),
                );
            }
        }catch(error){
            console.error(error);
            try{
                await interaction.respond([]);
            }
            catch(error){};
            return;
        }
    }

    /** Print an error as properly as possible
     * @param {Discord.Interaction} interaction 
     * @param {Object} error 
     */
    async handleError(interaction, error){
        if(!interaction.replied){
            if(error instanceof GameError){
                await interaction.reply({content: error.message, ephemeral: true});
            }
            else{
                await interaction.reply({content: "Something went wrong while executing that command!", ephemeral: true});
                console.log(error);
            }
        }
        else{
            console.log(error);
        }
    }

    /*
    HELPERS
    */

    /** Returns whether a command has everything it needs
     * @param {Object} command 
     * @returns {Boolean} Returns true if the command has everything it needs to function as a command in this handler. False otherwise
     */
    requirementsMet(command){
        if(command && command.data && command.securitylevel && command.serverreliance && command.execute){
            return true;
        }
        return false;
    }

    /** Returns whether the path represents a file
     * @param {String} path 
     * @returns {Boolean} Whether the path represents a file or not
     */
    isFile(path){
        try{
            var stat = fs.lstatSync(path);
            return stat.isFile();
        } catch(e){
            //lstatSync throws an error if path doesn't exist
            return false;
        }
    }

    //autocompletes for gamename
    retrieveGameNameAutocompletesAdmin(userId){
        return admin.allAdminedBy(userId);
    }

    retrieveGameNameAutocompletesOwner(userId){
        return admin.allOwnedBy(userId);
    }
}

/** Keeps track of command data and other information pertinent to commands for a module
 * @typedef {ModuleCommandHandler} ModuleCommandHandler
 */
class ModuleCommandHandler{
    
    /** The slash commands with their data
     * @type {Discord.Collection<String, Object>}
     */
    slashCommands;

    /** The path to the custom executor if any exists
     * @type {String}
     */
    customexecutorpath;

    /** Create a new Module Command Handler
     * @param {String} customexecutorpath 
     */
    constructor(customexecutorpath){
        this.slashCommands = new Discord.Collection();
        this.customexecutorpath = customexecutorpath;
    }

    /** Adds a command to this handler's set of slash commands
     * @param {Object} command
     */
    addCommand(command){

        //if this module has a custom executor
        if(this.customexecutorpath){

            try{
                //retrieve the executor
                var customexecutor = require(this.customexecutorpath);

                //see if it has the option to prep a command before adding it to array
                if(customexecutor.prepCommand){
                    customexecutor.prepCommand(command);
                }
            }catch(error){
                console.log(error);
            }
        }

        //add command to slash commands
        this.slashCommands.set(command.data.name, command);
    }

    /** Execute a command
     * @param {Object} command 
     * @param {Discord.Interaction} interaction 
     * @param {String} gameId 
     * @param {String} senderId 
     * @param {Discord.Guild} guild 
     * @returns {Object} The return value
     */
    async execute(command, interaction, gameId, senderId, guild){

        //if this module has a custom executor
        if(this.customexecutorpath){
            
            try{
                //retrieve the executor
                var customexecutor = require(this.customexecutorpath);
            }catch(error){
                console.log(error);
            }
                
            //see if it has the option to execute a command
            if(customexecutor.execute){
                await customexecutor.execute(command, interaction, gameId, senderId, guild);
                return;
            }
        }

        //if there is no custom executor or it didn't have the option to execute, execute directly
        await command.execute(interaction, gameId, senderId, guild);
    }

    /** Retrieve autocompletes
     * @param {Object} command 
     * @param {Discord.Interaction} interaction 
     * @param {String} gameId 
     * @returns {Array<Object>} The autocompletes
     */
    async retrieveAutocompletes(command, interaction, gameId){

        //if this module has a custom executor
        if(this.customexecutorpath){

            try{
                //retrieve the executor
                var customexecutor = require(this.customexecutorpath);
            }catch(error){
                console.log(error);
            }

            //see if it has the option to retrieve autocompletes
            if(customexecutor.retrieveAutocompletes){
                return await customexecutor.retrieveAutocompletes(command, interaction, gameId);
            }
        }

        //if there is no custom executor or it didn't have the option to retrieve autocompletes, retrieve them directly
        return await command.retrieveAutocompletes(interaction, gameId);
    }
}

module.exports = {
    CommandHandler: CommandHandler
}