const Discord = require('discord.js');
const admin = require('../administration/administration.js');
const {GameManager} = require('../classes/gamemanager.js');
const {Game} = require('../classes/game.js');
const {GameError, err} = require('../GameError.js');

/** The game manager this uses
 * @type {GameManager}
 */
const gameManager = require('../gamemanager.js').gameManager();

/** The discord client this uses
 * @type {Discord.Client}
 */
const client = require('../client.js').client();

/** Get an image from a discord ephemeral attachment url and store it as a permanent file
 * @param {String} url 
 * @param {String} gameId
 * @returns {Promise<String>} The permanent url
 */
const getPermanentLink = async function(gameId, url){

    var channel;

    //retrieve the channel to store the image in
    try{
        //retrieve the game
        var game = gameManager.games.get(gameId);

        //if the game doesn't exist, throw error
        if(!game) throw new GameError(err.GAME_DOESNT_EXIST);

        //if the game doesn't have an image channel, create one
        if(!game.imagechannel) await game.createImageChannel();

        //retrieve the image channel
        channel = game.imagechannel;
    }catch(error){
        console.log(error);
        return undefined;
    }

    //store the image and return the link
    try{
        var message = await channel.send({files: [`${url}`]});
        var attachment = message.attachments.first();
        return attachment.url;
    }catch(error){
        console.log(error);
        return undefined;
    }
}



module.exports = {
    getPermanentLink: getPermanentLink
}