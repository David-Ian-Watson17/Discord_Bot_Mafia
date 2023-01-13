const Discord = require('discord.js');
const {EventEmitter} = require('events');
const datahandler = require('../handlers/datahandler.js');
const {GameError, err} = require('../GameError.js');

/** The core class of this bot. A Game manages features over multiple servers.
 * @typedef {Game} Game
 */
class Game extends EventEmitter{
    
    /** The id of the game
     * @type {String}
     */
    id;

    /** The name of the game
     * @type {String}
     */
    name;

    /** The owner of the game
     * @type {Discord.User}
     */
    owner;

    /** The admins of the game
     * @type {Discord.Collection<String, Discord.User>}
     */
    admins;

    /** The guilds belonging to the game
     * @type {Discord.Collection<String, Discord.Guild>}
     */
    guilds;

    /** The client this game uses to respond to discord events
     * @type {Discord.Client}
     */
    client;

    /** The game manager 
     * @type {GameManager}
     */
    manager;

    /** The channel this uses to store images
     * @type {Discord.GuildChannel}
     */
    imagechannel;

    /** The managers for individual modules in this game
     * @type {Discord.Collection<String, ModuleManager>}
     */
    modulemanagers;

    /** Create a new game
     * @param {GameManager} manager 
     * @param {String} id 
     * @param {String} name 
     * @param {Discord.User} owner
     */
    constructor(manager, id, name, owner, loading=false){
        super();
        this.client = manager.client;
        this.manager = manager;
        this.id = id;
        this.name = name;
        this.owner = owner;
        this.admins = new Discord.Collection();
        this.guilds = new Discord.Collection();
        this.modulemanagers = new Discord.Collection();
        this.admins.set(owner.id, owner);
        this.imagechannel = null;
        if(!loading) this.store();
    }

    /** Destroy this game
     */
    destroy(){
        this.modulemanagers.each(module => {
            module.destroy();
        })
        this.deleteFile();
    }

    /** Change the owner
     * @param {Discord.User} newOwner 
     * @param {String} requesterId 
     */
    changeOwner(newOwner, requesterId){
        if(!(this.owner.id == requesterId)) throw new GameError(err.INVALID_OWNER_ID);
        this.owner = newOwner;
        this.store();
    }

    /** Add an admin to the game
     * @param {Discord.User} newAdmin 
     * @param {String} requesterId
     */
    addAdmin(newAdmin, requesterId){
        if(!(this.owner.id == requesterId)) throw new GameError(err.INVALID_OWNER_ID);
        if(this.admins.has(newAdmin.id)) throw new GameError(err.ADMIN_ALREADY_PRESENT);
        this.admins.set(newAdmin.id, newAdmin);
        this.store();
    }

    /** Remove an admin from the game
     * @param {String} adminId 
     * @param {String} requesterId
     */
    removeAdmin(adminId, requesterId){
        if(!(this.owner.id == requesterId)) throw new GameError(err.INVALID_OWNER_ID);
        if(!this.admins.has(adminId)) throw new GameError(err.ADMIN_NOT_PRESENT);
        if(adminId == requesterId) throw new GameError(err.CANNOT_REMOVE_OWNER);
        this.admins.delete(adminId);
        this.store();
    }

    /** Add a guild to the game
     * @param {Discord.Guild} newGuild 
     * @param {String} requesterId
     */
    addGuild(newGuild, requesterId){
        if(!(this.owner.id == requesterId)) throw new GameError(err.INVALID_OWNER_ID);
        if(!(newGuild.ownerId == requesterId)) throw new GameError(err.INVALID_SERVER_OWNER_ID);
        if(this.guilds.has(newGuild.id)) throw new GameError(err.GUILD_ALREADY_PRESENT);
        if(this.manager.guildMap.has(newGuild.id)) throw new GameError(err.GUILD_TAKEN);
        this.manager.addToGuildMap(newGuild.id, this.id);
        this.guilds.set(newGuild.id, newGuild);
        this.store();
    }
    
