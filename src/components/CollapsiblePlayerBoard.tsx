import { Player, Color, Card } from '../game/types';
import { SLOT_COLORS } from '../game/body-utils';
import SystemSlot, { SlotData } from './SystemSlot';

interface PlayerBoardProps {
  player: Player;
  isCurrentPlayer: boolean;
  isLocalPlayer: boolean;
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

export default function PlayerBoard({
  player,
  isCurrentPlayer,
  isLocalPlayer,
  onOrganClick,
  onDrop,
  onDragOver,
  selectedColor,
  isDropTarget = false,
  targetColor,
  validTargets,
  isSlotValid,
  selectedCard,
}: PlayerBoardProps) {
  const handleDrop = (e: React.DragEvent, color: Color) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDrop) {
      onDrop(color, player);
    }
  };

  const isValid = (color: Color): boolean => {
    const targetKey = `${player.id}-${color}`;
    const inValidTargets = validTargets?.has(targetKey);
    const fallbackValid = isSlotValid ? isSlotValid(color) : false;

    return inValidTargets || fallbackValid;
  };

  return (
    <div
      className={`
        relative rounded-xl md:rounded-2xl p-2 md:p-3 lg:p-4
        bg-gradient-to-b from-slate-900/60 to-slate-900/40
        border border-white/5 md:border-white/10
        w-full max-w-lg mx-auto
        transition-all duration-200
        ${isCurrentPlayer ? 'ring-1 md:ring-2 ring-cyan-400' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <div className="flex items-center gap-1.5 md:gap-2">
          <span
            className={`
              text-xs md:text-sm lg:text-base font-semibold
              ${isLocalPlayer ? 'text-emerald-400' : 'text-slate-200'}
            `}
          >
            {player.name}
          </span>
          {isLocalPlayer && (
            <span className="text-[9px] md:text-[10px] text-emerald-500/80">TÚ</span>
          )}
        </div>

        {isCurrentPlayer && (
          <span className="text-[9px] md:text-[10px] bg-cyan-500/10 text-cyan-300 px-1.5 md:px-2 py-0.5 rounded-full border border-cyan-500/20">
            Turno activo
          </span>
        )}
      </div>

      {/* Slots */}
      <div className="grid grid-cols-4 gap-1.5 md:gap-2">
        {SLOT_COLORS.map((color) => {
          const slot =
            player.body instanceof Map ? player.body.get(color) : player.body[color];
          const slotData: SlotData | null = slot ? {
            organCard: slot.organCard,
            virusCards: slot.virusCards,
            medicineCards: slot.medicineCards,
          } : null;
          const selected = selectedColor === color;
          const target = isDropTarget && targetColor === color;
          const valid = selectedCard && isSlotValid ? isSlotValid(color) : false;

          return (
            <SystemSlot
              key={color}
              color={color}
              slot={slotData}
              isSelected={selected}
              isTarget={target}
              isValid={valid}
              onClick={() => onOrganClick(color)}
              onDrop={(e) => handleDrop(e, color)}
              onDragOver={onDragOver}
            />
          );
        })}
      </div>
    </div >
  );
}
