import { Card, OrganSlot, OrganState } from '../game/types';
import { getOrganState } from '../game/validation';

export function handleVirusCard(card: Card, targetSlot: OrganSlot, discardPile: Card[]): void {
  const state = getOrganState(targetSlot);

  if (state === OrganState.VACCINATED) {
    targetSlot.medicineCards = [];
    discardPile.push(card);
  } else {
    targetSlot.virusCards.push(card);
    const newState = getOrganState(targetSlot);

    if (newState === OrganState.REMOVED) {
      // El órgano destruido va al descarte (para que BACKUP_SYSTEM pueda recuperarlo)
      if (targetSlot.organCard) {
        discardPile.push(targetSlot.organCard);
      }
      targetSlot.organCard = undefined;
      targetSlot.virusCards = [];
      targetSlot.medicineCards = [];
    }
  }
}

export function handleMedicineCard(card: Card, targetSlot: OrganSlot, discardPile: Card[]): void {
  const state = getOrganState(targetSlot);
  
  if (state === OrganState.INFECTED) {
    targetSlot.virusCards = [];
    discardPile.push(card);
  } else if (state === OrganState.HEALTHY || state === OrganState.VACCINATED) {
    targetSlot.medicineCards.push(card);
  }
}
