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

function canPlayTreatment(card: Card, gameState: any, currentPlayer: Player, targetPlayer: Player): boolean {
  if (card.type !== CardType.TREATMENT || !card.treatmentType) {
    return false;
  }

  switch (card.treatmentType) {
    case TreatmentType.TRANSPLANT:
      // TRANSPLANT requiere un objetivo válido (otro jugador o el mismo jugador con órganos)
      return getBodySlots(targetPlayer.body).some(slot =>
        slot.organCard && getOrganState(slot) !== OrganState.IMMUNIZED
      );

    case TreatmentType.ORGAN_THIEF:
      // ORGAN_THIEF requiere que el jugador NO tenga el sistema y que el objetivo sí lo tenga
      return gameState.players.some((p: Player) => p.id !== currentPlayer.id && getBodySlots(p.body).some(slot =>
        slot.organCard && getOrganState(slot) !== OrganState.IMMUNIZED
      ));

    case TreatmentType.LATEX_GLOVE:
      // LATEX_GLOVE requiere que haya oponentes con cartas
      return gameState.players.some((p: Player) => p.id !== currentPlayer.id && p.hand.length > 0);

    case TreatmentType.MEDICAL_ERROR:
      // MEDICAL_ERROR requiere al menos un oponente
      return gameState.players.some((p: Player) => p.id !== currentPlayer.id);

    default:
      return false;
  }
}

function canPlayCard(card: Card, currentPlayer: Player, targetPlayer: Player, targetColor: Color, gameState: any): boolean {
  switch (card.type) {
    case CardType.ORGAN:
      return canPlayOrgan(card, targetPlayer, targetColor);
    case CardType.VIRUS:
      return canPlayVirus(card, targetPlayer, targetColor);
    case CardType.MEDICINE:
      return canPlayMedicine(card, targetPlayer, targetColor);
    case CardType.TREATMENT:
      return canPlayTreatment(card, gameState, currentPlayer, targetPlayer);
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
