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
  onDiscardHand?: () => void;
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
  onDiscardHand,
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
      <div className="max-w-5xl mx-auto bg-slate-900/80 backdrop-blur-md rounded-t-xl md:rounded-xl md:rounded-2xl p-1 md:p-3 lg:p-4 shadow-2xl pointer-events-auto border-t border-white/5 md:border-white/10">
        {/* Waiting message - reduced height */}
        <div className="h-[18px] md:h-[32px] flex items-center justify-center mb-0.5 md:mb-2">
          {disabled && (
            <div className="flex items-center gap-1.5 px-2 md:px-6 py-0.5 md:py-2 bg-slate-800/50 rounded-full border border-white/5 animate-pulse-slow">
              <span className="text-cyan-400 text-[9px] md:text-xs font-black uppercase tracking-[0.15em]">
                ⏳ {UI_LABELS.waiting}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4 lg:gap-6">
          {/* Action Button Panel */}
          <div className="flex items-center justify-between md:justify-center gap-2 p-1.5 md:p-2 bg-slate-800/40 backdrop-blur-md rounded-xl md:rounded-3xl border border-white/10 shadow-inner order-last md:order-first">
            {/* End Turn Button */}
            <button
              id="tour-end-turn"
              onClick={onEndTurn}
              disabled={!isCurrentPlayer || !onEndTurn}
              className={`group relative flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-2.5 flex-1 md:flex-none md:w-[72px] md:h-[72px] lg:w-[80px] lg:h-[80px] md:flex-col rounded-lg md:rounded-2xl font-black text-[10px] md:text-[11px] transition-all uppercase tracking-wider border disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 ${!isCurrentPlayer || !onEndTurn
                  ? 'bg-slate-700/30 border-slate-600/30 text-gray-400'
                  : 'bg-gradient-to-br from-cyan-600/90 to-cyan-800/90 hover:from-cyan-500 hover:to-cyan-700 text-white shadow-lg shadow-cyan-900/40 border-cyan-400/30 animate-pulse-subtle'
                }`}
            >
              <div className="relative flex items-center justify-center">
                <div
                  className="w-4 h-4 md:w-6 md:h-6 transition-transform group-hover:scale-110"
                  style={{
                    backgroundColor: 'currentColor',
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
              </div>
              <span className="hidden md:block text-[9px] md:text-[10px] md:mt-1 leading-tight">{UI_LABELS.endTurn}</span>
              <span className="md:hidden text-[9px]">{UI_LABELS.endTurn}</span>

              {isCurrentPlayer && actionsThisTurn > 0 && onEndTurn && (
                <div className="absolute -top-1.5 -right-1.5 flex items-center justify-center">
                  <span className="relative flex h-4 w-4 md:h-5 md:w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 md:h-5 md:w-5 bg-emerald-500 items-center justify-center text-[8px] md:text-[10px] text-slate-950 font-black border border-white/20">
                      +{actionsThisTurn}
                    </span>
                  </span>
                </div>
              )}
            </button>

            {/* Discard Hand Button */}
            <button
              onClick={onDiscardHand}
              disabled={!isCurrentPlayer || !onDiscardHand || cards.length === 0}
              className={`group relative flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-2.5 flex-1 md:flex-none md:w-[72px] md:h-[72px] lg:w-[80px] lg:h-[80px] md:flex-col rounded-lg md:rounded-2xl font-black text-[10px] md:text-[11px] transition-all uppercase tracking-wider border disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 ${!isCurrentPlayer || !onDiscardHand || cards.length === 0
                  ? 'bg-slate-700/30 border-slate-600/30 text-gray-400'
                  : 'bg-gradient-to-br from-red-600/80 to-red-800/80 hover:from-red-500 hover:to-red-700 text-white shadow-lg shadow-red-900/40 border-red-400/30'
                }`}
            >
              <span className="text-sm md:text-xl transition-transform group-hover:scale-110">🗑️</span>
              <span className="hidden md:block text-[9px] md:text-[10px] md:mt-1 leading-tight">Descartar</span>
              <span className="md:hidden text-[9px]">Descartar</span>

              {isCurrentPlayer && cards.length > 0 && onDiscardHand && (
                <span className="absolute -top-1.5 -right-1.5 bg-white text-red-600 px-1 md:px-1.5 py-0.5 rounded-full text-[8px] md:text-[10px] font-black border border-red-500 shadow-sm min-w-[16px] md:min-w-[20px] text-center">
                  {cards.length}
                </span>
              )}
            </button>
          </div>

          {/* Cards area - reduced min-heights */}
          <div id="tour-card-actions" className="flex-1 flex justify-center items-end pb-0.5 md:pb-4 min-h-[4rem] md:min-h-[8rem] lg:min-h-[10rem] px-1 md:px-4 w-full">
            {cards.length === 0 ? (
              <div className="text-gray-500 font-bold text-[9px] md:text-xs py-4 md:py-6 uppercase tracking-widest italic opacity-40">
                Sistemas en recarga...
              </div>
            ) : (
              <div
                className={`flex justify-center items-end flex-nowrap w-full ${cards.length <= 3 ? 'gap-1.5 md:gap-4 lg:gap-6' : 'gap-0.5 md:gap-1'}`}
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
        </div>
      </div>
    </div>
  );
}
