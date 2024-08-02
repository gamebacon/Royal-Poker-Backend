
const GameState = {
    INITIALIZING: 'INITIALIZING', // Game setup, shuffling cards, etc.
    WAITING_FOR_PLAYERS: 'WAITING_FOR_PLAYERS', // Waiting for players to join
    STARTING: 'STARTING', // Game setup, shuffling cards, etc.
    DEALING_CARDS: 'DEALING_CARDS', // Dealing initial hands
    PRE_FLOP: 'PRE_FLOP', // Pre-flop betting round
    FLOP: 'FLOP', // Flop betting round
    TURN: 'TURN', // Turn betting round
    RIVER: 'RIVER', // River betting round
    SHOWDOWN: 'SHOWDOWN', // Players reveal hands
    GAME_OVER: 'GAME_OVER' // End of game, determine winner
};


module.exports = { GameState };
