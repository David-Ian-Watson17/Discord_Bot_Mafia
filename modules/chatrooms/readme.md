## Chatrooms

------------
Chatrooms are 

#### Self Maintained Data

-------------------------



#### Data Files

---------------
Chatrooms  
Chatrooms/[ChatroomName]/settings.json  
    type: ""  

Chatrooms/[ChatroomName]/users.json  
    (userId): {username: "", profilepicture: "", boundterminal: ""}  

Chatrooms/[ChatroomName]/terminals.json  
    (channelId): {username: "", profilepicture: "", boundusers: [""]}  

Chatrooms/[ChatroomName]/usernames.json  
    (username): {bindtype: "user/terminal", boundid: ""}  

Chatrooms/[ChatroomName]/log.txt  

ChatroomsMapping  
ChatroomsMapping/usermapping.json  
    user: [""] (an array of chatroom names)  

ChatroomsMapping/terminalmapping.json  
    terminal: "" (a chatroom name)  

