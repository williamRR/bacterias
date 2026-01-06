import { GameState, Card, Player, Color, TreatmentType, OrganSlot, OrganState } from '../game/types';
import { nextTurn, playCard, discardCards, drawCards, initializeGame, checkGameVictory } from '../game/engine';
import { canPlayCard, canPerformTransplant, canPerformOrganThief, getOrganState } from '../game/validation';
import { getRoom, rooms } from './rooms';
import { Server as SocketIOServer } from 'socket.io';
import { getSlotFromBody, setSlotInBody, getBodyEntries, serializeBody, initializeEmptySlot } from '../game/body-utils';
import { swapSlotContents, transferSlotContents, clearSlot, swapPlayerBodies, getPlayerSlot } from '../utils/slotOperations';
import { handleVirusCard, handleMedicineCard } from '../utils/cardHandlers';
import { gameLogger } from '../game/logger';
import { COLOR_SYSTEM_LABELS, CARD_TYPE_LABELS } from '../game/theme';

function serializeGameState(gameState: GameState): any {
  const serialized = {
    ...gameState,
    players: gameState.players.map((player) => ({
      ...player,
      body: serializeBody(player.body),
    })),
  };

  console.log('=== SERIALIZED GAME STATE ===');
  serialized.players.forEach((player, index) => {
    console.log(`Player ${index} (${player.name}):`);
    console.log(`  Hand: ${player.hand.length} cards`);
    console.log(`  Body: ${Object.keys(player.body).length} slots`);
  });

  return serialized;
}

let io: SocketIOServer | null = null;

function setIOInstance(socketIO: SocketIOServer): void {
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
    if (card.treatmentType === TreatmentType.TRANSPLANT) {
      return `${playerName} intercambió sistemas con ${targetPlayerName}`;
    }
    if (card.treatmentType === TreatmentType.ORGAN_THIEF) {
      return `${playerName} robó el sistema ${systemName} de ${targetPlayerName}`;
    }
    if (card.treatmentType === TreatmentType.LATEX_GLOVE) {
      return `${playerName} activó interferencia electromagnética`;
    }
    if (card.treatmentType === TreatmentType.MEDICAL_ERROR) {
      return `${playerName} intercambió todos sus sistemas con ${targetPlayerName}`;
    }
  }

  return `${playerName} jugó una carta`;
}

function handleTreatmentCard(roomId: string, player: Player, targetPlayer: Player, card: Card, targetColor: Color, sourceColor?: Color): boolean {
  const room = getRoom(roomId);
  if (!room || !card.treatmentType) return false;

  const { gameState } = room;

  // Log antes de ejecutar la carta de tratamiento
  gameLogger.logTreatmentCardPlayed(card, player.name, targetPlayer.name, {
    targetColor,
    sourceColor,
  });

  switch (card.treatmentType) {
    case TreatmentType.TRANSPLANT: {
      const srcColor = sourceColor || targetColor;
      const playerSlot = getPlayerSlot(player, srcColor);
      const targetSlot = getPlayerSlot(targetPlayer, targetColor);

      gameLogger.debug(`TRANSPLANT: srcColor=${srcColor}, targetColor=${targetColor}`);

      if (!targetSlot?.organCard || !playerSlot) {
        gameLogger.warning(`TRANSPLANT falló: targetSlot o playerSlot inválido`, {
          targetSlotHasOrgan: !!targetSlot?.organCard,
          playerSlotExists: !!playerSlot,
        });
        return false;
      }

      if (playerSlot.organCard) {
        // Ambos tienen órganos - intercambiar
        gameLogger.info(`TRANSPLANT: Intercambiando sistemas`);
        swapSlotContents(playerSlot, targetSlot);
      } else {
        // Solo el target tiene órgano - transferir
        gameLogger.info(`TRANSPLANT: Transfiriendo sistema`);
        transferSlotContents(targetSlot, playerSlot);
        clearSlot(targetSlot);
      }

      gameLogger.logAllPlayersState(gameState);
      return true;
    }

    case TreatmentType.ORGAN_THIEF: {
      const targetSlot = getPlayerSlot(targetPlayer, targetColor);
      const playerSlot = getPlayerSlot(player, targetColor);

      gameLogger.debug(`ORGAN_THIEF: targetColor=${targetColor}`, {
        targetSlotHasOrgan: !!targetSlot?.organCard,
        targetSlotState: targetSlot ? getOrganState(targetSlot) : 'NO_SLOT',
        playerSlotHasOrgan: !!playerSlot?.organCard,
      });

      if (!targetSlot?.organCard) {
        gameLogger.warning(`ORGAN_THIEF falló: targetSlot no tiene órgano`);
        return false;
      }
      if (getOrganState(targetSlot) === OrganState.IMMUNIZED) {
        gameLogger.warning(`ORGAN_THIEF falló: targetSlot está BLINDADO`);
        return false;
      }

      if (playerSlot) {
        transferSlotContents(targetSlot, playerSlot);
        clearSlot(targetSlot);
      }

      gameLogger.action(`ORGAN_THIEF: ${player.name} robó ${targetColor} de ${targetPlayer.name}`);
      gameLogger.logAllPlayersState(gameState);
      return true;
    }

    case TreatmentType.LATEX_GLOVE: {
      gameState.players.filter(p => p.id !== player.id).forEach(p => {
        gameState.discardPile.push(...p.hand);
        p.hand = [];
        // Enviar notificación personalizada al jugador afectado
        sendNotificationToPlayer(roomId, p.id, `⚡ ${player.name} usó INTERFERENCIA ELECTROMAGNÉTICA: ¡Has perdido todas tus cartas!`, 'warning');
      });
      return true;
    }

    case TreatmentType.MEDICAL_ERROR: {
      swapPlayerBodies(player, targetPlayer);

      sendNotificationToPlayer(roomId, player.id, `🌀 FALLO DE TELETRANSPORTE: ¡Tus sistemas han sido intercambiados con ${targetPlayer.name}!`, 'warning');
      sendNotificationToPlayer(roomId, targetPlayer.id, `🌀 FALLO DE TELETRANSPORTE: ¡Tus sistemas han sido intercambiados con ${player.name}!`, 'warning');

      return true;
    }

    default:
      return false;
  }
}

