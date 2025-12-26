console.log("1. Script starting...");

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const questions = require('./questions.json'); // Validated by debugger!

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve files from the current folder
app.use(express.static(__dirname));

// Send HTML on root load
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Game State
let roomData = {}; 
let users = {};

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join-room", (room, name) => {
    socket.join(room);
    users[socket.id] = { name, room };
    
    // Init Room
    if (!roomData[room]) {
      roomData[room] = { players: [], answers: [], votes: [] };
    }
    
    // Add Player
    if (!roomData[room].players.includes(socket.id)) {
        roomData[room].players.push(socket.id);
    }
    
    // --- AUTO START CHECK ---
    const playerCount = roomData[room].players.length;
    
    if (playerCount >= 2) {
        io.to(room).emit("wait-screen", "Starting game in 3 seconds...");
        
        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * questions.length);
            let questionData = { ...questions[randomIndex] };

            // Handle {player} tag
            if (questionData.text && questionData.text.includes("{player}")) {
                const usersInRoom = Object.values(users).filter(u => u.room === room);
                if (usersInRoom.length > 0) {
                    const randomUser = usersInRoom[Math.floor(Math.random() * usersInRoom.length)];
                    questionData.text = questionData.text.replace("{player}", randomUser.name);
                }
            }
            
            io.to(room).emit("new-round", questionData.text); 
        }, 3000);
        
    } else {
        socket.emit("wait-screen", `Waiting for players... (You are player 1/2)`);
    }
  });

  socket.on("submit-answer", (answerText) => {
    const user = users[socket.id];
    if (!user) return; 
    const room = roomData[user.room];

    room.answers.push({
      socketId: socket.id,
      author: user.name,
      text: answerText,
      votes: 0,
      funnyVotes: 0
    });

    if (room.answers.length === room.players.length) {
      const shuffledAnswers = room.answers.sort(() => Math.random() - 0.5);
      io.to(user.room).emit("start-voting", shuffledAnswers);
    } else {
      socket.emit("wait-screen", "Waiting for others to answer...");
    }
  });

  socket.on("submit-vote", (truthIndex, funnyIndex) => {
    const user = users[socket.id];
    if (!user) return;
    const room = roomData[user.room];

    if (room.answers[truthIndex]) room.answers[truthIndex].votes += 1;
    if (room.answers[funnyIndex]) room.answers[funnyIndex].funnyVotes += 1;

    room.votes.push(user.name);

    if (room.votes.length === room.players.length) {
      const results = room.answers.map(a => ({
        author: a.author,
        text: a.text,
        score: a.votes,
        funnyScore: a.funnyVotes
      }));
      
      io.to(user.room).emit("show-results", results);
      room.answers = [];
      room.votes = [];
    } else {
      socket.emit("wait-screen", "Waiting for others to vote...");
    }
  });

  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user) delete users[socket.id];
  });
});

// Using port 3001 to avoid conflicts
server.listen(3001, () => {
  console.log('----------------------------------------');
  console.log('✅ SERVER RUNNING: http://localhost:3001');
  console.log('----------------------------------------');
});