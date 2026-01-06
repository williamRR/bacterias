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
  isSlotValid: (color: Color) => boolean;
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
      <div className="md:hidden flex gap-3 overflow-x-auto pb-2 justify-center">
        {others.map(player => (
          <div key={player.id} className="min-w-[220px] flex-none">
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
              isSlotValid={(color) => isSlotValid(color)}
              selectedCard={selectedCard}
            />
          </div>
        ))}
      </div>

      {/* Desktop/tablet: grid layout centered */}
      <div className={`hidden md:grid gap-4 justify-center items-start mb-6 w-full ${others.length === 1 ? 'grid-cols-1' : others.length === 2 ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        {others.map(player => (
          <div key={player.id} className="w-full max-w-lg">
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
              isSlotValid={(color) => isSlotValid(color)}
              selectedCard={selectedCard}
            />
          </div>
        ))}
      </div>
    </>
  );
}
