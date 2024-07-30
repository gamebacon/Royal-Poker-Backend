// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const admin = require('firebase-admin');
const cors = require('cors');
const PORT = 5050;
const serviceAccount = require('./firebase-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // databaseURL: 'https://<your-database-name>.firebaseio.com'
});

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

const verifyToken = async (socket, next) => {
  console.log('Verifying token');
  const token = socket.handshake.auth.token;
  if (!token) {
    console.error('No token provided');
    return next(new Error('Authentication error'));
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    socket.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    next(new Error('Authentication error'));
  }
};

io.use((socket, next) => {
  console.log('Middleware executed');
  verifyToken(socket, next);
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.user);

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });

  socket.on('message', (msg) => {
    const message = {
      text: msg,
      user: {
        id: socket.user.uid,
        email: socket.user.email,
        displayName: socket.user.name || socket.user.email,
        image: socket.user.picture,
      }
    };
    console.log('Message received:', message);
    io.emit('message', message);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
