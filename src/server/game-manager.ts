import { GameState, Card, Player, Color, TreatmentType, OrganSlot, OrganState, CardType } from '../game/types';
import { nextTurn, playCard, discardCards, drawCards, initializeGame, checkGameVictory } from '../game/engine';
import { canPlayCard, canPerformTransplant, canPerformOrganThief, getOrganState } from '../game/validation';
import { getRoom, rooms } from './rooms';
import { Server as SocketIOServer } from 'socket.io';
import { getSlotFromBody, setSlotInBody, getBodyEntries, serializeBody, initializeEmptySlot, getBodySlots } from '../game/body-utils';
import { swapSlotContents, transferSlotContents, clearSlot, swapPlayerBodies, getPlayerSlot, swapOrgansBetweenPlayers } from '../utils/slotOperations';
import { handleVirusCard, handleMedicineCard } from '../utils/cardHandlers';
import { gameLogger } from '../game/logger';
import { getGameLogger } from './logger';
import { COLOR_SYSTEM_LABELS, CARD_TYPE_LABELS, TREATMENT_LABELS } from '../game/theme';

export function serializeGameState(gameState: GameState): any {
  const serialized = {
    ...gameState,
    players: gameState.players.map((player) => ({
      ...player,
      hand: player.hand.map((card) => ({
        id: card.id,
        type: card.type,
        color: card.color,
        treatmentType: card.treatmentType,
        name: card.name,
      })),
      body: serializeBody(player.body),
    })),
  };

  return serialized;
}

let io: SocketIOServer | null = null;

export function setIOInstance(socketIO: SocketIOServer): void {
  io = socketIO;
}

function broadcastGameState(roomId: string, gameState: GameState): void {
  if (!io) return;
  io.to(roomId).emit('game-state', serializeGameState(gameState));
}

function sendNotificationToPlayer(roomId: string, playerId: string, message: string, type: 'warning' | 'info' | 'success' = 'info'): void {
  if (!io) return;
  io.to(roomId).emit('player-notification', {
    playerId,
    message,
    type
  });
}

function broadcastNarration(roomId: string, message: string, senderId?: string): void {
  if (!io) return;
  io.to(roomId).emit('narration', { message, senderId });
}

