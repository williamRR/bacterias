import { Socket } from 'socket.io-client';
import { GameState, Player } from '@/game/types';
import { VICTORY_MESSAGES, GAME_THEME, UI_LABELS } from '@/game/theme';
import GameBoard from './GameBoard';

interface GameOverScreenProps {
  gameState: GameState;
  currentPlayerId: string | null;
  socket: Socket | null;
  roomId: string;
}

export default function GameOverScreen({
  gameState,
  currentPlayerId,
  socket,
  roomId,
}: GameOverScreenProps) {
  const winner = gameState.winner;
  if (!winner) return null;

  const isWinner = winner.id === currentPlayerId;

  // Calcular sistemas funcionales del ganador
  const winnerBody = winner.body;
  const winnerSlots = winnerBody instanceof Map
    ? Array.from(winnerBody.values())
    : Object.values(winnerBody || {});
  const winnerSystemsCount = winnerSlots.filter((slot: any) => slot?.organCard).length;

  return (
    <main className="min-h-screen text-white pb-52 relative">
      <div className="stars-bg"></div>

      {/* Panel superior con resultado - posicionado para no bloquear la vista del tablero */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4">
        <div className={`max-w-4xl mx-auto rounded-2xl p-6 md:p-8 backdrop-blur-xl border-2 shadow-2xl ${
          isWinner
            ? 'bg-gradient-to-br from-cyan-900/80 to-cyan-950/80 border-cyan-500/50'
            : 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-600/50'
        }`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Icono y mensaje de resultado */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className={`text-5xl md:text-6xl ${isWinner ? 'animate-bounce' : ''}`}>
                {isWinner ? '🎉' : '🏆'}
              </div>
              <div className="text-center md:text-left">
                <h1 className={`text-2xl md:text-4xl font-black uppercase tracking-tight ${
                  isWinner ? 'neon-glow text-cyan-300' : 'text-gray-300'
                }`}>
                  {isWinner ? VICTORY_MESSAGES.win : VICTORY_MESSAGES.lose}
                </h1>
                <p className="text-sm md:text-base text-gray-300 mt-1">
                  Ganador: <span className="text-cyan-300 font-bold">{winner.name}</span>
                </p>
              </div>
            </div>

            {/* Stats del ganador */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-black text-cyan-300">{winnerSystemsCount}</div>
                <div className="text-[10px] md:text-xs uppercase tracking-wider text-gray-400">Sistemas</div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  socket?.emit('restart-game', { roomId });
                }}
                className="btn-space px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wide hover:scale-105 transition-all shadow-lg"
              >
                🔄 Jugar de Nuevo
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="bg-slate-700/50 hover:bg-slate-600/50 border border-slate-500/50 px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-all"
              >
                🚀 Salir
              </button>
            </div>
          </div>

          <p className="text-center text-[10px] md:text-xs text-gray-400 mt-4 uppercase tracking-widest">
            Revisa el estado final de todos los sistemas abajo
          </p>
        </div>
      </div>

      {/* CONTENIDO DEL TABLERO - Más visible y sin pointer-events-none */}
      <div className="container mx-auto p-4 pt-48 relative z-10">
        {/* Header con información de sala */}
        <div className="action-panel rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold neon-glow text-cyan-400">{GAME_THEME.title}</h1>
              <div className="text-sm text-gray-400">{UI_LABELS.room}: {roomId}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Juego Finalizado</div>
            </div>
          </div>
        </div>

        {/* Tableros de otros jugadores */}
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          {gameState.players
            .filter((p) => p.id !== currentPlayerId)
            .map((player) => (
              <GameBoard
                key={player.id}
                player={player}
                isCurrentPlayer={false}
                onOrganClick={() => { }}
                onDrop={() => { }}
                onDragOver={() => { }}
                selectedColor={null}
                isDropTarget={false}
                targetColor={null}
                validTargets={new Set()}
                isSlotValid={() => false}
                selectedCard={null}
              />
            ))}
        </div>

        {/* Tablero del jugador actual */}
        <div className="mb-6 flex justify-center">
          {gameState.players.find((p) => p.id === currentPlayerId) && (
            <GameBoard
              player={gameState.players.find((p) => p.id === currentPlayerId)!}
              isCurrentPlayer={false}
              onOrganClick={() => { }}
              onDrop={() => { }}
              onDragOver={() => { }}
              selectedColor={null}
              isDropTarget={false}
              targetColor={null}
              validTargets={new Set()}
              isSlotValid={() => false}
              selectedCard={null}
            />
          )}
        </div>
      </div>
    </main>
  );
}
