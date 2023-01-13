const DEBUG = 0;

//get Discord
const Discord = require('discord.js');

//get client and token
const client = require('./client.js').client();
const token = require('./token.json').token;

//get modulehandler
const ModuleHandler = require('./handlers/modulehandler.js').ModuleHandler;
const modulehandler = new ModuleHandler(client, token);

//get game manager
const GameManager = require('./classes/gamemanager.js').GameManager;
const gameManager = require('./gamemanager.js').gameManager();

//signal readiness
client.once('ready', async () => {
    console.log("Client ready");
    gameManager.load();
    modulehandler.load();
})

//client error handler
client.on('error', error => {
    console.error(error);
})

client.on('unhandledRejection', error => {
    console.log(error);
});

//login with token
client.login(require('./token.json').token);