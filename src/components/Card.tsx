import { useState } from 'react';
import type { Card } from '../game/types';
import { CardType as CardTypeEnum } from '../game/types';
import { SPACE_ICONS, CARD_TYPE_LABELS, TREATMENT_LABELS, SYSTEM_ICONS, COLOR_SYSTEM_LABELS } from '../game/theme';

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
  const [showTooltip, setShowTooltip] = useState(false);

  // Obtener el emoji del sistema para cartas ORGAN
  const getSystemIcon = () => {
    switch (card.color) {
      case 'RED': return '🔧';
      case 'BLUE': return '💨';
      case 'GREEN': return '🧭';
      case 'YELLOW': return '🛡️';
      case 'MULTICOLOR': return '🖥️';
      default: return '❓';
    }
  };

  // Estilos específicos según el tipo de carta
  const getCardStyle = () => {
    const baseStyle = "border-2 rounded-xl flex flex-col items-center justify-center p-2 transition-all duration-200 flex-shrink-0 select-none relative overflow-hidden group";

    switch (card.type as CardTypeEnum) {
      case 'ORGAN':
        const organColors: Record<string, string> = {
          'RED': 'border-orange-500 bg-gradient-to-br from-slate-800 to-orange-900/30',
          'BLUE': 'border-cyan-500 bg-gradient-to-br from-slate-800 to-cyan-900/30',
          'GREEN': 'border-emerald-500 bg-gradient-to-br from-slate-800 to-emerald-900/30',
          'YELLOW': 'border-amber-500 bg-gradient-to-br from-slate-800 to-amber-900/30',
          'MULTICOLOR': 'border-violet-500 bg-gradient-to-br from-slate-800 to-violet-900/30',
        };
        return `${baseStyle} ${organColors[card.color] || organColors['MULTICOLOR']}`;

      case 'VIRUS':
        return `${baseStyle} border-red-600 bg-gradient-to-br from-red-950 to-red-900/50 shadow-red-500/30`;

      case 'MEDICINE':
        return `${baseStyle} border-emerald-500 bg-gradient-to-br from-emerald-950 to-emerald-900/50 shadow-emerald-500/30`;

      case 'TREATMENT':
        return `${baseStyle} border-fuchsia-500 bg-gradient-to-br from-purple-950 to-fuchsia-900/50 shadow-fuchsia-500/30`;

      default:
        return `${baseStyle} border-gray-600 bg-gray-800`;
    }
  };

  // Color del badge de tipo según el tipo de carta
  const getTypeBadgeColor = () => {
    switch (card.type as CardTypeEnum) {
      case 'ORGAN':
        return 'bg-slate-700 text-white';
      case 'VIRUS':
        return 'bg-red-600 text-white';
      case 'MEDICINE':
        return 'bg-emerald-600 text-white';
      case 'TREATMENT':
        return 'bg-fuchsia-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

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

  // Icono principal según el tipo
  const getMainIcon = () => {
    switch (card.type as CardTypeEnum) {
      case 'ORGAN':
        return getSystemIcon(); // Icono del sistema específico
      case 'VIRUS':
        return '⚠️'; // Símbolo de peligro
      case 'MEDICINE':
        return '✅'; // Símbolo de OK/cura
      case 'TREATMENT':
        return '⚡'; // Símbolo de acción especial
      default:
        return '❓';
    }
  };

  // Subtítulo adicional
  const getSubtitle = () => {
    if (card.type === 'ORGAN' as CardTypeEnum) {
      return COLOR_SYSTEM_LABELS[card.color];
    }
    if (card.type === 'VIRUS' as CardTypeEnum) {
      return `vs ${COLOR_SYSTEM_LABELS[card.color]}`;
    }
    if (card.type === 'MEDICINE' as CardTypeEnum) {
      return `para ${COLOR_SYSTEM_LABELS[card.color]}`;
    }
    return null;
  };

  // Descripción para el tooltip
  const getCardDescription = () => {
    switch (card.type as CardTypeEnum) {
      case 'ORGAN':
        return 'Instala este sistema en tu nave. Necesitas 4 sistemas diferentes para ganar.';
      case 'VIRUS':
        return `Avería el sistema ${COLOR_SYSTEM_LABELS[card.color]} de un oponente. Dos sabotajes destruyen el sistema.`;
      case 'MEDICINE':
        return `Repara o protege tu sistema ${COLOR_SYSTEM_LABELS[card.color]}. Dos protecciones lo blindan permanentemente.`;
      case 'TREATMENT':
        return card.treatmentType ? TREATMENT_LABELS[card.treatmentType] : 'Efecto especial de misión.';
      default:
        return 'Carta de misión espacial.';
    }
  };

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

  const mainIcon = getMainIcon();
  const subtitle = getSubtitle();
  const treatmentLabel = card.treatmentType ? TREATMENT_LABELS[card.treatmentType] : null;

  return (
    <div
      onClick={onClick}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        ${getCardStyle()}
        ${selected ? 'ring-4 ring-cyan-400 scale-105 z-20' : ''}
        ${draggable ? 'hover:shadow-cyan-400/50 hover:shadow-2xl hover:translate-y-[-8px] cursor-grab active:cursor-grabbing' : 'hover:shadow-cyan-400/30 hover:shadow-lg cursor-pointer'}
        shadow-lg card-entrance
        transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)
      `}
      style={{ width: '5rem', height: '7rem' }}
    >
      {/* Tooltip Overlay */}
      {showTooltip && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md p-2 flex flex-col justify-center items-center text-center animate-in fade-in zoom-in duration-200">
          <p className="text-[8px] font-bold text-cyan-400 mb-1 uppercase tracking-widest">{getTypeBadgeLabel()}</p>
          <p className="text-[9px] text-white font-medium leading-tight">{getCardDescription()}</p>
          <button
            onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}
            className="mt-2 text-[8px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-full text-white/70"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Efecto de escáner sutil cuando está seleccionada o en hover */}
      {(selected || draggable) && <div className="absolute inset-0 scanner-effect opacity-20 pointer-events-none" />}

      {/* Brillo de fondo */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/5 opacity-50 pointer-events-none" />

      {/* Badge del tipo de carta - más estilizado */}
      <div className={`absolute top-0 left-0 right-0 text-center py-0.5 md:py-1 ${getTypeBadgeColor()} rounded-t-lg shadow-inner z-10`}>
        <span className="text-[7px] md:text-[9px] font-black tracking-widest uppercase">{getTypeBadgeLabel()}</span>
      </div>

      {/* Botones de acción (Info y Descarte) */}
      <div className="absolute top-4 right-1 left-1 flex justify-between md:top-7 items-center z-30">
        {/* Botón de información (?) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowTooltip(true);
          }}
          className="w-4 h-4 md:w-5 md:h-5 flex items-center justify-center bg-cyan-500/10 hover:bg-cyan-500/30 text-cyan-400 hover:text-cyan-200 rounded-full transition-all duration-200"
          title="Ver información"
        >
          <span className="text-[10px] md:text-xs font-bold">?</span>
        </button>

        {/* Botón de descarte (X) */}
        {onDiscard && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDiscard();
            }}
            className="w-4 h-4 md:w-5 md:h-5 flex items-center justify-center bg-red-500/10 hover:bg-red-500/30 text-red-400 hover:text-red-200 rounded-full transition-all duration-200 group/discard"
            title="Descartar carta"
          >
            <span className="text-[10px] md:text-xs font-bold transition-transform group-hover/discard:rotate-90">✕</span>
          </button>
        )}
      </div>

      {/* Contenido principal con sombra */}
      <div className="flex flex-col items-center justify-center h-full pt-4 md:pt-6 relative z-10">
        {/* Icono principal grande con brillo - REDUCIDO el tamaño */}
        <div className="text-2xl md:text-4xl mb-1 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-transform group-hover:scale-110 duration-500">
          {mainIcon}
        </div>

        {/* Subtítulo (sistema que afecta) con fondo sutil */}
        {subtitle && (
          <div className="bg-black/20 backdrop-blur-sm px-1 md:px-2 py-0.5 rounded text-[6px] md:text-[8px] text-center text-gray-200 font-bold uppercase mt-0.5 tracking-tighter">
            {subtitle}
          </div>
        )}

        {/* Tratamiento especial si existe */}
        {treatmentLabel && (
          <div className="text-[7px] md:text-[8px] text-center px-1 md:px-2 mt-1 text-yellow-300 font-black leading-tight drop-shadow-md line-clamp-2 italic uppercase">
            {treatmentLabel}
          </div>
        )}
      </div>

      {/* Indicador de arrastre más visual */}
      {draggable && (
        <div className="absolute bottom-1 right-1 flex gap-0.5 opacity-40">
          <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
          <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
        </div>
      )}
    </div>
  );
}
