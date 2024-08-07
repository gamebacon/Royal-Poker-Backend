class Card {
    constructor(suit, value) {
        this.value = value;
        this.valueSymbol = this.getValueSymbol(value);
        this.suit = suit;
        this.suitSymbol = this.getSuitSymbol(suit);
    }

    // Method to get the suit symbol
    getSuitSymbol(suit) {
        const suitSymbols = {
            0: '♥',
            1: '♦',
            2: '♣',
            3: '♠'
        };
        return suitSymbols[suit];
    }

    // Method to get the short value representation
    getValueSymbol(value) {
        const valueSymbols = {
            0: 'A',
            1: '2',
            2: '3',
            3: '4',
            4: '5',
            5: '6',
            6: '7',
            7: '8',
            8: '9',
            9: '10',
            10: 'J',
            11: 'Q',
            12: 'K'
        };
        return valueSymbols[value];
    }

    // Short label method using suit and value symbols
    toString() {
        return `${this.getValueSymbol(this.value)}${this.getSuitSymbol(this.suit)}`;
    }
}

module.exports = { Card };
