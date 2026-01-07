import React, { useState } from 'react';

interface RoomHeaderProps {
  title: string;
  roomId: string;
  currentPlayerName?: string | null;
  isCurrentPlayer: boolean;
  actionsThisTurn: number;
  uiLabels: any;
  turnTimeRemaining?: number | null;
  turnTimeLimit?: number | null;
}

export default function RoomHeader({
  title,
  roomId,
  currentPlayerName,
  isCurrentPlayer,
  actionsThisTurn,
  uiLabels,
  turnTimeRemaining,
  turnTimeLimit,
}: RoomHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  return (
    <div className="action-panel rounded-lg p-1.5 md:p-3 mb-2 md:mb-4 shrink-0 overflow-hidden relative">
      <div className="flex flex-col md:flex-row justify-between items-start gap-2 md:gap-3">
        <div className="flex items-center gap-1.5 md:gap-3 w-full md:w-auto min-w-0">
          <div className="min-w-0 flex-1 md:flex-none">
            <h1 className="font-bold neon-glow text-cyan-400 truncate" style={{ fontSize: 'clamp(0.875rem, 3vw, 1.25rem)' }}>
              {title}
            </h1>
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="text-[10px] md:text-xs text-gray-400 uppercase tracking-widest truncate">{uiLabels.room}: {roomId}</div>
              <button
                onClick={handleCopy}
                className={`text-[8px] md:text-[10px] px-1.5 py-0.5 rounded transition-all border whitespace-nowrap ${copied ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20'}`}
              >
                {copied ? '¡COPIADO!' : '📋 COPIAR'}
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5 md:gap-1 w-full md:w-auto shrink-0">
          <div className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full font-bold text-[10px] md:text-xs whitespace-nowrap ${isCurrentPlayer ? 'bg-cyan-500/20 text-cyan-300 animate-pulse border border-cyan-500/30' : 'bg-gray-700/50 text-gray-300 border border-gray-600/30'}`}>
            {isCurrentPlayer ? `${uiLabels.yourTurn}` : `${uiLabels.turnOf}: ${currentPlayerName}`}
          </div>
          {isCurrentPlayer && (
            <>
              <div className="text-[10px] md:text-xs text-gray-400 whitespace-nowrap">
                Acciones: {actionsThisTurn}/1
              </div>
              {turnTimeLimit !== null && turnTimeLimit !== undefined && turnTimeRemaining !== null && turnTimeRemaining !== undefined && (
                <div className={`text-[10px] md:text-xs font-bold whitespace-nowrap ${turnTimeRemaining <= 5 ? 'text-red-400 animate-pulse' : turnTimeRemaining <= 10 ? 'text-yellow-400' : 'text-green-400'}`}>
                  ⏱️ {turnTimeRemaining}s
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
