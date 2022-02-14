const fs = require('fs');
const client = require('../client.js').client();
const Discord = require('discord.js');
const dir = './games'
const admin = require('./administration.js');
const errorcodes = require('../universal_data/errorcodes.json');

/*
Lynch files
-----------

lynchisrunning.txt:     Nothing in file                                 Exists if there is a lynch running
roles.txt:              guildid  roleid                                 Tracks roles that can vote to lynch/be lynched
channels.txt:           channelid                                       Tracks channels that can be voted in
updatechannels.txt:     channelid                                       Tracks channels that updates will be posted in
hostupdatechannels.txt: channelid                                       Tracks channels used for purely host information
votingexceptions.txt:   userid                                          Tracks users that cannot vote
voteableexceptions.txt: userid                                          Tracks users that cannot be voted for
voteweights.txt:        userid  weight                                  Tracks the weight each users vote has
lovehateweights.txt:    userid  points                                  Tracks how many less or more votes individual players need
lynch.txt:              targetid  voter1  voter2  voter3...             Tracks normal voting
votecap.txt:            votesneeded                                     Tracks the required number of votes for lynch


Requirements
----------------------

Start a Lynch:
Must be triggered by a host
At least one channel to post updates in
At least one role to lynch/be lynched
A means to calculate required number of votes
A means to assign required number of votes to votecap.txt

Post Vote Counts:
Lynch must be running
At least one channel to post updates in
A means to get lynch visibility level
A means to retrieve all votes in lynch.txt

Cast Lynch Vote:
Lynch must be running
A means to check if vote was cast in a valid channel
A means to check if voting member has a lynch role
A means to check if the voting member is currently not excepted from being able to vote
A means to check if the target is currently not excepted from being voted for
A means to check if the voter has cast a vote before
A means to remove a vote from lynch.txt if it has been cast
A means to add a vote to lynch.txt

Uncast Lynch Vote:
Lynch must be running
A means to check if command was made in a valid channel
A means to check if the voter has cast a vote before
A means to remove a vote from lynch.txt if it has been cast

End Lynch:
Lynch must be running
At least one channel to post updates in
A means to calculate each time a vote is cast whether the vote cap has been reached
A means to end the lynch running
A means to end the lynch with a specified target

Modifiable Settings
------------------
Must be able to return a list of all currently eligible voters
Voting exceptions must be able to be added
Must be able to return a list of voting exceptions
Must be able to remove a voting exception
Voteable exceptions must be able to be added
Must be able to return a list of voteable exceptions
Must be able to remove a voteable exception
Must be able to add an update channel
Must be able to remove an update channel
Must be able to add a voting channel
Must be able to remove a voting channel
Must be able to add a voting role
Must be able to remove a voting role
Must be able to manually adjust the voting cap



Things Resolved By Create Game
------------------------------

Empty roles.txt file created.
Empty channels.txt file created.
Empty votingexceptions.txt file created.
Empty voteableexceptions.txt file created.
Empty updatechannels.txt file created.
Empty votecap.txt file created.
Empty voteweights.txt file created.
Empty lovehateweights.txt file created.

Table of Contents:
(0) Validation Checkers: 105
(1) Getting Commands: 281
(2) Setting Commands: 555
(3) File Fixers: 968
(4) Host Commands: 1104
(5) Player Lynch Commands: 1268
(6) Helpers: 1314
*/

/*
(0) VALIDATION CHECKERS
*/

/* validSetup
validSetup is called when trying to start a lynch. It returns true if certain criteria are met, or false otherwise
Criteria checked:
- Lynch is not already running
- There is at least one lynch role
- There is at least one lynch update channel
- There is at least one voter
Note: If all members in a voting role but are also votingexceptions, this will still pass, despite it shouldn't
*/
var validSetup = function(gameid)
{
    //Lynch is already running
    if(lynchisrunning(gameid)) return errorcodes.ERROR_LYNCH_IS_RUNNING;
    
    //There are no lynch update channels
    if(getUpdateChannels(gameid).length < 1) return errorcodes.ERROR_NO_UPDATE_CHANNEL;

    var lynchroles = getRoles(gameid);

    //There isn't a lynch role
    if(lynchroles.length < 1) return errorcodes.ERROR_NO_LYNCH_ROLE;
    for(var i = 0; i < lynchroles.length; i++)
    {
        //Checks complete, all clear
        if(lynchroles[i].members.size > 0)
        {
            return true;
        }
    }

    //There isn't a valid voter
    return errorcodes.ERROR_NO_VOTERS;
}

/*lynchisrunning
lynchisrunning returns true if there is a lynch in progress and false otherwise
*/
var lynchisrunning = function(gameid){
    return fs.existsSync(`${dir}/${gameid}/lynching/lynchisrunning.txt`);
}

/* validVoter
validVoter accepts a gameid and a userid and returns true if the user is allowed to vote in that game, or false otherwise
Criteria checked:
- Is the user a member of a voting role for the game?
- If the user is a member of a voting role, do they have an exception that prevents them from voting?
*/
var validVoter = function(gameid, userid)
{
    var votingpermissions = false;

    //check if member of a voting role
    var rawvotingids = fs.readFileSync(`${dir}/${gameid}/lynching/roles.txt`).toString().split("\n");
    for(var i = 0; i < (rawvotingids.length - 1); i++)
    {
        try
        {
            var guildid = rawvotingids[i].split("  ")[0];
            var roleid = rawvotingids[i].split("  ")[1];
            var guild = client.guilds.cache.get(guildid);
            var role = guild.roles.cache.get(roleid);
            if(role.members.get(userid))
                votingpermissions = true;
        }
        catch(error)
        {
            console.log(error);
        }
    }

    //check if member is not able to vote
    var rawexceptionids = fs.readFileSync(`${dir}/${gameid}/lynching/votingexceptions.txt`).toString().split("\n");
    for(var i = 0; i < (rawexceptionids.length - 1); i++)
    {
        if(rawexceptionids[i] == userid)
            votingpermissions = false;
    }

    return votingpermissions;
}

