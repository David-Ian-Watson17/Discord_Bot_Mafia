const fs = require('fs');
const client = require('../main.js').client;
const Discord = require('discord.js');
const dir = './games'
const admin = require('./administration.js');

/*
memes.txt

Condition(s)
Case-sensitivity + Punctuation-sensitivity
Response[0]
Response[1]
...

1 
0
0 <string>

0 
1
3 <channelidlist>

CONDITIONS:
0: Contains <string>
1: Startswith <string>

CASE-SENSITIVITY/PUNCTUATION:
0: ignore case/punctuation
1: case-sensitive, ignore punctuation
2: punctuation-sensitive, ignore case
3: case/punctuation-sensitive

RESPONSES:
0: Say <string> <channellist>(no channels implies same channel as message)
1: Respond <string>
2: Mute <time> <channellist>
3: Removeaccess <time> <channellist>(no channels implies same channel as message)
4: PreventViewHistory <time> <channellist>
*/

var getgamememes = function(gameid)
{

}

var getindexbyphrase = function(gameid, phrase)
{
    
}

var getmemeresponses = function(gameid, index)
{

}

var removefunction = function(gameid, index)
{

}

module.exports = {
    checkmemes(message, args)
    {

    },
    

    
}