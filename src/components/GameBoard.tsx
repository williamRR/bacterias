import { Player, Color, Card } from '../game/types';
import { getOrganState } from '../game/validation';
import { SLOT_COLORS } from '../game/body-utils';
import {
  COLOR_SYSTEM_LABELS,
  ORGAN_STATE_LABELS,
  SYSTEM_ICONS,
  SYSTEM_STATE_ICONS,
} from '../game/theme';

interface GameBoardProps {
  player: Player;
  isCurrentPlayer: boolean;
  onOrganClick: (color: Color) => void;
  onDrop?: (color: Color, player: Player) => void;
  onDragOver?: (e: React.DragEvent) => void;
  selectedColor: Color | null;
  isDropTarget?: boolean;
  targetColor?: Color | null;
  validTargets?: Set<string>;
  isSlotValid?: (color: Color) => boolean;
  selectedCard?: Card | null;
}

export default function GameBoard({
  player,
  isCurrentPlayer,
  onOrganClick,
  onDrop,
  onDragOver,
  selectedColor,
  isDropTarget = false,
  targetColor,
  validTargets,
  isSlotValid,
  selectedCard,
}: GameBoardProps) {


  // Color base del sistema (SIEMPRE el mismo, no cambia con el estado)
  const getSystemColor = (color: Color): string => {
    switch (color) {
      case Color.RED:
        return 'bg-orange-900/80 border-orange-500';
      case Color.BLUE:
        return 'bg-cyan-900/80 border-cyan-500';
      case Color.GREEN:
        return 'bg-emerald-900/80 border-emerald-500';
      case Color.YELLOW:
        return 'bg-amber-900/80 border-amber-500';
      case Color.MULTICOLOR:
        return 'bg-violet-900/80 border-violet-500';
      default:
        return 'bg-gray-900/80 border-gray-500';
    }
  };

  // Estilos adicionales según el estado (NO cambia el color base del sistema)
  const getStateOverlay = (state: string): string => {
    switch (state) {
      case 'HEALTHY':
        return ''; // Estado normal, sin overlay
      case 'INFECTED':
        return 'shadow-red-500/50 shadow-lg'; // Sombra roja
      case 'VACCINATED':
        return 'shadow-cyan-500/50 shadow-lg'; // Sombra cyan
      case 'IMMUNIZED':
        return 'ring-2 ring-violet-400 shadow-violet-500/50'; // Borde violeta brillante
      case 'REMOVED':
        return 'opacity-30 grayscale'; // Gris y transparente
      default:
        return '';
    }
  };

  const handleDrop = (e: React.DragEvent, color: Color) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDrop) {
      onDrop(color, player);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (onDragOver) {
      onDragOver(e);
    }
  };

  const isValid = (color: Color): boolean => {
    return isSlotValid ? isSlotValid(color) : false;
  };

  return (
    <div
      className={`
        bg-gradient-to-br from-slate-800/90 to-gray-900/90 backdrop-blur-sm
        rounded-2xl p-4 border border-slate-700/50
        w-full max-w-lg mx-auto
        ${isCurrentPlayer ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/20' : ''}
        transition-all duration-300
      `}
    >
      <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
        <span className="text-cyan-400">{player.name}</span>
        {isCurrentPlayer && (
          <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full">
            ACTIVO
          </span>
        )}
      </h3>

      <div className="grid grid-cols-5 gap-3">
        {SLOT_COLORS.map((color) => {
          const slot = player.body instanceof Map ? player.body.get(color) : player.body[color];
          const state = slot ? getOrganState(slot) : 'REMOVED';
          const isSelected = selectedColor === color;
          const isTarget = isDropTarget && targetColor === color;
          const valid = isValid(color);
          const systemLabel = COLOR_SYSTEM_LABELS[color];
          const stateLabel = ORGAN_STATE_LABELS[state];
          const systemIcon = SYSTEM_ICONS[color];

          return (
            <div
              key={color}
              onClick={() => onOrganClick(color)}
              onDrop={(e) => handleDrop(e, color)}
              onDragOver={handleDragOver}
              className={`
                ${getSystemColor(color)}
                ${getStateOverlay(state)}
                ${isSelected ? 'ring-2 ring-white scale-105 z-10 shadow-xl' : ''}
                ${isTarget ? 'ring-4 ring-cyan-400 scale-110 shadow-lg shadow-cyan-500/50 z-20' : ''}
                ${selectedCard && valid ? 'ring-2 ring-green-400 shadow-[0_0_15px_rgba(74,222,128,0.4)] animate-pulse-slow' : ''}
                ${selectedCard && !valid ? 'opacity-30 grayscale scale-95' : ''}
                border-2 rounded-xl p-2 h-36 flex flex-col items-center justify-center
                cursor-pointer transition-all duration-300 hover:scale-105
                relative overflow-hidden group/slot scanner-effect
              `}
            >
              {/* Patrón de rejilla espacial más sutil */}
              <div className="absolute inset-0 opacity-[0.05]">
                <div className="w-full h-full" style={{
                  backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                  backgroundSize: '12px 12px'
                }} />
              </div>

              {/* Indicador de target válido - Estética sci-fi */}
              {selectedCard && valid && (
                <div className="absolute top-1 right-1 flex gap-1 z-10">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></div>
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                </div>
              )}

              {/* Icono grande del sistema con efecto de flotado */}
              <div className="text-4xl mb-1 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] relative z-10 transition-transform group-hover/slot:scale-110 duration-500">
                {systemIcon}
              </div>

              {/* Nombre del sistema */}
              <div className="text-[10px] font-black text-white uppercase tracking-[0.2em] relative z-10 opacity-80">
                {systemLabel}
              </div>

              {/* Estado del sistema - UI mejorada */}
              {slot?.organCard ? (
                <div className="text-center relative z-10 mt-1.5">
                  {/* Etiqueta de estado con fondo */}
                  <div className={`
                    text-[8px] font-bold px-1.5 py-0.5 rounded-full inline-block
                    ${state === 'HEALTHY' ? 'bg-green-500/20 text-green-300' : ''}
                    ${state === 'INFECTED' ? 'bg-yellow-500/20 text-yellow-300' : ''}
                    ${state === 'VACCINATED' ? 'bg-blue-500/20 text-blue-300' : ''}
                    ${state === 'IMMUNIZED' ? 'bg-cyan-500/20 text-cyan-300' : ''}
                  `}>
                    {stateLabel}
                  </div>

                  {/* Icono de estado sutil */}
                  <div className="text-xs mt-0.5 opacity-80">
                    {state === 'HEALTHY' && '✅'}
                    {state === 'INFECTED' && '⚠️'}
                    {state === 'VACCINATED' && '🛡️'}
                    {state === 'IMMUNIZED' && '💎'}
                  </div>

                  {/* Contadores con visualización premium */}
                  <div className="flex gap-2 justify-center mt-1.5">
                    {state !== 'HEALTHY' && slot.virusCards.length > 0 && (
                      <div className="flex items-center gap-0.5 bg-red-500/20 px-1 rounded text-[9px] text-red-300 font-bold border border-red-500/30">
                        <span>⚠</span>
                        <span>{slot.virusCards.length}</span>
                      </div>
                    )}
                    {state !== 'HEALTHY' && slot.medicineCards.length > 0 && (
                      <div className="flex items-center gap-0.5 bg-cyan-500/20 px-1 rounded text-[9px] text-cyan-300 font-bold border border-cyan-500/30">
                        <span>🛡️</span>
                        <span>{slot.medicineCards.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center relative z-10 mt-2 opacity-40">
                  <div className="text-2xl filter grayscale opacity-50">💀</div>
                  <div className="text-[8px] text-gray-400 font-black mt-1 tracking-widest">DESTROYED</div>
                </div>
              )}

              {/* Borde interior sutil */}
              <div className="absolute inset-px border border-white/5 rounded-[10px] pointer-events-none" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
