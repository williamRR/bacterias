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
      case TreatmentType.DERIVACION_ENERGIA:
        return {
          type: 'success',
          message: `Derivación de energía en ${systemName}`,
          logMessage: `Jugaste DERIVACIÓN DE ENERGÍA en ${systemName}`
        };
      case TreatmentType.BRECHA_CASCO:
        return {
          type: 'warning',
          message: `¡BRECHA DE CASCO en ${systemName} de ${targetPlayer.name}!`,
          logMessage: `Jugaste BRECHA DE CASCO en ${systemName} de ${targetPlayer.name}`
        };
      case TreatmentType.INTRUSION:
        return {
          type: 'success',
          message: `¡${systemName} robado de ${targetPlayer.name}!`,
          logMessage: `Jugaste INTRUSIÓN de ${systemName} de ${targetPlayer.name}`
        };
      case TreatmentType.INTERFERENCIA:
        return {
          type: 'info',
          message: `Interferencia en ${targetPlayer.name}`,
          logMessage: `Jugaste INTERFERENCIA en ${targetPlayer.name}`
        };
      case TreatmentType.REPARACION_EMERGENCIA:
        return {
          type: 'success',
          message: `Reparación de emergencia en ${systemName} de ${targetPlayer.name}`,
          logMessage: `Jugaste REPARACIÓN DE EMERGENCIA en ${systemName} de ${targetPlayer.name}`
        };
      case TreatmentType.REDISTRIBUCION:
        return {
          type: 'warning',
          message: `¡REDISTRIBUCIÓN activada!`,
          logMessage: `Jugaste REDISTRIBUCIÓN`
        };
      case TreatmentType.COLAPSO_SISTEMICO:
        return {
          type: 'info',
          message: `COLAPSO SISTÉMICO activado`,
          logMessage: `Jugaste COLAPSO SISTÉMICO`
        };
      case TreatmentType.RECUPERACION:
        return {
          type: 'success',
          message: `RECUPERACIÓN activada`,
          logMessage: `Jugaste RECUPERACIÓN`
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
