const { Deck } = require("./Deck");

class Game {
    constructor() {
        this.public = {
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
          players: [],
          isStarted: false,
        },
        this.private = {
          deck: new Deck(),
          playerHands: [],
        }
    }
}

module.exports = {Game};