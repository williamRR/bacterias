import { Card, Color, Player, GameState, TreatmentType, OrganState } from '../types';
import { getSlotFromBody } from '../body-utils';
import { Color as ColorEnum } from '../types';
import { getOrganState } from './organState';

export function canPlayTreatment(
  card: Card,
  gameState: GameState,
  currentPlayer: Player,
  targetPlayer: Player,
  targetColor?: Color,
  sourceColor?: Color,
  sourcePlayerId?: string
): boolean {
  if (card.type !== 'TREATMENT' || !card.treatmentType) {
    return false;
  }

  switch (card.treatmentType) {
    case TreatmentType.ENERGY_TRANSFER:
      return canPlayEnergyTransfer(card, gameState, currentPlayer, targetPlayer, targetColor, sourceColor, sourcePlayerId);
    case TreatmentType.EMERGENCY_DECOMPRESSION:
      return canPlayEmergencyDecompression(card, targetPlayer, targetColor);
    case TreatmentType.DATA_PIRACY:
      return canPlayDataPiracy(card, gameState, currentPlayer, targetPlayer, targetColor);
    case TreatmentType.QUANTUM_DESYNC:
      return canPlayQuantumDesync(card, gameState, targetPlayer);
    case TreatmentType.PROTOCOL_ERROR:
      return canPlayProtocolError(card, gameState, currentPlayer, targetPlayer, targetColor);
    case TreatmentType.SINGULARITY:
      return canPlaySingularity(card, gameState);
    case TreatmentType.EVENT_HORIZON:
      return canPlayEventHorizon(card, gameState, currentPlayer);
    case TreatmentType.BACKUP_SYSTEM:
      return canPlayBackupSystem(card, gameState, currentPlayer, targetColor);
    default:
      return false;
  }
}

function canPlayEnergyTransfer(
  card: Card,
  gameState: GameState,
  currentPlayer: Player,
  targetPlayer: Player,
  targetColor?: Color,
  sourceColor?: Color,
  sourcePlayerId?: string
): boolean {
  if (!targetColor) return false;
  const srcColor = sourceColor || targetColor;

  const sourcePlayer = sourcePlayerId ? gameState.players.find((p: Player) => p.id === sourcePlayerId) : targetPlayer;
  if (!sourcePlayer) return false;

  const sourceSlot = getSlotFromBody(sourcePlayer.body, srcColor);
  const destSlot = getSlotFromBody(currentPlayer.body, targetColor);

  if (!sourceSlot?.organCard) return false;
  if (!destSlot?.organCard) return false;

  const hasVirus = sourceSlot.virusCards.length > 0;
  const hasMedicine = sourceSlot.medicineCards.length > 0;
  if (!hasVirus && !hasMedicine) return false;

  if (hasMedicine && destSlot.medicineCards.length >= 2) return false;

  const isSameSlot = sourcePlayer.id === currentPlayer.id && srcColor === targetColor;

  return !isSameSlot;
}

function canPlayEmergencyDecompression(card: Card, targetPlayer: Player, targetColor?: Color): boolean {
  if (!targetColor) return false;
  const targetSlot = getSlotFromBody(targetPlayer.body, targetColor);
  return targetSlot?.organCard !== undefined;
}

function canPlayDataPiracy(
  card: Card,
  gameState: GameState,
  currentPlayer: Player,
  targetPlayer: Player,
  targetColor?: Color
): boolean {
  if (!targetColor) return false;
  const playerSlot = getSlotFromBody(currentPlayer.body, targetColor);
  const targetSlot = getSlotFromBody(targetPlayer.body, targetColor);

  if (!targetSlot?.organCard) return false;
  if (playerSlot?.organCard) return false;

  return getOrganState(targetSlot) !== OrganState.IMMUNIZED;
}

function canPlayQuantumDesync(card: Card, gameState: GameState, targetPlayer: Player): boolean {
  return targetPlayer.hand.length > 0;
}

function canPlayProtocolError(
  card: Card,
  gameState: GameState,
  currentPlayer: Player,
  targetPlayer: Player,
  targetColor?: Color
): boolean {
  if (!targetColor) return false;
  if (currentPlayer.hand.length === 0) return false;

  const targetSlot = getSlotFromBody(targetPlayer.body, targetColor);
  return (targetSlot?.virusCards.length ?? 0) > 0;
}

function canPlaySingularity(card: Card, gameState: GameState): boolean {
  return gameState.players.length >= 2;
}

function canPlayEventHorizon(card: Card, gameState: GameState, currentPlayer: Player): boolean {
  return gameState.players.some((p: Player) => p.id !== currentPlayer.id && p.hand.length > 0);
}

function canPlayBackupSystem(
  card: Card,
  gameState: GameState,
  currentPlayer: Player,
  targetColor?: Color
): boolean {
  if (!targetColor) return false;
  const playerSlot = getSlotFromBody(currentPlayer.body, targetColor);

  if (playerSlot?.organCard) return false;

  return gameState.discardPile.some((c: Card) =>
    c.type === 'ORGAN' &&
    (c.color === targetColor || c.color === ColorEnum.MULTICOLOR)
  );
}
