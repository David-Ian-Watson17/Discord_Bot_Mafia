const Discord = require('discord.js');
const { SignalConnection } = require('../../code/connections.js');
const conn = require('../../code/connections.js');
const err = require('../../universal_data/errorcodes.json');

module.exports = {
    data: {
        name: "signal",
        description: "Use the signal prepared for this connection.",
        options: [
            {
                name: "user",
                description: "The user you want to mention in your signal.",
                required: false,
                type: Discord.Constants.ApplicationCommandOptionTypes.USER
            }
        ]
    },
    serverreliance: "server",
    securitylevel: "none",
    async execute(gameId, interaction){
        //retrieve user and extract mention if it exists
        var user = interaction.options.getUser('user');
        var mention = null;
        if(user){
            mention = `<@${user.id}>`;
        }

        //prepare reply
        var reply = "";

        //get all connections for this channel
        var connections = conn.connectionHandler[`${gameId}`].getConnectionsForChannel(interaction.channelId);
        
        //check each connection for if it's a signal connection and send if it is
        connections.forEach(connection => {
            if(connection.type == "signal"){
                var success = connection.sendSignal(mention);

                //returns true if sent, false if it needs a mention
                if(success) reply += "Signal sent!\n";
                else reply += "Signal requires mention!\n";
            }
        })

        //no reply means no signal connections
        if(reply == "") reply = "No connections to signal on!";

        //tell the user your job is done!
        await interaction.reply({content: reply, ephemeral: true}).catch(console.error);
        return err.GOOD_EXECUTE;
    }
}