import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as ServerIO } from 'socket.io';
import { createRoom, joinRoom, startGame, getRoomPlayers, getRoom, rooms } from './src/server/rooms';
import { handleGameAction, setIOInstance } from './src/server/game-manager';
import { gameLogger } from './src/game/logger';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3012', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      if (!req.url) {
        res.statusCode = 400;
        res.end('bad request');
        return;
      }

      // Endpoint para ver logs del juego
      if (req.url.startsWith('/api/logs')) {
        res.setHeader('Content-Type', 'application/json');
        const url = parse(req.url, true);
        const limit = url.query.limit ? parseInt(url.query.limit as string) : 100;

        const logs = gameLogger.getRecentLogs(limit);
        res.end(JSON.stringify({ logs, count: logs.length }, null, 2));
        return;
      }

      // Health check endpoint para Railway
      if (req.url === '/api/health') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
        return;
      }

      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new ServerIO(httpServer, {
    addTrailingSlash: false,
  });

  setIOInstance(io);

  io.on('connection', (socket) => {
    console.log(`=== CLIENTE CONECTADO: ${socket.id} ===`);

    socket.on('create-room', ({ playerName }) => {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      createRoom(roomId, socket.id, playerName);
      socket.join(roomId);
      socket.emit('room-created', { roomId, playerId: socket.id });
    });

    socket.on('join-room', ({ roomId, playerName }) => {
      console.log(`=== JOIN ROOM ===`);
      console.log('Room ID:', roomId);
      console.log('Player Name:', playerName);
      console.log('Socket ID:', socket.id);

      const room = joinRoom(roomId, socket.id, playerName);
      if (room) {
        console.log('Room found, joining...');
        socket.join(roomId);

        // Si el juego ya está en curso, enviar el estado actual
        if (room.gameState.gameStarted) {
          console.log('Game already in progress, sending current state');
          const { serializeGameState } = require('./src/server/game-manager');
          io.to(roomId).emit('player-joined', { playerId: socket.id, playerName, players: getRoomPlayers(roomId) });
          socket.emit('room-joined', { roomId, playerId: socket.id, players: getRoomPlayers(roomId) });
          // Enviar el estado del juego inmediatamente
          socket.emit('game-started', { gameState: serializeGameState(room.gameState) });
          // También emitir game-state para asegurar que tienen el estado más reciente
          io.to(roomId).emit('game-state', serializeGameState(room.gameState));
        } else {
          // Juego no iniciado, comportamiento normal
          io.to(roomId).emit('player-joined', { playerId: socket.id, playerName, players: getRoomPlayers(roomId) });
          socket.emit('room-joined', { roomId, playerId: socket.id, players: getRoomPlayers(roomId) });
        }
        console.log('Emitted room-joined event');
      } else {
        console.log('Room not found or full');
        socket.emit('error', { message: 'No se pudo unir a la sala' });
      }
    });

    socket.on('get-players', ({ roomId }) => {
      const players = getRoomPlayers(roomId);
      socket.emit('players-list', { players });
    });

    socket.on('start-game', ({ roomId }) => {
      const success = startGame(roomId);
      if (success) {
        const room = getRoom(roomId);
        if (room) {
          const { serializeGameState, broadcastGameState } = require('./src/server/game-manager');
          io.to(roomId).emit('game-started', { gameState: serializeGameState(room.gameState) });
        }
      } else {
        socket.emit('error', { message: 'No se pudo iniciar el juego' });
      }
    });

    socket.on('restart-game', ({ roomId }) => {
      // Enviar la acción de reiniciar juego al game manager
      handleGameAction(roomId, socket.id, { type: 'restart-game' });
    });

    socket.on('game-action', ({ roomId, action }) => {
      handleGameAction(roomId, socket.id, action);
    });

    socket.on('disconnect', () => {
      console.log(`Cliente desconectado: ${socket.id}`);
      // Eliminar al jugador de todas las salas donde esté
      const { deletePlayerFromRoom } = require('./src/server/rooms');
      deletePlayerFromRoom(socket.id);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
