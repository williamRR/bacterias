import { Card, Color, Player } from '../game/types';
import { COLOR_SYSTEM_LABELS, TREATMENT_LABELS } from '../game/theme';
import { TreatmentType } from '../game/types';

export interface PlayCardParams {
  card: Card;
  color: Color;
  targetPlayer: Player;
  currentPlayerId: string | null;
}

export interface PlayEnergyTransferParams {
  card: Card;
  sourceColor: Color;
  targetColor: Color;
  targetPlayer: Player;
  energyTransferSourcePlayerId: string | null;
}

export interface PlaySingularityParams {
  card: Card;
  firstPlayerId: string;
  secondPlayerId: string;
  gameState: any;
}

export function buildPlayCardMessage(
  { card, targetPlayer, color }: PlayCardParams,
  roomId: string
) {
  return {
    roomId,
    action: {
      type: 'play-card' as const,
      card,
      targetPlayerId: targetPlayer.id,
      targetColor: color,
    },
  };
}

export function buildPlayEnergyTransferMessage(
  { card, sourceColor, targetColor, targetPlayer, energyTransferSourcePlayerId }: PlayEnergyTransferParams,
  roomId: string
) {
  return {
    roomId,
    action: {
      type: 'play-card' as const,
      card,
      targetPlayerId: targetPlayer.id,
      targetColor: targetColor,
      sourceColor: sourceColor,
      sourcePlayerId: energyTransferSourcePlayerId,
    },
  };
}

export function buildPlaySingularityMessage(
  { card, firstPlayerId, secondPlayerId }: PlaySingularityParams,
  roomId: string
) {
  return {
    roomId,
    action: {
      type: 'play-card' as const,
      card,
      targetPlayerId: firstPlayerId,
      targetColor: Color.RED,
      secondTargetPlayerId: secondPlayerId,
    },
  };
}

export function buildDiscardCardMessage(card: Card, roomId: string) {
  return {
    roomId,
    action: {
      type: 'discard-cards' as const,
      cards: [card],
    },
  };
}

export function buildEndTurnMessage(roomId: string) {
  return {
    roomId,
    action: {
      type: 'end-turn' as const,
    },
  };
}

export function getCardPlayLogMessage(
  card: Card,
  color: Color,
  targetPlayer: Player,
  currentPlayerId: string | null
): string {
  const systemName = COLOR_SYSTEM_LABELS[color];
  const targetName = targetPlayer.id === currentPlayerId ? 'tu' : `de ${targetPlayer.name}`;

  if (card.type === 'ORGAN') {
    return `Jugaste ${card.name || 'una carta de SISTEMA'} en ${systemName} ${targetName}`;
  }

  if (card.type === 'VIRUS') {
    return `Jugaste ${card.name || 'una carta de SABOTAJE'} en ${systemName} ${targetName}`;
  }

  if (card.type === 'MEDICINE') {
    return `Jugaste ${card.name || 'una carta de REPARACIÓN'} en ${systemName} ${targetName}`;
  }

  if (card.type === 'TREATMENT') {
    return getTreatmentLogMessage(card, color, targetPlayer);
  }

  return `Jugaste una carta`;
}

function getTreatmentLogMessage(card: Card, color: Color, targetPlayer: Player): string {
  const systemName = COLOR_SYSTEM_LABELS[color];

  if (!card.treatmentType) {
    return 'Jugaste una carta de ACCIÓN';
  }

  switch (card.treatmentType) {
    case TreatmentType.ENERGY_TRANSFER:
      return `Jugaste ${card.name || 'TRANSFERENCIA DE ENERGÍA'} en ${systemName}`;
    case TreatmentType.EMERGENCY_DECOMPRESSION:
      return `Jugaste ${card.name || 'DESCOMPRESIÓN DE EMERGENCIA'} en ${systemName} de ${targetPlayer.name}`;
    case TreatmentType.DATA_PIRACY:
      return `Jugaste ${card.name || 'PIRATERÍA DE DATOS'} de ${systemName} de ${targetPlayer.name}`;
    case TreatmentType.QUANTUM_DESYNC:
      return `Jugaste ${card.name || 'DESINCRONIZACIÓN CUÁNTICA'} en ${targetPlayer.name}`;
    case TreatmentType.PROTOCOL_ERROR:
      return `Jugaste ${card.name || 'ERROR DE PROTOCOLO'} en ${systemName} de ${targetPlayer.name}`;
    case TreatmentType.SINGULARITY:
      return `Jugaste ${card.name || 'SINGULARIDAD'}`;
    case TreatmentType.EVENT_HORIZON:
      return `Jugaste ${card.name || 'HORIZONTE DE SUCESOS'}`;
    case TreatmentType.BACKUP_SYSTEM:
      return `Jugaste ${card.name || 'SISTEMA DE RESPALDO'}`;
    default:
      return 'Jugaste una carta de ACCIÓN';
  }
}

