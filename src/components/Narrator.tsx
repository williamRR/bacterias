'use client';

import { useEffect, useState } from 'react';

interface NarratorProps {
  message: string;
  duration?: number;
  onComplete?: () => void;
}

export default function Narrator({ message, duration = 2000, onComplete }: NarratorProps) {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    setVisible(true);
    setFadingOut(false);

    const fadeOutTimer = setTimeout(() => {
      setFadingOut(true);
    }, duration - 500);

    const completeTimer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, duration);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [message, duration, onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      {/* Mensaje flotante en posición superior - no bloquea interacciones */}
      <div className={`fixed top-6 md:top-8 left-1/2 -translate-x-1/2 transition-all duration-500 ${fadingOut ? 'opacity-0 translate-y-[-20px]' : 'opacity-100 translate-y-0'}`}>
        <div className="relative px-3 md:px-6 py-1.5 md:py-3 glass-panel border border-cyan-400/30 rounded-lg md:rounded-xl shadow-[0_0_30px_rgba(34,211,238,0.15)] bg-slate-950/60 backdrop-blur-sm">
          {/* Indicador brillante izquierdo */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 md:w-1 h-5 md:h-8 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-r-full animate-pulse" />

          <div className="flex items-center gap-2 md:gap-4">
            <div className="text-[8px] md:text-[9px] font-black text-cyan-400 uppercase tracking-[0.15em] md:tracking-[0.2em]">
              {message}
            </div>
          </div>

          {/* Línea decorativa inferior */}
          <div className="absolute bottom-0 left-0 right-0 h-[0.5px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        </div>
      </div>
    </div>
  );
}
