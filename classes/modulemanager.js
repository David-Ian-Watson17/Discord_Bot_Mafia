const datahandler = require('../handlers/datahandler.js');
const {Game} = require('./game.js');

/** A module manager handles how a module interacts with a game
 * @typedef {ModuleManager} ModuleManager
 */
class ModuleManager{

    /** The game this module manager belongs to
     * @type {Game}
     */
    game;

    /** The name of the module this manager is for
     * @type {String}
     */
    name;

    /** Create a new module manager
     * @param {Game} game 
     * @param {String} name 
     */
    constructor(game, name){
        this.game = game;
        this.name = name;
        this.addToGame();
    }

    /** Delete this module manager
     */
    destroy(){
        this.removeFromGame();
    }

    /** Add this module manager to its game
     */
    addToGame(){
        this.game.modulemanagers.set(this.name, this);
    }

    /** Remove this module manager from its game
     */
    removeFromGame(){
        this.game.modulemanagers.delete(this.name);
    }

    toString(){
        return `__${this.name.toUpperCase()}__`;
    }
}

module.exports = {
    ModuleManager: ModuleManager,
}