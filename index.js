// index.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { verifyToken } = require('./middleware/auth');
const gameEvents = require('./game/game.js');

const PORT = 5050;

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.use(verifyToken);

// Game event handling
gameEvents(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
