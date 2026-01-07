import { Card, CardType, Color, OrganState, OrganSlot, Player, TreatmentType } from './types';
import { getBodySlots, getSlotFromBody, COLORS } from './body-utils';

function getOrganState(slot: OrganSlot): OrganState {
  if (!slot.organCard) {
    return OrganState.REMOVED;
  }

  if (slot.medicineCards.length >= 2) {
    return OrganState.IMMUNIZED;
  }

  if (slot.virusCards.length >= 2) {
    return OrganState.REMOVED;
  }

  if (slot.virusCards.length === 1 && slot.medicineCards.length === 1) {
    return OrganState.HEALTHY;
  }

  if (slot.virusCards.length === 1) {
    return OrganState.INFECTED;
  }

  if (slot.medicineCards.length === 1) {
    return OrganState.VACCINATED;
  }

  return OrganState.HEALTHY;
}

function canPlayOrgan(card: Card, player: Player, targetColor: Color): boolean {
  if (card.type !== CardType.ORGAN) return false;
  if (card.color !== Color.MULTICOLOR && card.color !== targetColor) return false;
  return !getSlotFromBody(player.body, targetColor)?.organCard;
}

function canPlayVirus(card: Card, targetPlayer: Player, targetColor: Color): boolean {
  if (card.type !== CardType.VIRUS) return false;
  const targetSlot = getSlotFromBody(targetPlayer.body, targetColor);
  if (!targetSlot?.organCard) return false;

  const state = getOrganState(targetSlot);
  if (state === OrganState.IMMUNIZED || state === OrganState.REMOVED) return false;

  // Carta MULTICOLOR se puede jugar en cualquier sistema
  if (card.color === Color.MULTICOLOR) return true;

  // La carta debe coincidir con el color del slot O con el color del órgano si es MULTICOLOR
  // Ej: Órgano MULTICOLOR en slot OXÍGENO acepta cartas OXÍGENO (porque el slot define qué sistema es)
  // Ej: Órgano OXÍGENO en slot OXÍGENO acepta cartas OXÍGENO
  return card.color === targetColor;
}

function canPlayMedicine(card: Card, targetPlayer: Player, targetColor: Color): boolean {
  if (card.type !== CardType.MEDICINE) return false;
  const targetSlot = getSlotFromBody(targetPlayer.body, targetColor);
  if (!targetSlot?.organCard) return false;

  const state = getOrganState(targetSlot);
  if (state === OrganState.IMMUNIZED || state === OrganState.REMOVED) return false;

  // Carta MULTICOLOR se puede jugar en cualquier sistema
  if (card.color === Color.MULTICOLOR) return true;

  // La carta debe coincidir con el color del slot
  // Ej: Órgano MULTICOLOR en slot OXÍGENO acepta cartas OXÍGENO (porque el slot define qué sistema es)
  // Ej: Órgano OXÍGENO en slot OXÍGENO acepta cartas OXÍGENO
  return card.color === targetColor;
}