function handleTreatmentCard(roomId: string, player: Player, targetPlayer: Player, card: Card, targetColor: Color, sourceColor?: Color, secondTargetPlayerId?: string, sourcePlayerId?: string): boolean {
  const room = getRoom(roomId);
  if (!room || !card.treatmentType) return false;

  const { gameState } = room;
  const logger = getGameLogger(roomId);

  switch (card.treatmentType) {
    case TreatmentType.ENERGY_TRANSFER: {
      console.log('🔍 ENERGY_TRANSFER - Inicio');
      console.log('🔍 Action params:', { sourcePlayerId, sourceColor, targetColor, targetPlayer: targetPlayer.name });

      // Mueve un virus o medicina de un sistema a otro del mismo color
      const srcColor = sourceColor || targetColor;
      const sourcePlayer = sourcePlayerId ? gameState.players.find(p => p.id === sourcePlayerId) : targetPlayer;
      if (!sourcePlayer) {
        console.log('❌ ENERGY_TRANSFER - Fallo: sourcePlayer no encontrado');
        return false;
      }

      console.log('🔍 SourcePlayer:', sourcePlayer.name, 'SrcColor:', srcColor);
      console.log('🔍 TargetPlayer:', targetPlayer.name, 'TargetColor:', targetColor);

      const sourceSlot = getPlayerSlot(sourcePlayer, srcColor);
      const destSlot = getPlayerSlot(targetPlayer, targetColor);

      console.log('🔍 SourceSlot existe:', !!sourceSlot, 'DestSlot existe:', !!destSlot);
      console.log('🔍 SourceSlot virus:', sourceSlot?.virusCards.length, 'medicinas:', sourceSlot?.medicineCards.length);

      if (!sourceSlot || !destSlot) return false;

      // Validar que source y target sean diferentes
      const isSameSlot = sourcePlayer.id === targetPlayer.id && srcColor === targetColor;
      if (isSameSlot) {
        console.log('❌ ENERGY_TRANSFER - Fallo: mismo slot');
        return false;
      }

      // Validar que haya cartas para mover
      if (sourceSlot.virusCards.length === 0 && sourceSlot.medicineCards.length === 0) {
        console.log('❌ ENERGY_TRANSFER - Fallo: no hay cartas para mover');
        return false;
      }

      // Mover 1 virus o 1 medicina del slot origen al destino
      let moved = false;
      if (sourceSlot.virusCards.length > 0) {
        const virus = sourceSlot.virusCards.pop()!;
        destSlot.virusCards.push(virus);
        console.log('✅ Virus movido');
        moved = true;
      } else if (sourceSlot.medicineCards.length > 0) {
        // VALIDACIÓN: El destino no puede tener más de 2 medicinas
        if (destSlot.medicineCards.length >= 2) {
          console.log('❌ ENERGY_TRANSFER - Fallo: destino ya tiene 2 medicinas (máximo BLINDADO)');
          return false;
        }
        const medicine = sourceSlot.medicineCards.pop()!;
        destSlot.medicineCards.push(medicine);
        console.log('✅ Medicina movida');
        moved = true;
      }

      if (moved) {
        const systemName = COLOR_SYSTEM_LABELS[srcColor];
        sendNotificationToPlayer(roomId, sourcePlayer.id, `⚡ TRANSFERENCIA: Se movió avería/mejora de tu ${systemName} al ${systemName} de ${targetPlayer.name}`, 'info');
        sendNotificationToPlayer(roomId, targetPlayer.id, `⚡ TRANSFERENCIA: Recibiste avería/mejora en tu ${systemName} de ${sourcePlayer.name}`, 'info');
        logger.logTreatmentCard(player.name, 'ENERGY_TRANSFER', `${sourcePlayer.name} → ${targetPlayer.name}`);
        console.log('✅ ENERGY_TRANSFER - Completado con éxito');
      }
      return moved;
    }

    case TreatmentType.EMERGENCY_DECOMPRESSION: {
      // Regresa un módulo rival a SU mano, descarta cartas unidas, rival descarta 1 carta más
      const targetSlot = getPlayerSlot(targetPlayer, targetColor);

      if (!targetSlot?.organCard) return false;

      // El órgano vuelve a la mano del RIVAL (targetPlayer)
      targetPlayer.hand.push(targetSlot.organCard);

      // Descartar virus y medicinas unidas
      gameState.discardPile.push(...targetSlot.virusCards);
      gameState.discardPile.push(...targetSlot.medicineCards);

      // Limpiar el slot
      clearSlot(targetSlot);

      // El rival descarta 1 carta adicional de su mano
      if (targetPlayer.hand.length > 0) {
        // Descartar la última carta (que podría ser el órgano que acabamos de agregar o una existente)
        // Para ser más predecible, descartamos la primera carta de la mano
        const discardedIndex = 0; // Primera carta
        const discardedCard = targetPlayer.hand.splice(discardedIndex, 1)[0];
        gameState.discardPile.push(discardedCard);
      }

      sendNotificationToPlayer(roomId, targetPlayer.id, `⚠️ ${player.name} usó ${TREATMENT_LABELS[TreatmentType.EMERGENCY_DECOMPRESSION]}: ¡Tu sistema fue regresado a tu mano y perdiste las mejoras!`, 'warning');
      sendNotificationToPlayer(roomId, player.id, `✅ ${TREATMENT_LABELS[TreatmentType.EMERGENCY_DECOMPRESSION]}: El sistema de ${targetPlayer.name} regresó a su mano`, 'success');
      logger.logTreatmentCard(player.name, 'EMERGENCY_DECOMPRESSION', targetPlayer.name);
      return true;
    }

    case TreatmentType.DATA_PIRACY: {
      // Roba un módulo de un oponente (con sus cartas unidas)
      const targetSlot = getPlayerSlot(targetPlayer, targetColor);
      const playerSlot = getPlayerSlot(player, targetColor);

      if (!targetSlot?.organCard) return false;
      if (getOrganState(targetSlot) === OrganState.IMMUNIZED) return false;
      if (playerSlot?.organCard) return false;

      if (playerSlot) {
        transferSlotContents(targetSlot, playerSlot);
        clearSlot(targetSlot);
        logger.logTreatmentCard(player.name, 'DATA_PIRACY', targetPlayer.name);
      }
      return true;
    }

    case TreatmentType.QUANTUM_DESYNC: {
      // El oponente objetivo descarta una carta de su mano
      if (targetPlayer.hand.length > 0) {
        const discardedCard = targetPlayer.hand.pop()!;
        gameState.discardPile.push(discardedCard);
        sendNotificationToPlayer(roomId, targetPlayer.id, `⚡ ${player.name} usó ${TREATMENT_LABELS[TreatmentType.QUANTUM_DESYNC]}: ¡Has perdido una carta!`, 'warning');
        logger.logTreatmentCard(player.name, 'QUANTUM_DESYNC', targetPlayer.name);
        return true;
      }
      return false;
    }

    case TreatmentType.PROTOCOL_ERROR: {
      console.log('🔍 PROTOCOL_ERROR - Inicio');
      console.log('🔍 Jugador:', player.name, 'Mano antes:', player.hand.map(c => `${c.type}-${c.color}`));
      console.log('🔍 TargetPlayer:', targetPlayer.name, 'TargetColor:', targetColor);

      // Descarta una carta de tu mano para descartar un virus objetivo
      if (player.hand.length === 0) {
        console.log('❌ PROTOCOL_ERROR - Fallo: mano vacía');
        return false;
      }

      const targetSlot = getPlayerSlot(targetPlayer, targetColor);
      console.log('🔍 TargetSlot:', targetSlot ? 'existe' : 'NO existe', 'Virus:', targetSlot?.virusCards.length || 0);

      if (!targetSlot || targetSlot.virusCards.length === 0) {
        console.log('❌ PROTOCOL_ERROR - Fallo: no hay virus objetivo');
        return false;
      }

      // Descartar la carta de tratamiento primero (para asegurar que se elimine)
      const treatmentCardIndex = player.hand.findIndex(c => c.id === card.id);
      console.log('🔍 Índice carta tratamiento:', treatmentCardIndex);

      if (treatmentCardIndex !== -1) {
        player.hand.splice(treatmentCardIndex, 1);
        gameState.discardPile.push(card);
        console.log('✅ Carta tratamiento eliminada de mano');
      }

      // Descartar otra carta de la mano del jugador (la última, como antes)
      if (player.hand.length > 0) {
        const discardedCard = player.hand.pop()!;
        gameState.discardPile.push(discardedCard);
        console.log('✅ Carta adicional descartada:', discardedCard.type, discardedCard.color);
      }

      console.log('🔍 Mano después:', player.hand.map(c => `${c.type}-${c.color}`));

      // Eliminar un virus del slot objetivo
      const virus = targetSlot.virusCards.pop()!;
      gameState.discardPile.push(virus);
      console.log('✅ Virus eliminado del slot');

      const systemName = COLOR_SYSTEM_LABELS[targetColor];
      sendNotificationToPlayer(roomId, player.id, `⚡ ERROR DE PROTOCOLO: Descartaste 1 carta adicional + carta de tratamiento. Eliminaste 1 virus de ${systemName}`, 'success');
      if (player.id !== targetPlayer.id) {
        sendNotificationToPlayer(roomId, targetPlayer.id, `⚠️ ${player.name} usó ERROR DE PROTOCOLO en tu sistema ${systemName}`, 'warning');
      }
      logger.logTreatmentCard(player.name, 'PROTOCOL_ERROR', targetPlayer.name);
      console.log('✅ PROTOCOL_ERROR - Completado con éxito');
      return true;
    }

    case TreatmentType.SINGULARITY: {
      // Intercambia todos los sistemas entre dos jugadores
      console.log('🔍 SINGULARITY - Buscando segundo jugador ID:', secondTargetPlayerId);
      const secondTargetPlayer = gameState.players.find(p => p.id === secondTargetPlayerId);
      console.log('🔍 SINGULARITY - Jugadores en juego:', gameState.players.map(p => `${p.name} (${p.id})`));
      console.log('🔍 SINGULARITY - targetPlayer:', targetPlayer.name, `(${targetPlayer.id})`);
      console.log('🔍 SINGULARITY - secondTargetPlayer:', secondTargetPlayer?.name || 'NOT FOUND');

      if (!secondTargetPlayer) {
        console.log('❌ SINGULARITY - Fallo: secondTargetPlayer no encontrado');
        return false;
      }

      swapPlayerBodies(targetPlayer, secondTargetPlayer);

      sendNotificationToPlayer(roomId, targetPlayer.id, `🌀 SINGULARIDAD: ¡Tus sistemas han sido intercambiados con ${secondTargetPlayer.name}!`, 'warning');
      sendNotificationToPlayer(roomId, secondTargetPlayer.id, `🌀 SINGULARIDAD: ¡Tus sistemas han sido intercambiados con ${targetPlayer.name}!`, 'warning');
      logger.logTreatmentCard(player.name, 'SINGULARITY', `${targetPlayer.name} ↔ ${secondTargetPlayer.name}`);
      return true;
    }

    case TreatmentType.EVENT_HORIZON: {
      // Todos los oponentes descartan su mano completa
      gameState.players.filter(p => p.id !== player.id).forEach(p => {
        gameState.discardPile.push(...p.hand);
        p.hand = [];
        sendNotificationToPlayer(roomId, p.id, `⚡ ${player.name} usó ${TREATMENT_LABELS[TreatmentType.EVENT_HORIZON]}: ¡Has perdido todas tus cartas!`, 'warning');
      });
      logger.logTreatmentCard(player.name, 'EVENT_HORIZON');
      return true;
    }

    case TreatmentType.BACKUP_SYSTEM: {
      console.log('🔍 BACKUP_SYSTEM - Inicio');
      console.log('🔍 BACKUP_SYSTEM - Descarte tiene', gameState.discardPile.length, 'cartas');
      console.log('🔍 BACKUP_SYSTEM - Órganos en descarte:', gameState.discardPile.filter(c => c.type === CardType.ORGAN).map(c => c.color));

      // Recupera un órgano destruido del descarte y lo coloca en el slot
      const targetSlot = getPlayerSlot(player, targetColor);

      // Solo puede recuperar en slots vacíos (donde había un órgano destruido)
      if (targetSlot?.organCard) {
        console.log('❌ BACKUP_SYSTEM - Slot no vacío');
        return false;
      }

      // Buscar un órgano del color correcto en el descarte
      const organIndex = gameState.discardPile.findIndex(c =>
        c.type === CardType.ORGAN &&
        (c.color === targetColor || c.color === Color.MULTICOLOR)
      );

      console.log('🔍 BACKUP_SYSTEM - Buscando', targetColor, 'ó MULTICOLOR. Índice:', organIndex);

      if (organIndex === -1) {
        console.log('❌ BACKUP_SYSTEM - No se encontró órgano');
        return false;
      }

      // Recuperar el órgano
      const organ = gameState.discardPile.splice(organIndex, 1)[0];
      targetSlot!.organCard = organ;

      console.log('✅ BACKUP_SYSTEM - Órgano recuperado:', organ.color);
      sendNotificationToPlayer(roomId, player.id, `💾 SISTEMA DE RESPALDO: ¡Recuperaste un ${COLOR_SYSTEM_LABELS[targetColor]} del descarte!`, 'success');
      logger.logTreatmentCard(player.name, 'BACKUP_SYSTEM', targetColor);
      return true;
    }

    default:
      return false;
  }
}

