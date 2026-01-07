import { Card, Color, Player } from '../types';
import { getSlotFromBody } from '../body-utils';
import { CardType, Color as ColorEnum } from '../types';

export function canPlayOrgan(card: Card, player: Player, targetColor: Color): boolean {
  if (card.type !== CardType.ORGAN) return false;
  if (card.color !== ColorEnum.MULTICOLOR && card.color !== targetColor) return false;
  return !getSlotFromBody(player.body, targetColor)?.organCard;
}
