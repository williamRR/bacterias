import React, { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: string;
}

export default function Modal({ isOpen, onClose, children, title }: ModalProps) {
    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md glass-panel border-cyan-500/50 rounded-3xl p-6 shadow-[0_0_50px_rgba(34,211,238,0.15)] scanner-effect animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6 border-b border-cyan-500/20 pb-4">
                    <h3 className="text-lg font-black text-cyan-400 flex items-center gap-3 uppercase tracking-[0.2em]">
                        <span className="animate-pulse">●</span> {title || 'Información'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all transform hover:rotate-90"
                    >
                        ✕
                    </button>
                </div>

                <div className="text-gray-200">
                    {children}
                </div>

                <div className="mt-6 pt-4 border-t border-cyan-500/10 text-[9px] text-cyan-500/40 font-mono flex justify-between uppercase">
                    <span>Enlace Seguro Establecido</span>
                    <span className="animate-pulse">Escanenado...</span>
                </div>
            </div>
        </div>,
        document.body
    );
}
