const { Card } = require("./Card");

class Deck {
    constructor() {
        this.cards = [];
        for (let suit = 0; suit < 4; suit++) {
            for (let value = 0; value < 13; value++) {
                const card = new Card(suit, value);
                this.cards.push(card);
            }
        }
    }

    // Method to shuffle the deck
    shuffle() {
        // Fisher-Yates Shuffle Algorithm
        for (let i = this.cards.length - 1; i > 0; i--) {
            // Generate a random index from 0 to i
            const j = Math.floor(Math.random() * (i + 1));
            // Swap cards[i] with cards[j]
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }
}

module.exports = { Deck };
