/*
CONNECTIONS

This file is for functions that operate the backend of the "connections"
feature for this bot. Connections are one way links between discord 
channels where a message sent to the first channel will be immediately
sent to the second channel. What information is kept in the message
varies depending on the type of the connection

Default:    Sends full message with images and no modification. 
            Includes author's username and profile picture.

Anonymous:  Sends full message with images and no modification. 
            Author username and profile picture are replaced to 
            preserve anonymity of the author.

Signal:     Sends no message. Instead requires a user be mentioned
            and sends a pre-decided message based on who was signaled.
            Default message is a ping. Currently supports multiple channels
            at once with different signals to each channel but cannot pick 
            individual channels to signal to, so will always send to all
            on using signal command.
          
Files
---------
Connections/Connectionlist.json
Connections/Incompletelist.json

File etiquette
--------------
Connections/Connectionlist.json:    File is a json object. Keys are channel ids. Channel Id entries contain 
                                    an array of json objects which contain various keys each connection needs 
                                    to keep track of. These are listed below.
Connections/Incompletelist.json:    File is a json object. Keys are user ids. Each is mapped to a json object
                                    that contains information needed to convert into a connection, other than
                                    endChannel


Connections/Connectionlist keys
-------------------------------
Standard:                           startChannel: the Id of the channel this startChannel is
                                    endChannel: the Id of the channel this startChannel is connected to
                                    type: "standard"

Anonymous:                          startChannel: the id of the channel this startChannel is
                                    endChannel: the Id of the channel this startChannel is connected to
                                    type: "anonymous"
                                    username: the username this anonymous signal is sent under
                                    avatar: the avatar this anonymous signal uses

Signal:                             startChannel: the id of the channel this startChannel is
                                    endChannel: the Id of the channel this startChannel is connected to
                                    type: "signal"
                                    signal: the string used as a signal for this endChannel

Class List
-------------
Connection
StandardConnection extends Connection
AnonymousConnection extends Connection
SignalConnection extends Connection
ConnectionHandler

Variables
connectionHandler (A JSON object with ConnectionHandler's mapped to their gameId)
*/

const client = require('../client.js').client();
const Discord = require('discord.js');
const fs = require('fs');
const dir = './games';
const connectionlistext = 'Connections/Connectionlist.json';
const incompletelistext = 'Connections/Incompletelist.json';
const admin = require('./administration.js');
const whsending = require('./webhooksending.js');
const err = require('../universal_data/errorcodes.json');


/*
Connection
A class designed to be extended. Represents a basic connection.

Values:
startChannelId : The snowflake id of the channel that messages are sent from.
startChannel : The channel that messages are sent from.
endChannelId : The snowflake id of the channel that messages are sent to.
endChannel : The channel that messages are sent to.
type : The type of connection this is.
#valid : If both channels exist.

Methods:
refresh() : Re-retrieves the channels using their ids and calls validate()
validate() : Ensures the channels exist. Sets #valid based on that.
isValid() : returns #valid.
toJSON() : returns the connection as a JSON object
toString() : returns a string description
*/
class Connection{
    //variables
    startChannelId;
    startChannel;
    endChannelId;
    endChannel;
    type;
    #valid;

    //constructor
    constructor(startChannelId, endChannelId, type){
        this.startChannelId = startChannelId;
        this.endChannelId = endChannelId;
        this.startChannel = client.channels.cache.get(startChannelId);
        this.endChannel = client.channels.cache.get(endChannelId);
        this.type = type;
        this.validate();
    }

    //try to retrieve channels from their ids, then check that it's still valid
    refresh(){
        this.startChannel = client.channels.cache.get(this.startChannelId)
        this.endChannel = client.channels.cache.get(this.endChannelId);
        this.validate();
    }

    //check that both channels exist
    validate(){
        if(this.startChannel && this.endChannel) this.#valid = true;
        else this.#valid = false;
    }

