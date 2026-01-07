import { GameState, Player, Color, Card, OrganState, CardType, OrganSlot } from './types';
import { getOrganState } from './validation';
import { getBodySlots, serializeBody, isMapBody, initializeEmptySlot, COLORS } from './body-utils';
import { createDeck, shuffleDeck } from './deck';

function checkVictoryCondition(player: Player): boolean {
  const slots = getBodySlots(player.body);
  const organs = slots.filter(slot => slot.organCard !== undefined);

  if (organs.length !== 4) {
    return false;
  }

  const allHealthy = organs.every(slot => {
    const state = getOrganState(slot);
    return state === OrganState.HEALTHY || state === OrganState.VACCINATED || state === OrganState.IMMUNIZED;
  });

  return allHealthy;
}

function checkGameVictory(gameState: GameState): Player | null {
  for (const player of gameState.players) {
    if (checkVictoryCondition(player)) {
      return player;
    }
  }
  return null;
}

function drawCards(gameState: GameState, player: Player, count: number): void {
  for (let i = 0; i < count; i++) {
    if (gameState.deck.length > 0) {
      const card = gameState.deck.pop()!;
      player.hand.push(card);
    }
  }
}

function refillHand(gameState: GameState, player: Player): void {
  const cardsNeeded = 3 - player.hand.length;
  if (cardsNeeded > 0) {
    drawCards(gameState, player, cardsNeeded);
  }
}

function nextTurn(gameState: GameState): void {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  refillHand(gameState, currentPlayer);

  gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;

  const winner = checkGameVictory(gameState);
  if (winner) {
    gameState.gameEnded = true;
    gameState.winner = winner;
  }
}

function startTurn(gameState: GameState): void {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  refillHand(gameState, currentPlayer);
}

function playCard(gameState: GameState, player: Player, card: Card): void {
  const cardIndex = player.hand.findIndex(c => c.id === card.id);
  if (cardIndex !== -1) {
    player.hand.splice(cardIndex, 1);
    // No enviar al descarte aquí - cada caso maneja el descarte según corresponda
    // Las cartas instaladas en el tablero NO van al descarte
  }
}

function discardCards(gameState: GameState, player: Player, cards: Card[]): void {
  cards.forEach(card => {
    const cardIndex = player.hand.findIndex(c => c.id === card.id);
    if (cardIndex !== -1) {
      player.hand.splice(cardIndex, 1);
      gameState.discardPile.push(card);
    }
  });
}

function initializeGame(gameState: GameState): void {
  gameState.gameStarted = true;
  gameState.gameEnded = false;
  gameState.currentPlayerIndex = 0;
  gameState.discardPile = [];
  gameState.deck = shuffleDeck(createDeck());

  gameState.players.forEach((player) => {
    player.hand = [];
    const body = player.body;
    if (isMapBody(body)) {
      body.clear();
      COLORS.forEach(color => body.set(color, initializeEmptySlot()));
    } else {
      const newBody: Record<string, OrganSlot> = {};
      COLORS.forEach(color => { newBody[color] = initializeEmptySlot(); });
      player.body = newBody;
    }
    refillHand(gameState, player);
  });
}

function skipTurn(gameState: GameState, playerIndex: number): void {
  if (playerIndex === gameState.currentPlayerIndex) {
    nextTurn(gameState);
  }
}

export { checkVictoryCondition, checkGameVictory, drawCards, refillHand, nextTurn, startTurn, playCard, discardCards, initializeGame, skipTurn };
