import { Card, OrganSlot, OrganState } from '../game/types';
import { getOrganState } from '../game/validation';

export function handleVirusCard(card: Card, targetSlot: OrganSlot, discardPile: Card[]): void {
  const state = getOrganState(targetSlot);

  if (state === OrganState.VACCINATED) {
    // La medicina destruida va al descarte
    targetSlot.medicineCards.forEach(m => discardPile.push(m));
    targetSlot.medicineCards = [];
    discardPile.push(card);
  } else {
    targetSlot.virusCards.push(card);
    const newState = getOrganState(targetSlot);

    if (newState === OrganState.REMOVED) {
      // Órgano destruido: enviar órgano Y virus al descarte
      if (targetSlot.organCard) {
        discardPile.push(targetSlot.organCard);
      }
      targetSlot.virusCards.forEach(v => discardPile.push(v));
      targetSlot.medicineCards.forEach(m => discardPile.push(m));
      targetSlot.organCard = undefined;
      targetSlot.virusCards = [];
      targetSlot.medicineCards = [];
    }
  }
}

export function handleMedicineCard(card: Card, targetSlot: OrganSlot, discardPile: Card[]): void {
  const state = getOrganState(targetSlot);

  if (state === OrganState.INFECTED) {
    // El virus eliminado va al descarte junto con la medicina usada
    targetSlot.virusCards.forEach(v => discardPile.push(v));
    targetSlot.virusCards = [];
    discardPile.push(card);
  } else if (state === OrganState.HEALTHY || state === OrganState.VACCINATED) {
    targetSlot.medicineCards.push(card);
  }
}
