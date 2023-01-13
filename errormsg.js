
/**
 * @typedef {err} err
 */
class err{

    /** The code of the execute return
     * @type {String}
     */
    code;

    /** The message of the execute return
     * @type {String}
     */
    message;

    /** Create an execute code
     * @param {String} code 
     * @param {String} custommessage 
     */
    constructor(code, message){
        this.code = code;
        if(custommessage){
            this.message = message;
        }   
    }
    
    /** Reply to an interaction with this execute code's message
     * @param {Discord.Interaction} interaction 
     * @param {Boolean} ephemeral 
     */
    async replyToInteraction(interaction, ephemeral=true){
        if(!interaction.replied){
            await interaction.reply({content: this.message, ephemeral: ephemeral});
        }
        else{
            await interaction.editreply({content: this.message, ephemeral: ephemeral});
        }
    }
}

module.exports = {
    err: err
}