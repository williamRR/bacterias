import { Card, Color, Player } from '@/game/types';
import { TreatmentType } from '@/game/types';
import { COLOR_SYSTEM_LABELS, TREATMENT_LABELS } from '@/game/theme';

export function getCardActionMessage(
  card: Card,
  targetPlayer: Player,
  color: Color,
  currentPlayerId: string
): { type: 'success' | 'warning' | 'info'; message: string; logMessage: string } {
  const systemName = COLOR_SYSTEM_LABELS[color];
  const targetName = targetPlayer.id === currentPlayerId ? 'tu' : `de ${targetPlayer.name}`;

  if (card.type === 'ORGAN') {
    return {
      type: 'success',
      message: `Sistema ${systemName} instalado`,
      logMessage: `Jugaste una carta de SISTEMA en ${systemName} ${targetName}`
    };
  }

  if (card.type === 'VIRUS') {
    return {
      type: 'warning',
      message: `¡Sabotaje en ${systemName} ${targetName}!`,
      logMessage: `Jugaste una carta de SABOTAJE en ${systemName} ${targetName}`
    };
  }

  if (card.type === 'MEDICINE') {
    return {
      type: 'success',
      message: `Reparación aplicada a ${systemName} ${targetName}`,
      logMessage: `Jugaste una carta de REPARACIÓN en ${systemName} ${targetName}`
    };
  }

  if (card.type === 'TREATMENT' && card.treatmentType) {
    switch (card.treatmentType) {
      case TreatmentType.ENERGY_TRANSFER:
        return {
          type: 'success',
          message: `Transferencia de energía en ${systemName}`,
          logMessage: `Jugaste TRANSFERENCIA DE ENERGÍA en ${systemName}`
        };
      case TreatmentType.EMERGENCY_DECOMPRESSION:
        return {
          type: 'warning',
          message: `¡Descompresión de emergencia en ${systemName} de ${targetPlayer.name}!`,
          logMessage: `Jugaste DESCOMPRESIÓN DE EMERGENCIA en ${systemName} de ${targetPlayer.name}`
        };
      case TreatmentType.DATA_PIRACY:
        return {
          type: 'success',
          message: `¡${systemName} pirateado de ${targetPlayer.name}!`,
          logMessage: `Jugaste PIRATERÍA DE DATOS de ${systemName} de ${targetPlayer.name}`
        };
      case TreatmentType.QUANTUM_DESYNC:
        return {
          type: 'info',
          message: `Desincronización cuántica en ${targetPlayer.name}`,
          logMessage: `Jugaste DESINCRONIZACIÓN CUÁNTICA en ${targetPlayer.name}`
        };
      case TreatmentType.PROTOCOL_ERROR:
        return {
          type: 'success',
          message: `Error de protocolo en ${systemName} de ${targetPlayer.name}`,
          logMessage: `Jugaste ERROR DE PROTOCOLO en ${systemName} de ${targetPlayer.name}`
        };
      case TreatmentType.SINGULARITY:
        return {
          type: 'warning',
          message: `¡SINGULARIDAD activada!`,
          logMessage: `Jugaste SINGULARIDAD`
        };
      case TreatmentType.EVENT_HORIZON:
        return {
          type: 'info',
          message: `Horizonte de sucesos activado`,
          logMessage: `Jugaste HORIZONTE DE SUCESOS`
        };
    }
  }

  return {
    type: 'info',
    message: 'Carta jugada',
    logMessage: `Jugaste una carta`
  };
}

export function getTransplantMessage(sourceColor: Color, targetColor: Color, targetPlayer: Player): string {
  const sourceSystemName = COLOR_SYSTEM_LABELS[sourceColor];
  const targetSystemName = COLOR_SYSTEM_LABELS[targetColor];
  return `¡Intercambio completado: tu ${sourceSystemName} ← ${targetSystemName} de ${targetPlayer.name}!`;
}

export function getMedicalErrorMessage(targetPlayer: Player): string {
  return `¡Fallo de teletransporte! Tus sistemas han sido intercambiados con ${targetPlayer.name}`;
}
