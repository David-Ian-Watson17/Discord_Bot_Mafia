const fs = require('fs');
const path = require('path');

//create a map to hold sub command information
const subCommandMap = {};

//retrieve the file names of the subcommands
const subCommandFileNames = fs.readdirSync(path.join(__dirname, `subcommands`));

//populate sub command map
subCommandFileNames.forEach(fileName => {
    try{
        var commandInformation = require(`./subcommands/${fileName}`);
        subCommandMap[`${commandInformation.data.name}`] = commandInformation;
    }catch(error){
        console.log(error);
    }
});

//retrieve command data
const subCommands = [];
var keys = Object.keys(subCommandMap);
keys.forEach(key => {
    subCommands.push(subCommandMap[`${key}`].data);
});

//execute function
const execute = async function(interaction, gameId, senderId, guild){
    //retrieve the subcommand name
    var subCommandName = interaction.options.getSubcommandGroup(false);
    if(!subCommandName) subCommandName = interaction.options.getSubcommand();

    //retrieve subcommand
    const subCommand = subCommandMap[`${subCommandName}`];

    console.log("Executing");

    //execute subCommand
    await subCommand.execute(interaction, gameId, senderId, guild);
}

//retrieve autocompletes
const retrieveAutocompletes = async function(interaction, gameId){
    //retrieve the subcommand name
    var subCommandName = interaction.options.getSubcommandGroup(false);
    if(!subCommandName) subCommandName = interaction.options.getSubcommand();

    //retrieve subcommand
    const subCommand = subCommandMap[`${subCommandName}`];

    //retrieve autocomplettes
    return await subCommand.retrieveAutocompletes(interaction, gameId);
}

module.exports = {
    data: {
        name: "connections",
        description: "Commands related to connections.",
        options: subCommands,
    },
    securitylevel: "admin",
    serverreliance: "server",
    execute: execute,
    retrieveAutocompletes: retrieveAutocompletes,
}