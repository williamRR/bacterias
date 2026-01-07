import React from 'react';
import { Player, Color, Card } from '@/game/types';
import PlayerBoard from './CollapsiblePlayerBoard';

interface PlayerBoardsProps {
  players: Player[];
  currentPlayerId: string | null;
  currentPlayer?: Player | null;
  isDragging: boolean;
  dragTargetColor: Color | null;
  validTargets: Set<string>;
  selectedCard: Card | null;
  handleOrganClick: (color: Color, player: Player) => void;
  handleDropCard: (color: Color, player: Player) => void;
  handleDragOver: (e: React.DragEvent) => void;
  isSlotValid: (playerId: string, color: Color) => boolean;
}

export default function PlayerBoards({
  players,
  currentPlayerId,
  currentPlayer,
  isDragging,
  dragTargetColor,
  validTargets,
  selectedCard,
  handleOrganClick,
  handleDropCard,
  handleDragOver,
  isSlotValid,
}: PlayerBoardsProps) {
  // Separate others and self
  const others = players.filter(p => p.id !== currentPlayerId);

  return (
    <>
      {/* Mobile: vertical scroll of compact boards */}
      <div className="md:hidden flex flex-col gap-3 overflow-y-auto pb-4 snap-y snap-mandatory scroll-smooth px-2 max-h-[40vh]">
        {others.map(player => (
          <div key={player.id} className="min-w-[280px] md:min-w-[320px] flex-none snap-center">
            <PlayerBoard
              player={player}
              isCurrentPlayer={player.id === currentPlayer?.id}
              isLocalPlayer={false}
              onOrganClick={(color) => handleOrganClick(color, player)}
              onDrop={handleDropCard}
              onDragOver={handleDragOver}
              selectedColor={null}
              isDropTarget={isDragging}
              targetColor={dragTargetColor}
              validTargets={validTargets}
              isSlotValid={(color) => isSlotValid(player.id, color)}
              selectedCard={selectedCard}
            />
          </div>
        ))}
      </div>

      {/* Desktop/tablet: vertical layout */}
      <div className="hidden md:flex flex-col gap-4 items-center mb-6 md:mb-8 w-full max-w-4xl mx-auto">
        {others.map(player => (
          <div key={player.id} className="w-full max-w-3xl transition-all duration-300 scale-90 origin-top">
            <PlayerBoard
              player={player}
              isCurrentPlayer={player.id === currentPlayer?.id}
              isLocalPlayer={false}
              onOrganClick={(color) => handleOrganClick(color, player)}
              onDrop={handleDropCard}
              onDragOver={handleDragOver}
              selectedColor={null}
              isDropTarget={isDragging}
              targetColor={dragTargetColor}
              validTargets={validTargets}
              isSlotValid={(color) => isSlotValid(player.id, color)}
              selectedCard={selectedCard}
            />
          </div>
        ))}
      </div>
    </>
  );
}
