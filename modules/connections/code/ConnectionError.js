
/** A ConnectionError
 * @typedef {ConnectionError} ConnectionError
 */
class ConnectionError extends Error{

    /** The error code
     * @type {String}
     */
    code;

    /** Create a new instance of a connection error
     * @param {Object} errorcode 
     */
    constructor(errorcode){
        super(errorcode.message);
        this.code = errorcode.code;
    }
}

const ConnectionErrorCodes = {
    CONNECTION_DOESNT_EXIST: {code: "CONNECTION_DOESNT_EXIST", message: "That connection doesn't exist!"},
    SIGNAL_REQUIRES_USER_MENTION: {code: "SIGNAL_REQUIRES_USER_MENTION", message: "You cannot use this signal without mentioning someone!"},
    IMAGE_COULD_NOT_BE_UPLOADED: {code: "IMAGE_COULD_NOT_BE_UPLOADED", message: "Failed to add that image to the connection!"},
    INSUFFICIENT_PERMISSIONS: {code: "INSUFFICIENT_PERMISSIONS", message: "You do not have permission to use that command!"},
    NOT_STANDARD_CONNECTION: {code: "NOT_STANDARD_CONNECTION", message: "That is not a standard connection!"},
    NOT_ANONYMOUS_CONNECTION: {code: "NOT_ANONYMOUS_CONNECTION", message: "That is not an anonymous connection!"},
    NOT_SIGNAL_CONNECTION: {code: "NOT_SIGNAL_CONNECTION", message: "That is not a signal connection!"},
    NOT_USER_CONNECTION: {code: "NOT_USER_CONNECTION", message: "That is not a user connection!"},
    NOT_CHANNEL_CONNECTION: {code: "NOT_CHANNEL_CONNECTION", message: "That is not a channel connection!"},
}

module.exports = {
    ConnectionError: ConnectionError,
    err: ConnectionErrorCodes
}