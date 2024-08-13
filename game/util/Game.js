const { Deck } = require("./Deck");
const { GameState } = require("./GameState");

class Game {
    constructor() {
        this.public = {
          state: GameState.INITIALIZING,
          pot: 0,
          blinds: {
            big: {
              amount: 100,
              playerId: -1,
            },
            small: {
              amount: 50,
              playerId: -1,
            },
          },
          currentPlayerId: -1,
          availableActions: [],
          players: [],
          isStarted: false,
          communityCards: [],
        },
        this.private = {
          deck: new Deck(),
          playerHands: [],
        }
    }
}

module.exports = {Game};