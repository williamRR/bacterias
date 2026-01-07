'use client';

import { useEffect, useState, useRef } from 'react';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface NarratorProps {
  message: string | null;
  type?: NotificationType;
  duration?: number;
  onComplete?: () => void;
}

export default function Narrator({ message, type = 'info', duration = 3000, onComplete }: NarratorProps) {
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const [fadingOut, setFadingOut] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (message) {
      // Reset animations if a new message arrives while one is active
      setFadingOut(false);
      setCurrentMessage(message);

      if (timerRef.current) clearTimeout(timerRef.current);
      if (fadeRef.current) clearTimeout(fadeRef.current);

      fadeRef.current = setTimeout(() => {
        setFadingOut(true);
      }, duration - 500);

      timerRef.current = setTimeout(() => {
        setCurrentMessage(null);
        onComplete?.();
      }, duration);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (fadeRef.current) clearTimeout(fadeRef.current);
    };
  }, [message, duration, onComplete]);

  if (!currentMessage) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success': return 'border-emerald-500/30 text-emerald-400 from-emerald-400 to-emerald-600';
      case 'error': return 'border-red-500/30 text-red-400 from-red-400 to-red-600';
      case 'warning': return 'border-amber-500/30 text-amber-400 from-amber-400 to-amber-600';
      default: return 'border-cyan-400/30 text-cyan-400 from-cyan-400 to-cyan-600';
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed top-20 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4">
      <div className={`
        relative px-4 md:px-8 py-2 md:py-3 glass-panel border rounded-xl shadow-2xl transition-all duration-300
        ${fadingOut ? 'opacity-0 scale-95 -translate-y-4' : 'opacity-100 scale-100 translate-y-0'}
        ${styles.split(' ').slice(0, 1).join(' ')}
      `}>
        {/* Indicador brillante lateral */}
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 bg-gradient-to-b rounded-r-full animate-pulse ${styles.split(' ').slice(2).join(' ')}`} />

        <div className="flex items-center gap-3">
          <p className={`text-xs md:text-sm font-black uppercase tracking-wider text-center ${styles.split(' ').slice(1, 2).join(' ')}`}>
            {currentMessage}
          </p>
        </div>

        {/* Línea decorativa inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
    </div>
  );
}
