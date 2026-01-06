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
    <div className="fixed bottom-0 left-0 right-0 z-40 px-1 pb-1 md:px-2 md:pb-2 md:pb-4 pointer-events-none">
      <div className="max-w-4xl mx-auto glass-panel rounded-t-2xl md:rounded-3xl p-2 md:p-3 lg:p-5 shadow-2xl border-t-2 border-cyan-400/30 pointer-events-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4">
          <div className="flex-1 w-full flex flex-col items-center">
            {disabled && (
              <div className="text-center text-cyan-400 mb-1 md:mb-2 font-black text-[8px] md:text-[10px] flex items-center justify-center gap-1 md:gap-2 tracking-[0.2em] uppercase">
                <span className="animate-spin duration-1000 text-sm md:text-base">⚙️</span>
                <span className="animate-pulse">{UI_LABELS.waiting}</span>
              </div>
            )}

            {draggedCard && !disabled && (
              <div className="text-center text-cyan-300 mb-1 md:mb-2 text-[8px] md:text-[10px] font-bold animate-pulse uppercase tracking-widest bg-cyan-500/10 px-2 md:px-4 py-0.5 md:py-1 rounded-full border border-cyan-500/20">
                🚀 Arrastra la carta a un objetivo o a la papelera
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 lg:gap-6">
          {/* Botón Terminar Turno - integrado junto a las cartas */}
          {isCurrentPlayer && onEndTurn && (
            <div className="flex md:flex-col items-center justify-center gap-1 md:gap-2 order-first md:order-last">
              <button
                onClick={onEndTurn}
                disabled={actionsThisTurn === 0}
                className={`group relative flex md:flex-col items-center justify-center gap-1 md:gap-1 px-2 md:px-3 py-1.5 md:py-2 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-xl md:rounded-full font-black text-[8px] md:text-[10px] transition-all shadow-2xl uppercase tracking-tighter ${
                  actionsThisTurn > 0
                    ? 'btn-space animate-pulse-glow hover:scale-105'
                    : 'bg-slate-800/80 text-gray-600 border border-white/5 cursor-not-allowed'
                }`}
              >
                <span className="text-base md:text-lg lg:text-xl">{actionsThisTurn > 0 ? '🚀' : '⏳'}</span>
                <span className="hidden md:inline text-[8px] lg:text-[10px]">{UI_LABELS.endTurn}</span>
                <span className="md:hidden text-[7px] uppercase tracking-tight">Terminar</span>
                {actionsThisTurn > 0 && (
                  <span className="absolute -top-1 -right-1 md:bottom-1 md:right-1 bg-green-500 text-slate-900 px-0.5 md:px-1 py-0.5 rounded text-[7px] md:text-[9px] font-bold">+1🎴</span>
                )}
              </button>
            </div>
          )}

          {/* Hand of cards */}
          <div className="flex-1 flex justify-center items-end pb-0.5 md:pb-1 lg:pb-2 px-1 md:px-2 min-h-[6rem] md:min-h-[9rem] lg:min-h-[11rem]">
            {cards.length === 0 ? (
              <div className="text-gray-500 font-bold text-[10px] md:text-xs py-4 md:py-8 uppercase tracking-widest italic opacity-50">
                Sistemas en recarga...
              </div>
            ) : (
              <div className="flex justify-center" style={{
                maxWidth: '100%',
                margin: '0 auto'
              }}>
                {cards.map((card, index) => {
                  const fanStyle = getFanStyle(index, cards.length);
                  const isSelected = selectedCard?.id === card.id || selectedCards.some((c) => c.id === card.id);

                  return (
                    <div
                      key={card.id}
                      className="transition-all duration-300 ease-out"
                      style={{
                        ...fanStyle,
                        marginLeft: index === 0 ? 0 : '-2.5rem', // Stack cards more on mobile
                      } as any}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <Card
                        card={card}
                        onClick={() => !disabled && onCardSelect(card)}
                        onDragStart={!disabled ? (e) => handleDragStart(e, card) : undefined}
                        onDragEnd={handleDragEnd}
                        onDiscard={!disabled ? () => onCardDiscard?.(card) : undefined}
                        selected={isSelected}
                        draggable={!disabled}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Discard Pile Zone */}
          {!disabled && (
            <div
              onDrop={(e) => {
                e.preventDefault();
                if (draggedCard && onCardDiscard) {
                  onCardDiscard(draggedCard);
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              className={`
                hidden md:flex flex-col items-center justify-center w-20 h-28 lg:w-24 lg:h-32 rounded-2xl border-2 border-dashed transition-all duration-300
                ${draggedCard ? 'border-red-500/50 bg-red-500/10 scale-105 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'border-gray-700 bg-gray-900/40 opacity-40 hover:opacity-100'}
              `}
            >
              <div className={`text-2xl lg:text-3xl mb-1 ${draggedCard ? 'animate-bounce' : ''}`}>
                {draggedCard ? '🗑️' : '♻️'}
              </div>
              <div className="text-[9px] lg:text-[10px] font-black text-gray-400 uppercase tracking-widest text-center px-2">
                {draggedCard ? 'Soltar para' : 'Área de'} <br /> Descarte
              </div>
              <div className="mt-2 w-6 lg:w-8 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full bg-red-500 transition-all duration-500 ${draggedCard ? 'w-full' : 'w-0'}`} />
              </div>
            </div>
          )}
        </div>

        {!disabled && cards.length > 0 && (
          <div className="text-center text-[7px] md:text-[9px] lg:text-[10px] font-bold text-gray-500 mt-1 md:mt-2 uppercase tracking-widest opacity-60">
            Control Manual: Selecciona o arrastra una acción
          </div>
        )}
      </div>
    </div>
  );
}
