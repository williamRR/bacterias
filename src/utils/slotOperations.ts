import { Card, Color, OrganSlot, Player } from '../game/types';
import { getSlotFromBody, setSlotInBody, getBodyEntries } from '../game/body-utils';

export function copySlotCards(slot: OrganSlot): { virusCards: Card[]; medicineCards: Card[] } {
  return {
    virusCards: [...slot.virusCards],
    medicineCards: [...slot.medicineCards],
  };
}

export function clearSlot(slot: OrganSlot): void {
  slot.organCard = undefined;
  slot.virusCards = [];
  slot.medicineCards = [];
}

export function transferSlotContents(
  sourceSlot: OrganSlot,
  targetSlot: OrganSlot
): void {
  targetSlot.organCard = sourceSlot.organCard;
  targetSlot.virusCards = [...sourceSlot.virusCards];
  targetSlot.medicineCards = [...sourceSlot.medicineCards];
}

export function swapSlotContents(
  playerSlot: OrganSlot,
  targetSlot: OrganSlot
): void {
  const tempOrgan = playerSlot.organCard;
  const tempViruses = [...playerSlot.virusCards];
  const tempMedicines = [...playerSlot.medicineCards];

  playerSlot.organCard = targetSlot.organCard;
  playerSlot.virusCards = [...targetSlot.virusCards];
  playerSlot.medicineCards = [...targetSlot.medicineCards];

  targetSlot.organCard = tempOrgan;
  targetSlot.virusCards = tempViruses;
  targetSlot.medicineCards = tempMedicines;
}

export function swapPlayerBodies(
  player: Player,
  targetPlayer: Player
): void {
  console.log('🌀 SINGULARIDAD - INICIO');
  console.log('🔄 Intercambiando cuerpos entre:', player.name, '↔', targetPlayer.name);

  // Get the original slots for both players
  const playerSlots: Partial<Record<Color, OrganSlot>> = {};
  const targetSlots: Partial<Record<Color, OrganSlot>> = {};

  // Copy player's slots to temp storage (DEEP COPY)
  getBodyEntries(player.body).forEach(([color, slot]) => {
    playerSlots[color as Color] = {
      organCard: slot.organCard,
      virusCards: [...slot.virusCards],
      medicineCards: [...slot.medicineCards],
    };
  });

  // Copy target player's slots to temp storage (DEEP COPY)
  getBodyEntries(targetPlayer.body).forEach(([color, slot]) => {
    targetSlots[color as Color] = {
      organCard: slot.organCard,
      virusCards: [...slot.virusCards],
      medicineCards: [...slot.medicineCards],
    };
  });

  console.log('📦 ANTES DEL INTERCAMBIO:');
  console.log(`  ${player.name}:`, JSON.stringify(getBodyEntries(player.body).map(([c, s]) => [c, s.organCard?.color || 'empty'])));
  console.log(`  ${targetPlayer.name}:`, JSON.stringify(getBodyEntries(targetPlayer.body).map(([c, s]) => [c, s.organCard?.color || 'empty'])));

  // Clear both bodies and set them to each other's original slots
  const playerBody = player.body;
  const targetBody = targetPlayer.body;

  // Reset player's body with target's original slots
  if (playerBody instanceof Map) {
    playerBody.clear();
    Object.entries(targetSlots).forEach(([color, slot]) => {
      playerBody.set(color as Color, slot);
    });
  } else {
    Object.keys(playerBody).forEach(key => {
      delete playerBody[key as Color];
    });
    Object.entries(targetSlots).forEach(([color, slot]) => {
      playerBody[color as Color] = slot;
    });
  }

  // Reset target player's body with player's original slots
  if (targetBody instanceof Map) {
    targetBody.clear();
    Object.entries(playerSlots).forEach(([color, slot]) => {
      targetBody.set(color as Color, slot);
    });
  } else {
    Object.keys(targetBody).forEach(key => {
      delete targetBody[key as Color];
    });
    Object.entries(playerSlots).forEach(([color, slot]) => {
      targetBody[color as Color] = slot;
    });
  }

  console.log('📦 DESPUÉS DEL INTERCAMBIO:');
  console.log(`  ${player.name}:`, JSON.stringify(getBodyEntries(player.body).map(([c, s]) => [c, s.organCard?.color || 'empty'])));
  console.log(`  ${targetPlayer.name}:`, JSON.stringify(getBodyEntries(targetPlayer.body).map(([c, s]) => [c, s.organCard?.color || 'empty'])));
  console.log('✅ SINGULARIDAD - FIN');
}

