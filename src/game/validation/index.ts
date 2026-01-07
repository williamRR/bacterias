export { getOrganState, getOrganState as getSlotState } from './organState';
export { canPlayOrgan } from './organ';
export { canPlayVirus } from './virus';
export { canPlayMedicine } from './medicine';
export { canPlayTreatment } from './treatment';

import { Card, Color, Player, GameState } from '../types';
import { canPlayOrgan } from './organ';
import { canPlayVirus } from './virus';
import { canPlayMedicine } from './medicine';
import { canPlayTreatment } from './treatment';

export function canPlayCard(
  card: Card,
  currentPlayer: Player,
  targetPlayer: Player,
  targetColor: Color,
  gameState: any,
  sourceColor?: Color,
  sourcePlayerId?: string
): boolean {
  switch (card.type) {
    case 'ORGAN':
      return canPlayOrgan(card, targetPlayer, targetColor);
    case 'VIRUS':
      return canPlayVirus(card, targetPlayer, targetColor);
    case 'MEDICINE':
      return canPlayMedicine(card, targetPlayer, targetColor);
    case 'TREATMENT':
      return canPlayTreatment(card, gameState, currentPlayer, targetPlayer, targetColor, sourceColor, sourcePlayerId);
    default:
      return false;
  }
}
