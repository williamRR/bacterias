import { Card, CardType, Color, TreatmentType } from './types';
import { ALL_COLORS } from './body-utils';

const CARD_CONFIG = {
  ORGAN: { count: 5, type: CardType.ORGAN },
  VIRUS: { count: 5, type: CardType.VIRUS },
  MEDICINE: { count: 5, type: CardType.MEDICINE },
} as const;

const TREATMENT_CARDS = [
  TreatmentType.ENERGY_TRANSFER,
  TreatmentType.ENERGY_TRANSFER,
  TreatmentType.EMERGENCY_DECOMPRESSION,
  TreatmentType.EMERGENCY_DECOMPRESSION,
  TreatmentType.DATA_PIRACY,
  TreatmentType.DATA_PIRACY,
  TreatmentType.DATA_PIRACY,
  TreatmentType.QUANTUM_DESYNC,
  TreatmentType.QUANTUM_DESYNC,
  TreatmentType.PROTOCOL_ERROR,
  TreatmentType.PROTOCOL_ERROR,
  TreatmentType.PROTOCOL_ERROR,
  TreatmentType.SINGULARITY,
  TreatmentType.SINGULARITY,
  TreatmentType.EVENT_HORIZON,
  TreatmentType.EVENT_HORIZON,
  TreatmentType.BACKUP_SYSTEM,      // Nueva carta de comeback
  TreatmentType.BACKUP_SYSTEM,      // 2 copias para que sea accesible
] as const;

function createDeck(): Card[] {
  const deck: Card[] = [];
  let cardId = 0;

  // Crear cartas básicas (ORGAN, VIRUS, MEDICINE) para cada color
  ALL_COLORS.forEach(color => {
    Object.values(CARD_CONFIG).forEach(({ count, type }) => {
      for (let i = 0; i < count; i++) {
        deck.push({ id: `card-${cardId++}`, type, color });
      }
    });
  });

  // Crear cartas de tratamiento
  TREATMENT_CARDS.forEach(treatmentType => {
    deck.push({
      id: `card-${cardId++}`,
      type: CardType.TREATMENT,
      color: Color.MULTICOLOR,
      treatmentType,
    });
  });

  return deck;
}

function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function dealCards(deck: Card[], playerCount: number, cardsPerPlayer: number): { deck: Card[]; playerHands: Card[][] } {
  const remainingDeck = [...deck];
  const playerHands: Card[][] = [];

  for (let p = 0; p < playerCount; p++) {
    const hand: Card[] = [];
    for (let c = 0; c < cardsPerPlayer; c++) {
      hand.push(remainingDeck.pop()!);
    }
    playerHands.push(hand);
  }

  return {
    deck: remainingDeck,
    playerHands
  };
}

export { createDeck, shuffleDeck, dealCards };