function canPlayTreatment(card: Card, gameState: any, currentPlayer: Player, targetPlayer: Player, targetColor?: Color, sourceColor?: Color, sourcePlayerId?: string): boolean {
  if (card.type !== CardType.TREATMENT || !card.treatmentType) {
    return false;
  }

  switch (card.treatmentType) {
    case TreatmentType.ENERGY_TRANSFER: {
      // ENERGY_TRANSFER requiere sourceColor y targetColor válidos
      if (!targetColor) return false;
      const srcColor = sourceColor || targetColor;

      // Obtener el jugador fuente correcto
      const sourcePlayer = sourcePlayerId ? gameState.players.find((p: Player) => p.id === sourcePlayerId) : targetPlayer;
      if (!sourcePlayer) return false;

      const sourceSlot = getSlotFromBody(sourcePlayer.body, srcColor);
      const destSlot = getSlotFromBody(currentPlayer.body, targetColor);

      if (!sourceSlot || !destSlot) return false;

      // Debe haber al menos un virus o medicina en el origen
      const hasVirus = sourceSlot.virusCards.length > 0;
      const hasMedicine = sourceSlot.medicineCards.length > 0;
      if (!hasVirus && !hasMedicine) return false;

      // Si hay medicina en el origen, el destino no puede tener ya 2 medicinas
      if (hasMedicine && destSlot.medicineCards.length >= 2) return false;

      // No puede ser el mismo slot
      const isSameSlot = sourcePlayer.id === currentPlayer.id && srcColor === targetColor;

      return !isSameSlot;
    }

    case TreatmentType.EMERGENCY_DECOMPRESSION: {
      // EMERGENCY_DECOMPRESSION requiere que el objetivo tenga un sistema
      if (!targetColor) return false;
      const targetSlot = getSlotFromBody(targetPlayer.body, targetColor);
      return targetSlot?.organCard !== undefined;
    }

    case TreatmentType.DATA_PIRACY: {
      // DATA_PIRACY requiere que el jugador NO tenga el sistema y que el objetivo sí lo tenga
      if (!targetColor) return false;
      const playerSlot = getSlotFromBody(currentPlayer.body, targetColor);
      const targetSlot = getSlotFromBody(targetPlayer.body, targetColor);

      if (!targetSlot?.organCard) return false;
      if (playerSlot?.organCard) return false;

      return getOrganState(targetSlot) !== OrganState.IMMUNIZED;
    }

    case TreatmentType.QUANTUM_DESYNC: {
      // QUANTUM_DESYNC requiere que el objetivo tenga cartas en su mano
      return targetPlayer.hand.length > 0;
    }

    case TreatmentType.PROTOCOL_ERROR: {
      // PROTOCOL_ERROR requiere que el jugador tenga cartas en su mano
      // y que el objetivo tenga un virus en el sistema
      if (!targetColor) return false;
      if (currentPlayer.hand.length === 0) return false;

      const targetSlot = getSlotFromBody(targetPlayer.body, targetColor);
      return (targetSlot?.virusCards.length ?? 0) > 0;
    }

    case TreatmentType.SINGULARITY: {
      // SINGULARITY requiere al menos 2 jugadores en total (para intercambiar sus cuerpos)
      return gameState.players.length >= 2;
    }

    case TreatmentType.EVENT_HORIZON: {
      // EVENT_HORIZON requiere que haya oponentes con cartas
      return gameState.players.some((p: Player) => p.id !== currentPlayer.id && p.hand.length > 0);
    }

    case TreatmentType.BACKUP_SYSTEM: {
      // BACKUP_SYSTEM requiere:
      // 1. El slot del jugador debe estar vacío (sin órgano)
      // 2. Debe haber un órgano del color correcto en el descarte
      if (!targetColor) return false;
      const playerSlot = getSlotFromBody(currentPlayer.body, targetColor);

      // Solo puede recuperar en slots vacíos
      if (playerSlot?.organCard) return false;

      // Verificar que haya un órgano del color correcto en el descarte
      return gameState.discardPile.some((c: Card) =>
        c.type === CardType.ORGAN &&
        (c.color === targetColor || c.color === Color.MULTICOLOR)
      );
    }

    default:
      return false;
  }
}

function canPlayCard(card: Card, currentPlayer: Player, targetPlayer: Player, targetColor: Color, gameState: any, sourceColor?: Color, sourcePlayerId?: string): boolean {
  switch (card.type) {
    case CardType.ORGAN:
      return canPlayOrgan(card, targetPlayer, targetColor);
    case CardType.VIRUS:
      return canPlayVirus(card, targetPlayer, targetColor);
    case CardType.MEDICINE:
      return canPlayMedicine(card, targetPlayer, targetColor);
    case CardType.TREATMENT:
      return canPlayTreatment(card, gameState, currentPlayer, targetPlayer, targetColor, sourceColor, sourcePlayerId);
    default:
      return false;
  }
}

