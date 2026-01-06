enum Color {
  RED = 'RED',
  BLUE = 'BLUE',
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  MULTICOLOR = 'MULTICOLOR'
}

enum CardType {
  ORGAN = 'ORGAN',
  VIRUS = 'VIRUS',
  MEDICINE = 'MEDICINE',
  TREATMENT = 'TREATMENT'
}

enum OrganState {
  HEALTHY = 'HEALTHY',
  INFECTED = 'INFECTED',
  VACCINATED = 'VACCINATED',
  IMMUNIZED = 'IMMUNIZED',
  REMOVED = 'REMOVED'
}

enum TreatmentType {
  TRANSPLANT = 'TRANSPLANT',
  ORGAN_THIEF = 'ORGAN_THIEF',
  LATEX_GLOVE = 'LATEX_GLOVE',
  MEDICAL_ERROR = 'MEDICAL_ERROR'
}

interface Card {
  id: string;
  type: CardType;
  color: Color;
  treatmentType?: TreatmentType;
  name?: string;
}

interface OrganSlot {
  organCard?: Card;
  virusCards: Card[];
  medicineCards: Card[];
}

interface Player {
  id: string;
  name: string;
  hand: Card[];
  body: Map<Color, OrganSlot> | Record<string, OrganSlot>;
}

interface GameState {
  players: Player[];
  deck: Card[];
  discardPile: Card[];
  currentPlayerIndex: number;
  gameStarted: boolean;
  gameEnded: boolean;
  winner?: Player;
}

export type { Card, OrganSlot, Player, GameState };
export { Color, CardType, OrganState, TreatmentType };
