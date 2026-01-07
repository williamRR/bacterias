'use client';

import { useState } from 'react';
import { GameState, Player, Card, Color, CardType, TreatmentType } from '@/game/types';
import { SLOT_COLORS } from '@/game/body-utils';
import GameBoard from '@/components/GameBoard';
import PlayerBoards from '@/components/PlayerBoards';
import Hand from '@/components/Hand';
import { createDeck } from '@/game/deck';

export default function DemoPage() {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);

  const createMockPlayer = (name: string, id: string, hasAllOrgans: boolean = true): Player => {
    return {
      id,
      name,
      body: new Map(
        SLOT_COLORS.map((color) => {
          // Skip RED for player 2, skip BLUE for player 3 to show empty slots
          if (!hasAllOrgans) {
            if (id === 'player-2' && color === Color.RED) {
              return [color, null];
            }
            if (id === 'player-3' && color === Color.BLUE) {
              return [color, null];
            }
          }
          return [
            color,
            {
              organCard: {
                id: `${color}-organ`,
                type: CardType.ORGAN,
                color,
              },
              virusCards: [],
              medicineCards: [],
            },
          ];
        })
      ),
      hand: [],
    };
  };

  const createDemoCards = (): Card[] => [
    { id: 'v1', type: CardType.VIRUS, color: Color.RED },
    { id: 't1', type: CardType.TREATMENT, color: Color.MULTICOLOR, treatmentType: TreatmentType.ENERGY_TRANSFER },
    { id: 'o1', type: CardType.ORGAN, color: Color.MULTICOLOR },
  ];

  const mockGameState: GameState = {
    players: [
      createMockPlayer('Tú', 'player-1', true),
      createMockPlayer('Comandante Shepard', 'player-2', false),
      createMockPlayer('Kai Leng', 'player-3', false),
    ],
    currentPlayerIndex: 0,
    deck: createDeck(),
    discardPile: [],
    gameStarted: true,
    gameEnded: false,
    winner: undefined,
  };

  mockGameState.players[0].hand = createDemoCards();

  const currentPlayerId = 'player-1';
  const isCurrentPlayer = true;
  const currentPlayer = mockGameState.players[0];

  const handleCardSelect = (card: Card) => {
    setSelectedCard(card);
    setSelectedColor(null);
  };

  const handleOrganClick = (color: Color, player: Player) => {
    setSelectedColor(color);
  };

  const handleEndTurn = () => {
    setSelectedCard(null);
    setSelectedColor(null);
    setSelectedCards([]);
  };

  const isSlotValid = (playerId: string, color: Color): boolean => {
    return true;
  };

  return (
    <main className="h-screen text-white relative overflow-hidden flex flex-col">
      <div className="nebula-bg"></div>
      <div className="stars-bg"></div>
      <div className="shooting-stars"></div>

      <div className="container mx-auto max-w-6xl px-1.5 md:p-2 md:px-3 relative z-10 flex-1 flex flex-col min-h-0 overflow-y-auto pb-32 md:pb-40">
        <div className="text-center py-4 md:py-6">
          <h1 className="text-2xl md:text-3xl font-black text-cyan-400 uppercase tracking-[0.2em] mb-2">
            Virus! - Vista Previa
          </h1>
          <p className="text-gray-400 text-sm md:text-base">Demo del tablero de juego</p>
        </div>

        <div className="mb-2 md:mb-4">
          <PlayerBoards
            players={mockGameState.players}
            currentPlayerId={currentPlayerId}
            currentPlayer={currentPlayer || undefined}
            isDragging={false}
            dragTargetColor={null}
            validTargets={new Set()}
            selectedCard={selectedCard}
            handleOrganClick={handleOrganClick}
            handleDropCard={() => { }}
            handleDragOver={() => { }}
            isSlotValid={isSlotValid}
          />
        </div>

        <div className="mb-2 md:mb-4">
          <GameBoard
            player={currentPlayer}
            isCurrentPlayer={isCurrentPlayer}
            onOrganClick={(color) => handleOrganClick(color, currentPlayer)}
            onDrop={() => { }}
            onDragOver={() => { }}
            selectedColor={selectedColor}
            isDropTarget={false}
            targetColor={null}
            validTargets={new Set()}
            isSlotValid={(color) => isSlotValid(currentPlayerId, color)}
            selectedCard={selectedCard}
          />
        </div>

        <Hand
          cards={currentPlayer.hand}
          onCardSelect={handleCardSelect}
          onDragStart={() => { }}
          onDragEnd={() => { }}
          onCardDiscard={() => { }}
          selectedCard={selectedCard}
          selectedCards={selectedCards}
          disabled={!isCurrentPlayer}
          onEndTurn={handleEndTurn}
          actionsThisTurn={0}
          isCurrentPlayer={isCurrentPlayer}
        />
      </div>
    </main>
  );
}
