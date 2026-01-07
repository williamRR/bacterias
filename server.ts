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

      // Healthcheck endpoint para Railway
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
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  setIOInstance(io);

  io.on('connection', (socket) => {
    // Guardar el browserId en el socket para usarlo en eventos futuros
    socket.on('register-browser-id', ({ browserId }) => {
      (socket as any).browserId = browserId;
    });

    socket.on('create-room', ({ playerName, browserId }) => {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      (socket as any).browserId = browserId; // Guardar browserId
      createRoom(roomId, browserId || socket.id, playerName);
      socket.join(roomId);
      socket.emit('room-created', { roomId, playerId: browserId || socket.id });
    });

    socket.on('join-room', ({ roomId, playerName, browserId }) => {
      const playerId = browserId || socket.id;
      (socket as any).browserId = playerId; // Guardar browserId

      // Verificar si el jugador ya está en la sala (reconexión)
      const room = getRoom(roomId);
      const isReconnecting = room && room.players.has(playerId);

      if (isReconnecting) {
        // No hacer nada más, el jugador ya está en la sala con sus datos
        socket.join(roomId);

        // Enviar el estado actual del juego
        if (room.gameState.gameStarted) {
          const { serializeGameState } = require('./src/server/game-manager');
          socket.emit('game-started', { gameState: serializeGameState(room.gameState), reconnected: true });
        }

        socket.emit('room-joined', { roomId, playerId, players: getRoomPlayers(roomId), reconnected: true });
        return;
      }

      const result = joinRoom(roomId, playerId, playerName);

      // Manejar errores específicos
      if (result && 'error' in result) {
        socket.emit('join-error', { error: result.error, message: result.reason });
        return;
      }

      const joinedRoom = result;
      if (joinedRoom) {
        socket.join(roomId);

        // Juego no iniciado, comportamiento normal
        io.to(roomId).emit('player-joined', { playerId, playerName, players: getRoomPlayers(roomId) });
        socket.emit('room-joined', { roomId, playerId, players: getRoomPlayers(roomId) });
      } else {
        socket.emit('join-error', { error: 'room_not_found', message: 'Sala no encontrada' });
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
      const playerId = (socket as any).browserId || socket.id;
      // Enviar la acción de reiniciar juego al game manager
      console.log('restarting')
      handleGameAction(roomId, playerId, { type: 'restart-game' });
    });

    socket.on('game-action', ({ roomId, action }) => {
      const playerId = (socket as any).browserId || socket.id;
      handleGameAction(roomId, playerId, action);
    });

    socket.on('disconnect', () => {
      // Eliminar al jugador de todas las salas donde esté
      // Usar browserId si existe, sino usar socket.id
      const playerId = (socket as any).browserId || socket.id;
      const { deletePlayerFromRoom } = require('./src/server/rooms');
      deletePlayerFromRoom(playerId);
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
