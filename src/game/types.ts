enum Color {
  RED = 'RED',
  BLUE = 'BLUE',
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  MULTICOLOR = 'MULTICOLOR',
  PURPLE = 'PURPLE'  // Para cartas de ACCIÓN (TREATMENT)
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
  // Cartas de acción actualizadas
  DERIVACION_ENERGIA = 'DERIVACION_ENERGIA',      // ⚡ Mueve una reparación/sabotaje entre sistemas del mismo color
  BRECHA_CASCO = 'BRECHA_CASCO',                   // 💨 Devuelve sistema rival a su mano (descarta sus cartas, dueño descarta si >3)
  INTRUSION = 'INTRUSION',                         // 🔓 Roba sistema de oponente (con cartas). Falla vs blindaje
  INTERFERENCIA = 'INTERFERENCIA',                 // 📡 Rival descarta 1 carta de mano
  REPARACION_EMERGENCIA = 'REPARACION_EMERGENCIA', // 🔧 Descarta 1 carta tuya para eliminar 1 sabotaje
  REDISTRIBUCION = 'REDISTRIBUCION',               // ♻️ Intercambia TODOS los sistemas entre 2 jugadores
  COLAPSO_SISTEMICO = 'COLAPSO_SISTEMICO',         // ☠️ Todos los RIVALES descartan su mano (no el jugador)
  RECUPERACION = 'RECUPERACION',                   // 💾 Reinstala sistema del descarte a slot vacío
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
