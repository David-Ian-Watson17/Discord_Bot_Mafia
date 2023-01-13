//modules and external code to be loaded
const fs = require('fs');
const Discord = require('discord.js');
const datahandler = require('../handlers/datahandler.js');
const path = require('path');
const {GameManager} = require('../classes/gamemanager.js');
const {Game} = require('../classes/game.js');
const {GameError, err} = require('../GameError.js');

//variables

/** The game manager
 * @type {GameManager}
 */
const gameManager = require('../gamemanager.js').gameManager();

 /** The client
  * @type {Discord.Client}
  */
const client = require('../client.js').client();

/** Retrieve a game by its id
 * @param {String} gameId 
 * @returns {Game} The game
 */
const getGame = function(gameId){
    //retrieve the game for the id
    var game = gameManager.games.get(gameId);

    //if the game doesn't exist throw error
    if(!game) throw new GameError(err.GAME_DOESNT_EXIST);

    //otherwise return the game
    return game;
}

/** Return the id of a game by its name
 * @param {String} gameName 
 * @returns {String} The id
 */
const getIdForName = function(gameName){
    
    //retrieve the id
    return gameManager.nameMap.get(gameName);
}

/** Return the name of a game by its id
 * @param {String} gameId 
 * @returns {String} The name
 */
const getNameForId = function(gameId){

    //get the game
    var game = getGame(gameId);

    //return the name
    return game.name;
}

/** Return the id of a game by one of its guilds' id
 * @param {String} guildId 
 * @returns {String} The id
 */
const getIdForGuild = function(guildId){

    //retrieve the id
    return gameManager.guildMap.get(guildId);
}

/** Returns if a game has a certain guild in it
 * @param {String} gameId 
 * @param {String} guildId 
 * @returns {Boolean} 
 */
const hasGuild = function(gameId, guildId){

    //get the game
    var game = getGame(gameId);

    //check if guild is in game
    return game.guilds.has(guildId);
}

/** Retrieve the guilds that belong to a game
 * @param {String} gameId 
 * @returns {Array<Discord.Guild>} The guilds
 */
const getGuildsForId = function(gameId){

    //get the game
    var game = getGame(gameId);

    //get the guilds in an array
    var guilds = [];
    game.guilds.each(guild => {
        guilds.push(guild);
    });

    //return the guilds
    return guilds;
}

/** Retrieve the owner for a game
 * @param {String} gameId 
 * @returns {Discord.User} The owner
 */
const getOwner = function(gameId){
    
    //get the game
    var game = getGame(gameId);

    //return the owner
    return game.owner;
}

/** Retrieve the admins for a game
 * @param {String} gameId 
 * @returns {Array<Discord.User>} The admins
 */
const getAdmins = function(gameId){

    //get the game
    var game = getGame(gameId);

    //put the admins in an array
    var admins = [];
    game.admins.each(admin => {
        admins.push(admin);
    });

    //return the admins
    return admins;
}

/** Returns whether a user is the owner for a game
 * @param {String} gameId 
 * @param {String} userId 
 * @returns {Boolean}
 */
const isOwner = function(gameId, userId){

    //get the game
    var game = getGame(gameId);

    //verify the user is the owner
    if(game.owner.id == userId) return true;
    return false;
}

/** Returns whether a user is an admin for a game
 * @param {String} gameId 
 * @param {String} userId 
 * @returns {Boolean}
 */
const isAdmin = function(gameId, userId){

    //get the game
    var game = getGame(gameId);

    //verify the user is an admin
    if(game.admins.has(userId)) return true;
    return false;
}

/** Change the owner of a game
 * @param {String} gameId 
 * @param {Discord.User} newOwner 
 * @param {String} requesterId 
 */
const changeOwner = function(gameId, newOwner, requesterId){

    //get game
    var game = getGame(gameId);

    //change owner
    game.changeOwner(newOwner, requesterId);
}

/** Add an admin to a game
 * @param {String} gameId 
 * @param {Discord.User} admin
 * @param {String} requesterId 
 */
const addAdmin = function(gameId, admin, requesterId){

    //get the game
    var game = getGame(gameId);

    //add the admin
    game.addAdmin(admin, requesterId);
}

/** Remove an admin from a game
 * @param {String} gameId 
 * @param {String} adminId 
 * @param {String} requesterId 
 */
const removeAdmin = function(gameId, adminId, requesterId){

    //get the game
    var game = getGame(gameId);

    //remove the admin
    game.removeAdmin(adminId, requesterId);
}

/** Add a guild to a game
 * @param {String} gameId 
 * @param {Discord.Guild} guild 
 * @param {String} requesterId 
 */
const addGuild = function(gameId, guild, requesterId){

    //get the game
    var game = getGame(gameId);

    //add teh guild
    game.addGuild(guild, requesterId);
}

/** Remove a guild from a game
 * @param {String} gameId 
 * @param {String} guildId 
 * @param {String} requesterId 
 */
