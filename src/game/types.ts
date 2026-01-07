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
  // Nuevas cartas de acción
  ENERGY_TRANSFER = 'ENERGY_TRANSFER',
  EMERGENCY_DECOMPRESSION = 'EMERGENCY_DECOMPRESSION',
  DATA_PIRACY = 'DATA_PIRACY',
  QUANTUM_DESYNC = 'QUANTUM_DESYNC',
  PROTOCOL_ERROR = 'PROTOCOL_ERROR',
  SINGULARITY = 'SINGULARITY',
  EVENT_HORIZON = 'EVENT_HORIZON',
  BACKUP_SYSTEM = 'BACKUP_SYSTEM',  // Nueva: Recupera un órgano destruido del descarte
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
