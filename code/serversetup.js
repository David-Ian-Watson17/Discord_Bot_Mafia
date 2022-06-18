const client = require('../client.js').client();
const Discord = require('discord.js');
const fs = require('fs');
const dir = './games'
const admin = require('./administration.js');
const prefix = require('../universal_data/prefix.json').prefix;

const defaultdescription = "Welcome! " +
"Join our hub server if you haven't!\nhttps://discord.gg/vzQT5mqCN5"
const defaultrules = "The game can only run if we all follow the rules of the game, therefore be sure to abide them so that we can all have fun time together. The repercussions of the rules might be altered at the digression of the host depending on the situation. More rules may be created should the need arise.\n" +
                    "\`\`\` \`\`\`\n" +
                    "**Major Rules:**\nBreaking any of these will result in a modkill\n" +
                    "**・・・・・・・・・・・・・・・・・・・・・・・・・・**\n" + 
                    "**1. No game talk outside intended channels/servers**\n" + 
                    "Do not communicate outside the game about events occurring in the game, be it other server or private messages. Players caught doing so will be mod killed. Only players who are authorized to talk with each other may speak with each other about the game privately and will be given the means to do so.\n" +
                    "**2. Do not post screenshot of DMS with host**\n" +
                    "Do not post pictures of any private messages between you and the host. This includes your role, and any other messages that confirm that your action failed or succeeded. You are free to allege these things, but not provide photo or video evidence.\n" +
                    "**3. Do not fabricate evidence**\n" +
                    "Do not post fake photos about Private Messages, or any photos that are edited in any way. You may post screenshots of things that other people said so long as they are not edited.”\n" +
                    "**4. Do not cheat by modifying any message you have posted**\n" +
                    "Do not delete or edit messages that you have posted in day chat to make it seem as if you said something else or never said something. If you are caught doing so, you will be mod killed. (We have audit log so we can tell if you did). If you want to clarify of fix typos, it's more preferable to do it in a new comment\n" +
                    "**5. Report attempts to break the rules**\n" +
                    "Failure to do so is considered as willingness to break rules and can result in a mod kill.\n" +
                    "\`\`\` \`\`\`\n" +
                    "**Minor Rules:**\n" +
                    "Players who break any of the following rules will be given one of three strikes. Should a player receive all three strikes, they will be mod killed.\n" +
                    "**・・・・・・・・・・・・・・・・・・・・・・・・・・**\n" +
                    "**1. Do not post in the day chat during a night phase**\n" +
                    "**2. Do not post in the night chat during a day phase**\n" +
                    "**3. Do not game talk during night phase**\n" +
                    "Do not make any arguments, share theories, ask questions of other players, etc. during a night phase in night chat. Night chat is for casual hanging out only\n" +
                    "**4. Do not post NSFW. Period.**\n" +
                    "**5. Keep everything in its appropriate channel**\n" +
                    "**6. Be Respectful**\n" +
                    "Should your conduct beyond how you make an argument cause someone to be uncomfortable, you will be requested to refrain from repeating such behavior. Corrections in this sense will not be used to stop someone from making an argument as to why a player should be lynched or why they told a falsehood, etc. But unwelcome name calling, provocation, and personal attacks will not be tolerated.\n" +
                    "**7. Do not try to use loophole if you are given special limitations**\n" +
                    "If you are given any special limitations, like unable to communicate for the rest of the day phase or the like, do not attempt to send messages through your username, profile picture, etc.\n" +
                    "\`\`\` \`\`\`\n" +
                    "**High Offense:**\n" +
                    "Breaking any of these will expunge you from the game and may not be allowed to participate in future games\n" +
                    "**・・・・・・・・・・・・・・・・・・・・・・・・・・**\n" +
                    "**1. Do not make false allegations**\n" +
                    "Do not fabricate false allegations against another player in regards to whether or not they broke a rule in hopes that they might get mod killed and give you an advantage, or to get back at them for some personal reason, or any other reason this might occur.\n" +
                    "**2. Do not exaggerate real life situation**\n" +
                    "Do not privately or publicly falsify or exaggerate a real life situation that causes you to request special accommodations that prevents you from playing, voting, performing actions, speaking, or any action associated with the game of mafia.\n" +
                    "**3. Do not pressure host as a way to sway player opinion**\n" +
                    "Do not make false allegations against the Host or the Co-Host to sway the opinion of the player-base in order to attempt and apply pressure on the Host or Co-Host to give yourself any kind of advantage in-game.\n" +
                    "**4. Do not openly attempt to cast a negative light on the Host**\n" +
                    "Should you have a complaint, take it up with the Host and the Co-Host privately. All other expressions of complaints are inappropriate and will interfere with the function of the game.\n" +
                    "**5. Do not block anyone in the game during game phase**\n" +
                    "Do not block player or host during game phase for any reason. Leave your interpersonal problems at the door. They don’t belong in a mafia game, we are all there to have fun, regardless of our past interactions.\n" +
                    "\`\`\` \`\`\`";
