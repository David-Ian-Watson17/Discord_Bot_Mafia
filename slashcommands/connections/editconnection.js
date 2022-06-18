const Discord = require('discord.js');
const conn = require('../../code/connections.js');
const err = require('../../universal_data/errorcodes.json');

module.exports = {
    data: {
        name: "editconnection",
        description: "(Host Required) Change an aspect of a connection.",
        options: [
            {
                name: "anonymous",
                description: "(Host Required) Change an aspect of an anonymous connection.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "connection",
                        description: "The connection you would like to modify.",
                        required: true,
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        autocomplete: true
                    },
                    {
                        name: "username",
                        description: "The username messages are sent under. Leave blank to leave unchanged.",
                        required: false,
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING
                    },
                    {
                        name: "avatar",
                        description: "The avatar messages are sent under. Leave blank to leave unchanged.",
                        required: false,
                        type: 11 //attachment
                    }
                ]
            },
            {
                name: "signal",
                description: "(Host Required) Change an aspect of a signal connection.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "connection",
                        description: "The connection you would like to modify.",
                        required: true,
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        autocomplete: true
                    },
                    {
                        name: "signal",
                        description: "The signal used by /signal. Leave blank to leave as is.",
                        required: false,
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING
                    }
                ]
            }
        ]
    },
    serverreliance: "server",
    securitylevel: "host",
    async execute(gameId, interaction){
        //retrieve index
        var connectionstring = interaction.options.getString('connection');
        connectionstring = connectionstring.split(" ")[0];
        var index = connectionstring.replace(/\D/g, '');
        index--;

        //retrieve subcommand
        var subcommand = interaction.options.getSubcommand();
        switch(subcommand){
            case "anonymous":
                var newUsername = interaction.options.getString('username');
                var newAvatar = interaction.options.getAttachment('avatar');
                var reply = { content: "", ephemeral: true };
                var changed = false;
                if(newUsername && newUsername != "" && newUsername.length <= 80){
                    var returncode = conn.connectionHandler[`${gameId}`].setAnonymousConnectionUsername(index, newUsername);
                    if(returncode == err.GOOD_EXECUTE){
                        changed = true;
                        reply.content += `Username successfully changed to ${newUsername}!\n`;
                    }
                    else{
                        reply.content += `Something went wrong while trying to change username!\n`;
                    }
                }
                if(newAvatar){
                    var returncode = conn.connectionHandler[`${gameId}`].setAnonymousConnectionAvatar(index, newAvatar.url);
                    if(returncode == err.GOOD_EXECUTE){
                        changed = true;
                        reply.content += `Avatar successfully changed!\n`;
                        reply.files = [newAvatar];
                    }
                    else{
                        reply.content += `Something went wrong while trying to change avatar!\n`;
                    }
                }
                if(!changed){
                    reply.content = "No change made!";
                }
                await interaction.reply(reply).catch(console.error);
                return err.GOOD_EXECUTE;
            case "signal":
                var newSignal = interaction.options.getString('signal');
                if(newSignal == null){
                    await interaction.reply({content: "No change made!", ephemeral: true }).catch(console.error);
                    return err.GOOD_EXECUTE;
                }
                var returncode = conn.connectionHandler[`${gameId}`].setSignalConnectionSignal(index, newSignal);
                return returncode;
            default:
                return err.ERROR_GENERIC_COMMAND_EXECUTE_FAIL;
        }
    },
    async retrieveAutocompletes(gameId, interaction){
        try{
            var subcommand = interaction.options.getSubcommand();
            var value = interaction.options.getFocused(true).value;
            var connections = conn.connectionHandler[`${gameId}`].getAllCompleteConnections();
            var returnoptions = [];
            var index = 1;
            connections.forEach(connection => {
                if(connection.connection.type == subcommand){
                    var connectionstring = connection.connection.toString();
                    if(connectionstring.includes(value) || index.toString().includes(value))
                    {
                        returnoptions.push(`${index} : ${connectionstring}`);
                    }
                }
                index++;
            });
        }catch(error){
            console.error(error);
            return [];
        }
        return returnoptions;
    }
}