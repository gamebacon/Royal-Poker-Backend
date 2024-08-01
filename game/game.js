// game.js
const Chat = require('./chat');

class Game {
  constructor(io) {
    this.io = io;
    this.gameState = {
      players: [],
    };
    this.chat = new Chat(io);
    this.setupSocketListeners();
  }

  setupSocketListeners() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  addPlayer(user) {
    const player = {
      id: user.uid,
      name: user.name || user.email,
      image: user.picture,
      money: 100_000,
    };
    this.gameState.players.push(player);
    return player;
  }

  removePlayer(uid) {
    this.gameState.players = this.gameState.players.filter(player => player.id !== uid);
  }

  gameUpdate() {
    this.io.to('mainGame').emit('gameUpdate', this.gameState); 
  }

  onDisconnect(user) {
      this.removePlayer(user.uid);
      this.chat.addLeaveMessage(user)
      this.gameUpdate();
  }

  handleConnection(socket) {
    const user = socket.user;
    this.addPlayer(user);
    socket.join('mainGame');
    this.chat.addJoinMessage(user);
    this.gameUpdate();

    socket.on('disconnect', () => this.onDisconnect(user));

    socket.on('startGame', () => {
      this.gameUpdate(); 
    });

    socket.on('makeMove', (move) => {
      this.gameUpdate(); 
    });

    socket.on('sendMessage', (msg) => {
      this.chat.sendMessage(socket, msg);
    });
  }
}

module.exports = Game;
