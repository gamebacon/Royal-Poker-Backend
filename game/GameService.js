const Chat = require('./Chat');
const { Player } = require('./player');
const { Game } = require('./util/Game');
const { GameState } = require('./util/GameState');
const { getNextGameState, setupBlinds, dealCards, handleUserAction, handleNextRound } = require('./util/util');

class GameService {
  constructor(io) {
    this.io = io;
    this.game = new Game();
    this.chat = new Chat(io);
    this.startTimeout = null; // Store the timeout ID to clear it if needed
    this.countdownInterval = null; // Store the interval ID to clear it if needed
    this.setupSocketListeners();
    this.resetGame();
  }

  resetGame() {
    console.log('game reset!');
    this.game.public.state = GameState.WAITING_FOR_PLAYERS;
    clearTimeout(this.startTimeout);
    clearInterval(this.countdownInterval);
    this.startTimeout = null;
    this.countdownInterval = null;
    // Reset game values
  }

  setupSocketListeners() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  addPlayer(user, socket) {
    const player = new Player(user);
    this.game.public.players.push(player);
    socket.playerId = user.uid;

    if (this.canStartGame() && this.game.public.state === GameState.WAITING_FOR_PLAYERS) {
      this.game.public.state = getNextGameState(this.game.public.state);
      const countdown = 5_000;
      this.startTimeout = setTimeout(() => this.startGame(), countdown);
      let count = countdown / 1_000;
      this.countdownInterval = setInterval(() => {
        this.chat.send({text: `Game starting in ${--count}`
        });
      }, 1_000);
    }

    return player;
  }

  canStartGame() {
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
    this.game.public.state = getNextGameState(this.game.public.state);
    dealCards(this.game); // Call the utility function to deal cards

    // Send hands to each player
    for (const playerHand of this.game.private.playerHands) {
      
      // Find the socket for this player by iterating over connected sockets
      const playerSocket = Array.from(this.io.sockets.sockets.values()).find(socket => socket.playerId === playerHand.playerId);

      if (playerSocket) {
        playerSocket.emit('playerHand', { cards: playerHand.cards });
      }
    }
  }

  handleNextRound() {
    handleNextRound(this.game);
    this.gameUpdate();
  }

  handlePlayerMove(user, move) {
      //todo: return if game service is busy

      if (user.uid !== this.game.public.currentPlayerId) {
        return;
      }

      if (handleUserAction(this.game, move) == -1) {
        this.handleNextRound()
      } else {
        console.log('more players to act!');
      }
      try {
      } catch (error) {
        console.log(error.message);
        return;
      }

      this.gameUpdate(); 
  }

  onDisconnect(user) {
    this.removePlayer(user.uid);
    this.chat.addLeaveMessage(user);
    this.gameUpdate();
  }

  handleConnection(socket) {
    const user = socket.user;
    this.addPlayer(user, socket);
    socket.join('mainGame');
    this.chat.addJoinMessage(user);
    this.gameUpdate();

    socket.on('disconnect', () => this.onDisconnect(user));

    socket.on('startGame', () => {
      this.startGame();
    });

    socket.on('makeMove', (move) => {
      this.handlePlayerMove(user, move)
    });

    socket.on('sendMessage', (msg) => {
      this.chat.sendMessage(socket, msg);
    });
  }

  startGame() {
    if (this.canStartGame()) {
      clearInterval(this.countdownInterval);
      setupBlinds(this.game);
      this.dealCards();
      this.game.public.state = getNextGameState(this.game.public.state);
      this.game.public.isStarted = true;
      this.io.to('mainGame').emit('gameStart', { message: "Game is starting!" });
      this.gameUpdate();
    }
  }
}

module.exports = GameService;
