import { Card, Color, Player } from '../types';
import { getSlotFromBody } from '../body-utils';
import { CardType, Color as ColorEnum, OrganState } from '../types';
import { getOrganState } from './organState';

export function canPlayMedicine(card: Card, targetPlayer: Player, targetColor: Color): boolean {
  if (card.type !== CardType.MEDICINE) return false;
  const targetSlot = getSlotFromBody(targetPlayer.body, targetColor);
  if (!targetSlot?.organCard) return false;

  const state = getOrganState(targetSlot);
  if (state === OrganState.IMMUNIZED || state === OrganState.REMOVED) return false;

  if (card.color === ColorEnum.MULTICOLOR) return true;

  return card.color === targetColor;
}