/* validVoteable
validVoteable accepts a gameid and a userid and returns true if the user can be voted for in that game, or false otherwise
Criteria Checked:
- Is user a member of a voting role for the game?
- If user is a member of a voting role, do they have an exception that prevents them from being voted for?
*/
var validVoteable = function(gameid, userid)
{
    var votingpermissions = false;

    //check if member of a voting role
    var rawvotingids = fs.readFileSync(`${dir}/${gameid}/lynching/roles.txt`).toString().split("\n");
    for(var i = 0; i < (rawvotingids.length - 1); i++)
    {
        try
        {
            var guildid = rawvotingids[i].split("  ")[0];
            var roleid = rawvotingids[i].split("  ")[1];
            var guild = client.guilds.cache.get(guildid);
            var role = guild.roles.cache.get(roleid);
            if(role.members.get(userid))
                votingpermissions = true;
        }
        catch(error)
        {
            console.log(error);
        }
    }

    //check if member is not able to be voted
    var rawexceptionids = fs.readFileSync(`${dir}/${gameid}/lynching/voteableexceptions.txt`).toString().split("\n");
    for(var i = 0; i < (rawexceptionids.length - 1); i++)
    {
        if(rawexceptionids[i] == userid)
            votingpermissions = false;
    }

    return votingpermissions;
}

/*validVotingChannel
validVotingChannel accepts a gameid and a channelid and returns true if the channel can be voted in, or false otherwise
Criteria Checked:
- Checks to see if the channel is one of any bound voting channels for this game
- If the channel is not a bound voting channel, checks to see if there are any bound voting channels. If no, it's considered a bound channel
*/
var validVotingChannel = function(gameid, channelid)
{
    var channels = getChannels(gameid);

    //search for if bound channel
    for(var i = 0; i < channels.length; i++)
    {
        if(channelid == channels[i].id)
            return true;
    }

    //if there are no bound channels, automatically true
    if(channels.length == 0)
        return true;

    //not a bound channel
    return false;
}

/*targetAtHammer
targetAtHammer takes a gameid and a targetid. It returns true if the target has reached enough votes
    in the game to be lynched. Returns false otherwise
Criteria checked:
- Normal weighted votes for target >= The number of votes needed + loved/hated modifier
*/
var targetAtHammer = function(gameid, targetid)
{
    //no lynch running, instantly false
    if(!lynchisrunning(gameid)) return errorcodes.ERROR_LYNCH_NOT_RUNNING;

    //get votecount for target
    var votecount = 0;
    votecount += getWeightedVotesTarget(gameid, targetid);

    //get loved status for target
    var lovedstatus = getLoveHateTarget(gameid, targetid);

    //if the vote has hammered return true
    if(Number(votecount) >= (Number(getVotecap(gameid)) + Number(lovedstatus)))
        return true;

    //vote hasn't hammered
    return false;
}

/*
1: GETTING COMMANDS
*/

/* getEmoji
Returns the emoji used to react to successful lynch votes for a given game
*/
var getEmoji = function(gameid)
{
    var emoji = fs.readFileSync(`${dir}/${gameid}/lynching/emoji.txt`).toString();
    return emoji;
}

/* getRoles
Returns a list of all roles (full roles, not just ids) that can vote for a given game
*/
var getRoles = function(gameid){
    cleanseRoles(gameid);

    var rolearray = [];
    var rawroledata = fs.readFileSync(`${dir}/${gameid}/lynching/roles.txt`).toString().split("\n");

    for(var i = 0; i < (rawroledata.length - 1); i++)
    {
        try{
            var current = rawroledata[i].split("  ");
            var guild = client.guilds.cache.get(current[0]);
            var role = guild.roles.cache.get(current[1]);
            rolearray.push(role);
        }
        catch(err){
            console.log(`Lynch getRoles error:\n${err}`);
        }
    }
    return rolearray;
}

/* getChannels
getChannels returns all the channels (not just ids) used for voting for a given game
*/
var getChannels = function(gameid){

    cleanseVotingChannels(gameid);

    var channels = [];
    var rawchanneldata = fs.readFileSync(`${dir}/${gameid}/lynching/channels.txt`).toString().split("\n");

    for(var i = 0; i < (rawchanneldata.length - 1); i++)
    {
        try{
            var channel = client.channels.cache.get(rawchanneldata[i]);
            channels.push(channel);
        }
        catch(err){
            console.log(`Lynch getChannels error:\n${err}`);
        }
    }
    return channels;
}

/* getUpdateChannels
getUpdateChannels returns all the channels (not just ids) used to update players on the lynch status for a given game.
*/
var getUpdateChannels = function(gameid)
{
    cleanseUpdateChannels(gameid);

    var channels = [];
    var rawchanneldata = fs.readFileSync(`${dir}/${gameid}/lynching/updatechannels.txt`).toString().split("\n");

    for(var i = 0; i < (rawchanneldata.length - 1); i++)
    {
        try{
            var channel = client.channels.cache.get(rawchanneldata[i]);
            channels.push(channel);
        }
        catch(err){
            console.log(`Lynch getUpdateChannels error:\n${err}`);
        }
    }
    return channels;
}

/* getVotingExceptions
getVotingExceptions returns all userids of users that cannot vote, regardless of voting role, for a given game
*/
var getVotingExceptions = function(gameid)
{
    cleanseVotingExceptions(gameid);
    var exceptions = [];
    var rawexceptiondata = fs.readFileSync(`${dir}/${gameid}/lynching/votingexceptions.txt`).toString().split("\n");
    for(var i = 0; i < (rawexceptiondata.length - 1); i++)
    {
        exceptions[i] = rawexceptiondata[i];
    }
    return exceptions;
}

/* getVoteableExceptions
getVoteableExceptions returns all userids of users that cannot be voted for, regardless of voting role, for a given game
*/
var getVoteableExceptions = function(gameid)
{
    cleanseVoteableExceptions(gameid);
    var exceptions = [];
    var rawexceptiondata = fs.readFileSync(`${dir}/${gameid}/lynching/voteableexceptions.txt`).toString().split("\n");
    for(var i = 0; i < (rawexceptiondata.length - 1); i++)
    {
        exceptions[i] = rawexceptiondata[i];
    }
    return exceptions;
}