function canPerformTransplant(player: Player, targetPlayer: Player, sourceColor: Color, targetColor: Color): boolean {
  const sourceSlot = getSlotFromBody(player.body, sourceColor);
  const targetSlot = getSlotFromBody(targetPlayer.body, targetColor);
  if (!targetSlot?.organCard) return false;

  if (player.id === targetPlayer.id && sourceColor === targetColor) {
    // Same player, same slot - not a valid swap
    return false;
  }

  if (sourceColor === targetColor) {
    return getOrganState(targetSlot) !== OrganState.IMMUNIZED;
  }

  if (!sourceSlot?.organCard) return false;
  const sourceState = getOrganState(sourceSlot);
  const targetState = getOrganState(targetSlot);

  // Verificar que después del intercambio, ningún jugador tenga sistemas duplicados
  // Después del intercambio:
  // - El jugador tendrá el órgano del targetColor en su sourceColor slot
  // - El targetPlayer tendrá el órgano del sourceColor en su targetColor slot
  // Debemos verificar que esto no resulte en sistemas duplicados

  // Verificar que el jugador no tenga ya un órgano del targetColor (excepto en el slot que se va a intercambiar)
  const playerHasTargetColorOrgan = getBodySlots(player.body).some(slot =>
    slot.organCard && slot.organCard.color === targetColor && slot !== sourceSlot
  );

  // Verificar que el targetPlayer no tenga ya un órgano del sourceColor (excepto en el slot que se va a intercambiar)
  const targetPlayerHasSourceColorOrgan = getBodySlots(targetPlayer.body).some(slot =>
    slot.organCard && slot.organCard.color === sourceColor && slot !== targetSlot
  );

  // Si cualquiera de los jugadores ya tiene el órgano que recibiría, no se puede hacer el intercambio
  if (playerHasTargetColorOrgan || targetPlayerHasSourceColorOrgan) {
    return false;
  }

  return sourceState !== OrganState.IMMUNIZED && targetState !== OrganState.IMMUNIZED;
}

function canPerformOrganThief(player: Player, targetPlayer: Player, targetColor: Color): boolean {
  if (player.id === targetPlayer.id) return false;

  // Verificar que el jugador NO tenga ya un órgano del targetColor
  if (getSlotFromBody(player.body, targetColor)?.organCard) return false;

  // Verificar que el jugador NO tenga un órgano MULTICOLOR en ningún otro slot
  // (porque MULTICOLOR sirve como cualquier sistema)
  const hasMulticolorOrgan = getBodySlots(player.body).some(slot =>
    slot.organCard && slot.organCard.color === Color.MULTICOLOR
  );
  if (hasMulticolorOrgan) return false;

  const targetSlot = getSlotFromBody(targetPlayer.body, targetColor);
  if (!targetSlot?.organCard) return false;
  return getOrganState(targetSlot) !== OrganState.IMMUNIZED;
}

function canPerformContagion(player: Player, gameState: any): boolean {
  const hasInfected = getBodySlots(player.body).some((slot: OrganSlot) =>
    slot.virusCards.length > 0 && getOrganState(slot) === OrganState.INFECTED
  );
  if (!hasInfected) return false;

  return gameState.players.some((p: Player) => p.id !== player.id &&
    getBodySlots(p.body).some((slot: OrganSlot) =>
      slot.organCard && getOrganState(slot) !== OrganState.IMMUNIZED && getOrganState(slot) !== OrganState.REMOVED
    )
  );
}

function canPerformLatexGlove(player: Player, gameState: any): boolean {
  return gameState.players.some((p: Player) => p.id !== player.id && p.hand.length > 0);
}

function canPerformMedicalError(player: Player, targetPlayer: Player): boolean {
  return player.id !== targetPlayer.id;
}

export { getOrganState, canPlayOrgan, canPlayVirus, canPlayMedicine, canPlayTreatment, canPlayCard, canPerformTransplant, canPerformOrganThief, canPerformContagion, canPerformLatexGlove, canPerformMedicalError };