    //check if this connection still works
    isValid(){
        return this.#valid;
    }

    //conversion to json
    toJSON(){
        return {'startChannel': this.startChannelId, 'endChannel': this.endChannelId, 'type': this.type};
    }

    //get a string variant
    toString(){
        return `${this.startChannel.guild.name}/${this.startChannel.name} -> ${this.endChannel.guild.name}/${this.endChannel.name} (${this.type})`;
    }
}

/*
StandardConnection (extends Connection)
A connection that sends all messages from the startChannel to the
endChannel under the username and avatar of the sender

No Unique Values

Methods:
toJSON : returns the connection as a JSON object
*/
class StandardConnection extends Connection{
    //constructor
    constructor(startChannelId, endChannelId){
        super(startChannelId, endChannelId, "standard");
    }

    //conversion to json
    toJSON(){
        return {'startChannel': this.startChannelId, 'endChannel': this.endChannelId, 'type': this.type};
    }
}

/*
AnonymousConnection (extends Connection)
A connection that sends all messages from the startChannel to the
endChannel under a host-decided username and avatar

Values:
username : The username messages are sent under.
avatar : The avatar messages are sent under.

Methods:
setUsername(username) : sets the username of the connection
setAvatar(avatar) : sets the avatar of the connection
toJSON() : returns the connection as a JSON object
*/
class AnonymousConnection extends Connection{
    //unique variables
    username;
    avatar;

    //constructor
    constructor(startChannelId, endChannelId, username, avatar){
        super(startChannelId, endChannelId, "anonymous");
        this.username = username;
        this.avatar = avatar;
    }

    //set new username
    setUsername(username){
        this.username = username;
    }

    //set new avatar
    setAvatar(avatar){
        this.avatar = avatar;
    }

    //conversion to json
    toJSON(){
        return {'startChannel': this.startChannelId, 'endChannel': this.endChannelId, 'type': this.type, 'username': this.username, 'avatar': this.avatar}
    }
}

/*
SignalConnection
A connection that sends a pre-defined message from the start channel on
use of /signal. All instances of #### are replaced with the mention in /signal

Values:
signal : The message string that's sent upon use.

Methods:
setSignal(signal) : sets the signal used by this connection
toJSON() : returns the connection as a JSON object
*/
class SignalConnection extends Connection{
    //unique variable
    signal;

    //constructor
    constructor(startChannelId, endChannelId, signal){
        super(startChannelId, endChannelId, "signal");
        this.signal = signal;
    }

    //set new signal
    setSignal(signal){
        this.signal = signal;
    }

    //signal
    //send signal on webhook sender
    sendSignal(mention){
        if(this.requiresMention()){
            if(mention == null) return false;
            var substitutedsignal = this.substituteMention(mention);
            whsending.sendOnChannel(this.endChannelId, client.user.username, client.user.avatarURL(), substitutedsignal, null, null);
            return true;
        }
        whsending.sendOnChannel(this.endChannelId, client.user.username, client.user.avatarURL(), this.signal, null, null);
        return true;
    }

    //requiresMention
    //returns true if the signal is configured to require a mention, false otherwise
    requiresMention(){
        if(this.signal.includes(`####`)) return true;
        return false;
    }