/* getLoveHate
getLoveHate returns a list of all players with a loved or hated status, as well as the degree.
Returns array of type [[string]], with each interior array being of the form [userid, degree]
*/
var getLoveHate = function(gameid)
{
    var lovearray = [];
    var lovedata = fs.readFileSync(`${dir}/${gameid}/lynching/lovehateweights.txt`).toString().split("\n");
    for(var i = 0; i < (lovedata.length - 1); i++)
    {
        var current = lovedata[i].split("  ");
        lovearray.push(current);
    }

    return lovearray;
}

/* getVoteWeights
getVoteWeights returns a list of all players with a special weight to their vote, as well as the weight.
Returns array of type [[string]], with each interior array being of the form [userid, weight]
*/
var getVoteWeights = function(gameid)
{
    var weightarray = [];
    var weights = fs.readFileSync(`${dir}/${gameid}/lynching/voteweights.txt`).toString().split("\n");
    for(var i = 0; i < (weights.length - 1); i++)
    {
        var current = weights[i].split("  ");
        weightarray.push(current);
    }

    return weightarray;
}

/* getLoveHateTarget
getLoveHateTarget returns the degree of loved or hated a particular player possessess.
Returns 0 if they are not loved or hated.
*/
var getLoveHateTarget = function(gameid, targetid)
{
    var lovedata = fs.readFileSync(`${dir}/${gameid}/lynching/lovehateweights.txt`).toString().split("\n");
    for(var i = 0; i < (lovedata.length - 1); i++)
    {
        var current = lovedata[i].split("  ");
        if(current[0] == targetid)
        {
            return current[1];
        }
    }
    return 0;
}

/* getVoteWeightTarget
getVoteWeightTarget returns the weight of the vote a particular player possesses.
Returns 1 if they have no special weight.
*/
var getVoteWeightTarget = function(gameid, targetid)
{
    var weights = fs.readFileSync(`${dir}/${gameid}/lynching/voteweights.txt`).toString().split("\n");
    for(var i = 0; i < (weights.length - 1); i++)
    {
        var current = weights[i].split("  ");
        if(current[0] == targetid)
        {
            return current[1];
        }
    }
    return 1;
}

/* getVotecap
getVotecap returns the number of votes required for majority in the current ongoing lynch
*/
var getVotecap = function(gameid)
{
    var votecapstr = fs.readFileSync(`${dir}/${gameid}/lynching/votecap.txt`).toString();
    if(votecapstr.match(/\d+/) == 0)
        return -1;
    return votecapstr;
}

/* getUnweightedVotes
getUnweightedVotes returns a list of all players that have received a normal vote, along with the votes.
Returns array of type [[string]], with each interior array being of the form [userid, vote, vote,...]
Does not take vote weighting into account.
*/
var getUnweightedVotes = function(gameid)
{
    if(!lynchisrunning(gameid))
        return 0;

    var votearray = [];
    var lynchdata = fs.readFileSync(`${dir}/${gameid}/lynching/lynch.txt`).toString().split("\n");
    for(var i = 0; i < (lynchdata.length - 1); i++)
    {
        var current = lynchdata[i].split("  ");
        votearray.push(current);
    }

    return votearray;
}

/* getWeightedVotes
getWeightedVotes returns the total number of current normal votes for the game, including weights.
Votes are returned in the type [[string]], with the format for each inner array being
['targetid', 'voterIDxWeight', 'voterIDxWeight']
*/
var getWeightedVotes = function(gameid){
    if(!lynchisrunning(gameid))
        return -1;

    var votes = [];
    votes = getUnweightedVotes(gameid);
    votes = weightVotes(gameid, votes);

    return votes;
}

/* getWeightedVotesTarget
getWeightedVotesTarget returns the number of votes placed on a particular user in the current lynch vote.
Returns 0 if no votes have been placed. Takes weight into account.
*/
var getWeightedVotesTarget = function(gameid, targetid)
{
    if(!lynchisrunning(gameid))
        return 0;

    var votecount = 0;
    var votes = getWeightedVotes(gameid);
    for(var i = 0; i < votes.length; i++)
    {
        var currentvotee = votes[i];
        if(currentvotee[0] == targetid)
        {
            for(var j = 1; j < currentvotee.length; j++)
            {
                var currentvote = currentvotee[j].split("x");
                votecount += currentvote[1];
            }
            return votecount;
        }
    }
    
    return 0;
}

/* getFullWeightedVotes
getFullWeightedVotes returns the total number of votes for the game, including weights and non-normal votes.
Currently identical to getWeightedVotes.
*/
var getFullWeightedVotes = function(gameid)
{
    if(!lynchisrunning(gameid))
        return -1;

    var votes = [];
    votes = getUnweightedVotes(gameid);
    votes = weightVotes(gameid, votes);

    return votes;
}

/*
2: SETTING COMMANDS
*/

/* setEmoji
setEmoji sets the emoji that the bot uses to react to successful lynch votes
*/
var setEmoji = function(gameid, emoji)
{
    fs.writeFileSync(`${dir}/${gameid}/lynching/emoji.txt`, emoji);
}

/* addLynchRole
addLynchRole accepts the id for a guild and the id for a role from that guild and adds that role to the list
    of roles that are allowed to vote for a given game
*/
var addLynchRole = function(gameid, guildid, roleid)
{
    //make sure role isn't already in the file
    var rawroledata = fs.readFileSync(`${dir}/${gameid}/lynching/roles.txt`).toString();
    var roledata = rawroledata.split("\n");
    for(var i = 0; i < (roledata.length - 1); i++)
    {
        if(`${guildid}  ${roleid}` == roledata[i])
            return;
    }

    //add role to end of file
    fs.writeFileSync(`${dir}/${gameid}/lynching/roles.txt`, `${rawroledata}${guildid}  ${roleid}\n`);
}

