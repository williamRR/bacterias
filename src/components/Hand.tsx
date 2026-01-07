import { useState } from 'react';
import { Card as CardType } from '../game/types';
import Card from './Card';
import { UI_LABELS } from '../game/theme';

interface HandProps {
  cards: CardType[];
  onCardSelect: (card: CardType) => void;
  onDragStart?: (e: React.DragEvent, card: CardType) => void;
  onDragEnd?: () => void;
  onCardDiscard?: (card: CardType) => void;
  selectedCard: CardType | null;
  selectedCards: CardType[];
  disabled?: boolean;
  onEndTurn?: () => void;
  actionsThisTurn?: number;
  isCurrentPlayer?: boolean;
}

export default function Hand({
  cards,
  onCardSelect,
  onDragStart,
  onDragEnd,
  onCardDiscard,
  selectedCard,
  selectedCards,
  disabled = false,
  onEndTurn,
  actionsThisTurn = 0,
  isCurrentPlayer = false
}: HandProps) {
  const [draggedCard, setDraggedCard] = useState<CardType | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, card: CardType) => {
    setDraggedCard(card);
    onCardSelect(card);
    if (onDragStart) {
      onDragStart(e, card);
    }
  };

  const handleDragEnd = () => {
    setDraggedCard(null);
    if (onDragEnd) {
      onDragEnd();
    }
  };

  const getFanStyle = (index: number, totalCards: number) => {
    const isSelected = selectedCard?.id === cards[index].id || selectedCards.some((c) => c.id === cards[index].id);
    const isHovered = hoveredIndex === index;
    const isNeighbor = hoveredIndex !== null && Math.abs(hoveredIndex - index) === 1;

    let scale = 1;
    let translateY = 0;
    let translateX = 0;
    let rotate = 0;
    let zIndex = 10;

    if (totalCards > 4) {
      const midPoint = (totalCards - 1) / 2;
      const offsetFromCenter = index - midPoint;

      rotate = offsetFromCenter * 3;
      translateY = Math.abs(offsetFromCenter) * 8;
      translateX = offsetFromCenter * 8;
    }

    if (isSelected || isHovered) {
      scale = 1.15;
      translateY -= 30;
      zIndex = 50;
    } else if (isNeighbor) {
      scale = 1.05;
      translateY -= 10;
      zIndex = 30;
    }

    return {
      transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotate}deg) scale(${scale})`,
      zIndex,
    };
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-2 pb-2 md:pb-6 pointer-events-none" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0.5rem)' }}>
      <div className="max-w-5xl mx-auto glass-panel rounded-2xl md:rounded-[2rem] p-3 md:p-4 lg:p-6 shadow-2xl pointer-events-auto border-t border-white/10">
        {/* Fixed height container for waiting message to prevent layout shifts */}
        <div className="h-[40px] flex flex-col items-center justify-center mb-4">
          {disabled && (
            <div className="flex items-center gap-2 px-6 py-2 bg-slate-900/50 rounded-full border border-white/5 animate-pulse-slow">
              <span className="text-cyan-400 text-xs font-black uppercase tracking-[0.2em]">
                ⏳ {UI_LABELS.waiting}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-end md:items-center gap-4 lg:gap-8">
          {/* Botón Terminar Turno - always reserve space to prevent layout shifts */}
          <div className="flex items-center justify-center gap-2 order-last md:order-first">
            {isCurrentPlayer && onEndTurn ? (
              <button
                id="tour-end-turn"
                onClick={onEndTurn}
                // disabled={actionsThisTurn === 0}
                className={`group relative flex items-center justify-center gap-2 px-5 py-3 min-w-[120px] md:min-w-0 md:w-20 md:h-20 lg:w-24 lg:h-24 md:flex-col rounded-xl md:rounded-2xl font-black text-xs transition-all shadow-lg uppercase tracking-wider bg-gradient-to-br from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white shadow-cyan-900/30 active:scale-95' ${actionsThisTurn === 0 ? 'opacity-60' : ''}`}
              >
                <span className="text-lg md:hidden">🏁</span>
                <span className="text-sm md:text-[10px] md:mt-1">{UI_LABELS.endTurn}</span>
                {actionsThisTurn > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded-full text-[9px] font-bold animate-pulse">+1</span>
                )}
              </button>
            ) : (
              // Placeholder to maintain consistent spacing when button is not shown
              <div className="w-[120px] md:w-20 md:h-20 lg:w-24 lg:h-24" />
            )}
          </div>

          {/* Mano de cartas - Sin apilamiento para pocas cartas */}
          <div id="tour-card-actions" className="flex-1 flex justify-center items-end pb-4 min-h-[10rem] md:min-h-[12rem] px-4 w-full">
            {cards.length === 0 ? (
              <div className="text-gray-500 font-bold text-xs py-8 uppercase tracking-widest italic opacity-40">
                Sistemas en recarga...
              </div>
            ) : (
              <div
                className={`flex justify-center items-end flex-nowrap w-full ${cards.length <= 3 ? 'gap-4 md:gap-8' : ''}`}
                style={{
                  maxWidth: '100%',
                  margin: '0 auto'
                }}
              >
                {cards.map((card, index) => {
                  const isSelected = selectedCard?.id === card.id || selectedCards.some((c) => c.id === card.id);

                  return (
                    <div
                      key={card.id}
                      className="transition-all duration-300 ease-out flex-shrink-0"

                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <Card
                        card={card}
                        onClick={() => !disabled && onCardSelect(card)}
                        onDragStart={!disabled ? (e) => handleDragStart(e, card) : undefined}
                        onDragEnd={handleDragEnd}
                        onDiscard={!disabled ? () => {
                          onCardDiscard?.(card);
                        } : undefined}
                        selected={isSelected}
                        draggable={!disabled}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Discard Pile Zone - removed, use X button on card instead */}
        </div>

        {/* Fixed height container for hint text to prevent layout shifts */}
        <div className="h-[18px] md:h-[22px] text-center">
          {!disabled && cards.length > 0 && (
            <div className="text-[10px] md:text-[9px] lg:text-[10px] font-bold text-gray-500 mt-1 md:mt-2 uppercase tracking-widest opacity-60 leading-tight">
              Control Manual: Selecciona o arrastra una acción
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