    //substituteMention
    //returns the signal with all instances of #### replaced by a given mention
    substituteMention(mention){
        var substitutedSignal = this.signal.replace(/####/g, mention);
        return substitutedSignal;
    }

    //conversion to json
    toJSON(){
        return {'startChannel': this.startChannelId, 'endChannel': this.endChannelId, 'type': this.type, 'signal': this.signal}
    }
}




/*
ConnectionHandler
Contains all the connection data for a given game

Values:
gameId : the id of the game this connectionhandler tracks
connectionHolder : a JSON object that stores all complete connections mapped to a startChannelId
incompletesHolder : as JSON object that stores all incomplete connections as JSON objects mapped to the id of the user that requested them
#valid : Whether this handler is functional

Methods:
------------------------- Data Handling
loadConnections()
logConnections()
retrieveConnections()
------------------------- Standard
createStandardConnection()
startStandardConnection()
------------------------- Anonymous
createAnonymousConnection()
startAnonymousConnection()
setAnonymousConnectionUsername()
setAnonymousConnectionAvatar()
------------------------- Signal
createSignalConnection()
startSignalConnection()
setSignal()
------------------------- Universal
endConnection()
removeConnectionAtIndex()
getConnectionsForChannel()
getAllCompleteConnections()
getUserIncompleteConnection()
------------------------- Helpers
indexConnections()
modifyAtIndex()
*/
class ConnectionHandler{
    //variables
    gameId;
    connectionHolder;
    incompleteHolder;
    #valid;

    isValid(){
        return this.#valid;
    }

    //constructor
    constructor(gameId){
        this.gameId = gameId;
        this.connectionHolder = {};
        this.loadConnections();
    }

    /*
    DATA HANDLING
    */

    //loadConnections
    //loads all connections from the files
    loadConnections(){
        //not yet valid, if it returns at any point before the end, this stands
        this.#valid = false;

        //retrieve the connections from files
        var gameConnectionsJSON = {};
        var readcode = this.retrieveConnections(gameConnectionsJSON);
        if(readcode != err.GOOD_EXECUTE) return;
        gameConnectionsJSON = gameConnectionsJSON.value;

        //retrieve the incomplets from files
        var gameIncompletesJSON = {};
        readcode = this.retrieveIncompletes(gameIncompletesJSON);
        if(readcode != err.GOOD_EXECUTE) return;
        gameIncompletesJSON = gameIncompletesJSON.value;

        try{
            //retrieve all startChannelIds
            var startChannelIds = Object.keys(gameConnectionsJSON);

            //map connection arrays to startChannelIds
            startChannelIds.forEach(startChannelId => {
                //initialize connection array
                this.connectionHolder[`${startChannelId}`] = [];

                //retrieve all connection json objects for this start channel
                var temparray = gameConnectionsJSON[`${startChannelId}`];

                //for each connection, create a connection object and add to array if valid
                temparray.forEach(connectionJSON => {
                    var newconnection;
                    switch(connectionJSON.type){
                        case "standard":
                            newconnection = new StandardConnection(connectionJSON.startChannel, connectionJSON.endChannel);
                            break;
                        case "anonymous":
                            newconnection = new AnonymousConnection(connectionJSON.startChannel, connectionJSON.endChannel, connectionJSON.username, connectionJSON.avatar);
                            break;
                        case "signal":
                            newconnection = new SignalConnection(connectionJSON.startChannel, connectionJSON.endChannel, connectionJSON.signal);
                            break;
                        default:
                            newconnection = null;
                    }
                    if(newconnection != null && newconnection.isValid()){
                        this.connectionHolder[`${startChannelId}`].push(newconnection);
                    }
                })
            })
        }catch(error){
            console.error(error);
            return;
        }

        //assign incompletes
        this.incompleteHolder = gameIncompletesJSON;

        //set to valid
        this.#valid = true;
    }

    //logConnections
    //populates Connectionlist.json with this handler's completes
    logConnections(){
        var jsonhandler = JSON.stringify(this.connectionHolder);
        if(!fs.existsSync(`${dir}/${this.gameId}`)){
            return err.ERROR_GAME_NOT_FOUND;
        }
        if(!fs.existsSync(`${dir}/${this.gameId}/${connectionlistext}`)){
            console.log(`Couldn't find Connectionlist.json file for game ${this.gameId}. Creating new Connectionlist.json`);
            fs.mkdirSync(`${dir}/${this.gameId}/Connections`);
            fs.writeFileSync(`${dir}/${this.gameId}/Connections/Connectionlist.json`, "{}");
        }
    
        try{
            fs.writeFileSync(`${dir}/${this.gameId}/${connectionlistext}`, jsonhandler);
            return err.GOOD_EXECUTE;
        }catch(error){
            console.log(error);
            return err.ERROR_GENERIC_COMMAND_EXECUTE_FAIL;
        }
    }

