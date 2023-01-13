const {GameError} = require('../../../GameError.js');

/** An error related to chatrooms
 * @typedef {ChatroomError} ChatroomError
 */
class ChatroomError extends GameError{

    /** Create the error
     * @param {Object} code 
     */
    constructor(code){
        super(code);
    }
}

const codes = {
    ERROR_UNKNOWN: {code: "ERROR_UNKNOWN", message: "Something went wrong!"},
    GOOD_EXECUTE: {code: "GOOD_EXECUTE", message: "Success!"},
    CHATROOM_DOESNT_EXIST: {code: "CHATROOM_DOESNT_EXIST", message: "Could not find a chatroom to associate with that command!"},
    CHATROOM_NAME_TAKEN: {code: "CHATROOM_NAME_TAKEN", message: "That chatroom name is already taken!"},
    ACCOUNT_DOESNT_EXIST: {code: "ACCOUNT_DOESNT_EXIST", message: "That account doesn't exist."},
    ACCOUNT_ALREADY_REGISTERED: {code: "ACCOUNT_ALREADY_REGISTERED", message: "That account is already registered."},
    ACCOUNT_NOT_REGISTERED: {code: "ACCOUNT_NOT_REGISTERED", message: "This account is not registered and must be to use this command."},
    USERNAME_ALREADY_TAKEN: {code: "USERNAME_ALREADY_TAKEN", message: "That username is already taken."},
    USER_DOESNT_EXIST: {code: "USER_DOESNT_EXIST", message: "You are not a user in this chatroom."},
    USER_ALREADY_BOUND_TO_ACCOUNT: {code: "USER_ALREADY_BOUND_TO_ACCOUNT", message: "That user already has access to that account."},
    USER_NOT_BOUND_TO_ACCOUNT: {code: "USER_NOT_BOUND_TO_ACCOUNT", message: "That user does not have access to that account."},
    TERMINAL_ALREADY_EXISTS: {code: "TERMINAL_ALREADY_EXISTS", message: "That terminal is already a part of the chatroom."},
    TERMINAL_DOESNT_EXIST: {code: "TERMINAL_DOESNT_EXIST", message: "That channel is not a part of the chatroom."},
    TERMINAL_ALREADY_TAKEN: {code: "TERMINAL_ALREADY_TAKEN", message: "That channel is already a terminal in another chatroom."},
    TERMINAL_ALREADY_BOUND_TO_ACCOUNT: {code: "TERMINAL_ALREADY_BOUND_TO_ACCOUNT", message: "That terminal is already bound to that account."},
    TERMINAL_NOT_BOUND_TO_ACCOUNT: {code: "TERMINAL_NOT_BOUND_TO_ACCOUNT", message: "That terminal is not bound to that account."},
    ALREADY_LOGGED_IN: {code: "ALREADY_LOGGED_IN", message: "You are already logged into that account."},
    NOT_LOGGED_IN: {code: "NOT_LOGGED_IN", message: "You are not logged in."},
    INSUFFICIENT_PERMISSIONS: {code: "INSUFFICIENT_PERMISSIONS", message: "You do not have the permissions to do that."},
    UNABLE_TO_UPLOAD_IMAGE: {code: "UNABLE_TO_UPLOAD_IMAGE", message: "We could not seem to upload your image to a permanent source!"},
    TARGET_ACCOUNT_HAS_NO_TERMINALS: {code: "TARGET_ACCOUNT_HAS_NO_TERMINALS", message: "Could not find any terminals belonging to that account."},
    MISSING_INFORMATION: {code: "MISSING_INFORMATION", message: "You have not submitted anything to change."}
}

module.exports = {
    ChatroomError: ChatroomError,
    err: codes
}