/* removeLynchRole
removeLynchRole accepts the id for a guild and the id for a role from that guild and removes them from the list
    of roles that are allowed to vote for a given game. no consequences if they weren't already a voting role.
*/
var removeLynchRole = function(gameid, guildid, roleid)
{
    var rawroledata = fs.readFileSync(`${dir}/${gameid}/lynching/roles.txt`).toString();
    rawroledata = rawroledata.replace(`${guildid}  ${roleid}\n`, "");
    fs.writeFileSync(`${dir}/${gameid}/lynching/roles.txt`, rawroledata);
}

/* addUpdateChannel
addUpdateChannel adds a channel's id to the list of channels that will have voting notifications sent to them
*/
var addUpdateChannel = function(gameid, channelid)
{
    //make sure channel isn't already in the file
    var rawchanneldata = fs.readFileSync(`${dir}/${gameid}/lynching/updatechannels.txt`);
    var channeldata = rawchanneldata.toString().split("\n");
    for(var i = 0; i < (channeldata.length - 1); i++)
    {
        if(`${channelid}` == channeldata[i])
            return;
    }

    //add channel to end of file
    fs.writeFileSync(`${dir}/${gameid}/lynching/updatechannels.txt`, `${rawchanneldata}${channelid}\n`);
}

/* removeUpdateChannel
removeUpdateChannel removes a channel's id from the list of channels that will have voting notifications sent to them
*/
var removeUpdateChannel = function(gameid, channelid)
{
    var rawchanneldata = fs.readFileSync(`${dir}/${gameid}/lynching/updatechannels.txt`).toString();
    rawchanneldata = rawchanneldata.replace(`${channelid}\n`, "");
    fs.writeFileSync(`${dir}/${gameid}/lynching/updatechannels.txt`, rawchanneldata);
}

/* addVotingChannel
addVotingChannel adds a channel's id to the list of channels that can have votes sent to them
*/
var addVotingChannel = function(gameid, channelid)
{
    //make sure channel isn't already in the file
    var rawchanneldata = fs.readFileSync(`${dir}/${gameid}/lynching/channels.txt`);
    var channeldata = rawchanneldata.toString().split("\n");
    for(var i = 0; i < (channeldata.length - 1); i++)
    {
        if(`${channelid}` == channeldata[i])
            return;
    }

    //add channel to end of file
    fs.writeFileSync(`${dir}/${gameid}/lynching/channels.txt`, `${rawchanneldata}${channelid}\n`);
}

/* removeVotingChannel
removeVotingChannel removes a channel's id from the list of channels that can have votes sent to them
*/
var removeVotingChannel = function(gameid, channelid)
{
    var rawchanneldata = fs.readFileSync(`${dir}/${gameid}/lynching/channels.txt`).toString();
    rawchanneldata = rawchanneldata.replace(`${channelid}\n`, "");
    fs.writeFileSync(`${dir}/${gameid}/lynching/channels.txt`, rawchanneldata);
}

/* addVotingException
addVotingException accepts the id for a user and adds it to the list of users who may not vote regardless of
if they have a voting role
*/
var addVotingException = function(gameid, userid)
{
    //make sure user isn't already in the file
    var rawuserdata = fs.readFileSync(`${dir}/${gameid}/lynching/votingexceptions.txt`);
    var userdata = rawuserdata.toString().split("\n");
    for(var i = 0; i < (userdata.length - 1); i++)
    {
        if(`${userid}` == userdata[i])
            return;
    }

    //remove any votes this player has made
    unlynch(gameid, userid);

    //add user to end of file
    fs.writeFileSync(`${dir}/${gameid}/lynching/votingexceptions.txt`, `${rawuserdata}${userid}\n`);
}

/* removeVotingException
removeVotingException accepts the id for a user and removes it from the list of users who may not vote regardless
of if they have a voting role. After removal, they will be allowed to vote if they have a voting role.
*/
var removeVotingException = function(gameid, userid)
{
    var rawuserdata = fs.readFileSync(`${dir}/${gameid}/lynching/votingexceptions.txt`).toString();
    rawuserdata = rawuserdata.replace(`${userid}\n`, "");
    fs.writeFileSync(`${dir}/${gameid}/lynching/votingexceptions.txt`, rawuserdata);
}

/* addVoteableException
addVoteableExceptionaccepts the id for a user and adds it to the list of users who may not be voted for regardless
of if they have a voting role
*/
var addVoteableException = function(gameid, userid)
{
    //make sure user isn't already in the file
    var rawuserdata = fs.readFileSync(`${dir}/${gameid}/lynching/voteableexceptions.txt`);
    var userdata = rawuserdata.toString().split("\n");
    for(var i = 0; i < (userdata.length - 1); i++)
    {
        if(`${userid}` == userdata[i])
            return;
    }

    //make sure votes for target are cleared
    clearVotesTarget(gameid, userid);

    //add user to end of file
    fs.writeFileSync(`${dir}/${gameid}/lynching/voteableexceptions.txt`, `${rawuserdata}${userid}\n`);
}

/* removeVoteableException
removeVoteableException accepts the id for a user and removes it from the list of users who may not be voted for
regardless of if they have a voting role. After removal, voters will be allowed to vote for them if they have a
voting role.
*/
var removeVoteableException = function(gameid, userid)
{
    var rawuserdata = fs.readFileSync(`${dir}/${gameid}/lynching/voteableexceptions.txt`).toString();
    rawuserdata = rawuserdata.replace(`${userid}\n`, "");
    fs.writeFileSync(`${dir}/${gameid}/lynching/voteableexceptions.txt`, rawuserdata);
}

/* addLovedPoint
addLovedPoint accepts the id for a user and adds +1 to the amount of votes that are required to lynch them.
*/
var addLovedPoint = function(gameid, userid)
{
    //retrieve love/hate data
    var rawlovedata = fs.readFileSync(`${dir}/${gameid}/lynching/lovehateweights.txt`).toString();
    var lovedata = rawlovedata.split("\n");

    //find user
    for(var i = 0; i < (lovedata.length - 1); i++)
    {
        var currentlove = lovedata[i].split("  ");

        //update love/hate information
        if(currentlove[0] == userid)
        {
            var currentvalue = parseInt(currentlove[1]);

            //if it would restore it to 0, just remove data
            if((currentvalue + 1) == 0)
            {
                fs.writeFileSync(`${dir}/${gameid}/lynching/lovehateweights.txt`, rawlovedata.replace(`${lovedata[i]}\n`, ""));
            }

            //add +1 to their votes needed
            else
            {
                fs.writeFileSync(`${dir}/${gameid}/lynching/lovehateweights.txt`, rawlovedata.replace(`${lovedata[i]}`, `${currentlove[0]}  ${currentvalue + 1}`));
            }
            
        }
    }

    //no data found for user, start new entry
    fs.writeFileSync(`${dir}/${gameid}/lynching/lovehateweights.txt`, rawlovedata + `${userid}  1\n`);
}