    //logIncompletes
    //populates Incompletelist.json with this handler's incompletes
    logIncompletes(){
        var jsonhandler = JSON.stringify(this.incompleteHolder);
        if(!fs.existsSync(`${dir}/${this.gameId}`)){
            return err.ERROR_GAME_NOT_FOUND;
        }
        if(!fs.existsSync(`${dir}/${this.gameId}/${incompletelistext}`)){
            console.log(`Couldn't find Incompletelist.json file for game ${this.gameId}. Creating new Incompletelist.json`);
            fs.mkdirSync(`${dir}/${this.gameId}/Connections`);
            fs.writeFileSync(`${dir}/${this.gameId}/Connections/Incompletelist.json`, "{}");
        }
    
        try{
            fs.writeFileSync(`${dir}/${this.gameId}/${incompletelistext}`, jsonhandler);
            return err.GOOD_EXECUTE;
        }catch(error){
            console.log(error);
            return err.ERROR_GENERIC_COMMAND_EXECUTE_FAIL;
        }
    }

    //retrieveConnections
    //return the json format for the handler from ConnectionList.json file
    retrieveConnections(connectionList){
        if(!fs.existsSync(`${dir}/${this.gameId}`)){
            return err.ERROR_GAME_NOT_FOUND;
        }
        if(!fs.existsSync(`${dir}/${this.gameId}/${connectionlistext}`)){
            console.log(`ERROR: Couldn't find Connectionlist file for game ${this.gameId}!`);
            return err.ERROR_GENERIC_COMMAND_EXECUTE_FAIL;
        }
    
        try{
            var connectionlistraw = fs.readFileSync(`${dir}/${this.gameId}/${connectionlistext}`);
            connectionList.value = JSON.parse(connectionlistraw.toString());
            return err.GOOD_EXECUTE;
        }catch(error){
            console.error(error);
            return err.ERROR_GENERIC_COMMAND_EXECUTE_FAIL;
        }
    }

    //retrieveIncompletes
    //return the json format for the handler from IncompleteList.json file
    retrieveIncompletes(connectionList){
        if(!fs.existsSync(`${dir}/${this.gameId}`)){
            return err.ERROR_GAME_NOT_FOUND;
        }
        if(!fs.existsSync(`${dir}/${this.gameId}/${incompletelistext}`)){
            console.log(`Couldn't find Incompletelist.json file for game ${this.gameId}. Creating new Incompletelist.json`);
            fs.mkdirSync(`${dir}/${this.gameId}/Connections`);
            fs.writeFileSync(`${dir}/${this.gameId}/Connections/Incompletelist.json`, "{}");
        }

        try{
            var connectionlistraw = fs.readFileSync(`${dir}/${this.gameId}/${incompletelistext}`);
            connectionList.value = JSON.parse(connectionlistraw.toString());
            return err.GOOD_EXECUTE;
        }catch(error){
            console.error(error);
            return err.ERROR_GENERIC_COMMAND_EXECUTE_FAIL;
        }
    }

    /*
    STANDARD
    */

    //createStandardConnection
    //Accepts the id of the channel that will start the connection, and the id of the channel that will end the connection
    createStandardConnection(startChannelId, endChannelId){
        //create new standard connection
        var newConnection = new StandardConnection(startChannelId, endChannelId);

        //add to data structure
        if(this.connectionHolder[`${startChannelId}`]){
            this.connectionHolder[`${startChannelId}`].push(newConnection);
        }
        else{
            this.connectionHolder[`${startChannelId}`] = [newConnection];
        }
        
        //log to files
        var writecode = this.logConnections();

        //return writecode
        return writecode;
    }

