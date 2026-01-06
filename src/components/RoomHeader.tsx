import React from 'react';

interface RoomHeaderProps {
  title: string;
  roomId: string;
  currentPlayerName?: string | null;
  isCurrentPlayer: boolean;
  actionsThisTurn: number;
  uiLabels: any;
}

export default function RoomHeader({
  title,
  roomId,
  currentPlayerName,
  isCurrentPlayer,
  actionsThisTurn,
  uiLabels,
}: RoomHeaderProps) {
  return (
    <div className="action-panel rounded-xl p-2 md:p-4 mb-4 md:mb-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-2 md:gap-4">
        <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
          <div className="flex-1 md:flex-none">
            <h1 className="text-lg md:text-2xl font-bold neon-glow text-cyan-400">{title}</h1>
            <div className="text-xs md:text-sm text-gray-400">{uiLabels.room}: {roomId}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 md:gap-2 w-full md:w-auto">
          <div className={`px-3 md:px-4 py-1 md:py-2 rounded-full font-bold text-xs md:text-sm ${isCurrentPlayer ? 'bg-cyan-500/20 text-cyan-300 animate-pulse' : 'bg-gray-700 text-gray-300'}`}>
            {isCurrentPlayer ? `${uiLabels.yourTurn}` : `${uiLabels.turnOf}: ${currentPlayerName}`}
          </div>
          {isCurrentPlayer && (
            <div className="text-xs text-gray-400">
              Acciones: {actionsThisTurn}/1
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
