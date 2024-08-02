const { PlayerAction } = require("./util/PlayerAction");

class Player {
    constructor(user) {
        this.id = user.uid;
        this.name = user.name || user.email;
        this.image = user.picture;
        this.money = 100_000;
        this.action = PlayerAction.NONE;
    }
}

module.exports = {Player};