    //startStandardConnection
    //Accepts the id of the channel that will start the connection, and the id of the user that requested it
    //The requesterId will be used to keep track of what connection a user has initialized for later use in ending the connection
    startStandardConnection(startChannelId, requesterId){
        //check if there's a connection to finish already under this user
        if(this.incompleteHolder[`${requesterId}`]) return err.ERROR_CONNECTION_INCOMPLETE_CONNECTION;

        //attach standard start to user
        this.incompleteHolder[`${requesterId}`] = {"startChannel": `${startChannelId}`, "type": "standard"}

        //write back to file
        var writecode = this.logIncompletes();

        //return writecode
        return writecode;
    }

    /*
    ANONYMOUS
    */

    //createAnonymousConnection
    //Accepts the id of the channel that will start the connection, 
    //and the id of the channel that will end the connection, as well as an optional username and avatar
    //that will default to question marks if none is specified
    createAnonymousConnection(startChannelId, endChannelId, username="???", avatar="https://i.imgur.com/B1PH30q.jpeg"){
        //retrieve default on nulls
        if(!(typeof username === 'string')) username = "???";
        if(!(typeof avatar === 'string')) avatar = "https://i.imgur.com/B1PH30q.jpeg";

        //create new anonymous connection
        var newConnection = new AnonymousConnection(startChannelId, endChannelId, username, avatar);

        //add connection to list
        if(this.connectionHolder[`${startChannelId}`]){
            this.connectionHolder[`${startChannelId}`].push(newConnection);
        }
        else{
            this.connectionHolder[`${startChannelId}`] = [newConnection];
        }

        //write back to file
        var writecode = this.logConnections();

        //return writecode
        return writecode;
    }

    //startAnonymousConnection
    //Accepts the id of the channel that will start the connection, and the id of the user that requested it
    //as well as an optional username and avatarurl for the connection that will default to question marks if none is specified
    //The requesterId will be used to keep track of what connection a user has initialized for later use in ending the connection
    startAnonymousConnection(startChannelId, requesterId, username="???", avatar="https://i.imgur.com/B1PH30q.jpeg"){
        //retrieve default on nulls
        if(!(typeof username === 'string')) username = "???";
        if(!(typeof avatar === 'string')) avatar = "https://i.imgur.com/B1PH30q.jpeg";
    
        //check if there's a connection to finish already under this user
        if(this.incompleteHolder[`${requesterId}`]) return err.ERROR_CONNECTION_INCOMPLETE_CONNECTION;

        //attach anonymous start to user
        this.incompleteHolder[`${requesterId}`] = {"startChannel": `${startChannelId}`, "type": "anonymous", "username": `${username}`, "avatar": `${avatar}`};

        //write back to file
        var writecode = this.logIncompletes();

        //return writecode
        return writecode;
    }

    //setAnonymousConnectionUsername
    //accepts the game, the index of the connection, and the new username and sets the username of the connection
    setAnonymousConnectionUsername(index, newUsername="???"){
        //verify valid username
        if(!(typeof newUsername === 'string')) return err.ERROR_INVALID_INPUT;
        if(newUsername == "") return err.ERROR_INVALID_INPUT;
        if(newUsername.length > 80) return err.ERROR_INVALID_INPUT;

        //get indexed list
        var indexedlist = this.indexConnections();
        if(indexedlist === false) return err.ERROR_GENERIC_COMMAND_EXECUTE_FAIL;

        //ensure anonymous connection
        if(indexedlist[index].connection.type != "anonymous") return err.ERROR_INVALID_INPUT;

        //get location information
        var startchannel = indexedlist[index].startChannel;
        var startchannelindex = indexedlist[index].index;

        //set username
        this.connectionHolder[`${startchannel}`][startchannelindex].setUsername(newUsername);

        //write back to file
        var writecode = this.logConnections();
        
        //return writecode
        return writecode;
    }

