// game.js
let chat = { messages: [] };
let game = { players: [] };

const addPlayerToGame = (user) => {
  game.players.push({
    id: user.uid,
    name: user.name || user.email,
    image: user.picture,
  });
};

const removePlayerFromGame = (uid) => {
  game.players = game.players.filter(player => player.id !== uid);
};

const startGame = () => {
  // Implement your game start logic here
};

const handleMove = (move) => {
  // Implement your game move logic here
};

const addMessage = (message) => {
  chat.messages.push(message);
};

const gameEvents = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.user.name);

    // Add player to the game
    addPlayerToGame(socket.user);
    socket.join('mainGame');
    io.to('mainGame').emit('gameUpdate', game);

    // Create join message
    const joinMessage = {
      text: `${socket.user.name || socket.user.email} has joined the game.`,
      user: null, // Indicate that this is a system message
    };
    addMessage(joinMessage);
    io.to('mainGame').emit('chatUpdate', chat.messages);
    io.to('mainGame').emit('userJoined', socket.user);
    io.to('mainGame').emit('gameUpdate', game);

    socket.on('disconnect', () => {
      console.log('Client disconnected');
      removePlayerFromGame(socket.user.uid);
      io.to('mainGame').emit('gameUpdate', game);
      
      const leaveMessage = {
        text: `${socket.user.name || socket.user.email} has left the game.`,
        user: null, // Indicate that this is a system message
      };
      addMessage(leaveMessage);
      io.to('mainGame').emit('chatUpdate', chat.messages);
    });

    socket.on('startGame', () => {
      startGame();
      io.to('mainGame').emit('gameUpdate', game);
    });

    socket.on('makeMove', (move) => {
      handleMove(move);
      io.to('mainGame').emit('gameUpdate', game);
    });

    socket.on('sendMessage', (msg) => {
      const message = {
        text: msg,
        user: {
          id: socket.user.uid,
          email: socket.user.email,
          displayName: socket.user.name || socket.user.email,
          image: socket.user.picture
        },
        timestamp: new Date().toLocaleTimeString()
      };
      addMessage(message);
      io.to('mainGame').emit('chatUpdate', chat.messages);
    });
  });
};

module.exports = gameEvents;
