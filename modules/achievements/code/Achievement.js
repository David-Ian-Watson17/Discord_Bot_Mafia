const Discord = require('discord.js');

/** An Achievement is an accomplishment that can be displayed in a channel
 * @typedef {Achievement}
 */
class Achievement{

    /** What the achievement is called
     * @type {String}
     */
    title;

    /** The flavor text
     * @type {String}
     */
    description;

    /** The url to the achievement image
     * @type {String}
     */
    image;

    /** The url to the black and white achievement image
     * @type {String}
     */
    blackandwhiteimage;

    /** Whether the achievement is visible or obscured
     * @type {Boolean}
     */
    hidden;

    /** Whether the achievement is unlocked
     * @type {Boolean}
     */
    unlocked;

    /** The embed this achievement prints as
     * @type {Discord.MessageEmbed}
     */
    embed;

    /** The messages this achievement is present in
     * @type {Discord.Collection<String, Message>} 
     */
    messages;

    /** Create a new achievement
     * @param {String} title 
     * @param {String} description 
     * @param {String} image 
     * @param {Boolean} hidden 
     */
    constructor(title, description, image, hidden){
        this.title = title;
        this.description = description;
        this.image = image;
        this.hidden = hidden;
        this.unlocked = false;
        this.messages = new Discord.Collection();
        if(this.hidden){
            this.embed = new Discord.MessageEmbed()
                            .setTitle(this.title)
                            .setDescription("???")
                            .setImage("https://i.imgur.com/B1PH30q.jpeg")
        }
        else{
            this.embed = new Discord.MessageEmbed()
                            .setTitle(this.title)
                            .setDescription(this.description)
                            .setImage(this.image)
        }
    }

    changeTitle(title){

    }

    changeDescription(description){

    }

    changeImage(image){

    }

    makeVisible(){

    }

    makeHidden(){

    }

    unlock(){

    }

    lock(){

    }

    refreshEmbed(){

    }

    printEmbed(channel){

    }

    deleteEmbed(message){

    }
}

module.exports = {
    Achievement: Achievement
}