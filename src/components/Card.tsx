import { useState, useCallback, useMemo, useRef } from 'react';
import Modal from './Modal';
import type { Card } from '../game/types';
import { CardType as CardTypeEnum } from '../game/types';
import { SPACE_ICONS, CARD_TYPE_LABELS, TREATMENT_LABELS, TREATMENT_DESCRIPTIONS, SYSTEM_ICONS, COLOR_SYSTEM_LABELS } from '../game/theme';

interface CardProps {
  card: Card;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent, card: Card) => void;
  onDragEnd?: () => void;
  onDiscard?: () => void;
  selected?: boolean;
  draggable?: boolean;
}

export default function Card({ card, onClick, onDragStart, onDragEnd, onDiscard, selected, draggable = false }: CardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Memoizar valores calculados para evitar parpadeo
  const cardData = useMemo(() => {
    // Obtener el emoji del sistema para cartas ORGAN
    const getSystemIcon = () => {
      if (!card.color) return '🎴'; // Default icon for cards without color

      const color = String(card.color).toUpperCase();
      switch (color) {
        case 'RED':
        case '0':
          return '🔧';
        case 'BLUE':
        case '1':
          return '💨';
        case 'GREEN':
        case '2':
          return '🧭';
        case 'YELLOW':
        case '3':
          return '🛡️';
        case 'MULTICOLOR':
        case '4':
          return '🖥️';
        default:
          return '🎴';
      }
    };

    // Mapeo directo de colores a labels
    const colorToLabel: Record<string, string> = {
      'RED': 'MOTOR',
      '0': 'MOTOR',
      'BLUE': 'OXÍGENO',
      '1': 'OXÍGENO',
      'GREEN': 'NAVEGACIÓN',
      '2': 'NAVEGACIÓN',
      'YELLOW': 'ESCUDOS',
      '3': 'ESCUDOS',
      'MULTICOLOR': 'SISTEMA OPERATIVO',
      '4': 'SISTEMA OPERATIVO',
    };

    const colorKey = card.color ? String(card.color).toUpperCase() : '';
    const systemLabel = colorKey ? (colorToLabel[colorKey] || COLOR_SYSTEM_LABELS[card.color as keyof typeof COLOR_SYSTEM_LABELS] || 'SISTEMA') : null;

    // Icono principal según el tipo
    const getMainIcon = () => {
      switch (card.type as CardTypeEnum) {
        case 'ORGAN':
          return getSystemIcon();
        case 'VIRUS':
          return '☣️';
        case 'MEDICINE':
          // Use the same icon as the system being repaired
          return '🔧';
        case 'TREATMENT':
          return '⚡';
        default:
          return '🎴';
      }
    };

    // Subtítulo adicional
    const getSubtitle = () => {
      if (!systemLabel) return null;

      if (card.type === 'ORGAN' as CardTypeEnum) {
        return systemLabel;
      }
      if (card.type === 'VIRUS' as CardTypeEnum) {
        return `Avería ${systemLabel}`;
      }
      if (card.type === 'MEDICINE' as CardTypeEnum) {
        return `Mejora ${systemLabel}`;
      }
      return null;
    };

    // Descripción para el tooltip
    const getCardDescription = () => {
      switch (card.type as CardTypeEnum) {
        case 'ORGAN':
          return 'Instala este sistema en tu nave. Necesitas 4 sistemas diferentes para ganar.';
        case 'VIRUS':
          return systemLabel ? `Avería el sistema ${systemLabel} de un oponente. Dos sabotajes destruyen el sistema.` : 'Avería un sistema de un oponente.';
        case 'MEDICINE':
          return systemLabel ? `Repara o protege tu sistema ${systemLabel}. Dos protecciones lo blindan permanentemente.` : 'Repara o protege uno de tus sistemas.';
        case 'TREATMENT':
          return card.treatmentType ? TREATMENT_DESCRIPTIONS[card.treatmentType] : 'Efecto especial de misión.';
        default:
          return 'Carta de misión espacial.';
      }
    };

    // Color de brillo según el tipo
    const getGlowColor = () => {
      const glowColors: Record<string, string> = {
        'RED': '249, 115, 22',      // MOTOR (Orange)
        '0': '249, 115, 22',
        'BLUE': '6, 182, 212',     // OXÍGENO (Cyan)
        '1': '6, 182, 212',
        'GREEN': '16, 185, 129',    // NAVEGACIÓN (Emerald)
        '2': '16, 185, 129',
        'YELLOW': '234, 179, 8',   // ESCUDOS (Yellow)
        '3': '234, 179, 8',
        'MULTICOLOR': '139, 92, 246', // SISTEMA OPERATIVO (Violet)
        '4': '139, 92, 246',
      };

      if (card.color) {
        const color = String(card.color).toUpperCase();
        if (glowColors[color]) return glowColors[color];
      }

      switch (card.type as CardTypeEnum) {
        case 'VIRUS':
          return '239, 68, 68'; // Sabotaje (Red)
        case 'MEDICINE':
          return '16, 185, 129'; // Reparación -> Navigation (Green) by default
        case 'TREATMENT':
          return '139, 92, 246'; // Acción -> OS (Purple) by default
        default:
          return '255, 255, 255';
      }
    };

    // Badge de tipo
    const getTypeBadgeLabel = () => {
      switch (card.type as CardTypeEnum) {
        case 'ORGAN':
          return 'SISTEMA';
        case 'VIRUS':
          return 'SABOTAJE';
        case 'MEDICINE':
          return 'REPARACIÓN';
        case 'TREATMENT':
          return 'ACCIÓN';
        default:
          return 'CARTA';
      }
    };

    const mainIcon = getMainIcon();
    const subtitle = getSubtitle();
    // TREATMENT_LABELS ahora usa string keys directamente para evitar problemas de optimización en Vercel
    const treatmentLabel = card.treatmentType ? TREATMENT_LABELS[card.treatmentType] || null : null;
    const glowColor = getGlowColor();
    const typeBadgeLabel = getTypeBadgeLabel();
    const cardDescription = getCardDescription();

    return {
      mainIcon,
      subtitle,
      treatmentLabel,
      glowColor,
      typeBadgeLabel,
      cardDescription,
      systemLabel,
    };
  }, [card]);

  const handleOpenModal = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e, card);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('cardId', card.id);
    }
  };

  const handleDragEnd = () => {
    if (onDragEnd) {
      onDragEnd();
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <>
      <div
        ref={cardRef}
        onClick={onClick}
        draggable={draggable}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
        relative w-[5.5rem] h-[7.8rem] rounded-xl flex flex-col justify-between
        text-white select-none transition-all duration-300
        ${selected ? 'ring-2 ring-cyan-400 scale-105' : ''}
        ${draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
        ${isHovered ? 'scale-[1.03] shadow-xl' : 'shadow-md'}
        ${card.color === 'MULTICOLOR' && card.type !== 'TREATMENT' ? 'multicolor-card' : ''}
        ${card.type === 'TREATMENT' ? 'action-card' : ''}
      `}
        style={card.color === 'MULTICOLOR' && card.type !== 'TREATMENT' ? {} : {
          background: `linear-gradient(145deg, #111827 0%, #1f2937 100%)`,
          border: `2px solid rgba(${cardData.glowColor}, 0.8)`,
          boxShadow: isHovered ? `0 0 25px rgba(${cardData.glowColor}, 0.5)` : `0 0 10px rgba(${cardData.glowColor}, 0.25)`,
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-2 pt-2 gap-1">
          <span className="text-[7px] font-bold uppercase tracking-widest text-white/60 truncate max-w-[3rem]">
            {/* {cardData.typeBadgeLabel} */}
          </span>
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={handleOpenModal}
              className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 text-xs flex items-center justify-center transition-colors flex-shrink-0 pointer-events-auto"
              style={{ color: `rgb(${cardData.glowColor})` }}
              title="Ver detalles"
              type="button"
            >
              ?
            </button>
            {onDiscard && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  onDiscard();
                }}
                className="w-5 h-5 rounded-full bg-red-900/50 hover:bg-red-800/70 text-red-400 text-xs flex items-center justify-center transition-colors flex-shrink-0 pointer-events-auto"
                title="Descartar"
                type="button"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Icono central */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-5xl drop-shadow-lg">{cardData.mainIcon}</div>
        </div>

        {/* Footer */}
        <div className="text-center pb-2 px-2">
          {cardData.subtitle && (
            <div className="text-[10px] md:text-[8px] text-white/70 uppercase tracking-wide leading-tight">
              {cardData.subtitle}
            </div>
          )}
          {cardData.treatmentLabel && (
            <div
              className="text-[9px] md:text-[7px] mt-0.5 font-bold leading-tight"
              style={{ color: `rgb(${cardData.glowColor})` }}
            >
              {cardData.treatmentLabel}
            </div>
          )}
        </div>
      </div>

      {/* Card Detail Modal - Rendered outside the card div */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Especificaciones de la Carta"
      >
        <div className="flex flex-col items-center gap-6 py-4">
          {/* Visual Preview */}
          <div
            className="w-32 h-44 rounded-2xl flex flex-col justify-between p-4 shadow-2xl relative overflow-hidden"
            style={{
              background: `linear-gradient(145deg, #111827 0%, #1f2937 100%)`,
              border: `2.5px solid rgba(${cardData.glowColor}, 0.9)`,
              boxShadow: `0 0 40px rgba(${cardData.glowColor}, 0.4)`,
            }}
          >
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/60">
              {cardData.typeBadgeLabel}
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-7xl drop-shadow-2xl">{cardData.mainIcon}</div>
            </div>
            <div className="text-center">
              {cardData.subtitle && (
                <div className="text-[12px] text-white/70 uppercase tracking-widest font-bold">
                  {cardData.subtitle}
                </div>
              )}
              {cardData.treatmentLabel && (
                <div
                  className="text-[10px] mt-1 font-mono uppercase font-bold"
                  style={{ color: `rgb(${cardData.glowColor})` }}
                >
                  {cardData.treatmentLabel}
                </div>
              )}
            </div>
          </div>

          {/* Info Details */}
          <div className="w-full space-y-4">
            <div className="space-y-1">
              <div
                className="text-[10px] font-mono uppercase tracking-[0.2em]"
                style={{ color: `rgba(${cardData.glowColor}, 0.6)` }}
              >
                Clasificación
              </div>
              <div className="text-lg font-bold text-white uppercase tracking-wider">{cardData.typeBadgeLabel}</div>
            </div>

            {cardData.subtitle && (
              <div className="space-y-1">
                <div
                  className="text-[10px] font-mono uppercase tracking-[0.2em]"
                  style={{ color: `rgba(${cardData.glowColor}, 0.6)` }}
                >
                  Sistema Objetivo
                </div>
                <div
                  className="text-lg font-bold uppercase tracking-wider"
                  style={{ color: `rgb(${cardData.glowColor})` }}
                >
                  {cardData.subtitle}
                </div>
              </div>
            )}

            {cardData.treatmentLabel && (
              <div className="space-y-1">
                <div
                  className="text-[10px] font-mono uppercase tracking-[0.2em]"
                  style={{ color: `rgba(${cardData.glowColor}, 0.6)` }}
                >
                  Efecto Especial
                </div>
                <div
                  className="text-lg font-bold uppercase tracking-wider"
                  style={{ color: `rgb(${cardData.glowColor})` }}
                >
                  {cardData.treatmentLabel}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div
                className="text-[10px] font-mono uppercase tracking-[0.2em]"
                style={{ color: `rgba(${cardData.glowColor}, 0.6)` }}
              >
                Descripción de la Misión
              </div>
              <div
                className="bg-slate-900/50 rounded-xl p-4 text-sm text-gray-300 leading-relaxed italic"
                style={{ border: `1px solid rgba(${cardData.glowColor}, 0.2)` }}
              >
                &ldquo;{cardData.cardDescription}&rdquo;
              </div>
            </div>
          </div>

          <button
            onClick={handleCloseModal}
            className="w-full py-3 rounded-xl font-bold uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: `rgba(${cardData.glowColor}, 0.1)`,
              border: `1px solid rgba(${cardData.glowColor}, 0.3)`,
              color: `rgb(${cardData.glowColor})`,
            }}
          >
            Entendido
          </button>
        </div>
      </Modal>
    </>
  );
}
