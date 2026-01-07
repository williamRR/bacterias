import { useState } from 'react';
import { Player, Color, Card } from '../game/types';
import { getOrganState } from '../game/validation';
import { SLOT_COLORS } from '../game/body-utils';
import {
  COLOR_SYSTEM_LABELS,
  ORGAN_STATE_LABELS,
  SYSTEM_ICONS,
} from '../game/theme';

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

  const getStateOverlay = (state: string): string => {
    switch (state) {
      case 'HEALTHY':
        return 'shadow-green-500/50 shadow-lg';
      case 'INFECTED':
        return 'shadow-yellow-500/50 shadow-lg animate-pulse-slow';
      case 'VACCINATED':
        return 'shadow-blue-400/50 shadow-lg';
      case 'IMMUNIZED':
        return 'ring-2 ring-cyan-300 shadow-cyan-400/60 shadow-lg';
      case 'REMOVED':
        return 'opacity-30 grayscale';
      default:
        return '';
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

  const getStateBadgeStyle = (state: string): string => {
    switch (state) {
      case 'HEALTHY':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'INFECTED':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse-slow';
      case 'VACCINATED':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'IMMUNIZED':
        return 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30';
      case 'REMOVED':
        return 'bg-gray-500/20 text-gray-500 border border-gray-500/30';
      default:
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
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
    const targetKey = `${player.id}-${color}`;
    const inValidTargets = validTargets?.has(targetKey);
    const fallbackValid = isSlotValid ? isSlotValid(color) : false;

    return inValidTargets || fallbackValid;
  };

  return (
    <div
      className={`
        relative rounded-2xl p-3 md:p-4
        bg-gradient-to-b from-slate-900/70 to-slate-900/40
        border border-white/10
        w-full max-w-lg mx-auto
        transition-all duration-300
        ${isCurrentPlayer ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/10' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`
              text-sm md:text-base font-semibold
              ${isLocalPlayer ? 'text-emerald-400' : 'text-slate-200'}
            `}
          >
            {player.name}
          </span>
          {isLocalPlayer && (
            <span className="text-[10px] text-emerald-500/80">TÚ</span>
          )}
        </div>

        {isCurrentPlayer && (
          <span className="text-[10px] bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/20">
            Turno activo
          </span>
        )}
      </div>

      {/* Slots */}
      <div className="grid grid-cols-4 gap-2">
        {SLOT_COLORS.map((color) => {
          const slot =
            player.body instanceof Map ? player.body.get(color) : player.body[color];
          const isEmpty = !slot?.organCard;
          const state = slot ? getOrganState(slot) : 'REMOVED';
          const selected = selectedColor === color;
          const target = isDropTarget && targetColor === color;
          const valid = selectedCard && isSlotValid ? isSlotValid(color) : false;

          return (
            <div
              key={color}
              onClick={() => onOrganClick(color)}
              onDrop={(e) => onDrop ? onDrop(color, player) : undefined}
              onDragOver={onDragOver}
              className={`
                relative h-24 rounded-xl
                flex flex-col items-center justify-center
                border border-white/10
                transition-all duration-200
                ${isEmpty ? 'grayscale opacity-40' : ''}
                ${selected ? 'ring-2 ring-white' : ''}
                ${target ? 'ring-2 ring-cyan-400' : ''}
                ${valid ? 'ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)]' : ''}
                ${selectedCard && !valid ? 'opacity-40 grayscale' : ''}
                ${getSystemColor(color)}
                hover:bg-white/5
              `}
            >
              {/* Icono */}
              <div className="text-2xl md:text-3xl">{SYSTEM_ICONS[color]}</div>

              {/* Label sistema */}
              <div className="text-[9px] text-white/60 uppercase mt-1">
                {COLOR_SYSTEM_LABELS[color]}
              </div>

              {/* Estado + contadores */}
              {slot?.organCard ? (
                <div className="mt-2 flex flex-col items-center gap-1">
                  <div
                    className={`
                      text-[9px] font-bold px-2 py-0.5 rounded-full
                      ${getStateBadgeStyle(state)}
                    `}
                  >
                    {ORGAN_STATE_LABELS[state]}
                  </div>

                  <div className="flex gap-1">
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
                <div className="mt-2 text-[9px] text-white/30">Vacío</div>
              )}
            </div>
          );
        })}
      </div>
    </div >
  );
}