function handleGameAction(roomId: string, playerId: string, action: any): void {
  const room = getRoom(roomId);
  if (!room) return;

  const { gameState } = room;
  const player = gameState.players.find(p => p.id === playerId);

  if (!player || gameState.currentPlayerIndex !== gameState.players.indexOf(player)) {
    return;
  }

  switch (action.type) {
    case 'play-card': {
      const { card, targetPlayerId, targetColor, sourceColor } = action;
      const targetPlayer = gameState.players.find(p => p.id === targetPlayerId);

      gameLogger.debug(`play-card action`, {
        jugador: player.name,
        carta: card,
        targetPlayer: targetPlayer?.name,
        targetColor,
        sourceColor,
      });

      if (targetPlayer && canPlayCard(card, player, targetPlayer, targetColor, gameState)) {
        if (card.type === 'TREATMENT') {
          const success = handleTreatmentCard(roomId, player, targetPlayer, card, targetColor, sourceColor);
          if (success) {
            playCard(gameState, player, card);

            // Narrar la acción
            const narration = getCardActionMessage(card, player.name, targetPlayer.name, targetColor);
            broadcastNarration(roomId, narration);

            // Chequear victoria después de tratamiento
            const winner = checkGameVictory(gameState);
            if (winner && !gameState.gameEnded) {
              gameState.gameEnded = true;
              gameState.winner = winner;
              gameLogger.action(`🏆 ¡VICTORIA! ${winner.name} ha completado todos los sistemas`);
              gameLogger.logAllPlayersState(gameState);
            }
          } else {
            // Treatment card failed - notify the player
            const cardName = card.name || (CARD_TYPE_LABELS as any)[card.type] || 'carta';
            sendNotificationToPlayer(roomId, playerId, `❌ La carta ${cardName} falló: no se pudo ejecutar la acción`, 'warning');
          }
        } else {
          const targetSlot = getSlotFromBody(targetPlayer.body, targetColor);
          if (targetSlot) {
            const slotBefore = { ...targetSlot };

            if (card.type === 'ORGAN') {
              targetSlot.organCard = card;
              gameLogger.logCardPlayed(card, player.name, targetPlayer.name, targetColor);
            } else if (card.type === 'VIRUS') {
              handleVirusCard(card, targetSlot, gameState.discardPile);
              gameLogger.logCardPlayed(card, player.name, targetPlayer.name, targetColor);
            } else if (card.type === 'MEDICINE') {
              handleMedicineCard(card, targetSlot, gameState.discardPile);
              gameLogger.logCardPlayed(card, player.name, targetPlayer.name, targetColor);
            }
            playCard(gameState, player, card);

            // Narrar la acción
            const narration = getCardActionMessage(card, player.name, targetPlayer.name, targetColor);
            broadcastNarration(roomId, narration);

            gameLogger.logSlotChange(targetPlayer.name, targetColor, slotBefore, targetSlot, `Carta jugada: ${card.type}`);
            gameLogger.logAllPlayersState(gameState);

            // Chequear victoria automáticamente después de jugar una carta
            const winner = checkGameVictory(gameState);
            if (winner && !gameState.gameEnded) {
              gameState.gameEnded = true;
              gameState.winner = winner;
              gameLogger.action(`🏆 ¡VICTORIA! ${winner.name} ha completado todos los sistemas`);
              gameLogger.logAllPlayersState(gameState);
            }
          }
        }
        broadcastGameState(roomId, gameState);
      } else {
        gameLogger.warning(`play-card rechazado: canPlayCard retornó false`, {
          jugador: player.name,
          carta: card,
          targetPlayer: targetPlayer?.name,
          targetColor,
        });
      }
      break;
    }

    case 'discard-cards': {
      const { cards } = action;
      discardCards(gameState, player, cards);
      broadcastNarration(roomId, `${player.name} descartó ${cards.length} carta${cards.length > 1 ? 's' : ''}`);
      broadcastGameState(roomId, gameState);
      break;
    }

    case 'end-turn': {
      const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
      const nextPlayer = gameState.players[nextPlayerIndex];
      nextTurn(gameState);
      broadcastNarration(roomId, `Turno de ${nextPlayer.name}`);
      broadcastGameState(roomId, gameState);
      break;
    }

    case 'restart-game': {
      // Reiniciar el juego manteniendo a los mismos jugadores
      initializeGame(gameState);
      broadcastGameState(roomId, gameState);
      break;
    }

    default:
      break;
  }
}

export { setIOInstance, broadcastGameState, handleGameAction, serializeGameState, rooms };
