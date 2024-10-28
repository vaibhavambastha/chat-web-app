var profile = {username: "Alice"}; 

var Service = {};



Service.origin = window.location.origin; 

Service.getAllRooms = function(){
    return fetch(this.origin + "/chat")
    .then(response =>{
        if(!response.ok){
            return response.text().then(err => {
                throw new Error(err); 
            })
        }
        return response.json();
    })
    .catch(error => {
        return Promise.reject(error); 
    });
}; 

Service.addRoom = function(data){
    return fetch(this.origin + "/chat", {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data)
    })
    
    .then(response =>{
        if(!response.ok){
            return response.text().then(err => {
                throw new Error(err); 
            })
        }
        return response.json();
    })
    .catch(error => {
        return Promise.reject(error); 
    });
}; 

function main() {

    var socket = new WebSocket("ws://localhost:8000");
    socket.addEventListener('message', (event) => {
        const messageData = JSON.parse(event.data); 
        console.log("EVENT: ", messageData); 
        let roomId = messageData['roomId']; 
        let username = messageData['username']; 
        let text = messageData['text']; 
        let currRoom = lobby.getRoom(roomId); 
        currRoom.addMessage(username, text); 
        
    });

    let lobby = new Lobby();
    let lobbyView = new LobbyView(lobby); 
    let chatView = new ChatView(socket); 
    let profileView = new ProfileView(); 

    function renderRoute() {
        var path = window.location.hash;
        var path_parts = path.split('/');
        // console.log(path_parts); 

        if(path_parts[0] === '' || path_parts[1] == '') {
            // console.log("NO WORK"); 
            var page_view = document.querySelector("#page-view");
            emptyDOM(page_view);
           page_view.appendChild(lobbyView.elem);


        }
        else if(path_parts[1] === "chat") {
            // console.log(path_parts); 
            var room = lobby.getRoom(path_parts[2]);
            console.log(room); 
            if(room) {
                chatView.setRoom(room);
            }
            else {
                console.log("room does not exist");
            }
            const page_view = document.querySelector("#page-view");
            emptyDOM(page_view);
            // page_view.innerHTML = chatView.elem; 
            page_view.appendChild(chatView.elem); 
        }
        else if(path_parts[1] === "profile") {
            // console.log("WORK"); 
            const page_view = document.querySelector("#page-view");
            emptyDOM(page_view);
            page_view.appendChild(profileView.elem);           
        } 
    }

    window.addEventListener('popstate', renderRoute);

    renderRoute();

    function refreshLobby(){
        Service.getAllRooms().then(value  => {
            value.forEach(room => {
                if(room.id in lobby.rooms){
                    lobby.rooms[room.id].name = room.name; 
                    lobby.rooms[room.id].image = room.image; 
                }
                else{   
                    lobby.addRoom(room.id, room.name, room.image, room.messages); 
                }
            });
        }).catch(error =>{
            console.log(error);
        })
    }

    //add setinterval before
    setInterval(refreshLobby, 5000); 

    
    

    cpen322.export(arguments.callee, {
        renderRoute: renderRoute,
        lobbyView: lobbyView,
        chatView: chatView,
        profileView: profileView,
        lobby: lobby,
        socket: socket
    });

    

    cpen322.export(arguments.callee, { refreshLobby, lobby });
    // cpen322.setDefault('webSocketServer', 'ws://new_address:8000');
    cpen322.setDefault('webSocketServer', 'ws://localhost:8000');
    // cpen322.export(__filename, { app });

}

window.addEventListener('load', main);

// Removes the contents of the given DOM element (equivalent to elem.innerHTML = '' but faster)
function emptyDOM (elem){
    while (elem.firstChild) elem.removeChild(elem.firstChild);
}

// Creates a DOM element from the given HTML string
function createDOM (htmlString){
    let template = document.createElement('template');
    template.innerHTML = htmlString.trim();
    return template.content.firstChild;
}

// example usage
var messageBox = createDOM(
    `<div>
        <span>Alice</span>
        <span>Hello World</span>
    </div>`
    );
