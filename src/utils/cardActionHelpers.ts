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
    case TreatmentType.DERIVACION_ENERGIA:
      return `Jugaste ${card.name || 'DERIVACIÓN DE ENERGÍA'} en ${systemName}`;
    case TreatmentType.BRECHA_CASCO:
      return `Jugaste ${card.name || 'BRECHA DE CASCO'} en ${systemName} de ${targetPlayer.name}`;
    case TreatmentType.INTRUSION:
      return `Jugaste ${card.name || 'INTRUSIÓN'} de ${systemName} de ${targetPlayer.name}`;
    case TreatmentType.INTERFERENCIA:
      return `Jugaste ${card.name || 'INTERFERENCIA'} en ${targetPlayer.name}`;
    case TreatmentType.REPARACION_EMERGENCIA:
      return `Jugaste ${card.name || 'REPARACIÓN DE EMERGENCIA'} en ${systemName} de ${targetPlayer.name}`;
    case TreatmentType.REDISTRIBUCION:
      return `Jugaste ${card.name || 'REDISTRIBUCIÓN'}`;
    case TreatmentType.COLAPSO_SISTEMICO:
      return `Jugaste ${card.name || 'COLAPSO SISTÉMICO'}`;
    case TreatmentType.RECUPERACION:
      return `Jugaste ${card.name || 'RECUPERACIÓN'}`;
    default:
      return 'Jugaste una carta de ACCIÓN';
  }
}

export function getEnergyTransferLogMessage(card: Card, color: Color): string {
  const systemName = COLOR_SYSTEM_LABELS[color];
  return `Usaste ${card.name || 'DERIVACIÓN DE ENERGÍA'} para mover avería/mejora en ${systemName}`;
}

export function getSingularityLogMessage(card: Card, firstPlayerName?: string, secondPlayerName?: string): string {
  return `Usaste ${card.name || 'REDISTRIBUCIÓN'} para intercambiar todos los sistemas entre ${firstPlayerName || 'jugador'} y ${secondPlayerName || 'jugador'}`;
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
    case TreatmentType.DERIVACION_ENERGIA:
      return { message: `Derivación de energía en ${systemName}`, type: 'success' };
    case TreatmentType.BRECHA_CASCO:
      return { message: `¡BRECHA DE CASCO en ${systemName} de ${targetPlayer.name}!`, type: 'warning' };
    case TreatmentType.INTRUSION:
      return { message: `¡${systemName} robado de ${targetPlayer.name}!`, type: 'success' };
    case TreatmentType.INTERFERENCIA:
      return { message: `Interferencia en ${targetPlayer.name}`, type: 'info' };
    case TreatmentType.REPARACION_EMERGENCIA:
      return { message: `Reparación de emergencia en ${systemName} de ${targetPlayer.name}`, type: 'success' };
    case TreatmentType.REDISTRIBUCION:
      return { message: `¡REDISTRIBUCIÓN activada!`, type: 'warning' };
    case TreatmentType.COLAPSO_SISTEMICO:
      return { message: `COLAPSO SISTÉMICO activado`, type: 'info' };
    case TreatmentType.RECUPERACION:
      return { message: `RECUPERACIÓN activada`, type: 'success' };
    default:
      return { message: 'Acción especial ejecutada', type: 'info' };
  }
}

export function getEnergyTransferNotification(color: Color): { message: string; type: 'success' } {
  const systemName = COLOR_SYSTEM_LABELS[color];
  return {
    message: `¡Derivación de energía completada en ${systemName}!`,
    type: 'success',
  };
}

export function getSingularityNotification(firstPlayerName?: string, secondPlayerName?: string): { message: string; type: 'warning' } {
  return {
    message: `¡REDISTRIBUCIÓN! ${firstPlayerName || 'Jugador 1'} ↔ ${secondPlayerName || 'Jugador 2'}: sistemas intercambiados.`,
    type: 'warning',
  };
}
