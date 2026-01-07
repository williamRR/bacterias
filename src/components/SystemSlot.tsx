import { Color, Card } from '../game/types';
import { getOrganState } from '../game/validation';
import {
  COLOR_SYSTEM_LABELS,
  ORGAN_STATE_LABELS,
} from '../game/theme';

export interface SlotData {
  organCard?: Card;
  virusCards: Card[];
  medicineCards: Card[];
}

export interface SystemSlotProps {
  color: Color;
  slot: SlotData | null;
  isSelected: boolean;
  isTarget: boolean;
  isValid: boolean;
  onClick: () => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
}

// Helper functions moved to shared scope
const getSystemColorValue = (color: Color): string => {
  switch (color) {
    case Color.RED: return '#ef4444';
    case Color.BLUE: return '#06b6d4';
    case Color.GREEN: return '#10b981';
    case Color.YELLOW: return '#eab308';
    case Color.MULTICOLOR: return '#a855f7';
    default: return '#94a3b8';
  }
};

const getSystemIconPath = (color: Color): string => {
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

const getNeonConfig = (color: Color) => {
  return {
    [Color.RED]: {
      shadow: 'shadow-red-500/20',
      text: 'text-red-400/90',
      glow: 'drop-shadow-[0_0_5px_rgba(239,68,68,0.4)]'
    },
    [Color.BLUE]: {
      shadow: 'shadow-cyan-500/20',
      text: 'text-cyan-400/90',
      glow: 'drop-shadow-[0_0_5px_rgba(6,182,212,0.4)]'
    },
    [Color.GREEN]: {
      shadow: 'shadow-emerald-500/20',
      text: 'text-emerald-400/90',
      glow: 'drop-shadow-[0_0_5px_rgba(16,185,129,0.4)]'
    },
    [Color.YELLOW]: {
      shadow: 'shadow-yellow-500/20',
      text: 'text-yellow-400/90',
      glow: 'drop-shadow-[0_0_5px_rgba(234,179,8,0.4)]'
    },
    [Color.MULTICOLOR]: {
      shadow: 'shadow-violet-500/20',
      text: 'text-violet-400/90',
      glow: 'drop-shadow-[0_0_5px_rgba(168,85,247,0.4)]'
    },
  }[color] || { shadow: '', text: 'text-gray-500', glow: '' };
};

export default function SystemSlot({
  color,
  slot,
  isSelected,
  isTarget,
  isValid,
  onClick,
  onDrop,
  onDragOver,
}: SystemSlotProps) {
  const isEmpty = !slot?.organCard;
  const state = slot ? getOrganState(slot) : 'REMOVED';
  const medicineCount = slot?.medicineCards.length || 0;
  const virusCount = slot?.virusCards.length || 0;
  const neonConfig = getNeonConfig(color);

  const getStateBadgeStyle = (state: string): string => {
    switch (state) {
      case 'HEALTHY': return 'bg-emerald-500/20 text-emerald-300';
      case 'INFECTED': return 'bg-yellow-500/20 text-yellow-300';
      case 'VACCINATED': return 'bg-cyan-500/20 text-cyan-300';
      case 'IMMUNIZED': return 'bg-red-500/20 text-red-300';
      case 'REMOVED': return 'bg-gray-500/20 text-gray-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  return (
    <div
      onClick={onClick}
      onDrop={onDrop}
      onDragOver={onDragOver}
      className={`
        relative flex flex-col items-center justify-center h-20 md:h-24 rounded-xl transition-all overflow-hidden cursor-pointer
        ${isEmpty
          ? 'bg-black/20 border-2 border-dashed border-white/5'
          : `bg-slate-800/40 border-2 shadow-inner bg-radial-system ${neonConfig.shadow}`
        }
        ${isValid ? 'ring-2 ring-yellow-400 scale-[1.02] animate-vibrate' : 'hover:bg-white/5'}
        ${isSelected ? 'ring-2 ring-white z-10' : ''}
      `}
      style={!isEmpty ? { '--tw-shadow-color': getSystemColorValue(color) } as any : {}}
    >
      {/* Scan effect for empty slots */}
      {isEmpty && <div className="absolute inset-0 animate-scan-pulse bg-white/5 pointer-events-none" />}

      {/* Icono con Mask Image para limpieza de activos */}
      <div
        className={`w-10 h-10 md:w-12 md:h-12 transition-all mb-1
          ${isEmpty ? 'opacity-10 grayscale' : `opacity-90 ${neonConfig.glow}`}
        `}
        style={{
          backgroundColor: getSystemColorValue(color),
          maskImage: `url(${getSystemIconPath(color)})`,
          WebkitMaskImage: `url(${getSystemIconPath(color)})`,
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
        }}
      />

      {/* Nombre del sistema: Solo brilla si existe el órgano */}
      <span className={`text-[7px] md:text-[9px] font-bold tracking-tighter uppercase transition-all
        ${isEmpty ? 'text-slate-600' : `${neonConfig.text} ${neonConfig.glow}`}`}>
        {COLOR_SYSTEM_LABELS[color]}
      </span>

      {/* Pill Indicators */}
      {!isEmpty && (
        <div className="absolute bottom-1 md:bottom-2 left-0 right-0 flex flex-col items-center gap-0.5 md:gap-1 px-1 md:px-2">
          {/* Medicine Pills (Cyan) */}
          {medicineCount > 0 && (
            <div className="flex gap-0.5 md:gap-1 justify-center">
              {Array.from({ length: medicineCount }).map((_, i) => (
                <div key={`med-${i}`} className="w-3 h-0.5 md:w-5 md:h-1 bg-cyan-400 rounded-full shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
              ))}
            </div>
          )}
          {/* Virus Pills (Red) */}
          {virusCount > 0 && (
            <div className="flex gap-0.5 md:gap-1 justify-center">
              {Array.from({ length: virusCount }).map((_, i) => (
                <div key={`vir-${i}`} className="w-1 h-1 md:w-1.5 md:h-1.5 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* State Badge (top-right corner) */}
      {!isEmpty && (
        <div className={`absolute top-0.5 right-0.5 text-[6px] md:text-[7px] font-bold px-1 py-0.5 rounded-full ${getStateBadgeStyle(state)}`}>
          {ORGAN_STATE_LABELS[state as keyof typeof ORGAN_STATE_LABELS].slice(0, 3)}
        </div>
      )}
    </div>
  );
}
