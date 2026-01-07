import { GameState, Player, Card, Color } from '../game/types';
import { createDeck, shuffleDeck, dealCards } from '../game/deck';
import { OrganSlot } from '../game/types';
import { initializeGame } from '../game/engine';
import { getGameLogger, removeGameLogger } from './logger';

interface Room {
  id: string;
  players: Map<string, Player>;
  gameState: GameState;
  hostId: string;
  emptySince?: number;
  turnTimeLimit?: number | null;  // Límite de tiempo por turno en segundos (null = sin límite)
  turnTimer?: NodeJS.Timeout;     // Timer principal del turno (setTimeout)
  turnCountdownInterval?: NodeJS.Timeout;  // Intervalo de countdown (setInterval)
}

const rooms = new Map<string, Room>();

// Timeouts de desconexión pendientes (para permitir reconexión)
const disconnectTimeouts = new Map<string, NodeJS.Timeout>();

function createRoom(roomId: string, playerId: string, playerName: string, turnTimeLimit?: number | null): Room {
  const room: Room = {
    id: roomId,
    players: new Map(),
    gameState: {
      players: [],
      deck: [],
      discardPile: [],
      currentPlayerIndex: 0,
      gameStarted: false,
      gameEnded: false,
    },
    hostId: playerId,
    turnTimeLimit,
  };

  const player: Player = {
    id: playerId,
    name: playerName,
    hand: [],
    body: new Map<Color, OrganSlot>(),
  };

  room.players.set(playerId, player);

  rooms.set(roomId, room);
  getGameLogger(roomId).logPlayerJoined(playerName, playerId);
  return room;
}

function joinRoom(roomId: string, playerId: string, playerName: string): Room | { error: string; reason: string } | null {
  const room = rooms.get(roomId);
  if (!room) {
    return null;
  }

  // Si el jugador ya está en la sala, es una reconexión - retornar la sala sin modificar
  // La lógica de eliminación de la sesión antigua se maneja en server.ts
  if (room.players.has(playerId)) {
    return room;
  }

  // No permitir unirse si el juego ya está en curso (nuevos jugadores)
  if (room.gameState.gameStarted) {
    return {
      error: 'game_already_started',
      reason: 'La partida ya está en curso'
    };
  }

  if (room.players.size >= 4) {
    return {
      error: 'room_full',
      reason: 'La sala está llena'
    };
  }

  const player: Player = {
    id: playerId,
    name: playerName,
    hand: [],
    body: new Map<Color, OrganSlot>(),
  };

  room.players.set(playerId, player);

  // Limpiar emptySince si la sala estaba vacía
  if (room.emptySince !== undefined) {
    delete room.emptySince;
  }

  getGameLogger(roomId).logPlayerJoined(playerName, playerId);
  return room;
}

function startGame(roomId: string): boolean {
  const room = rooms.get(roomId);
  if (!room) {
    return false;
  }

  if (room.players.size < 2) {
    return false;
  }

  const deck = shuffleDeck(createDeck());
  const { deck: remainingDeck, playerHands } = dealCards(deck, room.players.size, 3);

  const logger = getGameLogger(roomId);
  const players = Array.from(room.players.values());
  players.forEach((player, index) => {
    player.hand = playerHands[index];
  });

  room.gameState.players = players;
  room.gameState.deck = remainingDeck;

  // Inicializar el juego (configura turnos y reparte cartas iniciales)
  initializeGame(room.gameState);

  logger.logGameStarted();

  return true;
}

function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

function deleteRoom(roomId: string): void {
  rooms.delete(roomId);
  removeGameLogger(roomId);
}

function getRoomPlayers(roomId: string): Player[] {
  const room = rooms.get(roomId);
  return room ? Array.from(room.players.values()) : [];
}

