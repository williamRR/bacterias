import { useState, useCallback, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Card, Color, Player, GameState, TreatmentType } from '@/game/types';
import { SLOT_COLORS } from '@/game/body-utils';
import { COLOR_SYSTEM_LABELS } from '@/game/theme';
import { NotificationType } from '@/components/Narrator';
import { playVirusSound, playMedicineSound, playDiscardSound, playSystemSound } from '@/utils/audio';

import {
  calculateValidTargets,
  calculateEnergyTransferSources,
  calculateEnergyTransferTargets,
  calculateAllPlayersWithOrgans,
  calculateAllPlayersExcept,
  isSingularityCard,
  isEnergyTransferCard,
  buildTargetKey,
} from '@/utils/cardTargetCalculator';

import {
  getCardPlayNotification,
  getCardPlayLogMessage,
  getEnergyTransferLogMessage,
  getSingularityLogMessage,
  getEnergyTransferNotification,
  getSingularityNotification,
  buildPlayCardMessage,
  buildPlayEnergyTransferMessage,
  buildPlaySingularityMessage,
  buildDiscardCardMessage,
  buildEndTurnMessage,
  type PlayCardParams,
  type PlayEnergyTransferParams,
  type PlaySingularityParams,
} from '@/utils/cardActionHelpers';

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

  const [energyTransferStep, setEnergyTransferStep] = useState<0 | 1 | 2>(0);
  const [energyTransferSourceColor, setEnergyTransferSourceColor] = useState<Color | null>(null);
  const [energyTransferSourcePlayerId, setEnergyTransferSourcePlayerId] = useState<string | null>(null);

  const [singularityFirstPlayerId, setSingularityFirstPlayerId] = useState<string | null>(null);
  const [singularitySelectingSecond, setSingularitySelectingSecond] = useState(false);

  useEffect(() => {
    const targets = calculateValidTargets(selectedCard, gameState, currentPlayerId);
    setValidTargets(targets);
  }, [selectedCard, gameState, currentPlayerId]);

  const resetActions = useCallback(() => {
    setActionsThisTurn(0);
  }, []);

  const playCardSound = useCallback((card: Card) => {
    if (card.type === 'ORGAN') {
      playSystemSound();
    } else if (card.type === 'VIRUS') {
      playVirusSound();
    } else if (card.type === 'MEDICINE') {
      playMedicineSound();
    }
  }, []);

  const incrementActions = useCallback(() => {
    setActionsThisTurn((prev) => prev + 1);
  }, []);

  const deselectCard = useCallback(() => {
    setSelectedCard(null);
    setSelectedCards([]);
    setValidTargets(new Set());
  }, []);

  const playCard = useCallback((color: Color, targetPlayer: Player) => {
    const notification = getCardPlayNotification(selectedCard!, color, targetPlayer, currentPlayerId);
    notify(notification.message, notification.type);

    const logMessage = getCardPlayLogMessage(selectedCard!, color, targetPlayer, currentPlayerId);
    addToGameLog(logMessage);

    playCardSound(selectedCard!);

    const message = buildPlayCardMessage({
      card: selectedCard!,
      color,
      targetPlayer,
      currentPlayerId,
    }, roomId);

    socket?.emit('game-action', message);

    deselectCard();
    incrementActions();
  }, [selectedCard, currentPlayerId, roomId, socket, notify, addToGameLog, deselectCard, incrementActions, playCardSound]);

  const playEnergyTransferCard = useCallback((sourceColor: Color, targetColor: Color, targetPlayer: Player) => {
    const notification = getEnergyTransferNotification(sourceColor);
    notify(notification.message, notification.type);

    const logMessage = getEnergyTransferLogMessage(selectedCard!, sourceColor);
    addToGameLog(logMessage);

    const message = buildPlayEnergyTransferMessage({
      card: selectedCard!,
      sourceColor,
      targetColor,
      targetPlayer,
      energyTransferSourcePlayerId,
    }, roomId);

    socket?.emit('game-action', message);

    setEnergyTransferStep(0);
    setEnergyTransferSourceColor(null);
    setEnergyTransferSourcePlayerId(null);
    deselectCard();
    incrementActions();
  }, [selectedCard, energyTransferSourcePlayerId, roomId, socket, notify, addToGameLog, deselectCard, incrementActions]);

  const playSingularityCard = useCallback((firstPlayerId: string, secondPlayerId: string) => {
    const firstPlayer = gameState?.players.find(p => p.id === firstPlayerId);
    const secondPlayer = gameState?.players.find(p => p.id === secondPlayerId);

    const notification = getSingularityNotification(firstPlayer?.name, secondPlayer?.name);
    notify(notification.message, notification.type);

    const logMessage = getSingularityLogMessage(selectedCard!, firstPlayer?.name, secondPlayer?.name);
    addToGameLog(logMessage);

    const message = buildPlaySingularityMessage({
      card: selectedCard!,
      firstPlayerId,
      secondPlayerId,
      gameState,
    }, roomId);

    socket?.emit('game-action', message);

    setSingularityFirstPlayerId(null);
    setSingularitySelectingSecond(false);
    deselectCard();
    incrementActions();
  }, [selectedCard, gameState, roomId, socket, notify, addToGameLog, deselectCard, incrementActions]);

  const handleCardSelect = useCallback(
    (card: Card) => {
      if (energyTransferStep > 0 || singularitySelectingSecond || singularityFirstPlayerId) {
        notify('Proceso cancelado', 'warning');
        setEnergyTransferStep(0);
        setEnergyTransferSourceColor(null);
        setEnergyTransferSourcePlayerId(null);
        setSingularityFirstPlayerId(null);
        setSingularitySelectingSecond(false);
        setValidTargets(new Set());
        return;
      }

      if (isSingularityCard(card)) {
        setSelectedCard(card);
        setSelectedCards([card]);
        setSingularitySelectingSecond(false);
        setSingularityFirstPlayerId(null);
        notify(
          '⚠️ SINGULARIDAD: Intercambia TODOS los sistemas entre dos jugadores. Selecciona el PRIMER jugador.',
          'warning',
        );
        const allPlayers = calculateAllPlayersWithOrgans(gameState!);
        setValidTargets(allPlayers);
        return;
      }

      if (isEnergyTransferCard(card)) {
        setEnergyTransferStep(1);
        setSelectedCard(card);
        setSelectedCards([card]);
        notify('TRANSFERENCIA DE ENERGÍA: Paso 1/2 - Selecciona el sistema ORIGEN (del que quieres tomar la avería/mejora)', 'info');
        const allValidSources = calculateEnergyTransferSources(gameState!);
        setValidTargets(allValidSources);
        return;
      }

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
      notify,
    ],
  );

  const handleOrganClick = useCallback(
    (color: Color, player: Player) => {
      if (!selectedCard) return;

      if (isSingularityCard(selectedCard) && !singularityFirstPlayerId) {
        setSingularityFirstPlayerId(player.id);
        setSingularitySelectingSecond(true);
        notify(`Primer jugador: ${player.name}. Ahora selecciona el SEGUNDO jugador.`, 'info');
        const secondPlayerTargets = calculateAllPlayersExcept(gameState!, player.id);
        setValidTargets(secondPlayerTargets);
        return;
      }

      if (isSingularityCard(selectedCard) && singularitySelectingSecond) {
        if (!singularityFirstPlayerId || player.id === singularityFirstPlayerId) {
          notify('Selecciona un JUGADOR DIFERENTE al primero', 'warning');
          return;
        }
        playSingularityCard(singularityFirstPlayerId, player.id);
        return;
      }

      const targetKey = buildTargetKey(player.id, color);
      if (!validTargets.has(targetKey)) {
        return;
      }

      if (isEnergyTransferCard(selectedCard) && energyTransferStep === 1) {
        setEnergyTransferSourceColor(color);
        setEnergyTransferSourcePlayerId(player.id);
        setEnergyTransferStep(2);
        const sameColorTargets = calculateEnergyTransferTargets(gameState!, color);
        setValidTargets(sameColorTargets);
        const systemName = COLOR_SYSTEM_LABELS[color];
        notify(
          `TRANSFERENCIA DE ENERGÍA: Paso 2/2 - Selecciona el sistema DESTINO del mismo tipo (${systemName})`,
          'info',
        );
        return;
      }

      if (isEnergyTransferCard(selectedCard) && energyTransferStep === 2) {
        playEnergyTransferCard(energyTransferSourceColor!, color, player);
        return;
      }

      playCard(color, player);
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
      playCard,
      playEnergyTransferCard,
      playSingularityCard,
    ],
  );

  const handleCardDiscard = useCallback(
    (card: Card) => {
      const message = buildDiscardCardMessage(card, roomId);

      socket?.emit('game-action', message);

      playDiscardSound();
      notify('Carta descartada', 'info');
      addToGameLog('Descartaste una carta');

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
    addToGameLog('Terminaste tu turno');

    const message = buildEndTurnMessage(roomId);

    socket?.emit('game-action', message);

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
