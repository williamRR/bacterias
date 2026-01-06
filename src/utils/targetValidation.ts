import { GameState, Card, Color, Player } from '@/game/types';
import { canPlayCard } from '../game/validation';

export function calculateValidTargets(
  card: Card | null,
  gameState: GameState | null,
  currentPlayerId: string | null
): Set<string> {
  if (!card || !gameState || !currentPlayerId) {
    return new Set();
  }

  const targets = new Set<string>();
  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
  
  if (!currentPlayer) {
    return targets;
  }

  gameState.players.forEach(player => {
    const body = player.body;
    const colors = body instanceof Map ? Array.from(body.keys()) : Object.keys(body);
    
    colors.forEach(color => {
      if (canPlayCard(card, currentPlayer, player, color as Color, gameState)) {
        targets.add(`${player.id}-${color}`);
      }
    });
  });

  return targets;
}

export function isValidTarget(
  playerId: string,
  color: Color,
  validTargets: Set<string>
): boolean {
  return validTargets.has(`${playerId}-${color}`);
}