export function handleGameAction(roomId: string, playerId: string, action: any): void {
  const room = getRoom(roomId);
  if (!room) return;

  const { gameState } = room;
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return;

  const playerIndex = gameState.players.indexOf(player);
  const logger = getGameLogger(roomId);
  console.log(action)

  switch (action.type) {
    case 'play-card': {
      if (gameState.currentPlayerIndex !== playerIndex) return;

      const { card, targetPlayerId, targetColor, sourceColor, secondTargetPlayerId, sourcePlayerId } = action;
      const targetPlayer = gameState.players.find(p => p.id === targetPlayerId);

      console.log('🔍 DEBUG - card.type:', card.type, '=== TREATMENT?', card.type === 'TREATMENT');
      console.log('🔍 DEBUG - canPlayCard:', targetPlayer ? canPlayCard(card, player, targetPlayer, targetColor, gameState, sourceColor, sourcePlayerId) : 'no targetPlayer');
      console.log('🔍 DEBUG - card.treatmentType:', card.treatmentType);

      if (targetPlayer && canPlayCard(card, player, targetPlayer, targetColor, gameState, sourceColor, sourcePlayerId)) {
        if (card.type === 'TREATMENT') {
          console.log('✅ ENTRANDO A TREATMENT BLOCK');
          const success = handleTreatmentCard(roomId, player, targetPlayer, card, targetColor, sourceColor, secondTargetPlayerId, sourcePlayerId);
          if (success) {
            playCard(gameState, player, card);
            const narration = getCardActionMessage(card, player.name, targetPlayer.name, targetColor);
            broadcastNarration(roomId, narration);

            const winner = checkGameVictory(gameState);
            if (winner && !gameState.gameEnded) {
              gameState.gameEnded = true;
              gameState.winner = winner;
              logger.logGameEnded(winner.name);
            }
          } else {
            const cardName = card.name || (CARD_TYPE_LABELS as any)[card.type] || 'carta';
            sendNotificationToPlayer(roomId, playerId, `❌ La carta ${cardName} falló: no se pudo ejecutar la acción`, 'warning');
          }
        } else {
          const targetSlot = getSlotFromBody(targetPlayer.body, targetColor);
          if (targetSlot) {
            if (card.type === 'ORGAN') {
              targetSlot.organCard = card;
            } else if (card.type === 'VIRUS') {
              handleVirusCard(card, targetSlot, gameState.discardPile);
            } else if (card.type === 'MEDICINE') {
              handleMedicineCard(card, targetSlot, gameState.discardPile);
            }
            playCard(gameState, player, card);

            const narration = getCardActionMessage(card, player.name, targetPlayer.name, targetColor);
            broadcastNarration(roomId, narration);

            logger.logCardPlayed(player.name, card.type, targetColor);

            const winner = checkGameVictory(gameState);
            if (winner && !gameState.gameEnded) {
              gameState.gameEnded = true;
              gameState.winner = winner;
              logger.logGameEnded(winner.name);
            }
          }
        }
        broadcastGameState(roomId, gameState);
      }
      break;
    }

    case 'discard-cards': {
      if (gameState.currentPlayerIndex !== playerIndex) return;
      const { cards } = action;
      discardCards(gameState, player, cards);
      cards.forEach((card: Card) => logger.logCardDiscarded(player.name, card.type));
      broadcastNarration(roomId, `${player.name} descartó ${cards.length} carta${cards.length > 1 ? 's' : ''}`);
      broadcastGameState(roomId, gameState);
      break;
    }

    case 'end-turn': {
      if (gameState.currentPlayerIndex !== playerIndex) return;
      const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
      const nextPlayer = gameState.players[nextPlayerIndex];
      nextTurn(gameState);
      logger.logTurnStarted(nextPlayer.name, nextPlayerIndex);
      broadcastNarration(roomId, `Turno de ${nextPlayer.name}`);
      broadcastGameState(roomId, gameState);
      break;
    }

    case 'restart-game': {
      if (!gameState.gameEnded) return;
      initializeGame(gameState);

      // Emitir evento específico para que el cliente sepa que el juego se reinició
      if (io) {
        io.to(roomId).emit('game-restarted', { gameState: serializeGameState(gameState) });
      }

      logger.logGameStarted();
      break;
    }

    default:
      break;
  }
}

