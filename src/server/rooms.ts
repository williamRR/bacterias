import { GameState, Player, Card, Color } from '../game/types';
import { createDeck, shuffleDeck, dealCards } from '../game/deck';
import { OrganSlot } from '../game/types';
import { initializeGame } from '../game/engine';

interface Room {
  id: string;
  players: Map<string, Player>;
  gameState: GameState;
  hostId: string;
  emptySince?: number;
}

const rooms = new Map<string, Room>();

function createRoom(roomId: string, playerId: string, playerName: string): Room {
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
  };

  const player: Player = {
    id: playerId,
    name: playerName,
    hand: [],
    body: new Map<Color, OrganSlot>(),
  };

  room.players.set(playerId, player);

  rooms.set(roomId, room);
  return room;
}

function joinRoom(roomId: string, playerId: string, playerName: string): Room | null {
  const room = rooms.get(roomId);
  if (!room) {
    return null;
  }

  if (room.players.size >= 4) {
    return null;
  }

  const player: Player = {
    id: playerId,
    name: playerName,
    hand: [],
    body: new Map<Color, OrganSlot>(),
  };

  room.players.set(playerId, player);

  // Si el juego ya está en curso, agregar el jugador al gameState también
  if (room.gameState.gameStarted) {
    console.log(`Joining in-progress game. Adding player ${playerName} to gameState`);
    room.gameState.players.push(player);

    // Dar cartas al nuevo jugador desde el mazo existente
    const cardsToDeal = Math.min(3, room.gameState.deck.length);
    for (let i = 0; i < cardsToDeal; i++) {
      player.hand.push(room.gameState.deck.pop()!);
    }
    console.log(`Player ${playerName} joined in-progress game with ${player.hand.length} cards from existing deck`);
  }

  // Limpiar emptySince si la sala estaba vacía
  if (room.emptySince !== undefined) {
    delete room.emptySince;
  }
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

  console.log('=== START GAME ===');
  console.log('Room ID:', roomId);
  console.log('Players:', room.players.size);
  console.log('Player hands:', playerHands.map(h => h.length));

  const players = Array.from(room.players.values());
  players.forEach((player, index) => {
    player.hand = playerHands[index];
    console.log(`Player ${index} (${player.name}): ${player.hand.length} cards`);
    player.hand.forEach(card => {
      console.log(`  - ${card.type} ${card.color} (${card.id})`);
    });
  });

  room.gameState.players = players;
  room.gameState.deck = remainingDeck;

  // Inicializar el juego (configura turnos y reparte cartas iniciales)
  initializeGame(room.gameState);

  console.log('After initializeGame:');
  room.gameState.players.forEach((player, index) => {
    console.log(`Player ${index} (${player.name}): ${player.hand.length} cards in hand`);
  });

  return true;
}

function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

function deleteRoom(roomId: string): void {
  rooms.delete(roomId);
}

function getRoomPlayers(roomId: string): Player[] {
  const room = rooms.get(roomId);
  return room ? Array.from(room.players.values()) : [];
}

function deletePlayerFromRoom(playerId: string): void {
  // Buscar el jugador en todas las salas y eliminarlo
  const roomsArray = Array.from(rooms.entries());
  for (const [roomId, room] of roomsArray) {
    if (room.players.has(playerId)) {
      console.log(`Eliminando jugador ${playerId} de la sala ${roomId}`);
      room.players.delete(playerId);

      // Si la sala se queda vacía, marcarla para eliminación después de 5 minutos
      if (room.players.size === 0) {
        console.log(`Sala ${roomId} vacía, marcando para eliminación futura`);
        room.emptySince = Date.now();
        // Programar eliminación después de 5 minutos (300000 ms)
        setTimeout(() => {
          const currentRoom = rooms.get(roomId);
          if (currentRoom && currentRoom.emptySince && currentRoom.players.size === 0) {
            const timeSinceEmpty = Date.now() - currentRoom.emptySince;
            if (timeSinceEmpty >= 300000) {
              console.log(`Sala ${roomId} eliminada después de 5 minutos vacía`);
              rooms.delete(roomId);
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
}

export { createRoom, joinRoom, startGame, getRoom, deleteRoom, getRoomPlayers, deletePlayerFromRoom, rooms };