    //setAnonymousConnectionAvatar
    //accepts the game, the index of the connection (base 0) and a new avatar and sets the avatar of the indexed connection
    setAnonymousConnectionAvatar(index, newAvatar="https://i.imgur.com/B1PH30q.jpeg"){
        //get indexed list
        var indexedlist = this.indexConnections();
        if(indexedlist === false) return err.ERROR_GENERIC_COMMAND_EXECUTE_FAIL;

        //ensure anonymous connection
        if(indexedlist[index].connection.type != "anonymous") return err.ERROR_INVALID_INPUT;

        //get location information
        var startchannel = indexedlist[index].startChannel;
        var startchannelindex = indexedlist[index].index;

        //set username
        this.connectionHolder[`${startchannel}`][startchannelindex].setAvatar(newAvatar);

        //write back to file
        var writecode = this.logConnections();
        
        //return writecode
        return writecode;
    }

    /*
    SIGNAL
    */

    //createSignalConnection
    //Accepts the id of the channel that will start the connection 
    //and the id of the channel that will end the connection, as well as an optional signal string
    //signal defaults to a ping in case one is not submitted
    createSignalConnection(startChannelId, endChannelId, signal="####"){
        //retrieve default on null
        if(!(typeof signal === 'string')) signal = "####";
        
        //create new connection
        var newConnection = new SignalConnection(startChannelId, endChannelId, signal);

        //add connection to list
        if(this.connectionHolder[`${startChannelId}`]){
            this.connectionHolder[`${startChannelId}`].push(newConnection);
        }
        else{
            this.connectionHolder[`${startChannelId}`] = [newConnection];
        }

        //write back to file
        var writecode = this.logConnections();
        
        //return writecode
        return writecode;
    }

    //startSignalConnection
    //Accepts the id of the channel that will start the connection, and the id of the user that requested it
    //as well as an optional signal string that will default to a mention if none is specified
    //The requesterId will be used to keep track of what connection a user has initialized for later use in ending the connection
    startSignalConnection(startChannelId, requesterId, signal="####"){
        //retrieve default on null
        if(!(typeof signal === 'string')) signal = "####";

        //check if there's a connection to finish already under this user
        if(this.incompleteHolder[`${requesterId}`]) return err.ERROR_CONNECTION_INCOMPLETE_CONNECTION;

        //attach signal start to user
        this.incompleteHolder[`${requesterId}`] = {"startChannel": `${startChannelId}`, "type": "signal", "signal": `${signal}`};

        //write back to file
        var writecode = this.logIncompletes();

        //return writecode
        return writecode;
    }

    //setSignal
    //Sets the signal string of an existing signal connection. Accepts the id of the start channel as well as
    //the index of the connection in its array
    setSignalConnectionSignal(index, newSignal){
        //verify good signal
        if(!(typeof newSignal === 'string')) return err.ERROR_INVALID_INPUT;
        if(newSignal == "") return err.ERROR_INVALID_INPUT;

        //get indexed list
        var indexedlist = this.indexConnections();
        if(indexedlist === false) return err.ERROR_GENERIC_COMMAND_EXECUTE_FAIL;

        //ensure anonymous connection
        if(indexedlist[index].connection.type != "signal") return err.ERROR_INVALID_INPUT;

        //get location information
        var startchannel = indexedlist[index].startChannel;
        var startchannelindex = indexedlist[index].index;

        //set username
        this.connectionHolder[`${startchannel}`][startchannelindex].setSignal(newSignal);

        //write back to file
        var writecode = this.logConnections();
        
        //return writecode
        return writecode;
    }

    /*
    UNIVERSAL
    */

