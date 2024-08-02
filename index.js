// index.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { verifyToken } = require('./middleware/auth');
const GameService = require('./game/GameService.js');

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

const gameService = new GameService(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
