const io = require("socket.io")(3000,{
    cors:{
        origin:"*",
    },
});
/*
roomData[roomName] = {
players:[socketId1,socketId2,..],
answers:[{id:socketId,text:"answer",author:"Name"}],
votes:[]}*/

const questions = require('./question.json');
let users={}; // maps socketId->{name,roomName}
let roomData = {};

io.on("connection",(socket) => {
    console.log(`User connected : ${socket.id}`);
    // Event : user joining a specific room
    socket.on("join-room",(roomName,username)=>{
        socket.join(roomName);
        users[socket.id] = { username,roomName};
        console.log(`${username} joined room ${roomName}`);
        io.to(roomName).emit("notification",`${username} has joined the party!`);

        // initialising the room if not exists
        if(!roomData[roomName]){
            roomData[roomName] = {players:[],answers:[],votes:[]};
        }
        roomData[room].players.push(socket.id);

    });
    // Event : question is displayed for users in the room
    socket.on("get-question",(roomName)=>{
        const randomIdx = Math.floor(Math.random()* questions.length);
        let questionData = { ...questions[randomIdx]} //making a copy so that we don't modify the original database
        if ( questionData.text.includes("{player}")){
            const usersinRoom = Object.values(users).filter(u => u.room === roomName);
            if(usersinRoom.length > 0){
                const randomUser = usersInRoom[Math.floor(Math.random()* usersInRoom.length)];
                questionData.text = questionData.text.replace("{player}",randomUser.name);

            }
            else{
                //nonsense fallback
                questionData.text = questionData.text.replace("{player}","someone");
            }
        }
        io.to(roomName).emit("receive-question",questionData);
    });
    // PHASE 1 collecting answers 
    socket.on("submit-answer",(answerText)=>{
        const user = users[socket.id];
        const room = roomData[user.roomName];
        // store the answer
        room.answers.push({
            socketId:socket.id,
            author:user.name,
            text:answerText,
            votes:0,
            funnyVotes:0

        });

        // check if everyone has answered

        if(room.answers.length === room.players.length){
            // shuffle the answers
            const shuffledAnswers = room.answers.sort(()=> Math.random()-0.5);

            // switch the phase to voting
            io.to(user.roomName).emit("start-voting",shuffledAnswers);
        }
        else{
            socket.emit("wait-screen","Waiting for the players to vote");
        }

    });
    //PHASE 2 collect votes
    socket.on("submit-vote",(correctIndex,funnyIndex)=>{
        const user = users[socket.id];
        const room = roomData[user.roomName];
        // record the votes
        if(room.answers[correctIndex]) room.answers[correctIndex].votes +=1;
        if (room.answers[funnyIndex]) room.answers[funnyIndex].funnyVotes +=1;
        
        room.votes.push({voter:user.name});

        if(room.votes.length === room.players.length){
            // calculating results
            const results = room.answers.map(a=>({
                author:a.author,
                text:a.text,
                score:a.votes,
                funnyScore:a.funnyVotes
            }));
            // send results to everyone
            io.to(user.room).emit("show-results",results);
            // cleanup for next round
            room.answers = [];
            room.votes = [];

        }
        else{
            socket.emit("wait-screen","Waiting for others to vote...");
        }


    });


    // disconnecting from the room
    socket.on("disconnect",()=>{
    delete users[socket.id];
});

});