    //endConnection
    //ends any outstanding incomplete connection started by a given requester
    //accepts the game id, the end channel to finish the connection to, and the requester's user id
    endConnection(endChannelId, requesterId){
        //check if an entry exists for requester
        if(!this.incompleteHolder[`${requesterId}`]) return err.ERROR_CONNECTION_NO_START_TO_FINISH;

        //retrieve incomplete connection
        var startedconnection = this.incompleteHolder[`${requesterId}`];
        var startChannelId = startedconnection.startChannel;
        var type = startedconnection.type;

        //make new connection
        var newConnection;
        switch(type){
            case "standard":
                newConnection = new StandardConnection(startChannelId, endChannelId);
                break;
            case "anonymous":
                newConnection = new AnonymousConnection(startChannelId, endChannelId, startedconnection.username, startedconnection.avatar);
                break;
            case "signal":
                newConnection = new SignalConnection(startChannelId, endChannelId, startedconnection.signal);
                break;
            default:
        }

        //delete incomplete entry
        delete this.incompleteHolder[`${requesterId}`];

        //move connection to proper entry
        if(this.connectionHolder[`${startChannelId}`]){
            this.connectionHolder[`${startChannelId}`].push(newConnection);
        }
        else{
            this.connectionHolder[`${startChannelId}`] = [newConnection];
        }

        //write back to file
        var writecode = this.logConnections();
        var writecode2 = this.logIncompletes();

        //return code
        if(writecode != err.GOOD_EXECUTE || writecode2 != err.GOOD_EXECUTE){
            return err.ERROR_GENERIC_COMMAND_EXECUTE_FAIL;
        }
        return err.GOOD_EXECUTE;
    }

    //removeConnection
    //removes a connection at a given index
    removeConnectionAtIndex(index){
        var success = this.modifyAtIndex(index, "delete");

        if(success){
            var writecode = this.logConnections();
            return writecode;
        }

        return err.ERROR_GENERIC_COMMAND_EXECUTE_FAIL;
    }

    //scrapStartedConnection
    //removes the incomplete connection started by a given user
    scrapStartedConnection(requesterId){
        if(!this.incompleteHolder[`${requesterId}`]) return err.ERROR_CONNECTION_NO_START_TO_FINISH;
        delete this.incompleteHolder[`${requesterId}`];
        var writecode = this.logIncompletes();
        return writecode;
    }

    //getConnectionsForChannel
    //accepts a channel Id and returns all connections it could find associated with that channel
    getConnectionsForChannel(channelId){
        //get channel connections
        if(!this.connectionHolder[`${channelId}`]) return [];
        return this.connectionHolder[`${channelId}`];
    }

    //getAllCompleteConnections
    //returns a full array of every complete connection in a game
    getAllCompleteConnections(){
        //get indexed list
        var indexedlist = this.indexConnections();
        if(indexedlist === false) return false;

        //return array
        return indexedlist;
    }

    //getUserIncompleteConnection
    //returns the incomplete connection attached to a user or null if none exists
    getUserIncompleteConnection(requesterId){
        //verify incompletes exist
        if(!this.incompleteHolder[`${requesterId}`]) return null;

        //return connection
        return this.incompleteHolder[`${requesterId}`];
    }

    /*
    HELPERS
    */

    //indexConnections
    //returns a consistently sorted list of connections in an array, with the keys
    //startChannel: the starting channel, index: the index in the starting channel's array, connection: the connection
    indexConnections(){
        //create indexed array
        var indexedarray = [];
        try{
            //get sorted keys
            var keys = Object.keys(this.connectionHolder);
            keys.sort();

            //start indexing
            keys.forEach(startchannelid => {
                var currentarr = this.connectionHolder[`${startchannelid}`];
                var index = 0;
                currentarr.forEach(connection => {
                    indexedarray.push({startChannel: startchannelid, index: index, connection: connection});
                    index++;
                })
            });
        }catch(error){
            console.error(error);
            return false;
        }
        return indexedarray;
    }

