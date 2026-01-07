import { useState } from 'react';
import { Card as CardType } from '../game/types';
import Card from './Card';
import { UI_LABELS } from '../game/theme';
import { Color } from '@/game/types';

const SYSTEM_ICON = '/assets/icons/ENERGIA_RED.svg';
const SYSTEM_COLOR = '#ef4444';

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


  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-1 md:px-2 pb-0 md:pb-2 pointer-events-none" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0.1rem)' }}>
      <div className="max-w-5xl mx-auto bg-slate-900/80 backdrop-blur-md rounded-xl md:rounded-2xl p-1.5 md:p-3 lg:p-4 shadow-2xl pointer-events-auto border-t border-white/5 md:border-white/10">
        {/* Fixed height container for waiting message to prevent layout shifts */}
        <div className="h-[20px] md:h-[32px] flex flex-col items-center justify-center mb-1 md:mb-2">
          {disabled && (
            <div className="flex items-center gap-2 px-4 md:px-6 py-1 md:py-2 bg-slate-800/50 rounded-full border border-white/5 animate-pulse-slow">
              <span className="text-cyan-400 text-[10px] md:text-xs font-black uppercase tracking-[0.15em]">
                ⏳ {UI_LABELS.waiting}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-end md:items-center gap-2 md:gap-4 lg:gap-6">
          {/* Botón Terminar Turno - always reserve space to prevent layout shifts */}
          <div className="flex items-center justify-center gap-2 order-last md:order-first">
            {isCurrentPlayer && onEndTurn ? (
              <button
                id="tour-end-turn"
                onClick={onEndTurn}
                className={`group relative flex items-center justify-center gap-1 md:gap-2 px-2 md:px-5 py-1.5 md:py-3 min-w-[70px] md:min-w-0 md:w-20 md:h-20 lg:w-24 lg:h-24 md:flex-col rounded-lg md:rounded-2xl font-black text-[9px] md:text-xs transition-all shadow-md md:shadow-lg uppercase tracking-wider bg-gradient-to-br from-cyan-600/80 to-cyan-700/80 hover:from-cyan-500/90 hover:to-cyan-600/90 text-white shadow-cyan-900/20 active:scale-95 border border-cyan-500/20' ${actionsThisTurn === 0 ? 'opacity-60' : ''}`}
              >
                <div className="relative">
                  <div
                    className="w-5 h-5 md:w-7 md:h-7"
                    style={{
                      backgroundColor: SYSTEM_COLOR,
                      maskImage: `url(${SYSTEM_ICON})`,
                      WebkitMaskImage: `url(${SYSTEM_ICON})`,
                      maskRepeat: 'no-repeat',
                      WebkitMaskRepeat: 'no-repeat',
                      maskPosition: 'center',
                      WebkitMaskPosition: 'center',
                      maskSize: 'contain',
                      WebkitMaskSize: 'contain',
                    }}
                  />
                  <span className="absolute -top-1 -right-1.5 text-[8px] md:text-[10px] font-bold text-white drop-shadow-md">
                    {actionsThisTurn > 0 ? '+' : '-'}
                  </span>
                </div>
                <span className="text-[8px] md:text-sm md:text-[10px] md:mt-1">{UI_LABELS.endTurn}</span>
                {actionsThisTurn > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-emerald-500 text-slate-950 px-1 py-0.5 rounded-full text-[8px] md:text-[9px] font-bold animate-pulse">+1</span>
                )}
              </button>
            ) : (
              // Placeholder to maintain consistent spacing when button is not shown
              <div className="w-[70px] md:w-20 md:h-20 lg:w-24 lg:h-24" />
            )}
          </div>

          {/* Mano de cartas - Sin apilamiento para pocas cartas */}
          <div id="tour-card-actions" className="flex-1 flex justify-center items-end pb-1 md:pb-4 min-h-[5rem] md:min-h-[10rem] lg:min-h-[12rem] px-2 md:px-4 w-full">
            {cards.length === 0 ? (
              <div className="text-gray-500 font-bold text-[10px] md:text-xs py-6 md:py-8 uppercase tracking-widest italic opacity-40">
                Sistemas en recarga...
              </div>
            ) : (
              <div
                className={`flex justify-center items-end flex-nowrap w-full ${cards.length <= 3 ? 'gap-2 md:gap-4 lg:gap-6' : 'gap-0.5 md:gap-1'}`}
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


      </div>
    </div>
  );
}