/* addHatedPoint
addHatedPoint accepts the id for a user and adds -1 to the amount of votes required to lynch them.
*/
var addHatedPoint = function(gameid, userid)
{
    //retrieve love/hate data
    var rawlovedata = fs.readFileSync(`${dir}/${gameid}/lynching/lovehateweights.txt`).toString();
    var lovedata = rawlovedata.split("\n");

    //find user
    for(var i = 0; i < (lovedata.length - 1); i++)
    {
        var currentlove = lovedata[i].split("  ");

        //update love/hate information
        if(currentlove[0] == userid)
        {
            var currentvalue = parseInt(currentlove[1]);

            //if it would restore it to 0, just remove from data
            if((currentvalue - 1) == 0)
            {
                fs.writeFileSync(`${dir}/${gameid}/lynching/lovehateweights.txt`, rawlovedata.replace(`${lovedata[i]}\n`, ""));
            }

            //add -1 to their votes needed
            else
            {
                fs.writeFileSync(`${dir}/${gameid}/lynching/lovehateweights.txt`, rawlovedata.replace(`${lovedata[i]}`, `${currentlove[0]}  ${currentvalue - 1}`));
            }
            
        }
    }

    //no data found for user, start new entry
    fs.writeFileSync(`${dir}/${gameid}/lynching/lovehateweights.txt`, rawlovedata + `${userid}  -1\n`);
}

/* removeLoveHate
removeLoveHate accepts a user id and clears all love/hate points from them
*/
var removeLoveHate = function(gameid, userid)
{
    //retrieve love/hate data
    var rawlovedata = fs.readFileSync(`${dir}/${gameid}/lynching/lovehateweights.txt`).toString();
    var lovedata = rawlovedata.split("\n");

    //find target
    for(var i = 0; i < (lovedata.length - 1); i++)
    {
        var currentlove = lovedata[i].split("  ");

        //clear user's love/hate points from file
        if(currentlove[0] == userid)
        {
            fs.writeFileSync(`${dir}/${gameid}/lynching/lovehateweights.txt`, rawlovedata.replace(`${lovedata[i]}\n`, ""));
            return;
        }
    }
}

/* setWeight
setWeight accepts the id for a user and a new numerical weight for their vote. Their vote will now be worth
that number of votes.
*/
var setWeight = function(gameid, userid, newweight)
{
    //new weight must be a number
    if(newweight == NaN) return errorcodes.ERROR_NOT_A_NUMBER;

    //remove a previous weight for this user
    removeWeight(gameid, userid);

    //add info to file
    fs.appendFileSync(`${userid}  ${newweight}\n`);
}

/* removeWeight
removeWeight accepts the id for a user and returns the weight of their vote to 1.
*/
var removeWeight = function(gameid, userid)
{
    //get previous weight data
    var rawweightdata = fs.readFileSync(`${dir}/${gameid}/lynching/voteweights.txt`).toString();
    var weightdata = rawweightdata.split("\n");

    //locate data for this user if it exists
    for(var i = 0; i < (weightdata.length - 1); i++)
    {
        var currentweight = weightdata[i].split("  ");
        if(currentweight[0] == userid)
        {
            //remove data for this user
            fs.writeFileSync(`${dir}/${gameid}/lynching/voteweights.txt`, rawweightdata.replace(`${weightdata[i]}\n`, ""));
            return;
        }
    }
}

/* setVotecap
setVotecap sets the number of votes required to lynch someone, barring external factors
*/
var setVotecap = function(gameid, newcap)
{
    fs.writeFileSync(`${dir}/${gameid}/lynching/votecap.txt`, `${newcap}`);
}

/* addVote
addVote accepts a target's id and a voter's id, then performs checks to make sure that the voter can
vote to lynch the target. If the checks pass, then it adds the vote to the list of votes for that target
*/
var addVote = function(gameid, targetid, voterid)
{
    //lynch must be running
    if(!lynchisrunning(gameid)) return errorcodes.ERROR_LYNCH_NOT_RUNNING;

    //get lynch data
    var rawlynchdata = fs.readFileSync(`${dir}/${gameid}/lynching/lynch.txt`).toString();
    var lynchdata = rawlynchdata.split("\n");

    //for each target...
    for(var i = 0; i < (lynchdata.length - 1); i++)
    {
        //split into target and voters
        var current = lynchdata[i].split("  ");

        //if found target
        if(current[0] == targetid)
        {
            //add voter to end of list
            lynchdata[i] = lynchdata[i].concat(`  ${voterid}`);

            //readd data to file
            var newdata = "";
            for(var j = 0; j < (lynchdata.length - 1); j++)
            {
                newdata += `${lynchdata[j]}\n`;
            }
            fs.writeFileSync(`${dir}/${gameid}/lynching/lynch.txt`, newdata);

            return true;
        }
    }

    //create new target and add to file
    fs.appendFileSync(`${dir}/${gameid}/lynching/lynch.txt`, `${targetid}  ${voterid}\n`);

    return true;
}

/* removeVote
removeVote accepts a voter's id and removes any votes they've made on any target for a given game.
*/
var removeVote = function(gameid, voterid)
{
    //lynch must be running
    if(!lynchisrunning(gameid)) return errorcodes.ERROR_LYNCH_NOT_RUNNING;

    //get lynch data
    var rawlynchdata = fs.readFileSync(`${dir}/${gameid}/lynching/lynch.txt`).toString();
    var lynchdata = rawlynchdata.split("\n");
    
    //find lynch with vote
    for(var i = 0; i < (lynchdata.length - 1); i++)
    {
        var current = lynchdata[i].split("  ");
        for(var j = 1; j < current.length; j++)
        {
            if(current[j] == voterid)
            {
                if(current.length == 2)
                    rawlynchdata = rawlynchdata.replace(`${lynchdata[i]}\n`, "");
                else
                    rawlynchdata = rawlynchdata.replace(`  ${voterid}`, "");
            }
        }
    }

    //write lynch data back
    fs.writeFileSync(`${dir}/${gameid}/lynching/lynch.txt`, rawlynchdata);

    return true;
}

