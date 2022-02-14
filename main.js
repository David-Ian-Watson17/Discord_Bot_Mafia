//import discord.js
const Discord = require('discord.js');

//get client
const clientfile = require('./client.js');
clientfile.initializeClient();
const client = clientfile.client();

//get prefix
const prefix = require('./universal_data/prefix.json').prefix;

//fs for reading from/writing to files
const fs = require('fs');

//get necessary code files
const connections = require('./code/connections.js');
const messagelimit = require('./code/channel_limits.js');
const executor = require('./code/executor.js');
const errorcodehandler = require('./code/errormessages.js');

//get errorcodes
const errorcodes = require('./universal_data/errorcodes.json');

var secrets = null;
try{
    secrets = require('./code/secrets.js');
}
catch(err)
{
    console.log("No secrets.js file found");
}

//if there is no gamemap.txt file, make one
if(!fs.existsSync("./data/gamemap.txt"))
{
    fs.writeFileSync("./data/gamemap.txt", "");
}

//if there is no servermap.txt file, make one
if(!fs.existsSync("./data/servermap.txt"))
{
    fs.writeFileSync("./data/servermap.txt", "");
}

//set up client commands
client.commands = new Discord.Collection();
const commandCategories = fs.readdirSync('./commands/');
var commandFiles = [];
for(var directory of commandCategories)
{
    var currentcommandFiles = fs.readdirSync(`./commands/${directory}`).filter(file => file.endsWith('.js'));

    for(var file of currentcommandFiles){
        const command = require(`./commands/${directory}/${file}`);
        if(!command.hasOwnProperty('securitylevel'))
        {
            console.log(`${command.name[0]} does not have a security level!`);
        }
        if(!command.hasOwnProperty('gameidreliance'))
        {
            console.log(`${command.name[0]} does not have a game id reliance!`);
        }
        else{
            commandFiles.push([command.name[0]]);
            for(let i = 0; i < command.name.length; i++){
                client.commands.set(command.name[i], command);
            }
        }
    }
}

//signal readiness
client.once('ready', async () => {
    console.log('BotBoi is online!');
    console.log(commandFiles);
});

/*
Order of operations:
Connections
Commands
Secrets
Memes
*/

client.on('messageCreate', message =>{

    //check channel for message limit
    try{ messagelimit.checkLimits(message.channel); }
    catch(err)
    { console.error(err); }

    //don't listen to bots they sus
    if (message.author.bot) return;

    // Command responses vvv

    var skipcommands = false;
    var skipconnections = false;

    //check for prefix match
    if(message.content.length < prefix.length || message.content.substring(0, prefix.length) != prefix)
        skipcommands = true;

    if(skipcommands == false)
    {
        var returnedcode = executor.execute(message);
        errorcodehandler.logcode(returnedcode);
        errorcodehandler.respondcode(returnedcode, message);
        if(returnedcode == errorcodes.GOOD_EXECUTE)
        {
            skipconnections = true;
        }
    }

    //check for connections and send message
    if(skipconnections == false)
    {
        try{ connections.checkConnections(message); }
        catch(error)
        { console.log(error); }
    }

    //check secrets
    try{ secrets.checkSecrets(message); }
    catch(error)
    { console.log(error); }
});

client.on('error', error => {
    console.log(error);
})

// Have the client log in to the bot

client.login(require('./token.json').token);