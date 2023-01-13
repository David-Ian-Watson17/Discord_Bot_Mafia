/**
 * @typedef {String} Event 
 */
const Events = {
    CHATROOM_DESTROYED: 'chatroom_destroyed',
    CHATROOM_UPDATED: 'chatroom_updated',
    TERMINAL_ADDED: 'terminal_added',
    TERMINAL_REMOVED: 'terminal_removed',
    ACCOUNT_ADDED: 'account_added',
    ACCOUNT_REMOVED: 'account_removed',
    ACCOUNT_UPDATED: 'account_updated',
    ACCOUNT_REGISTERED: 'account_registered',
    ACCOUNT_UNREGISTERED: 'account_unregistered',
    ACCOUNT_USERNAME_CHANGED: 'account_username_changed',
    ACCOUNT_PROFILE_PICTURE_CHANGED: 'account_profile_picture_changed',
    USER_ADDED_TO_ACCOUNT: 'user_added_to_account',
    USER_REMOVED_FROM_ACCOUNT: 'user_removed_from_account',
    USER_PERMISSIONS_CHANGED: 'user_permissions_changed',
    USER_CREATED: 'user_created',
    USER_DELETED: 'user_deleted',
    LOGIN: 'login',
    LOGOUT: 'logout',
}

module.exports = {
    Events: Events,
}