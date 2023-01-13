const Discord = require('discord.js');
const code = require('../code.js');
const {ChatroomError, err} = require('../code/ChatroomError.js');

module.exports = {
    data: {
        name: "chatroomaccounts",
        description: "(Admin Only) Commands related to accounts belonging to chatrooms.",
        options: [
            {
                name: "create",
                description: "(Admin) Create a new account.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "terminalbound",
                        description: "Should the account only be allowed to post in its own terminals?",
                        type: Discord.Constants.ApplicationCommandOptionTypes.BOOLEAN,
                        required: true,
                    },
                    {
                        name: "terminal",
                        description: "Channel to bind this account to (can add later).",
                        type: Discord.Constants.ApplicationCommandOptionTypes.CHANNEL,
                        required: false
                    },
                    {
                        name: "user",
                        description: "User to add to account (can add later).",
                        type: Discord.Constants.ApplicationCommandOptionTypes.USER,
                        required: false,
                    },
                    {
                        name: "post",
                        description: "Should user be able to post with this account? (Defaults to true)",
                        type: Discord.Constants.ApplicationCommandOptionTypes.BOOLEAN,
                        required: false,
                    },
                    {
                        name: "modify",
                        description: "Should user be able to change username and profile picture? (Defaults to true)",
                        type: Discord.Constants.ApplicationCommandOptionTypes.BOOLEAN,
                        required: false,
                    },
                    {
                        name: "register",
                        description: "Should user be able to register account? (Defaults to true)",
                        type: Discord.Constants.ApplicationCommandOptionTypes.BOOLEAN,
                        required: false,
                    }
                ]
            },
            {
                name: "delete",
                description: "(Admin) Delete an old account.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "account",
                        description: "The account you'd like to delete.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true,
                    }
                ]
            },
            {
                name: "edit",
                description: "(Admin) Edit an account's information.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "account",
                        description: "The account you'd like to edit.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true,
                    },
                    {
                        name: "username",
                        description: "A new username for the account.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: false
                    },
                    {
                        name: "profilepicture",
                        description: "A new profile picture for the account.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.ATTACHMENT,
                        required: false
                    },
                    {
                        name: "terminalbound",
                        description: "Should the account only be allowed to post in its own terminals?",
                        type: Discord.Constants.ApplicationCommandOptionTypes.BOOLEAN,
                        required: false
                    }
                ]
            },
            {
                name: "list",
                description: "(Admin) List all accounts in this chatroom.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            },
            {
                name: "profile",
                description: "(Admin) View the profile embed for an account.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "account",
                        description: "The account you'd like to view the profile for.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true,
                    }
                ]
            },
            {
                name: "register",
                description: "(Admin) Register an account, allowing it to post in the chatroom and be recognized.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "account",
                        description: "The account you'd like to register.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true,
                    },
                    {
                        name: "username",
                        description: "The username for the account.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                    },
                    {
                        name: "profilepicture",
                        description: "The profile picture for the account.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.ATTACHMENT,
                        required: true,
                    }
                ]
            },
            {
                name: "unregister",
                description: "(Admin) Unregister an account, cancelling its privileges to post in the chatroom.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "account",
                        description: "The account you'd like to unregister",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true,
                    }
                ]
            },
            {
                name: "adduser",
                description: "(Admin) Add a user to an account.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "account",
                        description: "The account you'd like to add a user to.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true,
                    },
                    {
                        name: "user",
                        description: "The user you'd like to add to the account.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.USER,
                        required: true,
                    },
                    {
                        name: "post",
                        description: "Whether the user will be able to post with the account. Defaults to true.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.BOOLEAN,
                        required: false,
                    },
                    {
                        name: "modify",
                        description: "Whether the user will be able to change the username and profile picture. Defaults to true.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.BOOLEAN,
                        required: false,
                    },
                    {
                        name: "register",
                        description: "Whether the user will be able to register the account. Defaults to true.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.BOOLEAN,
                        required: false,
                    }
                ]
            },
            {
                name: "removeuser",
                description: "(Admin) Remove a user from an account.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "account",
                        description: "The account you'd like to remove a user from.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true,
                    },
                    {
                        name: "user",
                        description: "The user you'd like to remove from the account.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true,
                    }
                ]
            },
            {
                name: "editpermissionsforuser",
                description: "(Admin) Edit a user's permissions for an account.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "account",
                        description: "The account you'd like to edit user's permissions over.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true,
                    },
                    {
                        name: "user",
                        description: "The user you'd like to edit permissions for.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true,
                    },
                    {
                        name: "post",
                        description: "Can the user post using the account?",
                        type: Discord.Constants.ApplicationCommandOptionTypes.BOOLEAN,
                        required: false,
                    },
                    {
                        name: "modify",
                        description: "Can the user modify the account's username and profile picture?",
                        type: Discord.Constants.ApplicationCommandOptionTypes.BOOLEAN,
                        required: false,
                    },
                    {
                        name: "register",
                        description: "Can the user register the account?",
                        type: Discord.Constants.ApplicationCommandOptionTypes.BOOLEAN,
                        required: false,
                    }
                ]
            },
            {
                name: "addterminal",
                description: "(Admin) Add a terminal to an account.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "account",
                        description: "The account you'd like to add a terminal to.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true,
                    },
                    {
                        name: "terminal",
                        description: "The channel you'd like to add as a terminal.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.CHANNEL,
                        required: true,
                    }
                ]
            },
            {
                name: "removeterminal",
                description: "(Admin) Remove a terminal from an account.",
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "account",
                        description: "The account you'd like to remove a terminal from.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true,
                    },
                    {
                        name: "terminal",
                        description: "The terminal you'd like to remove.",
                        type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        autocomplete: true,
                    }
                ]
            }
        ]
    },
    securitylevel: "admin",
    serverreliance: "server",
    chatroomidreliance: "name",
    async execute(interaction, gameId, senderId, guild, chatroomId){
        switch(interaction.options.getSubcommand()){
            case "create":

                //retrieve core information
                var terminalbound = interaction.options.getBoolean("terminalbound");

                //retrieve terminal information
                var terminal = interaction.options.getChannel("terminal");

                //retrieve user information
                var user = interaction.options.getUser("user");
                var post = interaction.options.getBoolean("post");
                var modify = interaction.options.getBoolean("modify");
                var register = interaction.options.getBoolean("register");

                //create account
                var accountId = code.createAccount(gameId, chatroomId, terminalbound);

                //reply with code
                await code.replyToInteraction(interaction, `Successfully created account! The id is ${accountId}.`, true);

                //if terminal is present, add terminal to account
                if(terminal){
                    try{
                        code.addTerminalToAccount(gameId, chatroomId, accountId, terminal);
                        await code.replyToInteraction(interaction, `Successfully added ${terminal.toString()} to account.`);
                    }catch(errorcode){
                        await code.replyToInteraction(interaction, "Couldn't add terminal to account:");
                        await code.replyToInteractionBasedOnReturnCode(interaction, errorcode);
                    }
                }

                //if user is present add user to account
                if(user){

                    //retrieve permissions for user
                    var permissionsobject = {post: true, modify: true, register: true};
                    if(!(post == undefined)) permissionsobject.post = post;
                    if(!(modify == undefined)) permissionsobject.modify = modify;
                    if(!(register == undefined)) permissionsobject.register = register;

                    //add the user to account
                    try{
                        code.addUserToAccount(gameId, chatroomId, accountId, user.id, permissionsobject);
                        await code.replyToInteraction(interaction, `Successfully added ${user.toString()} to the newly made account.`);
                    }catch(errorcode){
                        await code.replyToInteraction(interaction, "Could not add user to account: ");
                        await code.replyToInteractionBasedOnReturnCode(interaction, errorcode);
                    }
                }
                break;
            case "delete":
                //retrieve account id
                var accountId = interaction.options.getString("account");

                //delete the account
                code.deleteAccount(gameId, chatroomId, accountId);

                await code.replyToInteraction(interaction, "Successfully deleted account!");
                break;
            case "edit":
                //retrieve account id
                var accountId = interaction.options.getString("account");

                //retrieve information
                var username = interaction.options.getString("username");
                var attachment = interaction.options.getAttachment("profilepicture");
                var terminalbound = interaction.options.getBoolean("terminalbound");

                //defer the reply
                await interaction.deferReply({ephemeral: true});

                //if none of the information is there, just... why?
                if(!username && !attachment && terminalbound == undefined){
                    await code.replyToInteraction(interaction, "Why do you waste my time? At least change something.", true);
                    return;
                }

                //if terminalbound is there, change that
                if(!(terminalbound == undefined)){
                    try{
                        code.changeTerminalBoundStatusForAccount(gameId, chatroomId, accountId, terminalbound);
                        if(terminalbound) await code.replyToInteraction(interaction, "Successfully restricted account to posting in its terminals.");
                        else await code.replyToInteraction(interaction, "Successfully allowed account to post anywhere.");
                    }catch(errorcode){
                        await code.replyToInteraction(interaction, "Failed to change terminal bound status: ");
                        await code.replyToInteractionBasedOnReturnCode(interaction, errorcode);
                    }

                }

                //if username is there, change that
                if(username){
                    try{
                        code.changeAccountUsername(gameId, chatroomId, accountId, interaction.user.id, username);
                        await code.replyToInteraction(interaction, `Successfully changed username for account to ${username}!`);
                    }catch(errorcode){
                        await code.replyToInteraction(interaction, "Failed to change username: ");
                        await code.replyToInteractionBasedOnReturnCode(interaction, errorcode);
                    }
                }

                //if profile picture is there, change that
                if(attachment){
                    try{
                        var profilepicture = attachment.url;
                        await code.changeAccountProfilePicture(gameId, chatroomId, accountId, interaction.user.id, profilepicture);
                        await code.replyToInteraction(interaction, "Successfully changed profile picture for account!");
                    }catch(errorcode){
                        await code.replyToInteraction(interaction, "Failed to change profile picture: ");
                        await code.replyToInteractionBasedOnReturnCode(interaction, errorcode);
                    }
                }
                break;
            case "list":

                //retrieve the strings for all accounts in the chatroom
                var accountstrings = code.retrieveAllAccountStringsForChatroom(gameId, chatroomId);

                //prepare response
                var responsestring = "";
                if(accountstrings.length == 0){
                    responsestring = "There are no accounts in this chatroom at the moment.";
                }
                else{
                    responsestring = "__Accounts__";
                    accountstrings.forEach(accountstring => {
                        responsestring += `\n${accountstring}`;
                    })
                }

                //print the strings
                await code.replyToInteraction(interaction, responsestring);
                break;
            case "profile":

                //retrieve the account id
                var accountId = interaction.options.getString("account");

                //retrieve profile embed
                var profileembed = code.retrieveAccountProfile(gameId, chatroomId, accountId);

                //print embed
                await code.replyToInteractionWithEmbed(interaction, profileembed);
                break;
            case "register":

                //retrieve the account id
                var accountId = interaction.options.getString("account");

                //retrieve username and profilepicture
                var username = interaction.options.getString("username");
                var profilepicture = interaction.options.getAttachment("profilepicture").url;

                //register the account
                await code.registerAccount(gameId, chatroomId, accountId, senderId, username, profilepicture);

                //print success
                await code.replyToInteraction(interaction, "Successfully registered account!");
                break;
            case "unregister":

                //retrieve the account id
                var accountId = interaction.options.getString("account");

                //unregister the account
                code.unregisterAccount(gameId, chatroomId, accountId, senderId);

                //print success
                await code.replyToInteraction(interaction, "Successfully unregistered account!");
                break;
            case "adduser":

                //retrieve the account id
                var accountId = interaction.options.getString("account");

                //retrieve the user
                var user = interaction.options.getUser("user");

                //retrieve permissions
                var permissions = {post: true, modify: true, register: true};
                var post = interaction.options.getBoolean("post");
                var modify = interaction.options.getBoolean("modify");
                var register = interaction.options.getBoolean("register");
                if(!(post == undefined)) permissions.post = post;
                if(!(modify == undefined)) permissions.modify = modify;
                if(!(register == undefined)) permissions.register = register;

                //add user to account
                code.addUserToAccount(gameId, chatroomId, accountId, user.id, permissions);

                //print success
                await code.replyToInteraction(interaction, `Successfully added <@${user.id}> to account!`);
                break;
            case "removeuser":

                //retrieve the account id
                var accountId = interaction.options.getString("account");

                //retrieve the user id
                var userId = interaction.options.getString("user");

                //remove user from account
                code.removeUserFromAccount(gameId, chatroomId, accountId, userId);

                //print success
                await code.replyToInteraction(interaction, `Successfully removed <@${userId}> from account!`);
                break;
            case "editpermissionsforuser":

                //retrieve the account id
                var accountId = interaction.options.getString("account");

                //retrieve the user id
                var userId = interaction.options.getString("user");

                //retrieve permissions
                var newPermissions = {};
                var post = interaction.options.getBoolean("post");
                var modify = interaction.options.getBoolean("modify");
                var register = interaction.options.getBoolean("register");
                if(!(post == undefined)) newPermissions.post = post;
                if(!(modify == undefined)) newPermissions.modify = modify;
                if(!(register == undefined)) newPermissions.register = register;

                //modify user permissions
                code.editUserPermissionsForAccount(gameId, chatroomId, accountId, userId, newPermissions);

                var replyString = `Successfully edited permissions for <@${userId}>:`;
                if(!(post == undefined)) replyString += `\nPost: ${post}`;
                if(!(modify == undefined)) replyString += `\nModify: ${modify}`;
                if(!(register == undefined)) replyString += `\nRegister: ${register}`;

                //print success
                await code.replyToInteraction(interaction, replyString);
                break;
            case "addterminal":

                //retrieve the account id
                var accountId = interaction.options.getString("account");

                //retrieve the terminal channel
                var terminal = interaction.options.getChannel("terminal");

                //add terminal to account
                code.addTerminalToAccount(gameId, chatroomId, accountId, terminal);

                //print success
                await code.replyToInteraction(interaction, `Successfully added ${terminal.toString()} to account.`);
                break;
            case "removeterminal":

                //retrieve the account id
                var accountId = interaction.options.getString("account");

                //retrieve the terminal id
                var terminalId = interaction.options.getString("terminal");

                //remove terminal from account
                code.removeTerminalFromAccount(gameId, chatroomId, accountId, terminalId);

                //print success
                await code.replyToInteraction(interaction, `Successfully removed <#${terminalId}> from account.`);
                break;
        }
    },
    async retrieveAutocompletes(interaction, gameId, chatroomId){
        var focusedvalue = interaction.options.getFocused();
        switch(interaction.options.getSubcommand()){
            case "delete":
                return code.adminAutocompletesAllAccounts(gameId, chatroomId, interaction.user.id, focusedvalue);
                break;
            case "edit":
                return code.adminAutocompletesAllAccounts(gameId, chatroomId, interaction.user.id, focusedvalue);
                break;
            case "profile":
                return code.adminAutocompletesAllAccounts(gameId, chatroomId, interaction.user.id, focusedvalue);
                break;
            case "register":
                return code.adminAutocompletesUnregisteredAccounts(gameId, chatroomId, interaction.user.id, focusedvalue);
                break;
            case "unregister":
                return code.adminAutocompletesRegisteredAccounts(gameId, chatroomId, interaction.user.id, focusedvalue);
                break;
            case "adduser":
                return code.adminAutocompletesAllAccounts(gameId, chatroomId, interaction.user.id, focusedvalue);
                break;
            case "removeuser":
                switch(interaction.options.getFocused(true).name){
                    case "account":
                        return code.adminAutocompletesAllAccounts(gameId, chatroomId, interaction.user.id, focusedvalue);
                        break;
                    case "user":
                        return code.adminAutocompletesUsersFromAccount(gameId, chatroomId, interaction.user.id, interaction.options.getString("account"), focusedvalue);
                        break;
                }
                break;
            case "editpermissionsforuser":
                switch(interaction.options.getFocused(true).name){
                    case "account":
                        return code.adminAutocompletesAllAccounts(gameId, chatroomId, interaction.user.id, focusedvalue);
                        break;
                    case "user":
                        return code.adminAutocompletesUsersFromAccount(gameId, chatroomId, interaction.user.id, interaction.options.getString("account"), focusedvalue);
                        break;
                }
                break;
            case "addterminal":
                return code.adminAutocompletesAllAccounts(gameId, chatroomId, interaction.user.id, focusedvalue);
                break;
            case "removeterminal":
                switch(interaction.options.getFocused(true).name){
                    case "account":
                        return code.adminAutocompletesAllAccounts(gameId, chatroomId, interaction.user.id, focusedvalue);
                        break;
                    case "terminal":
                        return code.adminAutocompletesTerminalFromAccount(gameId, chatroomId, interaction.options.getString("account"), focusedvalue);
                        break;
                }
                break;
        }
    }
}