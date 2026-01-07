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
    case Color.PURPLE:
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

// Treatment/Action icon (Ouroboros - anomalía cuántica)
export const SvgIconTreatment = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 1200 1200" fill="currentColor" {...props}>
    <g transform="translate(0, 1199) scale(0.1, -0.1)">
      <path d="M5575 11829 c-761 -62 -1441 -243 -2103 -560 -1748 -837 -2975 -2496 -3261 -4409 -48 -322 -56 -446 -56 -865 0 -426 9 -550 60 -880 310 -1980 1679 -3679 3574 -4437 300 -120 565 -203 682 -213 107 -9 156 -22 320 -81 214 -77 249 -81 574 -55 352 28 405 23 855 -84 379 -90 430 -99 580 -99 133 -1 136 -1 203 32 84 42 160 115 193 186 25 54 26 55 82 66 449 91 982 279 1427 505 1636 830 2771 2355 3069 4125 61 364 71 488 71 935 0 419 -8 542 -56 865 -227 1517 -1049 2891 -2284 3817 -851 638 -1834 1022 -2920 1139 -176 19 -836 28 -1010 13z m810 -139 c1684 -121 3182 -935 4190 -2275 263 -350 518 -793 689 -1198 382 -902 526 -1937 405 -2907 -256 -2049 -1657 -3787 -3646 -4524 -268 -99 -574 -185 -903 -253 -179 -37 -397 -38 -560 -4 -262 55 -570 190 -570 250 0 24 22 42 95 79 142 71 184 83 315 93 1052 79 2027 442 2855 1064 207 155 362 290 550 479 407 408 711 833 960 1341 304 620 461 1231 497 1933 25 472 -29 1008 -148 1490 -366 1485 -1362 2739 -2729 3432 -1122 569 -2427 717 -3653 415 -1751 -433 -3158 -1731 -3727 -3440 -345 -1033 -363 -2125 -54 -3140 203 -666 519 -1249 982 -1809 119 -144 482 -508 622 -625 213 -177 490 -374 680 -484 135 -78 308 -110 600 -110 266 1 528 32 649 77 86 33 197 58 453 106 121 22 301 59 400 80 259 58 501 92 663 93 117 1 150 -3 243 -27 59 -15 156 -45 215 -68 96 -36 195 -68 215 -68 4 0 7 9 7 21 0 39 58 52 250 57 204 4 288 -9 389 -60 82 -42 122 -91 128 -155 l5 -48 -79 -29 c-220 -80 -282 -98 -443 -130 -264 -52 -353 -88 -575 -234 -240 -158 -374 -208 -710 -266 -82 -14 -167 -31 -187 -37 -40 -11 -49 -32 -20 -48 18 -9 119 -25 232 -36 132 -13 203 -36 500 -162 180 -76 260 -105 360 -127 104 -24 322 -37 450 -28 63 5 116 7 118 6 8 -5 -29 -62 -60 -90 -77 -73 -158 -92 -313 -74 -136 16 -197 29 -505 110 -146 38 -305 76 -355 86 -125 23 -293 15 -445 -20 -286 -67 -429 -27 -883 247 -205 124 -265 150 -322 139 -19 -3 -25 -10 -23 -25 2 -15 33 -36 112 -76 172 -88 147 -108 -57 -46 -470 143 -988 387 -1422 672 -334 220 -575 414 -863 697 -481 473 -829 956 -1123 1560 -282 580 -450 1170 -524 1846 -36 318 -30 861 11 1215 172 1469 897 2802 2039 3745 910 751 2037 1202 3225 1289 166 12 632 13 795 1z m1 -540 c1101 -87 2092 -492 2949 -1204 154 -129 492 -466 620 -621 393 -472 681 -964 890 -1520 154 -408 248 -808 301 -1275 21 -184 30 -694 15 -890 -104 -1382 -785 -2632 -1916 -3515 -139 -109 -445 -313 -595 -398 -553 -311 -1147 -522 -1759 -622 -156 -26 -412 -57 -418 -51 -7 7 129 89 188 113 33 13 133 38 222 54 1516 278 2804 1243 3491 2618 257 513 413 1043 482 1641 22 190 30 637 15 840 -88 1204 -588 2294 -1436 3136 -1067 1057 -2549 1563 -4040 1379 -1628 -201 -3058 -1225 -3784 -2710 -275 -562 -435 -1160 -482 -1804 -15 -205 -6 -643 16 -836 49 -418 152 -835 301 -1213 63 -160 228 -497 315 -645 217 -367 453 -671 754 -972 417 -417 884 -742 1420 -986 83 -38 148 -69 145 -69 -159 -21 -463 -14 -606 15 -107 21 -171 54 -386 198 -296 197 -506 368 -755 610 -859 839 -1382 1944 -1488 3144 -17 194 -20 620 -5 809 78 994 422 1911 1015 2709 275 372 666 762 1045 1046 783 587 1712 938 2690 1018 152 12 645 13 796 1z m-55 -430 c499 -39 973 -146 1414 -320 1095 -432 1995 -1265 2514 -2325 242 -493 392 -1019 458 -1596 24 -218 24 -762 0 -974 -92 -791 -342 -1479 -770 -2119 -165 -246 -319 -437 -537 -660 -505 -519 -1084 -895 -1772 -1151 l-87 -33 -11 53 c-27 130 -155 223 -367 267 -126 26 -277 21 -453 -16 -147 -31 -156 -30 -339 31 -296 99 -349 98 -981 -17 -819 -149 -1030 -176 -1174 -149 -101 18 -385 150 -636 294 -538 309 -1034 744 -1403 1232 -92 122 -263 381 -336 510 -73 129 -220 437 -274 573 -301 762 -389 1598 -257 2433 239 1506 1215 2820 2595 3496 513 251 1093 414 1645 461 69 5 141 12 160 14 86 8 488 5 611 -4z" />
      <path d="M5965 1653 c-11 -2 -74 -18 -140 -34 -66 -16 -194 -38 -284 -48 -90 -11 -166 -23 -169 -26 -16 -16 29 -30 112 -36 107 -8 155 -26 248 -92 35 -25 82 -50 106 -56 77 -21 210 2 373 65 88 34 96 35 148 25 111 -22 110 -4 -7 70 -181 117 -291 154 -387 132z m202 -95 c96 -47 96 -50 -5 -92 -48 -20 -90 -36 -92 -36 -3 0 -5 38 -5 85 0 98 -6 95 102 43z m-317 -15 c0 -10 11 -42 25 -72 14 -30 24 -56 21 -58 -2 -2 -23 3 -46 11 -42 14 -172 97 -164 105 5 5 115 29 142 30 15 1 22 -5 22 -16z" />
      <path d="M6947 1653 c-17 -17 -3 -31 43 -41 28 -6 87 -30 132 -52 88 -43 145 -51 172 -24 27 27 20 54 -21 70 -66 28 -311 63 -326 47z" />
    </g>
  </svg>
);

