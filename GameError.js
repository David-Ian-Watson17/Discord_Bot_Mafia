class GameError extends Error{
    
    /** The code of the error
     * @type {String}
     */
    code;
   
    /** Create a new GameError
     * @param {Object} err 
     */
    constructor(err){
        super(err.message)
        this.code = err.code;
    }
}

const ReturnCodes = {
    "ERROR_UNKNOWN" : {code: "ERROR_UNKNOWN", message: "Something went wrong!"},
    "GOOD_EXECUTE" : {code: "GOOD_EXECUTE", message: "Success!"},
    "GAME_DOESNT_EXIST": {code: "GAME_DOESNT_EXIST", message: "That game doesn't exist."},
    "NAME_TAKEN": {code: "NAME_TAKEN", message: "That name is already taken."},
    "GUILD_TAKEN": {code: "GUILD_TAKEN", message: "That guild is already taken."},
    "NO_GUILD": {code: "NO_GUILD", message: "There is no guild to perform that command with."},
    "GUILD_ALREADY_PRESENT": {code: "GUILD_ALREADY_PRESENT", message: "That guild is already a part of that game."},
    "GUILD_NOT_PRESENT": {code: "GUILD_NOT_PRESENT", message: "That guild is not a part of that game."},
    "ADMIN_ALREADY_PRESENT": {code: "ADMIN_ALREADY_PRESENT", message: "That user is already an admin for that game."},
    "ADMIN_NOT_PRESENT": {code: "ADMIN_NOT_PRESENT", message: "That user is not an admin for that game."},
    "CANNOT_REMOVE_OWNER": {code: "CANNOT_REMOVE_OWNER", message: "You are not allowed to remove the owner from the game."},
    "FILE_DOESNT_EXIST": {code: "FILE_DOESNT_EXIST", message: "Could not find necessary file(s)."},
    "FILE_DELETION_ERROR": {code: "FILE_DELETION_ERROR", message: "An error occurred trying to delete file(s)."},
    "FILE_WRITE_ERROR": {code: "FILE_WRITE_ERROR", message: "An error occurred trying to write to file(s)."},
    "FILE_READ_ERROR": {code: "FILE_READ_ERROR", message: "An error occurred trying to read from file(s)."},
    "INVALID_OWNER_ID": {code: "INVALID_OWNER_ID", message: "You must be the owner of the game to do that!"},
    "INVALID_ADMIN_ID": {code: "INVALID_ADMIN_ID", message: "You must be an admin of the game to do that!"},
    "INVALID_SERVER_OWNER_ID": {code: "INVALID_SERVER_OWNER_ID", message: "You must be the owner of the server to do that!"},
    "INVALID_USER_ID": {code: "INVALID_USER_ID", message: "That's not a valid discord user!"},
    "INVALID_CHANNEL_ID": {code: "INVALID_CHANNEL_ID", message: "That's not a valid channel!"},
    "INVALID_VALUE": {code: "INVALID_VALUE", message: "That is not a valid value!"},
    "INVALID_TYPE": {code: "INVALID_TYPE", message: "That value is of the wrong type."},
    "OVERLAPPING_VALUE": {code: "OVERLAPPING_VALUE", message: "That value cannot be used for that because it would conflict with another use."},
    "INSUFFICIENT_PERMISSIONS": {code: "INSUFFICIENT_PERMISSIONS", message: "You don't have permission to do that!"},
    "GUILD_REQUIRED": {code: "GUILD_REQUIRED", message: "You must use this command in a server."},
    "MISSING_INFORMATION": {code: "MISSING_INFORMATION", message: "That command needs more information."},
}

module.exports = {
    GameError: GameError,
    err: ReturnCodes,
}