    //modifyAtIndex
    //uses base 0 index system. accepts "delete" and "edit" as options
    modifyAtIndex(index, modification, newconnection={}){
        try{
            //obtain indexed list and verify index exists
            var indexedconnections = this.indexConnections();
            if(indexedconnections.length < (1 + index)) return false;

            //retrieve starting channel and index information
            var startingchannel = indexedconnections[index].startChannel;
            var slotindex = indexedconnections[index].index;

            //select modification
            switch(modification){
                case "delete":
                    this.connectionHolder[`${startingchannel}`].splice(slotindex, 1);
                    if(this.connectionHolder[`${startingchannel}`].length == 0) delete this.connectionHolder[`${startingchannel}`];
                    break;
                case "edit":
                    connectionList[`${startingchannel}`][slotindex] = newconnection;
                    break;
                default:
                    return false;
            }
            
            return true;
        }catch(error){
            console.error(error);
            return false;
        }
    }

    //cleanseConnections
    //systematically scans connections for missing channels and deletes the connections when found
    cleanseConnections(){
        //get indexed list
        var indexedlist = this.indexConnections();
        if(indexedlist === false) return;

        //prep tracking index
        var index = 0;

        //delete defunct connections
        indexedlist.forEach(item => {
            try{
                //check channels and delete if necessary
                item.connection.refresh();
                if(!item.connection.isValid()){
                    this.modifyAtIndex(index, "delete");
                }
                else{
                    index++;
                }
            }catch(error){
                console.error(error);
            }
        });

        //write back to file
        var writecode = this.logConnections();
        return;
    }
}



//Connection Handler, holds a ConnectionHandler class in a map with
//game ids as the keys
var connectionHandler = {};

//loadConnections
//loads all connections from files into the connectionHandler
var loadConnections = function(){
    //delete everything in current connectionHandler
    var keys = Object.keys(connectionHandler);
    keys.forEach(key => {
        delete connectionHandler[`${key}`];
    });

    //replenishg connectionHandler
    var gameIds = admin.getGameIds();
    gameIds.forEach(gameId => {
        try{
            connectionHandler[`${gameId}`] = new ConnectionHandler(gameId);
        }catch(error){
            console.error(`Failed to load connections for game ${gameId}!`);
            console.error(error);
        }
    });
}

//sendOnConnection
//accepts a connection and either a message or a mention, then sends a message based on that connection
var sendOnConnection = function(messageOrMention, connection){
    try{
        switch(connection.type){
            case "standard":
                whsending.sendOnChannel(connection.endChannelId, messageOrMention.author.username, messageOrMention.author.avatarURL(), messageOrMention.content, messageOrMention.files, messageOrMention.embeds);
                break;
            case "anonymous":
                whsending.sendOnChannel(connection.endChannelId, connection.username, connection.avatar, messageOrMention.content, messageOrMention.files, messageOrMention.embeds);
                break;
            case "signal":
                whsending.sendOnChannel(connection.endChannelId, client.username, client.avatarURL(), signalSubstituteMention(messageOrMention, connection), [], []);
                break;
            default:
        }
    }catch(error){
        console.error(error);
    }
}

//startConnectionListener
//called to initialize the connection module to start collecting messages and checking them for connection sending
var startConnectionListener = function(){
    loadConnections();
    client.on('messageCreate', message => {
        //Bots sus, don't listen
        if(message.author.bot) return;

        //retrieve game id
        var gameId = admin.gameIdFromServerId(message.guild.id);
        if(gameId == -1) return;

        if(!connectionHandler[`${gameId}`]) return;

        //get connections
        var connections = connectionHandler[`${gameId}`].getConnectionsForChannel(message.channel.id);
        
        //send on connections
        connections.forEach(connection => {
            if(connection.type != "signal")
                sendOnConnection(message, connection);
        });
    });
}

module.exports = {
    //classes
    ConnectionHandler: ConnectionHandler,
    StandardConnection: StandardConnection,
    AnonymousConnection: AnonymousConnection,
    SignalConnection: SignalConnection,
    
    //variables
    connectionHandler: connectionHandler,
    
    //methods
    loadConnections: loadConnections,
    sendOnConnection: sendOnConnection,
    startConnectionListener: startConnectionListener
}