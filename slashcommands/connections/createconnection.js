const Discord = require('discord.js');
const conn = require('../../code/connections.js');
const err = require('../../universal_data/errorcodes.json');

module.exports = {
    data: {
        name: 'createconnection',
        description: 'Creates a connection that transmits messages from one channel to another channel.',
        options: [
            {
                name: 'standard',
                description: 'Standard: Sends all messages by all users under sender\'s name and avatar.',
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: 'start_channel',
                        description: 'The channel you want messages to be transmitted from.',
                        required: true,
                        type: Discord.Constants.ApplicationCommandOptionTypes.CHANNEL,
                        channelTypes: [Discord.Constants.ChannelTypes.GUILD_TEXT]
                    },
                    {
                        name: 'end_channel',
                        description: 'The channel you want messages to be transmitted to.',
                        required: true,
                        type: Discord.Constants.ApplicationCommandOptionTypes.CHANNEL,
                        channelTypes: [Discord.Constants.ChannelTypes.GUILD_TEXT]
                    }
                ]
            },
            {
                name: 'anonymous',
                description: 'Anonymous: Sends all messages by all users under a chosen name and avatar.',
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: 'start_channel',
                        description: 'The channel you want messages to be transmitted from.',
                        required: true,
                        type: Discord.Constants.ApplicationCommandOptionTypes.CHANNEL,
                        channelTypes: [Discord.Constants.ChannelTypes.GUILD_TEXT]
                    },
                    {
                        name: 'end_channel',
                        description: 'The channel you want messages to be transmitted to.',
                        required: true,
                        type: Discord.Constants.ApplicationCommandOptionTypes.CHANNEL,
                        channelTypes: [Discord.Constants.ChannelTypes.GUILD_TEXT]
                    },
                    {
                        name: 'username',
                        description: 'The username all messages will be sent under. Leave blank for \"???\".',
                        required: false,
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING
                    },
                    {
                        name: 'avatar',
                        description: 'The avatar all messages will be sent under. Leave blank for ? symbol.',
                        required: false,
                        type: 11 //attachment
                    }
                ]
            },
            {
                name: 'signal',
                description: 'Signal: Sends a pre-defined signal when a player uses /signal. Supports mentions.',
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: 'start_channel',
                        description: 'The channel you want messages to be transmitted from.',
                        required: true,
                        type: Discord.Constants.ApplicationCommandOptionTypes.CHANNEL,
                        channelTypes: [Discord.Constants.ChannelTypes.GUILD_TEXT]
                    },
                    {
                        name: 'end_channel',
                        description: 'The channel you want messages to be transmitted to.',
                        required: true,
                        type: Discord.Constants.ApplicationCommandOptionTypes.CHANNEL,
                        channelTypes: [Discord.Constants.ChannelTypes.GUILD_TEXT]
                    },
                    {
                        name: 'signal',
                        description: 'The signal. #### replaced by the user mentioned in /signal. \"####\" at default.',
                        required: false,
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING
                    }
                ]
            }
        ]
    },
    securitylevel: "host",
    serverreliance: "server",
    async execute(gameId, interaction){
        try{
            var subcommand = interaction.options.getSubcommand();
            var start_channel = interaction.options.getChannel('start_channel').id;
            var end_channel = interaction.options.getChannel('end_channel').id;
            switch(subcommand){
                case "standard":
                    conn.connectionHandler[`${gameId}`].createStandardConnection(start_channel, end_channel);
                    break;
                case "anonymous":
                    var username = interaction.options.getString('username');
                    var avatar = interaction.options.getAttachment('avatar');
                    if(avatar) avatar = avatar.url;
                    conn.connectionHandler[`${gameId}`].createAnonymousConnection(start_channel, end_channel, username, avatar);
                    break;
                case "signal":
                    var signal = interaction.options.getString('signal');
                    conn.connectionHandler[`${gameId}`].createSignalConnection(start_channel, end_channel, signal);
                    break;
                default:
                    await interaction.reply("Such Power... That should have been impossible!").catch(console.error);
                    return err.ERROR_GENERIC_COMMAND_EXECUTE_FAIL;
            }
        }catch(error){
            console.error(error);
            return err.ERROR_GENERIC_COMMAND_EXECUTE_FAIL;
        }
        return err.GOOD_EXECUTE;
    }  
}