const removeGuild = function(gameId, guildId, requesterId){

    //get the game
    var game = getGame(gameId);

    //remove the guild
    game.removeGuild(guildId, requesterId);
}

/** Return all game ids
 * @returns {Array<String>} All Game Ids
 */
const getAllIds = function(){
    return gameManager.games.map(game => game.id);
}

/** Retrieve all games owned by a user by their id
 * @param {String} userId 
 * @returns {Discord.Collection<Game>}
 */
const allGamesOwnedBy = function(userId){
    return gameManager.games.filter(game => game.owner.id == userId);
}

/** Retrieve all games admined by a user by their id
 * @param {String} userId 
 * @returns {Discord.Collection<Game>}
 */
const allGamesAdminedBy = function(userId){
    return gameManager.games.filter(game => game.admins.has(userId));
}

/** Create a new game
 * @param {String} gameName 
 * @param {Discord.User} requester 
 */
var createGame = function(gameName, requester){
    gameManager.createGame(gameName, requester);
}

/** Delete a game
 * @param {String} gameId 
 * @param {String} requesterId 
 */
var deleteGame = function(gameId, requesterId){
    gameManager.deleteGame(gameId, requesterId);
}

/** Create a channel to store images
 * @param {String} gameId 
 */
const createImageChannel = async function(gameId){
    if(!idExists(gameId)){
        throw new GameError(err.GAME_DOESNT_EXIST);
    }

    //retrieve the information
    var rawGameInformation = fs.readFileSync(path.join(__dirname, gameinformationpath));
    var gameInformation = JSON.parse(rawGameInformation);

    //get the guild ids for the game
    var guildIds = gameInformation[`${gameId}`].guilds;
    
    //verify there are guilds
    if(guildIds.length == 0) return err.GUILD_REQUIRED;

    //get the first guild
    var guildId = guildIds[0];

    //get the guild
    var guild = client.guilds.cache.get(guildId);

    //create a new channel
    var channel = await guild.channels.create('image-holder', {name: 'image-holder', reason: 'Needed a channel to hold images', type: Discord.Constants.ChannelTypes.GUILD_TEXT});

    //set image channel
    gameInformation[`${gameId}`].imagechannel = channel.id;

    //write information back to file
    fs.writeFileSync(path.join(__dirname, gameinformationpath), JSON.stringify(gameInformation));

    return err.GOOD_EXECUTE;
}

/** Retrieve the channel a game uses to store images
 * @param {String} gameId 
 * @returns {Discord.Channel} The image channel
 */
const getImageChannel = function(gameId){
    
    //retrieve the game
    var game = getGame(gameId);

    //return the image channel
    return game.imagechannel;
}

/** Set the channel a game uses to store images
 * @param {String} gameId 
 * @param {Discord.Channel} channel
 */
const setImageChannel = function(gameId, channel, requesterId){

    //retrieve the game
    var game = getGame(gameId);

    //set the image channel
    game.setImageChannel(channel, requesterId);
}

/** Retrieve autocompletes for all games owned by a given user
 * @param {String} userId 
 * @returns {Array<Object>} The autocompletes
 */
const autocompletesAllOwnedBy = function(userId){
    
    //create autocompletes
    var autocompletes = [];

    //retrieve all games owned by user
    var games = allGamesOwnedBy(userId);

    //convert to autocompletes
    games.each(game => {
        autocompletes.push({name: `${game.name}`, value: `${game.id}`});
    });

    return autocompletes;
}

/** Retrieve autocompletes for all games admined by a given user
 * @param {String} userId 
 * @returns {Array<Object>} The autocompletes
 */
const autocompletesAllAdminedBy = function(userId){

    //create autocompletes
    var autocompletes = [];

    //retrieve all games admined by user
    var games = allGamesAdminedBy(userId);

    //convert to autocompletes
    games.each(game => {
        autocompletes.push({name: `${game.name}`, value: `${game.id}`});
    });

    return autocompletes;
}

module.exports = {
    getIdForName: getIdForName,
    getIdForGuild: getIdForGuild,
    getOwner: getOwner,
    getAdmins: getAdmins,
    isOwner: isOwner,
    isAdmin: isAdmin,
    getAllIds: getAllIds,
    allGamesOwnedBy: allGamesOwnedBy,
    allGamesAdminedBy: allGamesAdminedBy,
    getNameForId: getNameForId,
    changeOwner: changeOwner,
    addAdmin: addAdmin,
    removeAdmin: removeAdmin,
    hasGuild: hasGuild,
    getGuildsForId: getGuildsForId,
    addGuild: addGuild,
    removeGuild: removeGuild,
    createGame: createGame,
    deleteGame: deleteGame,
    createImageChannel: createImageChannel,
    getImageChannel: getImageChannel,
    setImageChannel: setImageChannel,
    autocompletesAllOwnedBy: autocompletesAllOwnedBy,
    autocompletesAllAdminedBy: autocompletesAllAdminedBy,
}