export function getEnergyTransferLogMessage(card: Card, color: Color): string {
  const systemName = COLOR_SYSTEM_LABELS[color];
  return `Usaste ${card.name || 'TRANSFERENCIA DE ENERGÍA'} para mover avería/mejora en ${systemName}`;
}

export function getSingularityLogMessage(card: Card, firstPlayerName?: string, secondPlayerName?: string): string {
  return `Usaste ${card.name || 'SINGULARIDAD'} para intercambiar todos los sistemas entre ${firstPlayerName || 'jugador'} y ${secondPlayerName || 'jugador'}`;
}

export function getCardPlayNotification(
  card: Card,
  color: Color,
  targetPlayer: Player,
  currentPlayerId: string | null
): { message: string; type: 'success' | 'warning' | 'info' } {
  const systemName = COLOR_SYSTEM_LABELS[color];

  if (card.type === 'ORGAN') {
    return { message: `Sistema ${systemName} instalado`, type: 'success' };
  }

  if (card.type === 'VIRUS') {
    const targetName = targetPlayer.id === currentPlayerId ? 'tu' : `de ${targetPlayer.name}`;
    return { message: `¡Sabotaje en ${systemName} ${targetName}!`, type: 'warning' };
  }

  if (card.type === 'MEDICINE') {
    const targetName = targetPlayer.id === currentPlayerId ? 'tu' : `de ${targetPlayer.name}`;
    return { message: `Reparación aplicada a ${systemName} ${targetName}`, type: 'success' };
  }

  return getTreatmentNotification(card, color, targetPlayer);
}

function getTreatmentNotification(
  card: Card,
  color: Color,
  targetPlayer: Player
): { message: string; type: 'success' | 'warning' | 'info' } {
  const systemName = COLOR_SYSTEM_LABELS[color];

  if (!card.treatmentType) {
    return { message: 'Acción especial ejecutada', type: 'info' };
  }

  switch (card.treatmentType) {
    case TreatmentType.ENERGY_TRANSFER:
      return { message: `Transferencia de energía en ${systemName}`, type: 'success' };
    case TreatmentType.EMERGENCY_DECOMPRESSION:
      return { message: `¡Descompresión de emergencia en ${systemName} de ${targetPlayer.name}!`, type: 'warning' };
    case TreatmentType.DATA_PIRACY:
      return { message: `¡${systemName} pirateado de ${targetPlayer.name}!`, type: 'success' };
    case TreatmentType.QUANTUM_DESYNC:
      return { message: `Desincronización cuántica en ${targetPlayer.name}`, type: 'info' };
    case TreatmentType.PROTOCOL_ERROR:
      return { message: `Error de protocolo en ${systemName} de ${targetPlayer.name}`, type: 'success' };
    case TreatmentType.SINGULARITY:
      return { message: `¡SINGULARIDAD activada!`, type: 'warning' };
    case TreatmentType.EVENT_HORIZON:
      return { message: `Horizonte de sucesos activado`, type: 'info' };
    case TreatmentType.BACKUP_SYSTEM:
      return { message: `Sistema de respaldo activado`, type: 'success' };
    default:
      return { message: 'Acción especial ejecutada', type: 'info' };
  }
}

export function getEnergyTransferNotification(color: Color): { message: string; type: 'success' } {
  const systemName = COLOR_SYSTEM_LABELS[color];
  return {
    message: `¡Transferencia de energía completada en ${systemName}!`,
    type: 'success',
  };
}

export function getSingularityNotification(firstPlayerName?: string, secondPlayerName?: string): { message: string; type: 'warning' } {
  return {
    message: `¡SINGULARIDAD! ${firstPlayerName || 'Jugador 1'} ↔ ${secondPlayerName || 'Jugador 2'}: sistemas intercambiados.`,
    type: 'warning',
  };
}
