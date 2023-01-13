<h1>Discord Mafia Bot</h1>

<h2>A Bot for Helping Hosts Run Discord Mafia Games</h2>

Discord Mafia is a social deduction game that pits factions against each other and has players rely on their intuition, wit, charm, ability to trust, and deductive skills to help their faction come out on top. Players do not know from the start what role everyone is playing or what faction they are aligned with and so the ability to communicate properly and at the right times (or prevent that communication) is paramount to a player's success. This bot intends to provide features that allow for more communication options than Discord allows natively, while providing those that host these games with helpful tools to ensure their games run smoothly.

--------------------------------------------------------------

<h3>Connections</h3>

Connections allow messages sent in one discord channel to be sent to another discord channel, even if that channel is in a different server. There are a few different kinds of connections.

<h4>Standard</h4>

A Standard Connection sends the message as is, with the username and profile picture of the user that sent it present.

<h4>Anonymous</h4>

An Anonymous Connection sends the message as is, but with the username and profile picture being swapped for a pre-established alternative.

<h4>Signal</h4>

A Signal Connection does not send all messages posted in the channel and instead allows users to use the /signal command to post a pre-determined message in the destination channel. These messages can be set up to allow for users to be pinged at certain points.

<h4>User</h4>

A User Connection sends all messages made by a given user in any server belonging to the game to the destination channel.

<h3>Chatrooms</h3>

A Chatroom is a collection of terminals and accounts that allow users to communicate anonymously. 

Terminals are discord channels that have been set up to act as a place to post messages in the chatroom. Any message posted in a terminal will be broadcast to all other terminals in that chatroom.

Accounts have a given username and profile picture that can be changed by either admins or authorized users. Multiple users may have access to one account and multiple accounts may be employed by one user.

<h3>Voting</h3>

In order to win a game of mafia, players have to be eliminated. This is most commonly done by a mechanism called the lynch vote. This bot provides a suite of features for voting, allowing hosts to easily allow or disallow users to vote and automatically updating players on the current state of the vote in designated update channels.