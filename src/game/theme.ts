import { CardType, TreatmentType, OrganState, Color } from './types';

// ============================================
// MISIÓN ESPACIAL: S.O.S. GALAXIA
// ============================================

export const GAME_THEME = {
  title: 'Misión Espacial: S.O.S. Galaxia',
  subtitle: 'Repara los sistemas críticos de la nave',
} as const;

// Mapping de tipos de cartas a nombres espaciales
export const CARD_TYPE_LABELS: Record<CardType, string> = {
  [CardType.ORGAN]: 'SISTEMA',
  [CardType.VIRUS]: 'SABOTAJE',
  [CardType.MEDICINE]: 'REPARACIÓN',
  [CardType.TREATMENT]: 'ACCIÓN',
} as const;

// Mapping de TreatmentType a nombres espaciales
export const TREATMENT_LABELS: Record<TreatmentType, string> = {
  [TreatmentType.TRANSPLANT]: 'INTERCAMBIO DE PIEZAS',
  [TreatmentType.ORGAN_THIEF]: 'ROBO DE PIEZAS',
  [TreatmentType.LATEX_GLOVE]: 'INTERFERENCIA ELECTROMAGNÉTICA',
  [TreatmentType.MEDICAL_ERROR]: 'FALLO DE TELETRANSPORTE',
} as const;

// Mapping de OrganState a nombres espaciales
export const ORGAN_STATE_LABELS: Record<OrganState, string> = {
  [OrganState.HEALTHY]: 'OPERATIVO',
  [OrganState.INFECTED]: 'AVERIADO',
  [OrganState.VACCINATED]: 'PROTEGIDO',
  [OrganState.IMMUNIZED]: 'BLINDADO',
  [OrganState.REMOVED]: 'DESTRUIDO',
} as const;

// Mapping de colores a sistemas de la nave
export const COLOR_SYSTEM_LABELS: Record<Color, string> = {
  [Color.RED]: 'MOTOR',
  [Color.BLUE]: 'OXÍGENO',
  [Color.GREEN]: 'NAVEGACIÓN',
  [Color.YELLOW]: 'ESCUDOS',
  [Color.MULTICOLOR]: 'SISTEMA OPERATIVO',
} as const;

// Emojis para la temática espacial
export const SPACE_ICONS = {
  [CardType.ORGAN]: '',          // Sistema
  [CardType.VIRUS]: '',          // Sabotaje
  [CardType.MEDICINE]: '',         // Reparación
  [CardType.TREATMENT]: '',        // Acción especial
} as const;

// Emojis para estados de sistema
export const SYSTEM_STATE_ICONS = {
  [OrganState.HEALTHY]: '',
  [OrganState.INFECTED]: '',
  [OrganState.VACCINATED]: '',
  [OrganState.IMMUNIZED]: '',
  [OrganState.REMOVED]: '',
} as const;

// Emojis para los sistemas
export const SYSTEM_ICONS = {
  [Color.RED]: '🔧',        // Motor
  [Color.BLUE]: '💨',       // Oxígeno
  [Color.GREEN]: '🧭',     // Navegación
  [Color.YELLOW]: '🛡️',       // Escudos
  [Color.MULTICOLOR]: '🖥️',  // Sistema Operativo
} as const;

// Frases de victoria/derrota
export const VICTORY_MESSAGES = {
  win: '¡Misión Cumplida!',
  lose: '¡Sistemas Críticos Fallidos!',
  winner: 'Nave Salvada Por',
} as const;

// Frases de UI
export const UI_LABELS = {
  yourTurn: '🟢 Tu Turno',
  turnOf: '🔴 Turno de',
  waiting: '⏳ Espera tu turno para jugar',
  endTurn: '⏭️ Terminar Turno',
  playCard: '🎯 Ejecutar Acción',
  discard: '🗑️ Descartar',
  cancel: '❌ Cancelar',
  empty: 'VACÍO',
  waitingPlayers: 'Esperando más tripulantes (mínimo 2)...',
  needPlayers: 'Necesitas al menos 2 tripulantes',
  startMission: 'Iniciar Misión',
  exit: 'Abortar Misión',
  players: 'Tripulantes',
  room: 'Sector',
  join: 'Uniéndose al sector...',
  actions: 'COMANDOS',
  selectedCards: 'Acciones seleccionadas',
  hint: '💡 Para actuar: selecciona una carta y arrástrala al sistema objetivo',
} as const;