//comment
class LobbyView{
    constructor(lobby){
        this.lobby = lobby;
        this.elem = createDOM(`                            
                        <div class = "content">
            <ul class = "room-list">
              <li><a href = "#/chat"><img src = "assets/everyone-icon.png"> Everyone in CPEN400A </img></a></li>
              <li><a href = "#/chat"><img src = "assets/bibimbap.jpg"> Foodies only </img></a></li>
              <li><a href = "#/chat"><img src = "assets/minecraft.jpg"> Gamers Unite </img></a></li>
              <li><a href = "#/chat"><img src = "assets/canucks.png"> Canucks Fans</img></a></li>
            </ul>
            <div class = "page-control">
              <input type="text" id = "room_title" placeholder="Room Title">
              <button type="button">Create Room</button>
            </div>
          </div>`); 
          this.listElem = this.elem.querySelector("ul.room-list");
          this.inputElem = this.elem.querySelector("input");
          this.buttonElem = this.elem.querySelector("button");
    

          this.buttonElem.addEventListener("click", () => {
            const roomTitle = this.inputElem.value.trim(); 
            if (roomTitle) {
                var data = {name: roomTitle, image: "assets/everyone-icon.png"};
                console.log("Data sent is: ", data); 
                Service.addRoom(data).then(response =>{
                    // NEED TO DO ERROR HANDLING
                        if(response){
                            this.lobby.addRoom(response['id'], response['name'], response['image'], response['messages']); 
                            this.redrawList(); 
                            this.inputElem.value = ''; 
                        }
                })
                .catch(error => {
                    return Promise.reject(error); 
                });
                
            } else {
                alert("Room title empty."); 
            }
        });
        
        // this.buttonElem.addEventListener("click", () => {
        //     const roomTitle = this.inputElem.value.trim(); 
        //     if (roomTitle) {
        //         const roomId = `room-${Object.keys(this.lobby.rooms).length + 1}`; 
        //         this.lobby.addRoom(roomId, roomTitle, "assets/everyone-icon.png", []); 
        //         this.redrawList(); 
        //         this.inputElem.value = ''; 
        //     } else {
        //         alert("Room title empty."); 
        //     }
        // });
        

        // this.redrawList();
        this.lobby.onNewRoom = (room) => { // Made by GPT
            const listItem = document.createElement('li');
            listItem.innerHTML = `<a href="#/chat/${room.id}"><img src="${room.image}" alt="${room.name}"> ${room.name}</a>`;
            this.listElem.appendChild(listItem);
        };
    }

    redrawList() {
        this.listElem.innerHTML = '';

        for (const roomId in this.lobby.rooms) {
            const room = this.lobby.rooms[roomId];
            const listItem = document.createElement('li'); 
            listItem.innerHTML = `<a href="#/chat/${room.id}"><img src="${room.image}" alt="${room.name}"> ${room.name}</a>`; // Set inner HTML with room details
            this.listElem.appendChild(listItem); 
        }


    }
}

class ChatView{
    constructor(socket){
        this.elem = createDOM(`<div class = "content">
            <h4 class = "room-name">Everyone in CPEN400A</h4>

            <div class = "message-list">
                <div class = "message">
                    <span class = "message-user">
                        Bob
                    </span>
                    <span class = "message-text">
                        How is everyone doing today?
                    </span>
                </div>

                <div class = "message my-message">
                    <span class = "message-user">
                        Alice
                    </span>
                    <span class = "message-text">
                        Hi guys!
                    </span>
                </div>

                    <div class = "message">
                        <span class = "message-user">
                            Charlie
                        </span>
                        <span class = "message-text">
                            Ugh... I'm still trying to debug my sorting algorithm...
                        </span>
                    </div>

                    <div class = "message">
                        <span class = "message-user">
                            Bob
                        </span>
                        <span class = "message-text">
                            Do you need some help with that Charlie?
                        </span>
                    </div>


                    <div class = "message my-message">
                        <span class = "message-user">
                            Alice
                        </span>
                        <span class = "message-text">
                            I can help with that too
                        </span>
                    </div>
            </div>
            <div class = "page-control">
                <textarea id = "message-text" placeholder="Message"></textarea>
                <button type="button">Send</button>
              </div>
            </div>`); 
            this.titleElem = this.elem.querySelector("h4"); //change to actual room name
            this.chatElem = this.elem.querySelector("div.message-list");
            this.inputElem = this.elem.querySelector("textarea");
            this.buttonElem = this.elem.querySelector("button");
            this.room = null;
            this.buttonElem.addEventListener("click", () => {
                this.sendMessage();
            });
            this.inputElem.addEventListener("keyup", (event) => { //Used GPT to implement
                if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    this.sendMessage();
                }
            });
            this.socket = socket; 


    }

    sendMessage(){
        const text = this.inputElem.value;
        // console.log("MESSAGE: ", profile.username); 
        // console.log("MESSAGE: ", text); 
        this.room.addMessage(profile.username, text);
        // console.log("Works: ", text); 
        this.inputElem.value = ''; 
        const message = {roomId: this.room.id, username: profile.username, text: text};
        this.socket.send(JSON.stringify(message)); 
    }
    
    setRoom(room) {
        this.room = room;

        this.titleElem.textContent = room.name;

        this.chatElem.innerHTML = ''; // Clear existing messages

        this.room.messages.forEach(message => {
            const messageDiv = document.createElement('div');
            const mine = (message.username == profile.username); 

            messageDiv.classList.add('message'); 
            if(mine){
                messageDiv.classList.add('my-message')
            }
        
            messageDiv.innerHTML = `
            <span class="message-user">${message.username}</span>
            <span class="message-text">${message.text}</span>`;
        
            this.chatElem.appendChild(messageDiv);
        });

        this.room.onNewMessage = (message) => { // Took inspiration from GPT to make the code look cleaner
            const newMessageDiv = document.createElement("div");
            newMessageDiv.className = "message";

            const newUserSpan = document.createElement("span");
            newUserSpan.className = "message-user";
            newUserSpan.textContent = message.username;

            const newTextSpan = document.createElement("span");
            newTextSpan.className = "message-text";
            newTextSpan.textContent = message.text;

            newMessageDiv.appendChild(newUserSpan);
            newMessageDiv.appendChild(newTextSpan);

            if (message.username === profile.username) {
                newMessageDiv.classList.add("my-message");
            }

            this.chatElem.appendChild(newMessageDiv);
        };
    }
}