// Mapping de colores a componentes SVG
export const SYSTEM_SVG_ICONS: Record<Color, React.ComponentType<any>> = {
  [Color.RED]: (props: any) => <SystemIconMask color={Color.RED} {...props} />,
  [Color.BLUE]: (props: any) => <SystemIconMask color={Color.BLUE} {...props} />,
  [Color.GREEN]: (props: any) => <SystemIconMask color={Color.GREEN} {...props} />,
  [Color.YELLOW]: (props: any) => <SystemIconMask color={Color.YELLOW} {...props} />,
  [Color.MULTICOLOR]: (props: any) => (
    <div
      {...props}
      className={`multicolor-icon-style ${props.className || ''}`}
      style={{
        ...props.style,
        WebkitMaskImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'black\'%3E%3Cpath d=\'M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z\'/%3E%3C/svg%3E")',
        maskImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'black\'%3E%3Cpath d=\'M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z\'/%3E%3C/svg%3E")',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        maskSize: '100% 100%',
        WebkitMaskSize: '100% 100%',
        backgroundColor: 'transparent',
      }}
    />
  ),
  [Color.PURPLE]: (props: any) => <SystemIconMask color={Color.PURPLE} {...props} />,
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
  DERIVACION_ENERGIA: 'DERIVACIÓN DE ENERGÍA',
  BRECHA_CASCO: 'BRECHA DE CASCO',
  INTRUSION: 'INTRUSIÓN',
  INTERFERENCIA: 'INTERFERENCIA',
  REPARACION_EMERGENCIA: 'REPARACIÓN DE EMERGENCIA',
  REDISTRIBUCION: 'REDISTRIBUCIÓN',
  COLAPSO_SISTEMICO: 'COLAPSO SISTÉMICO',
  RECUPERACION: 'RECUPERACIÓN',
};

export const TREATMENT_DESCRIPTIONS: Record<string, string> = {
  DERIVACION_ENERGIA: 'Mueve una reparación o sabotaje entre sistemas del mismo color (origen y destino deben estar activos).',
  BRECHA_CASCO: 'Devuelve un sistema rival a su mano. Pierde todas las mejoras/averías. Si excede las 3 cartas, descarta al azar.',
  INTRUSION: 'Robas un sistema de un oponente con sus cartas. Falla si el sistema está blindado.',
  INTERFERENCIA: 'El rival objetivo descarta 1 carta de su mano.',
  REPARACION_EMERGENCIA: 'Descartas 1 carta de tu mano para eliminar 1 sabotaje de un sistema.',
  REDISTRIBUCION: 'Intercambia TODOS los sistemas entre dos jugadores (requiere mínimo 2 jugadores).',
  COLAPSO_SISTEMICO: 'Todos los RIVALES descartan su mano completa.',
  RECUPERACION: 'Reinstala un sistema del descarte en un slot vacío.',
};

// Máscaras SVG para el efecto multicolor (optimizadas para relleno)
export const TYPE_ICON_MASKS = {
  [CardType.ORGAN]: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'black\'%3E%3Cpath d=\'M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z\'/%3E%3C/svg%3E")',
  [CardType.VIRUS]: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'black\'%3E%3Crect x=\'4\' y=\'10.5\' width=\'16\' height=\'3\' rx=\'1\'/%3E%3C/svg%3E")',
  [CardType.MEDICINE]: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'black\'%3E%3Crect x=\'10.5\' y=\'4\' width=\'3\' height=\'16\' rx=\'1\'/%3E%3Crect x=\'4\' y=\'10.5\' width=\'16\' height=\'3\' rx=\'1\'/%3E%3C/svg%3E")',
  [CardType.TREATMENT]: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'black\'%3E%3Cpath d=\'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z\'/%3E%3Ccircle cx=\'12\' cy=\'12\' r=\'4\'/%3E%3C/svg%3E")',
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
  [Color.RED]: 'ENERGÍA',
  [Color.BLUE]: 'OXÍGENO',
  [Color.GREEN]: 'BIOSEGURIDAD',
  [Color.YELLOW]: 'AGUA Y ALIMENTOS',
  [Color.MULTICOLOR]: 'SISTEMA OPERATIVO',
  [Color.PURPLE]: 'ACCIÓN ESPECIAL',
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
  [Color.PURPLE]: '⚡',      // Acción Especial
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
