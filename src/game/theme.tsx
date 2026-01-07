import { CardType, TreatmentType, OrganState, Color } from './types';
import type { SVGProps } from 'react';

// ============================================
// MISIÓN ESPACIAL: S.O.S. GALAXIA
// ============================================

export const GAME_THEME = {
  title: 'Misión Espacial: S.O.S. Galaxia',
  subtitle: 'Repara los sistemas críticos de la nave',
} as const;

// ============================================
// SVG ICONS - Minimalista
// ============================================

export const getSystemIconPath = (color: Color): string => {
  switch (color) {
    case Color.RED:
      return '/assets/icons/ENERGIA_RED.svg';
    case Color.BLUE:
      return '/assets/icons/oxigeno_blue.svg';
    case Color.GREEN:
      return '/assets/icons/bioseguridad_green.svg';
    case Color.YELLOW:
      return '/assets/icons/agua_y_alimentos_yellow.svg';
    case Color.MULTICOLOR:
      return '';
    default:
      return '';
  }
};

const SystemIconMask = ({ color, ...props }: { color: Color } & React.HTMLAttributes<HTMLDivElement>) => {
  const path = getSystemIconPath(color);
  if (!path) return null;
  return (
    <div
      {...props}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'currentColor',
        // Invert mask to color the drawing
        maskImage: `url(${path}), linear-gradient(black, black)`,
        WebkitMaskImage: `url(${path}), linear-gradient(black, black)`,
        maskComposite: 'exclude',
        WebkitMaskComposite: 'destination-out',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        // Clip side artifacts (extra bars)
        clipPath: 'inset(0 11%)',
        WebkitClipPath: 'inset(0 11%)',
        ...props.style
      }}
    />
  );
};

// Virus icon (negative - sabotaje)
export const SvgIconVirus = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 12h14" />
  </svg>
);

// Medicine icon (positive - mejora/reparación)
export const SvgIconMedicine = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

// Treatment/Action icon (anomalía cuántica)
export const SvgIconTreatment = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 6c2 2 2 8 0 10M12 6c-2 2-2 8 0 10" />
    <path d="M6 12c2-2 8-2 10 0M6 12c2 2 8 2 10 0" />
  </svg>
);

// Mapping de colores a componentes SVG
export const SYSTEM_SVG_ICONS: Record<Color, React.ComponentType<any>> = {
  [Color.RED]: (props: any) => <SystemIconMask color={Color.RED} {...props} />,
  [Color.BLUE]: (props: any) => <SystemIconMask color={Color.BLUE} {...props} />,
  [Color.GREEN]: (props: any) => <SystemIconMask color={Color.GREEN} {...props} />,
  [Color.YELLOW]: (props: any) => <SystemIconMask color={Color.YELLOW} {...props} />,
  [Color.MULTICOLOR]: (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  ),
} as const;

// Mapping de tipos de cartas a nombres espaciales
export const CARD_TYPE_LABELS: Record<CardType, string> = {
  [CardType.ORGAN]: 'SISTEMA',
  [CardType.VIRUS]: 'SABOTAJE',
  [CardType.MEDICINE]: 'REPARACIÓN',
  [CardType.TREATMENT]: 'ACCIÓN',
} as const;

// Mapping de TreatmentType a nombres espaciales
// Usamos string keys directamente para evitar problemas de optimización en Vercel
export const TREATMENT_LABELS: Record<string, string> = {
  ENERGY_TRANSFER: 'TRANSFERENCIA DE ENERGÍA',
  EMERGENCY_DECOMPRESSION: 'DESCOMPRESIÓN DE EMERGENCIA',
  DATA_PIRACY: 'PIRATERÍA DE DATOS',
  QUANTUM_DESYNC: 'DESINCRONIZACIÓN CUÁNTICA',
  PROTOCOL_ERROR: 'ERROR DE PROTOCOLO',
  SINGULARITY: 'SINGULARIDAD',
  EVENT_HORIZON: 'HORIZONTE DE SUCESOS',
  BACKUP_SYSTEM: 'SISTEMA DE RESPALDO',
};

export const TREATMENT_DESCRIPTIONS: Record<string, string> = {
  ENERGY_TRANSFER: 'Mueve una avería o mejora de un módulo a otro del mismo tipo.',
  EMERGENCY_DECOMPRESSION: 'Regresa un módulo rival a su mano. Descarta sus cartas unidas.',
  DATA_PIRACY: 'Roba un módulo de un oponente (con sus cartas unidas). No funciona en sistemas blindados.',
  QUANTUM_DESYNC: 'El oponente objetivo descarta una carta de su mano.',
  PROTOCOL_ERROR: 'Descarta una carta de tu mano para eliminar una avería objetivo.',
  SINGULARITY: 'Intercambia todos los sistemas entre dos jugadores.',
  EVENT_HORIZON: 'Todos tus oponentes descartan su mano completa.',
  BACKUP_SYSTEM: 'Recupera un sistema destruido del descarte y lo reinstala.',
};

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
  [Color.RED]: 'ENERGÍA',
  [Color.BLUE]: 'OXÍGENO',
  [Color.GREEN]: 'BIOSEGURIDAD',
  [Color.YELLOW]: 'AGUA Y ALIMENTOS',
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
  endTurn: 'Terminar Turno',
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
