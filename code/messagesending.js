/*
MESSAGECRAFTING

This module does all the necessary work to verify a message is in proper form to be sent out.

craftMessage
cutOffBeforeLimit
*/

const CHAR_LIMIT = 2000;
const ROOM_TO_GROW_LIMIT = 1980;
const generalmarkers = ["__", "~~"];
const codemarkers = ["```", "`"]
const asteriskmarkers = ["***", "**", "*"];

var cutMessageProperly = function(content){ 
    if(content.length < CHAR_LIMIT){
        return [content];
    }

    var messagearray = [];

    while(content.length > CHAR_LIMIT){
        //make cut
        var cutoffstring = cutOffBeforeLimit(content);
        content = content.substring(cutoffstring.length);

        //check markers
        var unfinishedmarkers = checkMarkers(cutoffstring);
        unfinishedmarkers.forEach(marker => {
            cutoffstring += marker;
            content = marker + content;
        })

        //push cuts to array
        messagearray.push(cutoffstring);
    }

    //push the remaining string to the message array
    messagearray.push(content);

    //return the message array
    return messagearray;
}

//finds an appropriate cutoff point near 2000 characters
var cutOffBeforeLimit = function(content){
    console.log(content);
    var cutofftext = cutOffByNewLines(content);
    if(cutofftext.length > 0) return cutofftext;

    cutofftext = cutOffBySpaces(content);
    if(cutofftext.length > 0) return cutofftext;

    cutofftext = cutOffAnywhere(content);
    return cutofftext;
}

var cutOffByNewLines = function(content){
    var cutoffcontent = "";

    //split by new lines
    var splices = content.split("\n");

    //first segment before new line is too long, just return
    if(splices[0].length > ROOM_TO_GROW_LIMIT) return "";

    //add lines until it would be too long to add another
    while(cutoffcontent.length + splices[0].length <= ROOM_TO_GROW_LIMIT){
        cutoffcontent += splices.shift();
        cutoffcontent += "\n";
    }

    //return cut
    return cutoffcontent;
}

var cutOffBySpaces = function(content){
    var cutoffcontent = "";

    //split by spaces
    var splices = content.split(" ");

    //first segment before new line is too long, just  return
    if(splices[0].length >= ROOM_TO_GROW_LIMIT) return "";
    
    //add words until it would be too long to add another
    while(cutoffcontent.length + splices[0].length < ROOM_TO_GROW_LIMIT){
        cutoffcontent += splices.shift();
        cutoffcontent += " ";
    }

    //return cut
    return cutoffcontent;
}

var cutOffAnywhere = function(content){
    //frick it, they want one long word, you won't respect where they want it cut
    var cutoffcontent = content.substring(0, ROOM_TO_GROW_LIMIT);

    //return cut
    return cutoffcontent;
}

//see if there are any markers left unfinished
var checkMarkers = function(content){
    var activemarkers = [];

    //general markers
    generalmarkers.forEach(marker => {
        var occurances = (content.split(marker).length - 1);
        if(occurances % 2 != 0) activemarkers.push(marker);
    });

    //only the largest code marker can be used
    var codemarkerclaimed = false;
    codemarkers.forEach(marker => {
        if(codemarkerclaimed == false){
            var occurances = (content.split(marker).length - 1);
            if(occurances % 2 != 0){
                activemarkers.push(marker);
                codemarkerclaimed = true;
            }
        }
    })

    //only the largest asterisk marker can be used
    var asteriskmarkerclaimed = false;
    asteriskmarkers.forEach(marker => {
        if(asteriskmarkerclaimed == false){
            var occurances = (content.split(marker).length - 1);
            if(occurances % 2 != 0){
                activemarkers.push(marker);
                asteriskmarkerclaimed = true;
            }
        }
    })

    //return active markers
    return activemarkers;
}

module.exports = {
    cutMessageProperly: cutMessageProperly
}