export function getPlayerSlot(player: Player, color: Color): OrganSlot | undefined {
  return getSlotFromBody(player.body, color);
}

/**
 * TRANSPLANT: Intercambia órganos entre jugadores, colocando cada uno en su slot correspondiente.
 * - El jugador toma el órgano del objetivo y lo coloca en SU slot del color del órgano
 * - El objetivo toma el órgano del jugador y lo coloca en SU slot del color del órgano
 *
 * Ejemplo: Jugador tiene MOTOR en RED, Objetivo tiene ESCUDOS en YELLOW
 * - Jugador selecciona su RED (MOTOR) para intercambiar con YELLOW del objetivo (ESCUDOS)
 * - Resultado: Jugador queda con ESCUDOS en su YELLOW, Objetivo queda con MOTOR en su RED
 */
export function swapOrgansBetweenPlayers(
  player: Player,
  playerSourceColor: Color,
  targetPlayer: Player,
  targetColor: Color
): boolean {
  // Obtener el slot del jugador (color origen que seleccionó)
  const playerSourceSlot = getSlotFromBody(player.body, playerSourceColor);

  // Obtener el slot del objetivo (color que seleccionó del objetivo)
  const targetSlot = getSlotFromBody(targetPlayer.body, targetColor);

  if (!playerSourceSlot || !targetSlot) {
    return false;
  }

  // El órgano del jugador tiene un color (su color original)
  const playerOrgan = playerSourceSlot.organCard;
  const targetOrgan = targetSlot.organCard;

  if (!playerOrgan || !targetOrgan) {
    return false;
  }

  // Obtener los colores de los órganos
  const playerOrganColor = playerOrgan.color;
  const targetOrganColor = targetOrgan.color;

  if (!playerOrganColor || !targetOrganColor) {
    return false;
  }

  // Obtener los slots DESTINO (donde deben ir los órganos intercambiados)
  const playerDestSlot = getSlotFromBody(player.body, targetOrganColor);
  const targetDestSlot = getSlotFromBody(targetPlayer.body, playerOrganColor);

  if (!playerDestSlot || !targetDestSlot) {
    return false;
  }

  // Hacer el intercambio: copiar todo el contenido de los slots
  const playerSourceCopy = {
    organCard: playerSourceSlot.organCard,
    virusCards: [...playerSourceSlot.virusCards],
    medicineCards: [...playerSourceSlot.medicineCards],
  };

  const targetCopy = {
    organCard: targetSlot.organCard,
    virusCards: [...targetSlot.virusCards],
    medicineCards: [...targetSlot.medicineCards],
  };

  // Colocar el órgano del objetivo en el slot correcto del jugador
  playerDestSlot.organCard = targetCopy.organCard;
  playerDestSlot.virusCards = targetCopy.virusCards;
  playerDestSlot.medicineCards = targetCopy.medicineCards;

  // Colocar el órgano del jugador en el slot correcto del objetivo
  targetDestSlot.organCard = playerSourceCopy.organCard;
  targetDestSlot.virusCards = playerSourceCopy.virusCards;
  targetDestSlot.medicineCards = playerSourceCopy.medicineCards;

  // Limpiar los slots origen si son diferentes a los destinos
  if (playerSourceColor !== targetOrganColor) {
    clearSlot(playerSourceSlot);
  }
  if (targetColor !== playerOrganColor) {
    clearSlot(targetSlot);
  }

  return true;
}
