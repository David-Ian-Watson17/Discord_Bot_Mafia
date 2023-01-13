## Administration

-----------------

This folder is used to handle the security of data management. It maintains a few separate things:

A 2 level security system in the form of owners and admins.  
Assurance that a guild (server) will never be a part of more than 1 game at a time.  
A name for each id'd folder in data.  

Therefore, all modules that make use of the multi-guild game scope of this bot should make use of this folder to gain information about where to store their data. Any modules that don't need to function inside of that scope can ignore it.

-----------------

This folder maintains three files in addition to interacting with the data handler.

namemap.json

------------
This file stores json objects with purely one key and one value. The key is the name of a game, and the value is the id of a game.

guildmap.json

--------------
This file stores json objects with purely one key and one value. The key is the id of a guild, and the value is the id of a game.

gameinformation.json

--------------------
This file stores json objects with one key but multiple values. The key is the id of a game, the values are:
name: the name of the game
owner: the discord user id of the owner of the game
admins: an array with the discord user ids of the admins of the game
guilds: an array with the discord guild ids of the guilds in the game