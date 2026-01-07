import { Card, Color, Player, OrganSlot } from '../types';
import { getSlotFromBody } from '../body-utils';
import { OrganState } from '../types';

export function getOrganState(slot: OrganSlot): OrganState {
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

export { getOrganState as getSlotState };
