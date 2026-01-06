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
  // Get the original slots for both players
  const playerSlots: Partial<Record<Color, OrganSlot>> = {};
  const targetSlots: Partial<Record<Color, OrganSlot>> = {};

  // Copy player's slots to temp storage
  getBodyEntries(player.body).forEach(([color, slot]) => {
    playerSlots[color as Color] = { ...slot };
  });

  // Copy target player's slots to temp storage
  getBodyEntries(targetPlayer.body).forEach(([color, slot]) => {
    targetSlots[color as Color] = { ...slot };
  });

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
}

export function getPlayerSlot(player: Player, color: Color): OrganSlot | undefined {
  return getSlotFromBody(player.body, color);
}
