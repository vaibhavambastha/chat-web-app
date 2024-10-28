const path = require('path');
const fs = require('fs');
const express = require('express');
var messages = {};

const cpen322 = require('./cpen322-tester.js');

const WebSocket = require('ws'); 

var broker = new WebSocket.Server({port: 8000});

broker.on('connection', (client) => {
    console.log('New client connected.');
  
    // Define what to do with each client
    client.on('message', (message) => {
        const parsedMessage = JSON.parse(message);
          console.log("NOW PRINTING PARSED MESSAGE: ", parsedMessage);
          const roomId = parsedMessage.roomId;
          messages[roomId].push(parsedMessage);
      // Iterate through the broker.clients set and forward the message
      broker.clients.forEach((otherClient) => {
        if (otherClient !== client && otherClient.readyState === WebSocket.OPEN) {
          otherClient.send(JSON.stringify(parsedMessage));
        }
      });
  
      // Assuming `messages` is an object storing arrays of messages for each room
      
    });
  
    client.on('close', () => {
      console.log('Client disconnected.');
    });
  });
  



function logRequest(req, res, next){
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

const host = 'localhost';
const port = 3000;
const clientApp = path.join(__dirname, 'client');

// express app
let app = express();

app.use(express.json()) 						// to parse application/json
app.use(express.urlencoded({ extended: true })) // to parse application/x-www-form-urlencoded
app.use(logRequest);							// logging for debug

// serve static files (client-side)
app.use('/', express.static(clientApp, { extensions: ['html'] }));
app.listen(port, () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});

let chatrooms = [
	{id: "101", name: "Jack", image: "img1.jpg"}, //arbitrary
	{id: "102", name: "Daniel", image: "img2.jpg"} //arbitrary
];



// var roomCounter = 0;
function generateUniqueId() {
    return 'room-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
} 

chatrooms.forEach(room => {
	console.log("ROOM ID IS: ", room.id); 
	messages[room.id] = [];
});

app.route('/chat')
.get((req, res, next) => {
	console.log("GET RECEIVED");
    let chatData = chatrooms.map(room => {
        return {
            id: room.id,
            name: room.name,
            image: room.image,
            messages: messages[room.id]
        };
    });
    res.json(chatData);
  })
  .post((req, res) => {
	const data = req.body; 
	if(!('name' in data)){
		// res.
		return res.status(400).json({ error: 'Name is Missing' });
	}
	else{
		// var id = (++roomCounter);
		var id = generateUniqueId(); 
		var name = data['name'];
		var image = data['image']; 
		var messagesToAdd = []; 
		var room = {id: id, name: name, image: image, messages: messagesToAdd}; 
		messages[id] = messagesToAdd; 
		chatrooms.push(room); 
		return res.status(200).json(room); 
	}
  });




cpen322.connect('http://3.98.223.41/cpen322/test-a3-server.js');
cpen322.export(__filename, { app });

cpen322.export(__filename, { chatrooms, messages, broker});