    /** Remove a guild from the game
     * @param {String} guildId 
     * @param {String} requesterId
     */
    removeGuild(guildId, requesterId){
        if(!this.guilds.has(guildId)) throw new GameError(err.GUILD_NOT_PRESENT);
        var guild = this.guilds.get(guildId);
        if(!this.admins.has(requesterId) && !(guild.ownerId == requesterId)) throw new GameError(err.INSUFFICIENT_PERMISSIONS);
        this.guilds.delete(guildId);
        this.manager.removeFromGuildMap(guildId);
        this.store();
    }

    /** Set the channel this game uses to store images
     * @param {Discord.Channel} channel 
     * @param {String} requesterId
     */
    setImageChannel(channel, requesterId){
        if(!this.admins.has(requesterId)) throw new GameError(err.INVALID_ADMIN_ID);
        this.imagechannel = channel;
        this.store();
    }

    /** Create a channel this game will use to store images
     */
    async createImageChannel(){

        //get the first guild
        var guild = this.guilds.first();

        //if there is no guild, throw an error
        if(!guild) throw new GameError(err.NO_GUILD);

        //create the image channel
        try{
            var channel = await guild.channels.create('image-channel', {
                type: Discord.Constants.ChannelTypes.GUILD_TEXT, 
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: ['VIEW_CHANNEL'],
                    },
                    {
                        id: this.client.user.id,
                        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
                    }
                ]});
    
            //set image channel
            this.imagechannel = channel;
        }catch(error){
            this.imagechannel = null;
            throw(error);
        }

        //store the new game information
        this.store();
    }

    /** Return the json string
     * @returns {Object}
     */
    toJSON(){
        var returnobject = {};
        returnobject.id = this.id;
        returnobject.name = this.name;
        returnobject.owner = this.owner.id;
        returnobject.admins = this.admins.map(user => user.id);
        returnobject.guilds = this.guilds.map(guild => guild.id);
        if(this.imagechannel) returnobject.imagechannel = this.imagechannel.id;
        return returnobject;
    }

    /** Store this game
     */
    store(){
        if(!datahandler.folderExists(this.id)) datahandler.createFolder(this.id);
        datahandler.putData(`${this.id}`, `Information.json`, JSON.stringify(this));
    }

    /** Delete this game's files
     */
    deleteFile(){
        datahandler.deleteFolder(this.id);
    }

    /** Load a specific game
     * @param {GameManager} manager
     * @param {String} gameId 
     * @returns {(Game|undefined)} The loaded game
     */
    static load(manager, gameId){

        //retrieve the game data and parse if it exists
        var rawGameData = datahandler.retrieveData(gameId, `Information.json`);
        if(!rawGameData) return undefined;
        var gameData = JSON.parse(rawGameData);

        //retrieve the owner
        var owner = manager.client.users.cache.get(gameData.owner);

        //if can't find the owner, take the earliest applicable admin
        if(!owner){
            var found = false;
            gameData.admins.forEach(adminId => {
                var admin = manager.client.users.cache.get(adminId);
                if(admin && !found){
                    owner = admin;
                    found = true;
                }
            });

            //if still hasn't found a viable owner after checking all the admins, delete the game
            var game = new Game(manager, gameId, gameData.name, undefined, true);
            game.destroy();
            return undefined;
        }

        //create the game
        var game = new Game(manager, gameId, gameData.name, owner, true);

        //add each admin
        gameData.admins.forEach(adminId => {
            var admin = manager.client.users.cache.get(adminId);
            if(admin){
                game.admins.set(admin.id, admin);
            }
        });
        
        //add each guild
        gameData.guilds.forEach(guildId => {
            var guild = manager.client.guilds.cache.get(guildId);
            if(guild){
                game.guilds.set(guild.id, guild);
            }
        });

        //set the image channel
        var imagechannel = manager.client.channels.cache.get(gameData.imagechannel);
        game.imagechannel = imagechannel;

        return game;
    }
}

module.exports = {
    Game: Game,
}