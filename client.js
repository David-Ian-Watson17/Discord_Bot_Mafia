var client;
var initialized = false;

var initializeClient = function()
{
    var Discord = require('discord.js');
    client = new Discord.Client({ intents: require('./intents.json').intents});
}

module.exports = {
    client()
    {
        if(!initialized)
        {
            initializeClient()
            initialized = true;
        }
        return client;
    }
}