function getCardActionMessage(card: Card, playerName: string, targetPlayerName: string, targetColor: Color): string {
  const systemName = COLOR_SYSTEM_LABELS[targetColor];
  const isSelf = playerName === targetPlayerName;

  if (card.type === 'ORGAN') {
    return `${playerName} instaló el sistema ${systemName}`;
  }
  if (card.type === 'VIRUS') {
    if (isSelf) {
      return `${playerName} sabotó su propio sistema ${systemName}`;
    }
    return `${playerName} sabotó el sistema ${systemName} de ${targetPlayerName}`;
  }
  if (card.type === 'MEDICINE') {
    if (isSelf) {
      return `${playerName} reparó su sistema ${systemName}`;
    }
    return `${playerName} reparó el sistema ${systemName} de ${targetPlayerName}`;
  }
  if (card.type === 'TREATMENT') {
    if (card.treatmentType === TreatmentType.ENERGY_TRANSFER) {
      return `${playerName} transfirió energía del sistema ${systemName} de ${targetPlayerName}`;
    }
    if (card.treatmentType === TreatmentType.EMERGENCY_DECOMPRESSION) {
      return `${playerName} descomprimió el sistema ${systemName} de ${targetPlayerName}`;
    }
    if (card.treatmentType === TreatmentType.DATA_PIRACY) {
      return `${playerName} pirateó el sistema ${systemName} de ${targetPlayerName}`;
    }
    if (card.treatmentType === TreatmentType.QUANTUM_DESYNC) {
      return `${playerName} desincronizó cuánticamente a ${targetPlayerName}`;
    }
    if (card.treatmentType === TreatmentType.PROTOCOL_ERROR) {
      return `${playerName} provocó un error de protocolo en el sistema ${systemName} de ${targetPlayerName}`;
    }
    if (card.treatmentType === TreatmentType.SINGULARITY) {
      return `${playerName} activó una SINGULARIDAD`;
    }
    if (card.treatmentType === TreatmentType.EVENT_HORIZON) {
      return `${playerName} activó el HORIZONTE DE SUCESOS`;
    }
  }

  return `${playerName} jugó una carta`;
}
