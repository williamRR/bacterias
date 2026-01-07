import { Card, Color, Player, GameState, TreatmentType } from '../game/types';
import { canPlayCard } from '../game/validation';
import { SLOT_COLORS } from '../game/body-utils';

export function calculateValidTargets(
  selectedCard: Card | null,
  gameState: GameState | null,
  currentPlayerId: string | null
): Set<string> {
  const targets = new Set<string>();

  if (!selectedCard || !gameState) {
    return targets;
  }

  const currentPlayer = gameState.players.find((p) => p.id === currentPlayerId);
  if (!currentPlayer) {
    return targets;
  }

  gameState.players.forEach((player) => {
    SLOT_COLORS.forEach((color) => {
      if (canPlayCard(selectedCard, currentPlayer, player, color, gameState)) {
        targets.add(`${player.id}-${color}`);
      }
    });
  });

  return targets;
}

export function calculateEnergyTransferSources(gameState: GameState): Set<string> {
  const sources = new Set<string>();

  gameState.players.forEach((player) => {
    SLOT_COLORS.forEach((color) => {
      const slot = player.body instanceof Map ? player.body.get(color) : player.body[color];
      if (slot && (slot.virusCards.length > 0 || slot.medicineCards.length > 0)) {
        sources.add(`${player.id}-${color}`);
      }
    });
  });

  return sources;
}

export function calculateEnergyTransferTargets(
  gameState: GameState,
  color: Color
): Set<string> {
  const targets = new Set<string>();

  gameState.players.forEach((player) => {
    const slot = player.body instanceof Map ? player.body.get(color) : player.body[color];
    if (slot && slot.organCard) {
      targets.add(`${player.id}-${color}`);
    }
  });

  return targets;
}

export function calculateAllPlayersWithOrgans(gameState: GameState): Set<string> {
  const targets = new Set<string>();

  gameState.players.forEach((player) => {
    SLOT_COLORS.forEach((color) => {
      const slot = player.body instanceof Map ? player.body.get(color) : player.body[color];
      if (slot?.organCard) {
        targets.add(`${player.id}-${color}`);
      }
    });
  });

  return targets;
}

export function calculateAllPlayersExcept(
  gameState: GameState,
  excludePlayerId: string
): Set<string> {
  const targets = new Set<string>();

  gameState.players.forEach((player) => {
    if (player.id === excludePlayerId) {
      return;
    }

    SLOT_COLORS.forEach((color) => {
      const slot = player.body instanceof Map ? player.body.get(color) : player.body[color];
      if (slot?.organCard) {
        targets.add(`${player.id}-${color}`);
      }
    });
  });

  return targets;
}

export function isSingularityCard(card: Card): boolean {
  return card.type === 'TREATMENT' && card.treatmentType === TreatmentType.REDISTRIBUCION;
}

export function isEnergyTransferCard(card: Card): boolean {
  return card.type === 'TREATMENT' && card.treatmentType === TreatmentType.DERIVACION_ENERGIA;
}

export function buildTargetKey(playerId: string, color: Color): string {
  return `${playerId}-${color}`;
}