/* clearVotes
clearVotes removes all votes for the currently running lynch
*/
var clearVotes = function(gameid)
{
    fs.writeFileSync(`${dir}/${gameid}/lynching/lynch.txt`, "");
}

/* clearVotesTarget
clearVotesTarget searches the votes for the currently running lynch to find all votes for a specific target,
and deletes them
*/
var clearVotesTarget = function(gameid, targetid)
{
    var rawvotedata = fs.readFileSync(`${dir}/${gameid}/lynching/lynch.txt`).toString();
    var votedata = rawvotedata.split("\n");
    for(var i = 0; i < (votedata.length - 1); i++)
    {
        var currentvotedata = votedata[i].split("  ");
        if(currentvotedata[0] == targetid)
        {
            fs.writeFileSync(`${dir}/${gameid}/lynching/lynch.txt`, rawvotedata.replace(`${votedata[i]}\n`, ""));
        }
    }
}

/*
3: FILE FIXERS
*/

/* cleanseRoles
cleanseRoles determines if there are any roles stored in the lynch roles file that no longer exist, and deletes them
*/
var cleanseRoles = function(gameid)
{
    var rawroles = fs.readFileSync(`${dir}/${gameid}/lynching/roles.txt`).toString();
    var roles = rawroles.split("\n");
    for(var i = 0; i < roles.length; i++)
    {
        try{
            var current = roles[i].split("  ");
            var guild = client.guilds.cache.get(current[0]);
            var role = guild.roles.cache.get(current[1]);
            if(role == undefined)
                rawroles = rawroles.replace(`${roles[i]}\n`, "");
        }
        catch(error)
        {
            rawroles.replace(`${roles[i]}\n`, "");
        }
    }
    fs.writeFileSync(`${dir}/${gameid}/lynching/roles.txt`, rawroles);
}

/* cleanseUpdateChannels
cleanseUpdateChannels searches the lynch update channels file for a game to find all stored channels that no longer
exist, and deletes them
*/
var cleanseUpdateChannels = function(gameid)
{
    var rawchannels = fs.readFileSync(`${dir}/${gameid}/lynching/updatechannels.txt`).toString();
    var channels = rawchannels.split("\n");
    {
        for(var i = 0; i < (channels.length - 1); i++)
        {
            try{
                var channel = client.channels.cache.get(channels[i]);
                if(channel == undefined)
                {
                    rawchannels = rawchannels.replace(`${channels[i]}\n`, "");
                }
            }
            catch(error)
            {
                rawchannels = rawchannels.replace(`${channels[i]}\n`, "");
            }
        }
    }
    fs.writeFileSync(`${dir}/${gameid}/lynching/updatechannels.txt`, rawchannels);
}

/* cleanseVotingChannels
cleanseVotingChannels searches the lynch channels for a game to find all stored channels that no longer exist,
and deletes them
*/
var cleanseVotingChannels = function(gameid)
{
    var rawchannels = fs.readFileSync(`${dir}/${gameid}/lynching/channels.txt`).toString();
    var channels = rawchannels.split("\n");
    {
        for(var i = 0; i < (channels.length - 1); i++)
        {
            try{
                var channel = client.channels.cache.get(channels[i]);
                if(channel == undefined)
                {
                    rawchannels = rawchannels.replace(`${channels[i]}\n`, "");
                }
            }
            catch(error)
            {
                rawchannels = rawchannels.replace(`${channels[i]}\n`, "");
            }
        }
    }
    fs.writeFileSync(`${dir}/${gameid}/lynching/channels.txt`, rawchannels);
}

/* cleanseVotingExceptions
cleanseVotingExceptions determines if there are any users in the votingexceptions file that are no longer
accessible to the bot, and deletes them
*/
var cleanseVotingExceptions = function(gameid)
{
    var rawexceptions = fs.readFileSync(`${dir}/${gameid}/lynching/votingexceptions.txt`).toString();
    var exceptions = rawexceptions.split("\n");
    for(var i = 0; i < (exceptions.length - 1); i++)
    {
        try
        {
            var user = client.users.cache.get(exceptions[i]);
            console.log(user);
            if(user == undefined)
            {
                rawexceptions = rawexceptions.replace(`${exceptions[i]}\n`, "");
            }
        }
        catch(error)
        {
            rawexceptions = rawexceptions.replace(`${exceptions[i]}\n`, "");
        }
    }
    fs.writeFileSync(`${dir}/${gameid}/lynching/votingexceptions.txt`, rawexceptions);
}

/* cleanseVoteableExceptions
cleanseVoteableExceptions determines if there are any users in the voteableexceptions file that are no longer
accessible to the bot, and deletes them
*/
var cleanseVoteableExceptions = function(gameid)
{
    var rawexceptions = fs.readFileSync(`${dir}/${gameid}/lynching/voteableexceptions.txt`).toString();
    var exceptions = rawexceptions.split("\n");
    for(var i = 0; i < (exceptions.length - 1); i++)
    {
        try
        {
            var user = client.users.cache.get(exceptions[i]);
            if(user == undefined)
            {
                rawexceptions = rawexceptions.replace(`${exceptions[i]}\n`, "");
            }
        }
        catch(error)
        {
            rawexceptions = rawexceptions.replace(`${exceptions[i]}\n`, "");
        }
    }
    fs.writeFileSync(`${dir}/${gameid}/lynching/voteableexceptions.txt`, rawexceptions);
}

/*
4: HOST COMMANDS
*/

