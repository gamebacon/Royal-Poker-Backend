// game.js
const Chat = require('./Chat');
const { Player } = require('./player');
const { Game } = require('./util/Game');
const { GameState } = require('./util/GameState');
const { getNextGameState, setupBlinds, dealCards } = require('./util/util');

class GameService {
  constructor(io) {
    this.io = io;
    this.game = new Game();
    this.chat = new Chat(io);
    this.startTimeout = null; // Store the timeout ID to clear it if needed
    this.countdownInterval = null; // Store the timeout ID to clear it if needed
    this.gameState = GameState.INITIALIZING;
    this.setupSocketListeners();
    this.resetGame();
  }

  resetGame() {
    console.log('game reset!');
    this.gameState = GameState.WAITING_FOR_PLAYERS;
    clearTimeout(this.startTimeout);
    clearInterval(this.coundownInterval);
    this.startTimeout = null;
    this.countdownInterval = null;
    //todo reset game values
  }

  setupSocketListeners() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  addPlayer(user) {
    const player = new Player(user);
    this.game.public.players.push(player);

    // Check if we have enough players to start the game
    if (this.canStartGame() && this.gameState == GameState.WAITING_FOR_PLAYERS) {
      this.gameState = getNextGameState(this.gameState);
      const countdown = 5_000;
      // If the game is not yet started, set a timeout to start the game
      this.startTimeout = setTimeout(() => this.startGame(), countdown);
      let count = countdown / 1_000;
      this.coundownInterval = setInterval(() => {
        this.chat.send({
          text: `Game starting in ${count--}`
        }
      )
      }, 1_000);
    }

    return player;
  }

  canStartGame() {
    // Correct condition to check the number of players
    return this.game.public.players.length >= 2 && !this.game.public.isStarted; 
  }

  removePlayer(uid) {
    this.game.public.players = this.game.public.players.filter(player => player.id !== uid);
    
    // If players drop below 2, cancel the game start timeout
    if (this.game.public.players.length < 2 && this.startTimeout) {
      this.resetGame();
    }
  }

  gameUpdate() {
    this.io.to('mainGame').emit('gameUpdate', this.game.public); 
  }

  dealCards() {
    dealCards(this.game); // Call the utility function to deal cards

    // Send hands to each player
    for (const playerHand of this.game.private.playerHands) {
      const playerSocket = this.io.sockets.sockets.get(playerHand.playerId);
      if (playerSocket) {
        playerSocket.emit('playerHand', { cards: playerHand.cards });
      }
    }
  }

  onDisconnect(user) {
    this.removePlayer(user.uid);
    this.chat.addLeaveMessage(user);
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
      this.startGame();
    });

    socket.on('makeMove', (move) => {
      console.log(move);
      this.gameUpdate(); 
    });

    socket.on('sendMessage', (msg) => {
      this.chat.sendMessage(socket, msg);
    });
  }

  startGame() {
    // Ensure we only start the game if there are enough players and it hasn't started yet
    if (this.canStartGame()) {
      console.log('start!');
      clearInterval(this.coundownInterval);
      this.gameState = getNextGameState(this.gameState);

      this.game.public.isStarted = true;
      this.io.to('mainGame').emit('gameStart', { message: "Game is starting!" });
      setupBlinds(this.game);
      this.dealCards();
      this.gameUpdate();
    }
  }
}

module.exports = GameService;