function deletePlayerFromRoom(playerId: string): void {
  // Cancelar cualquier timeout previo para este jugador
  const existingTimeout = disconnectTimeouts.get(playerId);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  // Programar la eliminación después de 5 segundos para permitir reconexión
  const timeout = setTimeout(() => {
    // Buscar el jugador en todas las salas y eliminarlo
    const roomsArray = Array.from(rooms.entries());
    for (const [roomId, room] of roomsArray) {
      if (room.players.has(playerId)) {
        const logger = getGameLogger(roomId);
        const player = room.players.get(playerId);
        const playerName = player?.name || playerId;

        room.players.delete(playerId);
        logger.logPlayerLeft(playerName, playerId);

        // Si la sala se queda vacía, marcarla para eliminación después de 5 minutos
        if (room.players.size === 0) {
          room.emptySince = Date.now();
          // Programar eliminación después de 5 minutos (300000 ms)
          setTimeout(() => {
            const currentRoom = rooms.get(roomId);
            if (currentRoom && currentRoom.emptySince && currentRoom.players.size === 0) {
              const timeSinceEmpty = Date.now() - currentRoom.emptySince;
              if (timeSinceEmpty >= 300000) {
                rooms.delete(roomId);
                removeGameLogger(roomId);
              }
            }
          }, 300000);
        } else {
          // Notificar a los demás jugadores que alguien salió
          const io = (global as any).io;
          if (io) {
            io.to(roomId).emit('player-left', { playerId, players: getRoomPlayers(roomId) });
          }
        }
        break;
      }
    }
    // Limpiar el timeout después de ejecutar
    disconnectTimeouts.delete(playerId);
  }, 5000); // 5 segundos de espera para reconexión

  disconnectTimeouts.set(playerId, timeout);
}

// Cancelar la eliminación de un jugador (cuando se reconecta)
function cancelPlayerDeletion(playerId: string): void {
  const timeout = disconnectTimeouts.get(playerId);
  if (timeout) {
    clearTimeout(timeout);
    disconnectTimeouts.delete(playerId);
  }
}

// Limpiar el timer de turno actual de una sala
function clearTurnTimer(roomId: string): void {
  const room = rooms.get(roomId);
  if (room?.turnTimer) {
    clearTimeout(room.turnTimer);
    room.turnTimer = undefined;
  }
  if (room?.turnCountdownInterval) {
    clearInterval(room.turnCountdownInterval);
    room.turnCountdownInterval = undefined;
  }
}

// Configurar un timer para el turno actual
function setTurnTimer(roomId: string, onTimeout: () => void): void {
  const room = rooms.get(roomId);
  console.log('⏱️ setTurnTimer called for room:', roomId, 'turnTimeLimit:', room?.turnTimeLimit);

  console.log('🔍 DEBUG room exists:', !!room);
  console.log('🔍 DEBUG turnTimeLimit value:', room?.turnTimeLimit);
  console.log('🔍 DEBUG turnTimeLimit === null:', room?.turnTimeLimit === null);
  console.log('🔍 DEBUG turnTimeLimit === undefined:', room?.turnTimeLimit === undefined);

  if (!room || room.turnTimeLimit === null || room.turnTimeLimit === undefined) {
    console.log('❌ setTurnTimer: No timer - room:', !!room, 'limit:', room?.turnTimeLimit);
    return; // No hay límite de tiempo
  }

  console.log('✅ setTurnTimer: Passed validation, creating timer');

  // Limpiar timer anterior si existe
  if (room.turnTimer) {
    clearTimeout(room.turnTimer);
  }
  if (room.turnCountdownInterval) {
    clearInterval(room.turnCountdownInterval);
  }

  const io = (global as any).io;
  const timeLimit = room.turnTimeLimit;

  // Emitir countdown cada segundo
  let remaining = timeLimit;
  console.log(`🔄 Starting countdown interval for room ${roomId}, limit: ${timeLimit}s`);
  const countdownInterval = setInterval(() => {
    console.log(`⏰ Interval fired - room ${roomId}, remaining: ${remaining}s`);
    if (io) {
      console.log(`⏰ Room ${roomId} - turn-tick: ${remaining}s - EMITTING`);
      io.to(roomId).emit('turn-tick', { remaining });
    }
    remaining--;

    if (remaining < 0) {
      console.log(`⏰ Countdown finished for room ${roomId}`);
      clearInterval(countdownInterval);
    }
  }, 1000);

  // Guardar la referencia del intervalo en la sala
  room.turnCountdownInterval = countdownInterval;

  // Timer principal que ejecuta el timeout
  room.turnTimer = setTimeout(() => {
    clearInterval(countdownInterval);
    onTimeout();
  }, timeLimit * 1000);
}

export { createRoom, joinRoom, startGame, getRoom, deleteRoom, getRoomPlayers, deletePlayerFromRoom, cancelPlayerDeletion, clearTurnTimer, setTurnTimer, rooms };
