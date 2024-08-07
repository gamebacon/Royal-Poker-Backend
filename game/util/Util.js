const { GameState } = require("./GameState");
const { PlayerAction } = require("./PlayerAction");

// Function to transition to the next state
function getNextGameState(currentState) {
  switch (currentState) {
    case GameState.INITIALIZING:
      return GameState.WAITING_FOR_PLAYERS;
    case GameState.WAITING_FOR_PLAYERS:
      return GameState.STARTING;
    case GameState.STARTING:
      return GameState.DEALING_CARDS;
    case GameState.DEALING_CARDS:
      return GameState.PRE_FLOP;
    case GameState.PRE_FLOP:
      return GameState.FLOP;
    case GameState.FLOP:
      return GameState.TURN;
    case GameState.TURN:
      return GameState.RIVER;
    case GameState.RIVER:
      return GameState.SHOWDOWN;
    case GameState.SHOWDOWN:
      return GameState.GAME_OVER;
    case GameState.GAME_OVER:
      return GameState.INITIALIZING; // Reset or start a new game
    default:
      throw new Error("Invalid game state: " + currentState);
  }
}

function setupHands(game) {
  game.private.playerHands = []; // Ensure playerHands is initialized
  for (const player of game.public.players) {
    game.private.playerHands.push({
      playerId: player.id,
      cards: [],
    });
  }
}

function dealCards(game) {
  setupHands(game);

  // Ensure the deck is shuffled before dealing cards
  game.private.deck.shuffle();

  // Deal 2 cards to each player
  for (let i = 0; i < 2; i++) {
    for (const playerHand of game.private.playerHands) {
      const card = game.private.deck.cards.pop();
      playerHand.cards.push(card);
    }
  }
}

function handleUserAction(game, action) {
  const currentPlayer = game.public.players.find(
    (player) => player.id === game.public.currentPlayerId
  );

  if (!currentPlayer) {
    throw new Error("It is not the current player's turn.");
  }

  const amount = action.amount;
  action = action.action;

  switch (action) {
    case PlayerAction.CHECK:
      if (currentPlayer.currentBet != game.public.currentBet) {
        throw new Error("Cannot check; there is a current bet to match.");
      }
      break;

    case PlayerAction.CALL:
      const callAmount = game.public.currentBet - currentPlayer.currentBet;
      if (currentPlayer.money < callAmount) {
        throw new Error("Not enough money to call.");
      }
      currentPlayer.money -= callAmount;
      currentPlayer.currentBet += callAmount;
      game.public.pot += callAmount;
      break;

    case PlayerAction.BET:
      if (amount <= 0) {
        throw new Error("Bet amount must be greater than zero.");
      }
      if (amount > currentPlayer.money) {
        throw new Error("Not enough money to bet.");
      }
      currentPlayer.money -= amount;
      currentPlayer.currentBet += amount;
      game.public.currentBet = currentPlayer.currentBet;
      game.public.pot += amount;
      break;

    case PlayerAction.RAISE:
      const raiseAmount = game.public.currentBet - currentPlayer.currentBet + amount;
      if (amount <= 0) {
        throw new Error("Raise amount must be greater than zero.");
      }
      if (currentPlayer.money < raiseAmount) {
        throw new Error("Not enough money to raise.");
      }
      currentPlayer.money -= raiseAmount;
      currentPlayer.currentBet += raiseAmount;
      game.public.currentBet = currentPlayer.currentBet;
      game.public.pot += raiseAmount;
      break;

    case PlayerAction.FOLD:
      currentPlayer.isFolded = true;
      break;

    default:
      throw new Error("Invalid action: " + action);
  }

  // action valid past this point

  currentPlayer.action = action;

  // Move to the next player's turn
  const nextPlayerIndex = getNextActivePlayerIndex(game);
  game.public.currentPlayerId = game.public.players[nextPlayerIndex].id;

  return {
    action: action,
    playerId: currentPlayer.id,
    remainingMoney: currentPlayer.money,
    pot: game.public.pot,
    currentBet: game.public.currentBet,
  };
}


// Utility function to find the next active player who hasn't folded
function getNextActivePlayerIndex(game) {
  const { players } = game.public;
  let currentIndex = players.findIndex(
    (player) => player.id === game.public.currentPlayerId
  );

  let nextIndex = (currentIndex + 1) % players.length;

  while (players[nextIndex].isFolded) {
    nextIndex = (nextIndex + 1) % players.length;
    if (nextIndex === currentIndex) {
      break; // All players except one have folded
    }
  }
  return nextIndex;
}

// Function to setup blinds and determine the player's turn
function setupBlinds(game) {
  const { players } = game.public;

  // Ensure we have enough players to start the round
  if (players.length < 2) {
    throw new Error("Not enough players to set up blinds");
  }

  // Determine the small blind player ID, default to first player if uninitialized
  let smallBlindPlayerId = game.public.blinds.small.playerId;
  if (smallBlindPlayerId === -1) {
    smallBlindPlayerId = players[0].id;
  }

  // Find index of small blind player
  const smallBlindIndex = players.findIndex(
    (player) => player.id === smallBlindPlayerId
  );

  if (smallBlindIndex === -1) {
    throw new Error("Small blind player not found in the player list");
  }

  // Determine the index for the big blind
  const bigBlindIndex = (smallBlindIndex + 1) % players.length;
  const bigBlindPlayerId = players[bigBlindIndex].id;

  // Blind amounts
  const smallBlindAmount = game.public.blinds.small.amount;
  const bigBlindAmount = game.public.blinds.big.amount;

  // Deduct blinds from player balances
  const smallBlindPlayer = players[smallBlindIndex];
  const bigBlindPlayer = players[bigBlindIndex];

  // Check if players have enough money for blinds
  if (smallBlindPlayer.money < smallBlindAmount) {
    throw new Error(
      `${smallBlindPlayer.name} does not have enough money for the small blind`
    );
  }

  if (bigBlindPlayer.money < bigBlindAmount) {
    throw new Error(
      `${bigBlindPlayer.name} does not have enough money for the big blind`
    );
  }

  // Deduct the blind amounts
  smallBlindPlayer.money -= smallBlindAmount;
  bigBlindPlayer.money -= bigBlindAmount;

  // Set current player bet
  smallBlindPlayer.currentBet = smallBlindAmount;
  bigBlindPlayer.currentBet = bigBlindAmount;

  // Update the game state with the new blind player IDs for the current round
  game.public.blinds.small.playerId = smallBlindPlayerId;
  game.public.blinds.big.playerId = bigBlindPlayerId;

  // Add blinds to the pot
  game.public.pot += smallBlindAmount + bigBlindAmount;
  game.public.currentBet = bigBlindAmount;

  console.log(
    `Small blind posted by ${smallBlindPlayer.name}, Big blind posted by ${bigBlindPlayer.name}`
  );

  // Determine the next player's turn (first player to act after blinds)
  const nextPlayerIndex = (bigBlindIndex + 1) % players.length;
  game.public.currentPlayerId = players[nextPlayerIndex].id;

  console.log(`Current turn: ${players[nextPlayerIndex].name}`);
}

module.exports = {
  getNextGameState,
  setupBlinds,
  dealCards,
  handleUserAction,
};
