const Discord = require('discord.js');
const {Game} = require('./game.js');
const datahandler = require('../handlers/datahandler.js');
const {GameError, err} = require('../GameError.js');

/** The Game Manager keeps track of all Games
 * @typedef {GameManager} GameManager
 */
class GameManager{

    /** The discord client this manager uses to pass along to its games
     * @type {Discord.Client}
     */
    client;

    /** The games this manager has
     * @type {Discord.Collection<String, Game>}
     */
    games;

    /** A map of names to the ids of the games they represent
     * @type {Discord.Collection<String, String>}
     */
    nameMap;

    /** A map of guild ids to the ids of the games they represent
     * @type {Discord.Collection<String, String>}
     */
    guildMap;

    /** Create a game manager
     */
    constructor(client){
        this.client = client;
        this.games = new Discord.Collection();
        this.nameMap = new Discord.Collection();
        this.guildMap = new Discord.Collection();
    }

    /** Create a new id for a game
     * @returns {String} The new id
     */
    generateNewId(){
        var newId = Math.floor(Math.random() * 100000);
        while(this.games.has(newId)){
            newId = Math.floor(Math.random() * 100000);
        }
        return `${newId}`;
    }

    /** Create a new game with a given name
     * @param {String} name 
     * @param {Discord.User} newOwner
     */
    createGame(name, newOwner){
        if(this.nameMap.has(name)) throw new GameError(err.NAME_TAKEN);
        var game = new Game(this, this.generateNewId(), name, newOwner);
        this.games.set(game.id, game);
        this.nameMap.set(name, game.id);
    }

    /** Delete a game
     * @param {String} gameId 
     * @param {String} requesterId
     */
    deleteGame(gameId, requesterId){
        if(!this.games.has(gameId)) throw new GameError(err.GAME_DOESNT_EXIST);
        var game = this.games.get(gameId);
        if(!(game.owner.id == requesterId)) throw new GameError(err.INVALID_OWNER_ID);
        this.games.delete(game.id);
        this.nameMap.delete(game.name);
        game.guilds.each((guild, id) => {
            this.guildMap.delete(id);
        });
        game.destroy();
    }

    /** Add a guild to the map with a game id
     * @param {String} guildId 
     * @param {String} gameId 
     */
    addToGuildMap(guildId, gameId){
        this.guildMap.set(guildId, gameId);
    }

    /** Remove a guild from the map
     * @param {String} guildId 
     */
    removeFromGuildMap(guildId){
        this.guildMap.delete(guildId);
    }

    /** Load all games this manager has access to
     */
    load(){
        var gameIds = datahandler.getFolderIds();
        gameIds.forEach(gameId => {
            var game = Game.load(this, gameId);
            if(game){
                this.games.set(game.id, game);
                this.nameMap.set(game.name, game.id);
                game.guilds.each(guild => {
                    this.guildMap.set(guild.id, game.id);
                });
            }
        });
    }
}

module.exports = {
    GameManager: GameManager,
}