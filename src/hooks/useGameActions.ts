import { useState, useCallback, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Card, Color, Player, GameState, TreatmentType } from '@/game/types';
import { canPlayCard } from '@/game/validation';
import { SLOT_COLORS } from '@/game/body-utils';
import { COLOR_SYSTEM_LABELS, TREATMENT_LABELS } from '@/game/theme';
import { NotificationType } from '@/components/Narrator';
import { playVirusSound, playMedicineSound, playDiscardSound, playSystemSound } from '@/utils/audio';

interface UseGameActionsOptions {
  socket: Socket | null;
  roomId: string;
  currentPlayerId: string | null;
  gameState: GameState | null;
  notify: (message: string, type: NotificationType) => void;
  addToGameLog: (message: string) => void;
  onTurnChange: (reset: boolean) => void;
}

export function useGameActions({
  socket,
  roomId,
  currentPlayerId,
  gameState,
  notify,
  addToGameLog,
  onTurnChange,
}: UseGameActionsOptions) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [validTargets, setValidTargets] = useState<Set<string>>(new Set());
  const [actionsThisTurn, setActionsThisTurn] = useState(0);

  // Para ENERGY_TRANSFER de 2 pasos
  const [energyTransferStep, setEnergyTransferStep] = useState<0 | 1 | 2>(0);
  const [energyTransferSourceColor, setEnergyTransferSourceColor] = useState<Color | null>(null);
  const [energyTransferSourcePlayerId, setEnergyTransferSourcePlayerId] = useState<string | null>(null);

  // Para SINGULARITY (seleccionar 2 jugadores)
  const [singularityFirstPlayerId, setSingularityFirstPlayerId] = useState<string | null>(null);
  const [singularitySelectingSecond, setSingularitySelectingSecond] = useState(false);

  // Calcular objetivos válidos cuando se selecciona una carta
  useEffect(() => {
    if (selectedCard && gameState) {
      const targets = new Set<string>();

      const currentPlayer = gameState.players.find((p) => p.id === currentPlayerId);
      if (!currentPlayer) {
        setValidTargets(new Set());
        return;
      }

      gameState.players.forEach((player) => {
        SLOT_COLORS.forEach((color) => {
          if (canPlayCard(selectedCard, currentPlayer, player, color, gameState)) {
            targets.add(`${player.id}-${color}`);
          }
        });
      });

      setValidTargets(targets);
    } else {
      setValidTargets(new Set());
    }
  }, [selectedCard, gameState, currentPlayerId]);

  const resetActions = useCallback(() => {
    setActionsThisTurn(0);
  }, []);

  const handleCardSelect = useCallback(
    (card: Card) => {
      // Si hay un proceso en curso, cancelarlo
      if (energyTransferStep > 0 || singularitySelectingSecond || singularityFirstPlayerId) {
        notify('Proceso cancelado', 'warning');
        setEnergyTransferStep(0);
        setEnergyTransferSourceColor(null);
        setEnergyTransferSourcePlayerId(null);
        setSingularityFirstPlayerId(null);
        setSingularitySelectingSecond(false);
        setValidTargets(new Set());
      }

      // Si es SINGULARITY, iniciar modo de selección de primer jugador
      if (card.type === 'TREATMENT' && card.treatmentType === TreatmentType.SINGULARITY) {
        setSelectedCard(card);
        setSelectedCards([card]);
        setSingularitySelectingSecond(false);
        setSingularityFirstPlayerId(null);
        notify(
          '⚠️ SINGULARIDAD: Intercambia TODOS los sistemas entre dos jugadores. Selecciona el PRIMER jugador.',
          'warning',
        );
        // Mostrar todos los jugadores como válidos
        const allPlayers = new Set<string>();
        gameState?.players.forEach((player) => {
          SLOT_COLORS.forEach((color) => {
            const slot = player.body instanceof Map ? player.body.get(color) : player.body[color];
            if (slot?.organCard) {
              allPlayers.add(`${player.id}-${color}`);
            }
          });
        });
        setValidTargets(allPlayers);
        return;
      }

      // Si es ENERGY_TRANSFER, iniciar el proceso de 2 pasos
      if (card.type === 'TREATMENT' && card.treatmentType === TreatmentType.ENERGY_TRANSFER) {
        setEnergyTransferStep(1);
        setSelectedCard(card);
        setSelectedCards([card]);
        notify('TRANSFERENCIA DE ENERGÍA: Paso 1/2 - Selecciona el sistema ORIGEN (del que quieres tomar la avería/mejora)', 'info');

        const myPlayer = gameState?.players.find((p) => p.id === currentPlayerId);
        if (myPlayer) {
          const allValidSources = new Set<string>();

          gameState!.players.forEach((player) => {
            SLOT_COLORS.forEach((color) => {
              const slot = player.body instanceof Map ? player.body.get(color) : player.body[color];
              if (slot && (slot.virusCards.length > 0 || slot.medicineCards.length > 0)) {
                allValidSources.add(`${player.id}-${color}`);
              }
            });
          });

          setValidTargets(allValidSources);
        }
        return;
      }

      // Si ya estaba seleccionada, deseleccionar
      if (selectedCard?.id === card.id) {
        setSelectedCard(null);
        setSelectedCards([]);
        setValidTargets(new Set());
        return;
      }

      setSelectedCard(card);
      setSelectedCards([card]);
    },
    [
      energyTransferStep,
      singularitySelectingSecond,
      singularityFirstPlayerId,
      selectedCard,
      gameState,
      currentPlayerId,
      notify,
    ],
  );

  const handleOrganClick = useCallback(
    (color: Color, player: Player) => {
      if (!selectedCard) return;

      // SINGULARITY: Seleccionar primer jugador
      if (selectedCard.treatmentType === TreatmentType.SINGULARITY && !singularityFirstPlayerId) {
        setSingularityFirstPlayerId(player.id);
        setSingularitySelectingSecond(true);

        notify(`Primer jugador: ${player.name}. Ahora selecciona el SEGUNDO jugador.`, 'info');

        // Mostrar todos los jugadores excepto el primero seleccionado
        const secondPlayerTargets = new Set<string>();
        gameState!.players.forEach((p) => {
          if (p.id !== player.id) {
            SLOT_COLORS.forEach((c) => {
              const slot = p.body instanceof Map ? p.body.get(c) : p.body[c];
              if (slot?.organCard) {
                secondPlayerTargets.add(`${p.id}-${c}`);
              }
            });
          }
        });
        setValidTargets(secondPlayerTargets);
        return;
      }

      // SINGULARITY: Seleccionar segundo jugador y ejecutar
      if (selectedCard.treatmentType === TreatmentType.SINGULARITY && singularitySelectingSecond) {
        if (!singularityFirstPlayerId || player.id === singularityFirstPlayerId) {
          notify('Selecciona un JUGADOR DIFERENTE al primero', 'warning');
          return;
        }
        playSingularityCard(selectedCard, singularityFirstPlayerId, player.id);
        return;
      }

      const targetKey = `${player.id}-${color}`;
      if (!validTargets.has(targetKey)) {
        return;
      }

      // Si es ENERGY_TRANSFER en paso 1
      if (
        selectedCard.type === 'TREATMENT' &&
        selectedCard.treatmentType === TreatmentType.ENERGY_TRANSFER &&
        energyTransferStep === 1
      ) {
        setEnergyTransferSourceColor(color);
        setEnergyTransferSourcePlayerId(player.id);
        setEnergyTransferStep(2);

        // Mostrar todos los slots del mismo color en todos los jugadores
        const sameColorTargets = new Set<string>();
        gameState!.players.forEach((p) => {
          const slot = p.body instanceof Map ? p.body.get(color) : p.body[color];
          if (slot) {
            sameColorTargets.add(`${p.id}-${color}`);
          }
        });
        setValidTargets(sameColorTargets);

        const systemName = COLOR_SYSTEM_LABELS[color];
        notify(
          `TRANSFERENCIA DE ENERGÍA: Paso 2/2 - Selecciona el sistema DESTINO del mismo tipo (${systemName})`,
          'info',
        );
        return;
      }

      // Si es ENERGY_TRANSFER en paso 2
      if (
        selectedCard.type === 'TREATMENT' &&
        selectedCard.treatmentType === TreatmentType.ENERGY_TRANSFER &&
        energyTransferStep === 2
      ) {
        playEnergyTransferCard(selectedCard, energyTransferSourceColor!, color, player);
        return;
      }

      // Jugar la carta normalmente
      playCard(selectedCard, color, player);
    },
    [
      selectedCard,
      singularityFirstPlayerId,
      singularitySelectingSecond,
      validTargets,
      energyTransferStep,
      energyTransferSourceColor,
      currentPlayerId,
      gameState,
      notify,
    ],
  );

  const playEnergyTransferCard = (card: Card, sourceColor: Color, targetColor: Color, targetPlayer: Player) => {
    const systemName = COLOR_SYSTEM_LABELS[sourceColor];

    notify(
      `¡Transferencia de energía completada en ${systemName}!`,
      'success',
    );

    addToGameLog(
      `Usaste ${card.name || 'TRANSFERENCIA DE ENERGÍA'} para mover avería/mejora en ${systemName}`,
    );

    socket?.emit('game-action', {
      roomId,
      action: {
        type: 'play-card',
        card: card,
        targetPlayerId: targetPlayer.id,
        targetColor: targetColor,
        sourceColor: sourceColor,
        sourcePlayerId: energyTransferSourcePlayerId,
      },
    });

    setEnergyTransferStep(0);
    setEnergyTransferSourceColor(null);
    setEnergyTransferSourcePlayerId(null);
    setSelectedCard(null);
    setSelectedCards([]);
    setValidTargets(new Set());
    setActionsThisTurn((prev) => prev + 1);
  };

  const playSingularityCard = (card: Card, firstPlayerId: string, secondPlayerId: string) => {
    const firstPlayer = gameState?.players.find(p => p.id === firstPlayerId);
    const secondPlayer = gameState?.players.find(p => p.id === secondPlayerId);

    notify(
      `¡SINGULARIDAD! ${firstPlayer?.name} ↔ ${secondPlayer?.name}: sistemas intercambiados.`,
      'warning',
    );

    addToGameLog(
      `Usaste ${card.name || 'SINGULARIDAD'} para intercambiar todos los sistemas entre ${firstPlayer?.name} y ${secondPlayer?.name}`,
    );

    // Enviar ambos IDs al servidor
    socket?.emit('game-action', {
      roomId,
      action: {
        type: 'play-card',
        card: card,
        targetPlayerId: firstPlayerId,
        targetColor: Color.RED,
        secondTargetPlayerId: secondPlayerId,
      },
    });

    setSingularityFirstPlayerId(null);
    setSingularitySelectingSecond(false);
    setSelectedCard(null);
    setSelectedCards([]);
    setValidTargets(new Set());
    setActionsThisTurn((prev) => prev + 1);
  };

  const playCard = (card: Card, color: Color, targetPlayer: Player) => {
    const systemName = COLOR_SYSTEM_LABELS[color];
    const targetName = targetPlayer.id === currentPlayerId ? 'tu' : `de ${targetPlayer.name}`;

    let logMessage = '';
    if (card.type === 'ORGAN') {
      notify(`Sistema ${systemName} instalado`, 'success');
      logMessage = `Jugaste ${card.name || 'una carta de SISTEMA'} en ${systemName} ${targetName}`;
      playSystemSound();
    } else if (card.type === 'VIRUS') {
      notify(`¡Sabotaje en ${systemName} ${targetName}!`, 'warning');
      logMessage = `Jugaste ${card.name || 'una carta de SABOTAJE'} en ${systemName} ${targetName}`;
      playVirusSound();
    } else if (card.type === 'MEDICINE') {
      notify(`Reparación aplicada a ${systemName} ${targetName}`, 'success');
      logMessage = `Jugaste ${card.name || 'una carta de REPARACIÓN'} en ${systemName} ${targetName}`;
      playMedicineSound();
    } else if (card.type === 'TREATMENT') {
      if (card.treatmentType === TreatmentType.ENERGY_TRANSFER) {
        notify(`Transferencia de energía en ${systemName}`, 'success');
        logMessage = `Jugaste ${card.name || 'TRANSFERENCIA DE ENERGÍA'} en ${systemName}`;
      } else if (card.treatmentType === TreatmentType.EMERGENCY_DECOMPRESSION) {
        notify(`¡Descompresión de emergencia en ${systemName} de ${targetPlayer.name}!`, 'warning');
        logMessage = `Jugaste ${card.name || 'DESCOMPRESIÓN DE EMERGENCIA'} en ${systemName} de ${targetPlayer.name}`;
      } else if (card.treatmentType === TreatmentType.DATA_PIRACY) {
        notify(`¡${systemName} pirateado de ${targetPlayer.name}!`, 'success');
        logMessage = `Jugaste ${card.name || 'PIRATERÍA DE DATOS'} de ${systemName} de ${targetPlayer.name}`;
      } else if (card.treatmentType === TreatmentType.QUANTUM_DESYNC) {
        notify(`Desincronización cuántica en ${targetPlayer.name}`, 'info');
        logMessage = `Jugaste ${card.name || 'DESINCRONIZACIÓN CUÁNTICA'} en ${targetPlayer.name}`;
      } else if (card.treatmentType === TreatmentType.PROTOCOL_ERROR) {
        notify(`Error de protocolo en ${systemName} de ${targetPlayer.name}`, 'success');
        logMessage = `Jugaste ${card.name || 'ERROR DE PROTOCOLO'} en ${systemName} de ${targetPlayer.name}`;
      } else if (card.treatmentType === TreatmentType.SINGULARITY) {
        notify(`¡SINGULARIDAD activada!`, 'warning');
        logMessage = `Jugaste ${card.name || 'SINGULARIDAD'}`;
      } else if (card.treatmentType === TreatmentType.EVENT_HORIZON) {
        notify(`Horizonte de sucesos activado`, 'info');
        logMessage = `Jugaste ${card.name || 'HORIZONTE DE SUCESOS'}`;
      }
    }

    addToGameLog(logMessage);

    socket?.emit('game-action', {
      roomId,
      action: {
        type: 'play-card',
        card: card,
        targetPlayerId: targetPlayer.id,
        targetColor: color,
      },
    });

    setSelectedCard(null);
    setSelectedCards([]);
    setValidTargets(new Set());
    setActionsThisTurn((prev) => prev + 1);
  };

  const handleCardDiscard = useCallback(
    (card: Card) => {
      socket?.emit('game-action', {
        roomId,
        action: {
          type: 'discard-cards',
          cards: [card],
        },
      });

      playDiscardSound();
      notify('Carta descartada', 'info');
      addToGameLog(`Descartaste una carta`);

      if (selectedCard?.id === card.id) {
        setSelectedCard(null);
        setSelectedCards([]);
        setValidTargets(new Set());
      }
      setActionsThisTurn((prev) => prev + 1);
    },
    [socket, roomId, selectedCard, notify, addToGameLog],
  );

  const handleEndTurn = useCallback(() => {
    addToGameLog(`Terminaste tu turno`);

    socket?.emit('game-action', {
      roomId,
      action: {
        type: 'end-turn',
      },
    });

    notify('Turno finalizado', 'info');
  }, [socket, roomId, notify, addToGameLog]);

  const isSlotValid = useCallback(
    (playerId: string, color: Color): boolean => {
      return validTargets.has(`${playerId}-${color}`);
    },
    [validTargets],
  );

  return {
    selectedCard,
    selectedCards,
    validTargets,
    actionsThisTurn,
    energyTransferStep,
    singularityFirstPlayerId,
    singularitySelectingSecond,
    handleCardSelect,
    handleOrganClick,
    handleCardDiscard,
    handleEndTurn,
    isSlotValid,
    resetActions,
  };
}
