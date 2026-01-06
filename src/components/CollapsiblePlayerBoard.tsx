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
        return 'bg-amber-900/80 border-amber-500';
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

  return (
    <div
      className={`
        bg-gradient-to-br from-slate-800/90 to-gray-900/90 backdrop-blur-sm
        rounded-2xl p-3 border border-slate-700/50 transition-all duration-300
        w-full max-w-lg mx-auto
        ${isCurrentPlayer ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/20 animate-pulse-glow' : ''}
        ${isLocalPlayer ? 'ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/10' : ''}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span className={`${isLocalPlayer ? 'text-emerald-400' : 'text-cyan-400'}`}>
            {player.name}
            {isLocalPlayer && <span className="text-xs ml-1">(TÚ)</span>}
          </span>
          {isCurrentPlayer && (
            <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full animate-pulse">
              ACTIVO
            </span>
          )}
        </h3>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {SLOT_COLORS.map((color) => {
          const slot = player.body instanceof Map ? player.body.get(color) : player.body[color];
          const state = slot ? getOrganState(slot) : 'REMOVED';
          const isSelected = selectedColor === color;
          const isTarget = isDropTarget && targetColor === color;
          const valid = isValid(color);
          const systemLabel = COLOR_SYSTEM_LABELS[color];
          const stateLabel = ORGAN_STATE_LABELS[state];
          const systemIcon = SYSTEM_ICONS[color];
          const stateColor = getStateColor(state);

          return (
            <div
              key={color}
              onClick={() => onOrganClick(color)}
              onDrop={(e) => handleDrop(e, color)}
              onDragOver={handleDragOver}
              className={`
                ${getSystemColor(color)}
                ${getStateOverlay(state)}
                ${isSelected ? 'ring-2 ring-white scale-105 z-10 shadow-xl' : ''}
                ${isTarget ? 'ring-4 ring-cyan-400 scale-110 shadow-lg shadow-cyan-500/50 z-20' : ''}
                ${selectedCard && valid ? 'ring-2 ring-green-400 shadow-[0_0_10px_rgba(74,222,128,0.3)] animate-pulse' : ''}
                ${selectedCard && !valid ? 'opacity-30 grayscale scale-95' : ''}
                border-2 rounded-xl p-2 h-32 flex flex-col items-center justify-center
                cursor-pointer transition-all duration-300 hover:scale-105
                relative overflow-hidden group/slot scanner-effect
              `}
            >
              {selectedCard && valid && (
                <div className="absolute top-1 right-1 flex gap-1 z-10">
                  <div className="w-1 h-1 bg-green-400 rounded-full animate-ping"></div>
                  <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                </div>
              )}

              <div className="text-3xl mb-1 drop-shadow-md relative z-10 group-hover/slot:scale-110 transition-transform duration-500">{systemIcon}</div>

              <div className="text-[9px] font-black text-white uppercase tracking-widest relative z-10 opacity-70">
                {systemLabel}
              </div>

              {slot?.organCard ? (
                <div className="text-center relative z-10 mt-1">
                  <div className={`text-[9px] font-bold px-1 rounded-full inline-block bg-black/30 ${stateColor}`}>
                    {stateLabel}
                  </div>
                  {(slot.virusCards.length > 0 || slot.medicineCards.length > 0) && (
                    <div className="flex gap-1 justify-center mt-1">
                      {slot.virusCards.length > 0 && (
                        <div className="bg-red-500/20 px-1 rounded text-[8px] text-red-300 font-bold border border-red-500/30">
                          ⚠{slot.virusCards.length}
                        </div>
                      )}
                      {slot.medicineCards.length > 0 && (
                        <div className="bg-cyan-500/20 px-1 rounded text-[8px] text-cyan-300 font-bold border border-cyan-500/30">
                          🛡{slot.medicineCards.length}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center relative z-10 mt-1 opacity-30">
                  <div className="text-xl filter grayscale">✖</div>
                  <div className="text-[7px] text-gray-400 font-black mt-0.5 tracking-tighter">DESTROYED</div>
                </div>
              )}

              {/* Borde interior sutil */}
              <div className="absolute inset-px border border-white/5 rounded-[10px] pointer-events-none" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
