const fs = require('fs');
const path = require('path');
const Discord = require('discord.js');

var command = {
    name: "administration",
    description: "Administration",
    options: [

    ]
}

var subcommanddata = [];

const loadSubCommands = function(){
    var commandfiles = fs.readdirSync(path.join(__dirname, './commands'));
    commandfiles.forEach(commandfile => {
        var subcommand = require(`./commands/${commandfile}`);
        command.options.push(subcommand.data);
        subcommanddata.push({"name": subcommand.name, "securitylevel": subcommand.securitylevel, "serverreliance": subcommand.serverreliance});
    })
}

module.exports = {
    data: command,
    subcommandinformation: subcommanddata,
    loadSubCommands: loadSubCommands
}