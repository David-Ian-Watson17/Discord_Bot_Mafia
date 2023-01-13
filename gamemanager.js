const {GameManager} = require('./classes/gamemanager.js');
const client = require('./client.js').client();

/** The game manager
 * @type {GameManager}
 */
var gameManager;

/** Whether the game manager has been initialized
 * @type {Boolean}
 */
var initialized = false;

/** Initialize the game manager
 */
var initializeManager = function()
{
    gameManager = new GameManager(client);
    initialized = true;
}

module.exports = {
    gameManager()
    {
        if(!initialized)
        {
            initializeManager();
            initialized = true;
        }
        return gameManager;
    }
}