/* startLynch
startLynch starts a lynch vote if it is able to
Criteria to start a vote:
- There is not currently a vote running.
- There is at least one voting role
- There is at least one lynch update channel
- There is at least one voter
*/
var startLynch = function(gameid, necessaryvotes=-1)
{
    //the setup must be valid
    var validsetupcode = validSetup(gameid)
    if(validsetupcode != true) return validsetupcode;

    //set the vote cap
    var requiredvotes = necessaryvotes;
    if(necessaryvotes == -1) requiredvotes = calculateVotecap(gameid);
    setVotecap(gameid, requiredvotes);

    //create lynch files
    fs.writeFileSync(`${dir}/${gameid}/lynching/lynch.txt`, "");

    //create running file
    fs.writeFileSync(`${dir}/${gameid}/lynching/lynchisrunning.txt`, "");

    //send an update
    var updatechannels = getUpdateChannels(gameid);
    for(var i = 0; i < updatechannels.length; i++)
    {
        updatechannels[i].send(`**Voting has begun!**\n*It currently requires ${requiredvotes} to lynch!*`);
    }

    //open voting channels to voters
    var votingchannels = getChannels(gameid);
    var votingroles = getRoles(gameid);
    for(var i = 0; i < votingchannels.length; i++)
    {
        for(var j = 0; j < votingroles.length; j++)
        {
            votingchannels[i].updateOverwrite(votingroles[j], { SEND_MESSAGES: true }).catch({});
        }
    }

    return true;
}

/* cancelLynch
cancelLynch cancels a currently running lynch
*/
var cancelLynch = function(gameid)
{
    if(!lynchisrunning(gameid)) return errorcodes.ERROR_LYNCH_NOT_RUNNING;

    //send notification to lynch update channels
    var updatechannels = getUpdateChannels(gameid);
    for(var i = 0; i < updatechannels.length; i++)
    {
        updatechannels[i].send(`**VOTING HAS BEEN CANCELLED!**`);
    }

    //close all voting channels
    var votingchannels = getChannels(gameid);
    var votingroles = getroles(gameid);
    for(var i = 0; i < votingchannels.length; i++)
    {
        for(var j = 0; j < votingroles.length; j++)
        {
            votingchannels[i].updateOverwrite(votingroles[j], { 'SEND_MESSAGES' : false }).catch({});
        }
    }

    resolveFiles(gameid);
}

/* resetLynch
resetLynch clears all votes for the current lynch and notifies voters of the reset
*/
var resetLynch = function(gameid)
{
    if(!lynchisrunning(gameid)) return errorcodes.ERROR_LYNCH_NOT_RUNNING;

    //notify lynch update channels
    var updatechannels = getUpdateChannels(gameid);
    for(var i = 0; i < updatechannels.length; i++)
    {
        updatechannels[i].send(`**VOTING HAS BEEN RESET!**`);
    }

    clearVotes(gameid);
}

/* endNoLynch
endNoLynch ends the current lynch vote where it is, sending the voting information to the hosts
*/
var endNoLynch = function(gameid)
{
    var updatechannels = getUpdateChannels(gameid);
    for(var i = 0; i < updatechannels.length; i++)
    {
        updatechannels[i].send(`**VOTING HAS ENDED!**`);
    }

    //close all voting channels
    var votingchannels = getChannels(gameid);
    var votingroles = getRoles(gameid);
    for(var i = 0; i < votingchannels.length; i++)
    {
        for(var j = 0; j < votingroles.length; j++)
        {
            votingchannels[i].updateOverwrite(votingroles[j], { 'SEND_MESSAGES' : false }).catch({});
        }
    }

    //retrieve voting information and update hosts
    var votinginformation = getFullWeightedVotes(gameid);
    var votingstring = stringifyWeightedVotes(votinginformation);
    var gamename = admin.getName(gameid);
    var informationstring = `Voting was concluded for game "${gamename}" with no lynch being performed!\n\n` +
                            `\`\`\`Final Votes:\n\n${votingstring}\`\`\``;
    admin.updateHosts(gameid, informationstring);

    //delete current lynch files
    resolveFiles(gameid);
}

/* hammer
hammer ends the current voting phase by lynching a specific player. sends the voting information to the hosts.
*/
var hammer = function(gameid, targetid)
{
    //notify voters of the vote ending
    var updatechannels = getUpdateChannels(gameid);
    for(var i = 0; i < updatechannels.length; i++)
    {
        updatechannels[i].send(`**VOTING HAS ENDED!**`);
    }

    //close all voting channels
    var votingchannels = getChannels(gameid);
    var votingroles = getRoles(gameid);
    for(var i = 0; i < votingchannels.length; i++)
    {
        for(var j = 0; j < votingroles.length; j++)
        {
            votingchannels[i].updateOverwrite(votingroles[j], { SEND_MESSAGES: false }).catch({});
        }
    }

    //send voting information to the hosts
    var votinginformation = getFullWeightedVotes(gameid);
    var votingstring = stringifyWeightedVotes(votinginformation);
    var gamename = admin.getName(gameid);
    var informationstring = `Voting was concluded for game "${gamename}" with <@${targetid}> being lynched!\n\n` +
                            `\`\`\`Final Votes:\n\n${votingstring}\`\`\``;
    admin.updateHosts(gameid, informationstring);

    //delete current lynch files
    resolveFiles(gameid);
}

/*
5: PLAYER LYNCH COMMANDS
*/

var lynch = function(gameid, targetid, voterid)
{
    if(!lynchisrunning(gameid)) return errorcodes.ERROR_LYNCH_NOT_RUNNING;

    if(!validVoter(gameid, voterid)) return errorcodes.ERROR_NOT_VOTER;

    if(!validVoteable(gameid, targetid)) return errorcodes.ERROR_NOT_VOTEABLE;

    removeVote(gameid, voterid);
    var returnvalue = addVote(gameid, targetid, voterid);

    if(targetAtHammer(gameid, targetid))
    {
        hammer(gameid, targetid);
    }

    return returnvalue;
}

var unlynch = function(gameid, voterid)
{
    if(!lynchisrunning(gameid)) return errorcodes.ERROR_LYNCH_NOT_RUNNING;

    return removeVote(gameid, voterid);
}

