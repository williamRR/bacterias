'use client';

import { useEffect, useState } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

interface ToasterProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export default function Toaster({ toasts, onRemove }: ToasterProps) {
  return (
    <div className="fixed top-16 md:top-20 left-1/2 transform -translate-x-1/2 z-[100] flex flex-col gap-2 md:gap-3 max-w-sm w-full px-2 md:px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            glass-panel rounded-xl md:rounded-2xl p-2 md:p-3 lg:p-4 shadow-2xl transform transition-all duration-500 card-entrance pointer-events-auto
            ${toast.type === 'success' && 'border-emerald-500/50'}
            ${toast.type === 'error' && 'border-red-500/50'}
            ${toast.type === 'warning' && 'border-amber-500/50'}
            ${toast.type === 'info' && 'border-cyan-500/50'}
          `}
        >
          <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
            <div className={`
              w-6 h-6 md:w-8 md:h-10 rounded-full flex items-center justify-center shrink-0
              ${toast.type === 'success' && 'bg-emerald-500/20 text-emerald-400 rotate-in'}
              ${toast.type === 'error' && 'bg-red-500/20 text-red-400 shake-in'}
              ${toast.type === 'warning' && 'bg-amber-500/20 text-amber-400 pulse-in'}
              ${toast.type === 'info' && 'bg-cyan-500/20 text-cyan-400 float-in'}
            `}>
              <span className="text-sm md:text-lg lg:text-xl">
                {toast.type === 'success' && '✅'}
                {toast.type === 'error' && '🚫'}
                {toast.type === 'warning' && '⚠️'}
                {toast.type === 'info' && '📡'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={`hidden md:block text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-0.5 opacity-60
                ${toast.type === 'success' && 'text-emerald-400'}
                ${toast.type === 'error' && 'text-red-400'}
                ${toast.type === 'warning' && 'text-amber-400'}
                ${toast.type === 'info' && 'text-cyan-400'}
              `}>
                {toast.type === 'info' ? 'Update' : toast.type}
              </h4>
              <p className="text-[10px] md:text-xs lg:text-sm text-white font-bold leading-tight">{toast.message}</p>
            </div>
            <button
              onClick={() => onRemove(toast.id)}
              className="w-5 h-5 md:w-6 md:h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 text-xs md:text-base"
            >
              ✕
            </button>
          </div>
          {/* Barra de progreso sutil */}
          <div className="absolute bottom-0 left-0 h-0.5 bg-current opacity-20 rounded-b-xl md:rounded-b-2xl transition-all duration-[4000ms] w-0 animate-progress-bar"></div>
        </div>
      ))}
    </div>
  );
}

// Hook para usar toasts en componentes
export function useToaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: Toast['type'] = 'info', duration: number = 4000) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const success = (message: string, duration?: number) => addToast(message, 'success', duration);
  const error = (message: string, duration?: number) => addToast(message, 'error', duration);
  const warning = (message: string, duration?: number) => addToast(message, 'warning', duration);
  const info = (message: string, duration?: number) => addToast(message, 'info', duration);

  return { toasts, addToast, removeToast, success, error, warning, info };
}