class ProfileView{
    constructor(){
        this.elem = createDOM(`<div class = "content">
                                    <div class="profile-form">
                                        <form>
                    <div class="form-field">
                        <label for="username">Username</label>
                        <input type="text" id="username" name="username"> 
                    </div>
                    <div class="form-field">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password"> 
                    </div>
                    <div class="form-field">
                        <label for="avatar-image">Avatar Image</label>
                        <img src="assets/profile-icon.png" class="profile-image" alt="Profile Icon">
                        <input type="file" id="avatar-image" name="avatar-image">
                    </div>
                    <div class="form-field">
                        <label for="about">About</label>
                        <textarea id="about" name="about"></textarea>
                    </div>
                </form>
                                    </div>            
                                    <div class = "page-control">
                                        <button type="button">Save</button>  
                                    </div>
                                    </div>`); 
        // this.elem = profileDom; 
    }
}

class Room{
    constructor(id, name, image = "assets/everyone-icon.png", messages = []){
        this.id = id; 
        this.name = name; 
        this.image = image;
        this.messages = messages; 
    }

    addMessage(username, text) {
        // console.log("NOW PRINTING: ", username); 
        // console.log("NOW PRINTING: ", text); 
        if(text.trim() === ''){
            return ; 
        }
        // console.log("NOW PRINTING: ", username); 
        // console.log("NOW PRINTING: ", text); 
        let message = {username: username, text: text}; 
        // console.log("NOW PRINTING: ", message); 
        this.messages.push(message);
        if (typeof this.onNewMessage === 'function') { // MADE BY GPT
            this.onNewMessage(message);
        }
    }
}

class Lobby{
    constructor(){
        // this.rooms = {"room-1": new Room("room-1", "Room 1", "assets/everyone-icon.png", []), 
        //     "room-2": new Room("room-2", "Room 2", "assets/everyone-icon.png", []), 
        //     "room-3": new Room("room-3", "Room 3", "assets/everyone-icon.png", []), 
        //     "room-4": new Room("room-4", "Room 4", "assets/everyone-icon.png", [])
        // }; 
        this.rooms = {}; 

 
    }

    getRoom(roomId){
        return this.rooms[roomId] || null; 
    }

    addRoom(id, name, image, messages){
        let roomNew = new Room(id, name, image, messages); 
        this.rooms[id] = roomNew; 

        if (typeof this.onNewRoom === 'function') { // MADE BY GPT
            this.onNewRoom(roomNew);
        }
    }
}





            // fetch(lobbyView.elem)
            //     .then(response => {
            //         if(!response.ok) {
            //             throw new Error('index.html not loading');
            //         }
            //         return response.text();
            //     })
            //     .then(html => {
            //         const temp_div = document.createElement('div');
            //         temp_div.innerHTML = html;

            //         const lobby_content = temp_div.querySelector("div.content");
            //         if(lobby_content) {
            //             const lobby_content_copy = lobby_content.cloneNode(true);
            //             page_view.appendChild(lobby_content_copy);
            //         }
            //         else {
            //             console.error("Can not load lobby content");
            //         }
            //     })