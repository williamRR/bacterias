'use client';

import { useState } from 'react';
import { GAME_THEME, UI_LABELS } from '@/game/theme';
import TourButton from '@/components/tour/TourButton';

export default function Home() {
  const [roomCode, setRoomCode] = useState('');

  const handleJoin = () => {
    if (roomCode.trim()) {
      window.location.href = `/room/${roomCode}`;
    }
  };

  return (
    <main className="min-h-screen text-white p-8 relative flex items-center justify-center">
      <div className="stars-bg"></div>

      <div className="max-w-2xl mx-auto text-center relative z-10">
        {/* Logo/Título principal */}
        <div className="mb-12" id="tour-home-title">
          <div className="text-8xl mb-6 animate-bounce"></div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 neon-glow text-cyan-400">
            {GAME_THEME.title}
          </h1>
          <p className="text-xl text-cyan-300">{GAME_THEME.subtitle}</p>
        </div>

        {/* Panel principal de acciones */}
        <div className="action-panel rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold mb-6 text-cyan-300">Iniciar Misión</h2>

          <div className="space-y-4">
            <a
              href="/demo"
              className="block w-full bg-emerald-600/80 hover:bg-emerald-500/90 border border-emerald-500/30 px-8 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
            >
              👁️ Vista Previa del Juego
            </a>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
              <span className="text-gray-400 text-sm">O</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
            </div>

            {/* Botón para crear sala */}
            <a
              href="/create-room"
              className="block w-full btn-space px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105"
              id="tour-create-room"
            >
              🚀 Crear Nuevo Sector
            </a>

            {/* Separador */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
              <span className="text-gray-400 text-sm">O</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
            </div>

            {/* Input y botón para unirse a sala existente */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Código de Sector"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                className="flex-1 bg-slate-800/50 px-4 py-3 rounded-xl border border-cyan-500/30 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-center font-mono text-lg uppercase"
                maxLength={6}
                id="tour-room-input"
              />
              <button
                onClick={handleJoin}
                disabled={!roomCode.trim()}
                className="btn-space px-8 py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 whitespace-nowrap"
                id="tour-join-button"
              >
                Unirse al Sector
              </button>
            </div>
          </div>
        </div>

        {/* Instrucciones rápidas */}
        <div
          className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20"
          id="tour-game-instructions"
        >
          <h3 className="text-lg font-bold mb-3 text-cyan-300">Cómo Jugar</h3>
          <div className="text-left text-sm text-gray-300 space-y-2">
            <p>🎯 <strong>Objetivo:</strong> Completa los 4 Sistemas Críticos de tu nave</p>
            <p>⚙️ <strong>Sistemas:</strong> Motor, Oxígeno, Navegación y Escudos</p>
            <p>🛡️ <strong>Defensa:</strong> Usa Reparaciones para proteger tus sistemas</p>
            <p>⚠️ <strong>Ataque:</strong> Lanza Sabotajes contra los sistemas enemigos</p>
            <p>✨ <strong>Victoria:</strong> El primero en completar todos sus sistemas gana</p>
          </div>
        </div>
      </div>

      {/* Tour Button */}
      <TourButton tourType="home" />
    </main>
  );
}
