import { Player, Color, Card, OrganState } from '../game/types';
import { getOrganState } from '../game/validation';
import { SLOT_COLORS } from '../game/body-utils';
import {
  COLOR_SYSTEM_LABELS,
  ORGAN_STATE_LABELS,
  SYSTEM_ICONS,
} from '../game/theme';

interface GameBoardProps {
  player: Player;
  isCurrentPlayer: boolean;
  onOrganClick: (color: Color) => void;
  onDrop?: (color: Color, player: Player) => void;
  onDragOver?: (e: React.DragEvent) => void;
  selectedColor: Color | null;
  isDropTarget?: boolean;
  targetColor?: Color | null;
  validTargets?: Set<string>;
  isSlotValid?: (color: Color) => boolean;
  selectedCard?: Card | null;
}

export default function GameBoard({
  player,
  isCurrentPlayer,
  onOrganClick,
  onDrop,
  onDragOver,
  selectedColor,
  isDropTarget = false,
  targetColor,
  validTargets,
  isSlotValid,
  selectedCard,
}: GameBoardProps) {


  // Color base del sistema (SIEMPRE el mismo, no cambia con el estado)
  const getSystemColor = (color: Color): string => {
    switch (color) {
      case Color.RED:
        return 'bg-orange-900/80 border-orange-500';
      case Color.BLUE:
        return 'bg-cyan-900/80 border-cyan-500';
      case Color.GREEN:
        return 'bg-emerald-900/80 border-emerald-500';
      case Color.YELLOW:
        return 'bg-yellow-600/80 border-yellow-400';
      case Color.MULTICOLOR:
        return 'bg-violet-900/80 border-violet-500';
      default:
        return 'bg-gray-900/80 border-gray-500';
    }
  };


  const getStateColor = (state: string): string => {
    switch (state) {
      case 'HEALTHY':
        return 'text-green-400';
      case 'INFECTED':
        return 'text-yellow-400';
      case 'VACCINATED':
        return 'text-blue-400';
      case 'IMMUNIZED':
        return 'text-cyan-300';
      case 'REMOVED':
        return 'text-gray-500';
      default:
        return 'text-gray-400';
    }
  };

  const handleDrop = (e: React.DragEvent, color: Color) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDrop) {
      onDrop(color, player);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (onDragOver) {
      onDragOver(e);
    }
  };

  const isValid = (color: Color): boolean => {
    return isSlotValid ? isSlotValid(color) : false;
  };

  const getStateBadgeStyle = (state: string) => {
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
      className={`
      bg-slate-900/60 backdrop-blur-md
      rounded-2xl p-3 md:p-4 border border-white/10
      w-full max-w-lg mx-auto transition-all duration-300
      ${isCurrentPlayer ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/10' : ''}
    `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm md:text-base font-semibold text-white">
          {player.name}
        </h3>
        {isCurrentPlayer && (
          <span className="text-[10px] bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/20">
            Tu turno
          </span>
        )}
      </div>

      {/* Slots */}
      <div className="grid grid-cols-4 gap-2">
        {SLOT_COLORS.map((color) => {
          const slot = player.body instanceof Map ? player.body.get(color) : player.body[color];
          const isEmpty = !slot?.organCard;
          const state = slot ? getOrganState(slot) : 'REMOVED';
          const isSelected = selectedColor === color;
          const isTarget = isDropTarget && targetColor === color;
          const valid = isValid(color);

          return (
            <div
              key={color}
              onClick={() => onOrganClick(color)}
              onDrop={(e) => handleDrop(e, color)}
              onDragOver={handleDragOver}
              className={`
              ${getSystemColor(color)}
              ${isEmpty ? 'grayscale opacity-40' : ''}
              ${isSelected ? 'ring-2 ring-white' : ''}
              ${isTarget ? 'ring-2 ring-cyan-400' : ''}
              ${valid ? 'ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)]' : ''}
              ${selectedCard && !valid ? 'opacity-40 grayscale' : ''}
              rounded-xl p-2 h-24 flex flex-col items-center justify-center
              cursor-pointer transition-all hover:bg-white/5
              border border-white/10
            `}
            >
              {/* Icono */}
              <div className="text-2xl mb-1">{SYSTEM_ICONS[color]}</div>

              {/* Label del sistema */}
              <div className="text-[9px] text-white/60 uppercase tracking-wide">
                {COLOR_SYSTEM_LABELS[color]}
              </div>

              {/* Estado */}
              {slot?.organCard ? (
                <div className="mt-2 text-center">
                  <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getStateBadgeStyle(state)}`}>
                    {ORGAN_STATE_LABELS[state as keyof typeof ORGAN_STATE_LABELS]}
                  </div>

                  {/* Contadores */}
                  <div className="flex gap-1 justify-center mt-1">
                    {slot.virusCards.length > 0 && (
                      <span className="text-[8px] bg-red-500/20 text-red-300 px-1 rounded">
                        ⚠ {slot.virusCards.length}
                      </span>
                    )}
                    {slot.medicineCards.length > 0 && (
                      <span className="text-[8px] bg-cyan-500/20 text-cyan-300 px-1 rounded">
                        🛡 {slot.medicineCards.length}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-[9px] text-white/30 uppercase">Vacío</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