const defaultshoutoutdescription = "Welcome to the player shoutouts channel!\n\n" +
    "A certain number of times per day, decided on by the host, you may send a host a message to be posted here. All alive players will be notified when this has been sent. This can be anything, but bear in mind, you have a limited number of uses. It is recommended you send important requests, instructions, or pieces of information here.";

var defaultserversetup = function(server)
{
    //delete all channels except the one where command was written
    var channels = server.channels.cache.toJSON();
    for(var i = 0; i < channels.length; i++)
    {
        deletesync(channels[i]);
    }

    //delete all roles not in use by the bot (or everyone)

    //first remove all roles from all non-bot members if possible
    var guildmembers = server.members.cache.toJSON();
    for(var i = 0; i < guildmembers.length; i++)
    {
        if(!guildmembers[i].user.bot)
        {
            try{
                removerolessync(guildmembers[i], guildmembers[i].roles.cache);
            }
            catch(error)
            {
                console.log(`Defaultserver: ${error}`);
            }
        }
    }

    //now delete all roles with no members
    var roles = server.roles.cache.toJSON();
    for(var i = 0; i < roles.length; i++)
    {
        if(roles[i].members.toJSON().length == 0)
        {
            try{
                deletesync(roles[i]);
            }
            catch(error)
            {
                console.log(`defaultserver: ${error}`);
            }
        }
    }

    //create host role
    server.roles.create({
            name: "Host",
            color: "YELLOW",
            mentionable: true,
            permissions: ["ADMINISTRATOR"]
    }).catch(error => {console.log(error)});

    //create player role
    server.roles.create({
        name: "Player",
        color: "RED",
        mentionable: true,
        permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "MENTION_EVERYONE", "USE_EXTERNAL_EMOJIS", "CONNECT", "SPEAK", "CHANGE_NICKNAME"]
    }).catch(error => {console.log(error)});

    //create observer role
    server.roles.create({
        name: "Observer",
        color: "BLUE",
        mentionable: true,
        permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "MENTION_EVERYONE", "USE_EXTERNAL_EMOJIS", "CONNECT", "SPEAK", "CHANGE_NICKNAME"]
    }).catch(error => {console.log(error)});

    //create dead role
    server.roles.create({
        name: "Dead",
        color: "PURPLE",
        mentionable: true,
        permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "MENTION_EVERYONE", "USE_EXTERNAL_EMOJIS", "CONNECT", "SPEAK", "CHANGE_NICKNAME"]
    }).catch(error => {console.log(error)});

    //create pregame category
    var pregameid;
    server.channels.create("PREGAME", {type: "GUILD_CATEGORY"}).then(channel => {
        pregameid = channel.id;
        server.channels.create("welcome", {type: "GUILD_TEXT"}).then(chann => {
            chann.setParent(pregameid);
            chann.overwritePermissions([{ id: chann.guild.roles.everyone, deny: ['SEND_MESSAGES'], }]).catch(console.log);
        }).catch(error => {});
        server.channels.create("pregame-chat", {type: "GUILD_TEXT"}).then(chann => {
            chann.setParent(pregameid);
        }).catch(error => {});
    }).catch(error => {});    //category

    //create information section
    var informationid
    server.channels.create("INFORMATION", {type: "GUILD_CATEGORY"}).then(channel => {
        informationid = channel.id;
        channel.permissionOverwrites.edit(channel.guild.roles.everyone, { SEND_MESSAGES: false }).catch(console.log);
        server.channels.create("announcements", {type: "GUILD_TEXT"}).then(chann => {
            chann.setParent(informationid);
        }).catch(error => {});
        server.channels.create("new-players", {type: "GUILD_TEXT"}).then(chann => {
            chann.setParent(informationid);
            admin.sendmessage(defaultdescription, chann);
        }).catch(error => {});
        server.channels.create("rules", {type: "GUILD_TEXT"}).then(chann => {
            chann.setParent(informationid);
            admin.sendmessage(defaultrules, chann);
        }).catch(error => {});
        server.channels.create("questions", {type: "GUILD_TEXT"}).then(chann => {
            chann.setParent(informationid);
        }).catch(error => {});
    }).catch(error => {});

    //create game section
    var gameid;
    server.channels.create("GAME", {type: "GUILD_CATEGORY"}).then(channel => {
        gameid = channel.id;
        channel.permissionOverwrites.edit(channel.guild.roles.everyone, { SEND_MESSAGES: false }).catch(console.log);
        server.channels.create("day", {type: "GUILD_TEXT"}).then(chann => {
            chann.setParent(gameid);
        }).catch(error => {});
        server.channels.create("night", {type: "GUILD_TEXT"}).then(chann => {
            chann.setParent(gameid);
        }).catch(error => {});
        server.channels.create("voting", {type: "GUILD_TEXT"}).then(chann => {
            chann.setParent(gameid);
        }).catch(error => {});
        server.channels.create("player-shoutouts", {type: "GUILD_TEXT"}).then(chann => {
            chann.setParent(gameid);
            chann.send(defaultshoutoutdescription);
        }).catch(error => {});
        server.channels.create("last-wills", {type: "GUILD_TEXT"}).then(chann => {
            chann.setParent(gameid);
        }).catch(error => {});
        server.channels.create("graveyard", {type: "GUILD_TEXT"}).then(chann => {
            chann.setParent(gameid);
        }).catch(error => {});
    }).catch(error => {});

    //create off topic section
    var offtopicid;
    server.channels.create("OFF TOPIC", {type: "GUILD_CATEGORY"}).then(channel => {
        offtopicid = channel.id;
        server.channels.create("memes", {type: "GUILD_TEXT"}).then(chann => {
            chann.setParent(offtopicid);
        }).catch(error => {});
    }).catch(error => {});

    //create dead section
    var deadid; //to get the category for easy parenting
    server.channels.create("REALM OF THE DEAD", {type: "GUILD_CATEGORY"}).then(channel => {
        channel.permissionOverwrites.edit(channel.guild.roles.everyone, { VIEW_CHANNEL: false }).catch(console.error);
        channel.guild.roles.cache.forEach(role => {
            if(role.name == "Dead" || role.name == "Observer")
            {
                channel.permissionOverwrites.edit(role, { VIEW_CHANNEL: true }).catch(console.error);
            }
        });
        deadid = channel.id;
        server.channels.create("dead-chat", {type: "GUILD_TEXT"}).then(channel => {
            channel.setParent(deadid);
        }).catch(error => {});
    }).catch(error => { console.error(error) });

    var hostid;
    server.channels.create("HOST CHANNELS", {type: "GUILD_CATEGORY"}).then(channel => {
        channel.permissionOverwrites.edit(channel.guild.roles.everyone, { VIEW_CHANNEL: false }).catch(console.error);
        hostid = channel.id;
        server.channels.create("host-updates", {type: "GUILD_TEXT"}).then(chann => {
            chann.setParent(hostid).catch(console.log);
            var id = admin.gameIdFromServerId(chann.guild.id);
            if(id != -1)
            {
                admin.addhostupdatechannel(id, chann.id);
                chann.send(`Host update channel was properly configured for your game!`);
            }
            else
            {
                chann.send(`Add this server to your game and then type ${prefix}bindhostupdates to establish this as your host update channel.`);
            }
        }).catch(error => {});
    }).catch(error => {})
}


//await asynchronous functions
const setparent = async(chan, parent) => {
    await chan.setParent(parent).catch(console.error);
}
const deletesync = async(chan) => {
    if(chan instanceof Discord.GuildChannel)
        setparent(chan, null);
    await chan.delete().catch(console.error);
}
const removerolessync = async(member, roleset) => {
    await member.roles.remove(roleset).catch(console.error);
}

module.exports = {
    defaultserversetup: defaultserversetup
}