var nolynch = function(gameid, voterid)
{
    if(!lynchisrunning(gameid)) return errorcodes.ERROR_LYNCH_NOT_RUNNING;

    if(!validVoter(gameid, voterid)) return errorcodes.ERROR_NOT_VOTER;

    removeVote(gameid, voterid);
    var returnvalue = addVote(gameid, 0, voterid);

    if(targetAtHammer(gameid, 0))
    {
        endNoLynch(gameid);
    }

    return returnvalue;
}

/*
6: HELPERS
*/

/* printToUpdateChannels
printToUpdateChannels accepts a string and sends it to all lynch update channels for a given game
*/
var printToUpdateChannels = function(gameid, string)
{
    var channels = getUpdateChannels(gameid);
    for(var i = 0; i < channels.length; i++)
    {
        channels[i].send(string);
    }
}

//weightVotes accepts an array of votes and a gameid and checks with the voteweights.txt file to evaluate the
//total worth of each vote. it returns the same array of votes with each vote string ending in "xN" where N is
//the worth of that particular vote
var weightVotes = function(gameid, votes)
{
    var newvotes = [];
    for(var i = 0; i < votes.length; i++)
    {
        var currentvotes = [];
        currentvotes.push(votes[i][0]);
        for(var j = 1; j < votes[i].length; j++)
        {
            var weight = getVoteWeightTarget(gameid, votes[i][j]);
            currentvotes.push(`${votes[i][j]}x${weight}`);
        }
        newvotes.push(currentvotes);
    }
    return newvotes;
}

/* stringifyWeightedVotes
stringifyWeightedVotes accepts an array of lynch votes in the format [[string]] and turns them into a readable
format that can be sent to either update channels or the hosts
*/
var stringifyWeightedVotes = function(votes)
{
    //initialize string
    var string = "";

    //for each target...
    for(var i = 0; i < votes.length; i++)
    {
        //add target
        var votecount = votes[i].length - 1;
        var continuewithvote = true;
        if(votes[i][0] == 0)
        {
            string += `No Lynch: ${votecount} (`;
        }
        else if(votes[i][0] == -1)
        {
            string += `???: ${votes[i][1]}`;
            continuewithvote = false;
        }
        else
        {
            var user = client.users.cache.get(votes[i][0]);
            string += `${user.username}#${user.discriminator}: ${votecount} (`;
        }

        //add voters
        if(continuewithvote)
        {
            for(var j = 1; j < votes[i].length; j++)
            {
                var splitweights = votes[i][j].split("x");
                var userid = "";
                var weight = 1;
                if(splitweights.length > 1)
                {
                    userid = splitweights[0];
                    weight = splitweights[1];
                }
                else
                {
                    userid = splitweights;
                }
                var user = client.users.cache.get(userid);
                string += ` ${user.username}#${user.discriminator}`;
                if(weight > 1)
                {
                    string += `[${weight} votes]`;
                }
            }
            string += " )\n";
        }
    }

    //return votestring
    return string;
}

/* resolveFiles
resolveFiles removes and/or resets the files that are only present/filled while a lynch is actively running
*/
var resolveFiles = function(gameid)
{
    fs.unlinkSync(`${dir}/${gameid}/lynching/lynchisrunning.txt`);
    fs.unlinkSync(`${dir}/${gameid}/lynching/lynch.txt`);
    fs.writeFileSync(`${dir}/${gameid}/lynching/votecap.txt`, "");
}

/* calculateVotecap
calculateVotecap uses the lynch roles and uses the number of members in each role to calculate the lynch
majority. Currently does not take into account vote weights or exceptions.
*/
var calculateVotecap = function(gameid)
{
    //fetch the roles
    var roles = getRoles(gameid);

    //setup a count and a user list
    var votecount = 0;
    var userlist = [];

    //go through every highlighted role
    for(var i = 0; i < roles.length; i++)
    {
        //get array of members with this role
        rolemembers = roles[i].members.toJSON();

        //go through each member
        for(var j = 0; j < rolemembers.length; j++)
        {
            //test if a member has already been added to the count
            var notadded = true;
            for(var k = 0; k < userlist.length; k++)
            {
                if(userlist[k] == rolemembers[j])
                    notadded = false;
            }

            //if a member has not been added, add them
            if(notadded == true)
            {
                userlist[userlist.length] = rolemembers[j];
                votecount++;
            }
        }
    }

    //get majority of vote count
    if(votecount % 2 == 1)
        return ((votecount + 1) / 2);
    return ((votecount + 2) / 2);
}

module.exports = {
    startLynch: startLynch,
    cancelLynch: cancelLynch,
    resetLynch: resetLynch,
    endNoLynch: endNoLynch,
    hammer: hammer,
    setEmoji: setEmoji,
    getEmoji: getEmoji,
    lynchisrunning: lynchisrunning,
    addLynchRole: addLynchRole,
    removeLynchRole: removeLynchRole,
    getRoles: getRoles,
    addVoteableException: addVoteableException,
    addVotingException: addVotingException,
    removeVoteableException: removeVoteableException,
    removeVotingException: removeVotingException,
    getVotingExceptions: getVotingExceptions,
    getVoteableExceptions: getVoteableExceptions,
    addLovedPoint: addLovedPoint,
    addHatedPoint: addHatedPoint,
    removeLoveHate: removeLoveHate,
    setWeight: setWeight,
    removeWeight: removeWeight,
    getLoveHate: getLoveHate,
    getVoteWeights: getVoteWeights,
    validVoter: validVoter,
    validVoteable: validVoteable,
    lynch: lynch,
    unlynch: unlynch,
    nolynch: nolynch,
    addUpdateChannel: addUpdateChannel,
    removeUpdateChannel: removeUpdateChannel,
    getUpdateChannels: getUpdateChannels,
    addVotingChannel: addVotingChannel,
    removeVotingChannel: removeVotingChannel,
    getChannels: getChannels,
    printToUpdateChannels: printToUpdateChannels,
    validVotingChannel: validVotingChannel,
    getWeightedVotes: getWeightedVotes,
    getFullWeightedVotes: getFullWeightedVotes,
    stringifyWeightedVotes: stringifyWeightedVotes
}