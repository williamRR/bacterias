'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GAME_THEME } from '@/game/theme';

export default function CreateRoom() {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [turnTimeLimit, setTurnTimeLimit] = useState<number | null>(null); // null = sin límite

  // Generar o recuperar un ID único para este navegador (persistente)
  const getBrowserId = () => {
    let browserId = localStorage.getItem('browserId');
    if (!browserId) {
      browserId = 'browser_' + Math.random().toString(36).substring(2, 15) + Date.now();
      localStorage.setItem('browserId', browserId);
    }
    return browserId;
  };

  useEffect(() => {
    // Detectar puerto correctamente - usar el puerto actual de la página
    const getSocketUrl = () => {
      // Si está definido en env, usarlo
      if (process.env.NEXT_PUBLIC_SOCKET_SERVER_URL) {
        return process.env.NEXT_PUBLIC_SOCKET_SERVER_URL;
      }

      // Construir desde la ubicación actual, PERO evitar localhost
      const protocol = window.location.protocol;
      let hostname = window.location.hostname;

      // Si es localhost, no usar la detección automática
      // El usuario debe configurar NEXT_PUBLIC_SOCKET_SERVER_URL
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        console.warn('⚠️ Detectado localhost. Para acceso desde LAN, configura NEXT_PUBLIC_SOCKET_SERVER_URL');
      }

      const port = window.location.port || '3012';

      return `${protocol}//${hostname}:${port}`;
    };

    const socketUrl = getSocketUrl();

    const newSocket = io(socketUrl, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    newSocket.on('connect', () => {
      // Socket connected
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err);
      setLoading(false);
      alert(`Error de conexión: ${err.message}\nURL: ${socketUrl}`);
    });

    newSocket.connect();
    setSocket(newSocket);

    newSocket.on('room-created', ({ roomId: createdRoomId }) => {
      setLoading(false);
      setCreatedRoomId(createdRoomId);
    });

    newSocket.on('join-error', ({ error, message }) => {
      setLoading(false);
      alert(message);
      // Si es un error de sala no encontrada, redirigir al home
      if (error === 'room_not_found') {
        window.location.href = '/';
      }
    });

    newSocket.on('error', ({ message }) => {
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
    socket?.emit('create-room', { playerName, browserId: getBrowserId(), turnTimeLimit });
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

  const copyToClipboard = async (text: string, type: 'id' | 'url') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'id') {
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
      } else {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      }
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const getFullUrl = (id: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/room/${id}`;
  };

  return (
    <main className="min-h-screen text-white p-4 md:p-8 relative flex items-center justify-center">
      <div className="stars-bg"></div>
      <div className="nebula-bg"></div>
      <div className="shooting-stars"></div>

      <div className="max-w-lg mx-auto w-full relative z-10 card-entrance">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl md:text-6xl font-black mb-2 neon-glow text-cyan-400 tracking-tighter drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
            {GAME_THEME.title}
          </h1>
          <p className="text-cyan-200 text-lg md:text-xl font-medium opacity-80">{GAME_THEME.subtitle}</p>
        </div>

        {/* Panel principal */}
        <div className="action-panel glass-panel rounded-3xl p-6 md:p-10 border border-cyan-500/30 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>

          {!createdRoomId ? (
            <div className="space-y-8">
              {/* Input de nombre */}
              <div className="group">
                <label className="block mb-3 text-cyan-300 font-bold text-sm tracking-widest uppercase">
                  Identificación del Explorador
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full bg-slate-900/40 px-6 py-4 rounded-2xl border-2 border-cyan-500/20 focus:border-cyan-400/60 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all text-xl font-semibold placeholder:text-slate-600"
                    placeholder="Tu nombre de código..."
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-2xl opacity-50 group-focus-within:opacity-100 transition-opacity">👤</div>
                </div>
              </div>

              {/* Selector de límite de tiempo */}
              <div className="space-y-4">
                <label className="block text-cyan-300 font-bold text-sm tracking-widest uppercase">
                  ⏱️ Límite de Tiempo por Turno
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: null, label: 'Sin Límite', desc: 'Juego relajado' },
                    { value: 30, label: '30s', desc: 'Relax' },
                    { value: 15, label: '15s', desc: 'Normal' },
                    { value: 10, label: '10s', desc: 'Rápido' },
                    { value: 5, label: '5s', desc: 'Blitz' },
                  ].map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => setTurnTimeLimit(option.value)}
                      className={`px-3 py-3 rounded-xl text-center transition-all border-2 ${
                        turnTimeLimit === option.value
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 scale-105'
                          : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:bg-slate-700/40'
                      }`}
                    >
                      <div className="font-black text-lg">{option.label}</div>
                      <div className="text-[10px] opacity-70 uppercase tracking-wider">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Botón para crear sala */}
              <button
                onClick={handleCreateRoom}
                disabled={loading || !playerName.trim()}
                className="w-full btn-space px-8 py-5 rounded-2xl font-black text-xl disabled:opacity-30 disabled:grayscale transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_30px_rgba(34,211,238,0.2)] hover:shadow-[0_0_40px_rgba(34,211,238,0.4)] flex items-center justify-center gap-3 relative overflow-hidden group"
              >
                <span className="relative z-10">{loading ? 'INICIANDO SISTEMAS...' : '🚀 CREAR NUEVO SECTOR'}</span>
                {loading && <div className="absolute inset-0 bg-cyan-400/10 animate-pulse"></div>}
              </button>

              {/* Separador */}
              <div className="flex items-center gap-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-cyan-500/30"></div>
                <span className="text-slate-500 text-xs font-black tracking-[0.2em] whitespace-nowrap">O ÚNETE A UN SECTOR</span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-cyan-500/30"></div>
              </div>

              {/* Input y botón para unirse a sala */}
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    className="w-full bg-slate-900/40 px-6 py-4 rounded-2xl border-2 border-cyan-500/20 focus:border-cyan-400/60 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all text-center font-mono text-3xl tracking-[0.3em] font-bold uppercase placeholder:text-slate-700"
                    placeholder="XXXXXX"
                    maxLength={6}
                  />
                </div>
                <button
                  onClick={handleJoinRoom}
                  disabled={loading || !roomId.trim() || !playerName.trim()}
                  className="w-full bg-slate-800/40 hover:bg-slate-700/60 border border-slate-600/50 px-8 py-4 rounded-2xl font-bold text-lg disabled:opacity-30 transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
                >
                  <span className="opacity-70 font-medium">🔗 Conectar al Sector</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in zoom-in duration-500">
              <div className="text-center">
                <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-cyan-400/50 animate-pulse">
                  <span className="text-4xl">✅</span>
                </div>
                <h2 className="text-3xl font-black text-cyan-400 mb-2">SECTOR PREPARADO</h2>
                <p className="text-slate-400">Comparte estas coordenadas con tu tripulación</p>
              </div>

              <div className="space-y-4">
                {/* Room ID Copy */}
                <div className="bg-slate-900/60 border border-cyan-500/20 rounded-2xl p-4 flex items-center justify-between group hover:border-cyan-400/40 transition-colors">
                  <div>
                    <span className="text-[10px] block text-cyan-500/70 font-black tracking-widest mb-1 uppercase">CÓDIGO DE SECTOR</span>
                    <span className="text-3xl font-mono font-bold tracking-widest">{createdRoomId}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(createdRoomId, 'id')}
                    className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${copiedId ? 'bg-green-500/20 text-green-400' : 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20'}`}
                  >
                    {copiedId ? '¡COPIADO!' : '📋 COPIAR'}
                  </button>
                </div>

                {/* URL Copy */}
                <div className="bg-slate-900/60 border border-cyan-500/20 rounded-2xl p-4 space-y-2 group hover:border-cyan-400/40 transition-colors">
                  <span className="text-[10px] block text-cyan-500/70 font-black tracking-widest uppercase">ENLACE DE ACCESO DIRECTO</span>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-black/40 px-4 py-2 rounded-lg text-xs font-mono text-slate-500 truncate">
                      {getFullUrl(createdRoomId)}
                    </div>
                    <button
                      onClick={() => copyToClipboard(getFullUrl(createdRoomId), 'url')}
                      className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${copiedUrl ? 'bg-green-500/20 text-green-400' : 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20'}`}
                    >
                      {copiedUrl ? '¡COPIADO!' : '📋 COPIAR LINK'}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => window.location.href = `/room/${createdRoomId}`}
                className="w-full btn-space px-8 py-5 rounded-2xl font-black text-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_40px_rgba(34,211,238,0.3)] flex items-center justify-center gap-4"
              >
                🛸 ENTRAR AL SECTOR
              </button>
            </div>
          )}

          {/* Volver al inicio */}
          <div className="mt-10 pt-8 border-t border-slate-800 flex justify-center">
            <a
              href="/"
              className="group flex items-center gap-2 text-slate-500 hover:text-cyan-400 transition-all font-bold text-sm tracking-widest uppercase"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              <span>Abortar y Salir</span>
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .card-entrance {
          animation: card-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes card-in {
          0% { transform: translateY(40px) scale(0.95); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </main>
  );
}
