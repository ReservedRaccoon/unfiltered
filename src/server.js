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
// roomData[roomName] = { 
//    players: [socketid1, ...], 
//    answers: [], 
//    votes: [], 
//    host: socketid 
// }

let users = {};
// users[socketid] = { name, room, score }

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // --- A. JOIN ROOM ---
  socket.on("join-room", (room, name) => {
    socket.join(room);
    users[socket.id] = { name, room, score: 0 };
    
    // Init Room
    if (!roomData[room]) {
      roomData[room] = { players: [], answers: [], votes: [], host: null };
    }
    
    // Add Player
    if (!roomData[room].players.includes(socket.id)) {
        roomData[room].players.push(socket.id);
    }

    // Make the first player the host
    if (roomData[room].host === null || roomData[room].players.length === 1) {
        roomData[room].host = socket.id;
        socket.emit('is-host'); // Tell client they are the boss
    }
    
    // Notify everyone
    const count = roomData[room].players.length;
    io.to(room).emit("wait-screen", `Waiting for players... (${count} joined)`);
  });

  // --- B. REQUEST START (Host Only) ---
  socket.on("request-start-game", () => {
    const user = users[socket.id];
    if (!user) return;
    const room = roomData[user.room];

    // Security Check: Only the host can start
    if (room && room.host === socket.id) {
        
        io.to(user.room).emit("wait-screen", "Host started the game! Loading...");

        // Small delay for drama
        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * questions.length);
            let questionData = { ...questions[randomIndex] };
            let subjectId = null; 

            // Handle {player} tag
            if (questionData.text && questionData.text.includes("{player}")) {
                const usersInRoom = Object.values(users).filter(u => u.room === user.room);
                if (usersInRoom.length > 0) {
                    const randomUser = usersInRoom[Math.floor(Math.random() * usersInRoom.length)];
                    questionData.text = questionData.text.replace("{player}", randomUser.name);
                    subjectId = randomUser.socketId; 
                }
            }
            
            // Save round data
            room.currentSubject = subjectId;
            room.answers = []; 
            room.votes = [];

            io.to(user.room).emit("new-round", questionData.text); 
        }, 1000);
    }
  });

  // --- C. SUBMIT ANSWER ---
  socket.on("submit-answer", (answerText) => {
    const user = users[socket.id];
    if (!user) return; 
    const room = roomData[user.room];

    const isTruth = (room.currentSubject === socket.id);

    room.answers.push({
      id: room.answers.length,
      socketId: socket.id,
      author: user.name,
      text: answerText,
      votes: 0,
      funnyVotes: 0,
      isCorrect: isTruth
    });

    if (room.answers.length === room.players.length) {
      const shuffledAnswers = room.answers.sort(() => Math.random() - 0.5);
      io.to(user.room).emit("start-voting", shuffledAnswers);
    } else {
      socket.emit("wait-screen", "Waiting for others to answer...");
    }
  });

  // --- D. SUBMIT VOTE ---
  socket.on("submit-vote", (truthIndex, funnyIndex) => {
    const user = users[socket.id];
    if (!user) return;
    const room = roomData[user.room];

    const truthAnswer = room.answers[truthIndex];
    const funnyAnswer = room.answers[funnyIndex];

    if (truthAnswer) {
        truthAnswer.votes += 1;
        if (truthAnswer.isCorrect) {
            user.score += 10; // Voter gets points
        } else {
            // Faker gets points
            if (users[truthAnswer.socketId]) {
                users[truthAnswer.socketId].score += 10;
            }
        }
    }

    if (funnyAnswer) {
        funnyAnswer.funnyVotes += 1;
    }

    room.votes.push(user.name);

    if (room.votes.length === room.players.length) {
      const results = room.answers.map(a => ({
        author: a.author,
        text: a.text,
        score: a.votes,
        funnyScore: a.funnyVotes,
        isCorrect: a.isCorrect
      }));
      
      io.to(user.room).emit("show-results", results);
      
      room.answers = [];
      room.votes = [];
    } else {
      socket.emit("wait-screen", "Waiting for others to vote...");
    }
  });

  // --- E. DISCONNECT ---
  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user) {
        console.log(`${user.name} disconnected`);
        if (roomData[user.room]) {
            roomData[user.room].players = roomData[user.room].players.filter(id => id !== socket.id);
            
            // If room is empty, delete it
            if (roomData[user.room].players.length === 0) {
                delete roomData[user.room];
            }
        }
        delete users[socket.id];
    }
  });

}); // End of io.on('connection')

// Using port 3001 to avoid conflicts
server.listen(3001, () => {
  console.log('----------------------------------------');
  console.log('✅ SERVER RUNNING: http://localhost:3001');
  console.log('----------------------------------------');
});