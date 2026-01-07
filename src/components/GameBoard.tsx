import { Player, Color, Card } from '../game/types';
import { SLOT_COLORS } from '../game/body-utils';
import SystemSlot, { SlotData } from './SystemSlot';

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

  const handleDrop = (e: React.DragEvent, color: Color) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDrop) {
      onDrop(color, player);
    }
  };

  const isValid = (color: Color): boolean => {
    return isSlotValid ? isSlotValid(color) : false;
  };

  return (
    <div
      className={`
      bg-slate-900/50 backdrop-blur-md
      rounded-xl md:rounded-2xl p-2 md:p-3 lg:p-4 border border-white/5 md:border-white/10
      w-full max-w-xl mx-auto transition-all duration-200
      ${isCurrentPlayer ? 'ring-1 md:ring-2 ring-cyan-400' : ''}
    `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <h3 className="text-xs md:text-sm lg:text-base font-semibold text-white">
          {player.name}
        </h3>
        {isCurrentPlayer && (
          <span className="text-[9px] md:text-[10px] bg-cyan-500/10 text-cyan-300 px-1.5 md:px-2 py-0.5 rounded-full border border-cyan-500/20">
            Tu turno
          </span>
        )}
      </div>

      {/* Slots */}
      <div className="grid grid-cols-4 gap-1.5 md:gap-2">
        {SLOT_COLORS.map((color) => {
          const slot = player.body instanceof Map ? player.body.get(color) : player.body[color];
          const slotData: SlotData | null = slot ? {
            organCard: slot.organCard,
            virusCards: slot.virusCards,
            medicineCards: slot.medicineCards,
          } : null;

          return (
            <SystemSlot
              key={color}
              color={color}
              slot={slotData}
              isSelected={selectedColor === color}
              isTarget={isDropTarget && targetColor === color}
              isValid={isValid(color)}
              onClick={() => onOrganClick(color)}
              onDrop={(e) => handleDrop(e, color)}
              onDragOver={onDragOver}
            />
          );
        })}
      </div>
    </div>
  );
}
