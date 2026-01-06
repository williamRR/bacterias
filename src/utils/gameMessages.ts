import { Card, Color, Player } from '@/game/types';
import { TreatmentType } from '@/game/types';
import { COLOR_SYSTEM_LABELS } from '@/game/theme';

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
      case TreatmentType.TRANSPLANT:
        return {
          type: 'success',
          message: `¡Intercambio de ${systemName} completado con ${targetPlayer.name}!`,
          logMessage: `Jugaste una carta de INTERCAMBIO con ${targetPlayer.name}`
        };
      case TreatmentType.ORGAN_THIEF:
        return {
          type: 'success',
          message: `¡${systemName} robado de ${targetPlayer.name}!`,
          logMessage: `Jugaste una carta de ROBO de ${systemName} de ${targetPlayer.name}`
        };
      case TreatmentType.LATEX_GLOVE:
        return {
          type: 'info',
          message: `Interferencia electromagnética: cartas descartadas de oponentes`,
          logMessage: `Jugaste una carta de GUANTE DE LÁTEX`
        };
      case TreatmentType.MEDICAL_ERROR:
        return {
          type: 'warning',
          message: `¡Fallo de teletransporte! Cuerpos intercambiados con ${targetPlayer.name}`,
          logMessage: `Jugaste una carta de FALLO DE TELETRANSPORTE con ${targetPlayer.name}`
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
