'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GAME_THEME } from '@/game/theme';

export default function CreateRoom() {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || undefined;
    const newSocket = io(socketUrl, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
    newSocket.connect();
    setSocket(newSocket);

    newSocket.on('room-created', ({ roomId: createdRoomId }) => {
      console.log('Room created:', createdRoomId);
      setLoading(false);
      const savedName = localStorage.getItem('playerName');
      if (savedName) {
        window.location.href = `/room/${createdRoomId}`;
      }
    });

    newSocket.on('error', ({ message }) => {
      console.log('Error:', message);
      setLoading(false);
      alert(message);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      alert('Por favor ingresa tu nombre, explorador');
      return;
    }

    setLoading(true);
    localStorage.setItem('playerName', playerName);
    socket?.emit('create-room', { playerName });
  };

  const handleJoinRoom = () => {
    if (!roomId.trim() || !playerName.trim()) {
      alert('Por favor ingresa tu nombre y el código de sector');
      return;
    }
    localStorage.setItem('playerName', playerName);
    setLoading(true);
    socket?.disconnect();
    window.location.href = `/room/${roomId}`;
  };

  return (
    <main className="min-h-screen text-white p-8 relative flex items-center justify-center">
      <div className="stars-bg"></div>

      <div className="max-w-md mx-auto w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4"></div>
          <h1 className="text-4xl font-bold mb-2 neon-glow text-cyan-400">
            {GAME_THEME.title}
          </h1>
          <p className="text-cyan-300">{GAME_THEME.subtitle}</p>
        </div>

        {/* Panel principal */}
        <div className="action-panel rounded-2xl p-8">
          <div className="space-y-6">
            {/* Input de nombre */}
            <div>
              <label className="block mb-2 text-cyan-300 font-bold">
                Identificación del Explorador
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full bg-slate-800/50 px-4 py-3 rounded-xl border border-cyan-500/30 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                placeholder="Ingresa tu nombre de código"
              />
            </div>

            {/* Botón para crear sala */}
            <button
              onClick={handleCreateRoom}
              disabled={loading || !playerName.trim()}
              className="w-full btn-space px-6 py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
            >
              {loading ? 'Iniciando sistemas...' : '🚀 Crear Nuevo Sector'}
            </button>

            {/* Separador */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
              <span className="text-gray-400 text-sm">O UNIRSE A SECTOR EXISTENTE</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
            </div>

            {/* Input y botón para unirse a sala */}
            <div>
              <label className="block mb-2 text-cyan-300 font-bold">Código de Sector</label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="w-full bg-slate-800/50 px-4 py-3 rounded-xl border border-cyan-500/30 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-center font-mono text-lg uppercase mb-3"
                placeholder="XXXXXX"
                maxLength={6}
              />
              <button
                onClick={handleJoinRoom}
                disabled={loading || !roomId.trim() || !playerName.trim()}
                className="w-full btn-space px-6 py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
              >
                {loading ? 'Estableciendo conexión...' : '🔗 Conectar al Sector'}
              </button>
            </div>
          </div>

          {/* Volver al inicio */}
          <div className="mt-6 pt-6 border-t border-cyan-500/20">
            <a
              href="/"
              className="block text-center text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              ← Volver al Menú Principal
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
