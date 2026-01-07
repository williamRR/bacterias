import { Socket } from 'socket.io-client';
import { GameState } from '@/game/types';

export interface SocketCallbacks {
  onGameState: (state: GameState) => void;
  onGameStarted: (state: GameState) => void;
  onRoomJoined: (data: { roomId: string; playerId: string; players: any[] }) => void;
  onPlayerJoined: (data: { playerId: string; playerName: string; players: any[] }) => void;
  onPlayersList: (data: { players: any[] }) => void;
  onPlayerLeft: (data: { playerId: string; players: any[] }) => void;
  onJoinError: (data: { error: string; message: string }) => void;
  onPlayerNotification: (data: { playerId: string; message: string; type: string }) => void;
  onNarration: (data: { message: string; senderId?: string }) => void;
  onGameRestarted: (state: GameState) => void;
  onTurnChange: (isMyTurn: boolean, playerIndex: number, currentPlayerId: string) => void;
  onTurnTick?: (remaining: number) => void;
  onTurnTimeout?: (data: { playerId: string }) => void;
}

export function setupSocketEventHandlers(
  socket: Socket,
  callbacks: SocketCallbacks,
  currentPlayerIdRef: React.MutableRefObject<string | null>,
  previousTurnIndexRef: React.MutableRefObject<number>,
  currentPlayerIdRefLocal: React.MutableRefObject<string | null>
): void {
  socket.on('connect', () => {
    if (socket.id) {
      currentPlayerIdRefLocal.current = currentPlayerIdRef.current;
    }
  });

  socket.on('join-error', (data: { error: string; message: string }) => {
    callbacks.onJoinError(data);
    if (data.error === 'room_not_found' || data.error === 'game_already_started') {
      window.location.href = '/';
    }
  });

  socket.on('room-joined', (data: { roomId: string; playerId: string; players: any[] }) => {
    currentPlayerIdRefLocal.current = data.playerId;
    currentPlayerIdRef.current = data.playerId;
    callbacks.onRoomJoined(data);
  });

  socket.on('player-joined', (data: { playerId: string; playerName: string; players: any[] }) => {
    callbacks.onPlayerJoined(data);
  });

  socket.on('players-list', (data: { players: any[] }) => {
    callbacks.onPlayersList(data);
  });

  socket.on('player-left', (data: { playerId: string; players: any[] }) => {
    callbacks.onPlayerLeft(data);
  });

  socket.on('game-started', (data: { gameState: GameState }) => {
    previousTurnIndexRef.current = data.gameState.currentPlayerIndex;
    callbacks.onGameStarted(data.gameState);
  });

  socket.on('game-state', (state: GameState) => {
    const newTurnIndex = state.currentPlayerIndex;
    const currentTurnPlayer = state.players[newTurnIndex];
    const isMyTurn = currentTurnPlayer?.id === currentPlayerIdRefLocal.current;

    if (newTurnIndex !== previousTurnIndexRef.current) {
      callbacks.onTurnChange(isMyTurn, newTurnIndex, currentPlayerIdRefLocal.current!);
      previousTurnIndexRef.current = newTurnIndex;
    }

    callbacks.onGameState(state);
  });

  socket.on('player-notification', (data: { playerId: string; message: string; type: string }) => {
    callbacks.onPlayerNotification(data);
  });

  socket.on('narration', (data: { message: string; senderId?: string }) => {
    callbacks.onNarration(data);
  });

  socket.on('game-restarted', (data: { gameState: GameState }) => {
    previousTurnIndexRef.current = data.gameState.currentPlayerIndex;
    callbacks.onGameRestarted(data.gameState);
  });

  socket.on('turn-tick', (data: { remaining: number }) => {
    if (callbacks.onTurnTick) {
      callbacks.onTurnTick(data.remaining);
    }
  });

  socket.on('turn-timeout', (data: { playerId: string }) => {
    if (callbacks.onTurnTimeout) {
      callbacks.onTurnTimeout(data);
    }
  });

  socket.on('error', ({ message }: { message: string }) => {
    alert(message);
  });
}

export function setupSocketConnection(
  socket: Socket,
  roomId: string,
  playerName: string,
  browserId: string
): void {
  socket.connect();
  socket.emit('join-room', { roomId, playerName, browserId });
}
