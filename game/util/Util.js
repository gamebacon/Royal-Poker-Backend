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

function resetActionsAndBets(game) {
  game.public.currentBet = 0;

  for (const player of game.public.players) {
    player.currentBet = 0;
    if (player.action != PlayerAction.FOLD) {
      player.action = null;
    }
  }
}


function dealCommunityCards(game, amount) {
  for(i = 0; i < amount; i++) {
      const card = game.private.deck.cards.pop();
      game.public.communityCards.push(card);
  }
}

function handleNextRound(game) {
  game.public.state = getNextGameState(game.public.state)

  resetActionsAndBets(game);

  const nextPlayerIndex = getNextActivePlayerIndex(game);
  const nextPlayer = game.public.players[nextPlayerIndex];
  setupNextPlayer(game, nextPlayer);

  switch(game.public.state) {
    case GameState.FLOP:
      dealCommunityCards(game, 3);
      return;
    case GameState.TURN:
      dealCommunityCards(game, 1);
      return;
    case GameState.RIVER:
      dealCommunityCards(game, 1);
      return;
    case GameState.SHOWDOWN:
      return;
  }

}

function getMinBet(game) {
  return game.public.blinds.big.amount;
}

function getMinRaise(game) {
  if (game.public.currentBet > 0) {
    return game.public.currentBet * 2;
  }
  return game.public.blinds.big.amount * 2;
}

function setupNextPlayer(game, player) {

  console.log(player)
  if (player == undefined) {
    throw new Error('null player')   }

  availableActions = [];

  if (game.public.currentBet == 0 && player.money >= getMinBet(game)) {
    availableActions.push(PlayerAction.BET);
  }
  if (player.money >= game.public.currentBet && game.public.currentBet != 0) {
    availableActions.push(PlayerAction.CALL);
  }
  if (player.money >= getMinRaise(game) && game.public.currentBet > 0) {
    availableActions.push(PlayerAction.RAISE)
  } 
  if (player.currentBet == game.public.currentBet) {
    availableActions.push(PlayerAction.CHECK);
  }

  availableActions.push(PlayerAction.FOLD);

  game.public.currentPlayerId = player.id;
  game.public.availableActions = availableActions;
  console.log(`Current turn: ${player.name}`);
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
      } else if (callAmount == 0) {
        throw new Error("Player already matching bet.");
      }
      currentPlayer.money -= callAmount;
      currentPlayer.currentBet += callAmount;
      game.public.pot += callAmount;
      break;

    case PlayerAction.BET:
      if (amount <= 0) {
        throw new Error("Bet amount must be greater than zero.");
      } else if (amount > currentPlayer.money) {
        throw new Error("Not enough money to bet.");
      } else if (currentPlayer.currentBet > 0) {
        throw new Error(`Player already placed bet: $${currentPlayer.currentBet}`);
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
      currentPlayer.action = PlayerAction.FOLD;
      break;

    default:
      throw new Error("Invalid action: " + action);
  }

  // action valid past this point
  currentPlayer.action = action;
  const nextPlayerIndex = getNextActivePlayerIndex(game);

  if (nextPlayerIndex == -1) {
    return -1;
  }

  const nextPlayer = game.public.players[nextPlayerIndex]
  setupNextPlayer(game, nextPlayer);
}


function isPlayerReadyForNextRound(game, player) {

  if (player.action == null) {
    return false;
  }

  return player.currentBet == game.public.currentBet;
}

// Utility function to find the next active player who hasn't folded
function getNextActivePlayerIndex(game) {
  const { players } = game.public;
  const currentIndex = players.findIndex(
    (player) => player.id === game.public.currentPlayerId
  );

  let nextIndex = (currentIndex + 1) % players.length;

  while (nextIndex !== currentIndex) {
    const player = players[nextIndex];
    console.log(player);

    // Check if the player is active (not folded and has actions left to take)
    if (player.action != PlayerAction.FOLD && !isPlayerReadyForNextRound(game, player)) {
      return nextIndex; // Return the index of the next active player
    } else {
      console.log('player folded or not betted')
    }

    nextIndex = (nextIndex + 1) % players.length;
  }

  // If we have looped through all players and none are active, return -1
  return -1;
}
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
  const nextPlayer = players[nextPlayerIndex];
  console.log(game);
  setupNextPlayer(game, nextPlayer);
}

module.exports = {
  getNextGameState,
  setupBlinds,
  dealCards,
  handleUserAction,
  handleNextRound,
};
