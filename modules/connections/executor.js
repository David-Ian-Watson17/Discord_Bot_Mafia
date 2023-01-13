const code = require('./code.js');

module.exports = {
    async execute(command, interaction, gameId, senderId, guild){
        try{
            console.log("Executor calling execute");
            await command.execute(interaction, gameId, senderId, guild);
        }catch(errorcode){
            await code.replyToInteractionBasedOnReturnCode(interaction, errorcode);
        }
    },
    async retrieveAutocompletes(command, interaction, gameId){
        try{
            return await command.retrieveAutocompletes(interaction, gameId);
        }catch(errorcode){
            return code.autocompletesError(errorcode);
        }
    }
}