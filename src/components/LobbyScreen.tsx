import { Player } from '@/game/types';
import { GAME_THEME, UI_LABELS } from '@/game/theme';

interface LobbyScreenProps {
  roomId: string;
  players: Player[];
  playerName: string;
  onStartGame: () => void;
  onCopyId: () => void;
  onCopyUrl: () => void;
  copiedId: boolean;
  copiedUrl: boolean;
}

export default function LobbyScreen({
  roomId,
  players,
  playerName,
  onStartGame,
  onCopyId,
  onCopyUrl,
  copiedId,
  copiedUrl,
}: LobbyScreenProps) {
  return (
    <main className="min-h-screen text-white p-8 relative">
      <div className="stars-bg"></div>
      <div className="max-w-md mx-auto relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 neon-glow">{GAME_THEME.title}</h1>
          <p className="text-cyan-300">{GAME_THEME.subtitle}</p>

          <div className="mt-8 space-y-3">
            <div className="inline-flex items-center gap-2 bg-slate-900/60 border border-cyan-500/20 px-4 py-2 rounded-xl">
              <span className="text-[10px] text-cyan-500/70 font-black tracking-widest uppercase">{UI_LABELS.room}:</span>
              <span className="font-mono font-bold text-lg tracking-widest">{roomId}</span>
              <button
                onClick={onCopyId}
                className={`ml-2 px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  copiedId ? 'bg-green-500/20 text-green-400' : 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20'
                }`}
              >
                {copiedId ? '¡COPIADO!' : '📋 COPIAR'}
              </button>
            </div>

            <div className="flex justify-center">
              <button
                onClick={onCopyUrl}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  copiedUrl
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:border-cyan-500/30 hover:text-cyan-300'
                }`}
              >
                {copiedUrl ? '¡ENLACE COPIADO!' : '🔗 COPIAR ENLACE DE INVITACIÓN'}
              </button>
            </div>
          </div>
        </div>

        <div className="action-panel rounded-xl p-6 mb-6">
          <h2 className="text-xl mb-4 text-cyan-300 font-bold">{UI_LABELS.players}</h2>
          <ul className="space-y-3">
            {players.map((player) => (
              <li key={player.id} className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg">
                <span className="text-2xl"></span>
                <span className="font-bold">{player.name}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-center text-gray-400 mb-6">
          <div className="animate-pulse">{UI_LABELS.waitingPlayers}</div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onStartGame}
            disabled={players.length < 2}
            className="w-full btn-space px-6 py-4 rounded-xl font-bold text-lg disabled:opacity-50"
          >
            {players.length < 2 ? UI_LABELS.needPlayers : UI_LABELS.startMission}
          </button>

          <button
            onClick={() => (window.location.href = '/')}
            className="w-full bg-red-900/50 hover:bg-red-800/50 border border-red-500/50 px-6 py-3 rounded-xl transition-all"
          >
            {UI_LABELS.exit}
          </button>
        </div>
      </div>
    </main>
  );
}
