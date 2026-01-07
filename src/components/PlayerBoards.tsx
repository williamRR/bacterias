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
      {/* Mobile: horizontal scroll of compact boards (now centered if few) */}
      <div className="md:hidden flex gap-2 md:gap-4 overflow-x-auto pb-2 md:pb-4 snap-x snap-mandatory scroll-smooth justify-center">
        {others.map(player => (
          <div key={player.id} className="min-w-[260px] md:min-w-[280px] flex-none snap-center">
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

      {/* Desktop/tablet: smarter grid layout centered */}
      <div className="hidden md:flex flex-wrap gap-6 justify-center items-start mb-8 w-full max-w-6xl mx-auto">
        {others.map(player => (
          <div key={player.id} className={`w-full ${others.length === 1 ? 'max-w-2xl' : 'max-w-md'} transition-all duration-300`}>
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
