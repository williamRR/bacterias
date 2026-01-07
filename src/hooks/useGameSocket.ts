import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState } from '@/game/types';

interface UseGameSocketOptions {
  roomId: string;
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
  currentPlayerIdRef: React.MutableRefObject<string | null>;
}

export function useGameSocket({
  roomId,
  onGameState,
  onGameStarted,
  onRoomJoined,
  onPlayerJoined,
  onPlayersList,
  onPlayerLeft,
  onJoinError,
  onPlayerNotification,
  onNarration,
  onGameRestarted,
  onTurnChange,
  currentPlayerIdRef,
}: UseGameSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const previousTurnIndexRef = useRef(0);
  const currentPlayerIdRefLocal = useRef<string | null>(null);

  // Store callbacks in refs to avoid reconnection on callback changes
  const callbacksRef = useRef({
    onGameState,
    onGameStarted,
    onRoomJoined,
    onPlayerJoined,
    onPlayersList,
    onPlayerLeft,
    onJoinError,
    onPlayerNotification,
    onNarration,
    onGameRestarted,
    onTurnChange,
  });

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = {
      onGameState,
      onGameStarted,
      onRoomJoined,
      onPlayerJoined,
      onPlayersList,
      onPlayerLeft,
      onJoinError,
      onPlayerNotification,
      onNarration,
      onGameRestarted,
      onTurnChange,
    };
  });

  useEffect(() => {
    if (socketRef.current) {
      return;
    }

    // Obtener nombre del localStorage
    let name = localStorage.getItem('playerName');
    if (!name) {
      name = prompt(`Ingresa tu nombre, explorador espacial:`);
      if (!name) {
        alert('Necesitas identificarte para la misión');
        window.location.href = '/';
        return;
      }
      localStorage.setItem('playerName', name);
    }

    // Obtener o generar browserId único para este navegador
    let browserId = localStorage.getItem('browserId');
    if (!browserId) {
      browserId = 'browser_' + Math.random().toString(36).substring(2, 15) + Date.now();
      localStorage.setItem('browserId', browserId);
    }

    // Usar el host actual para permitir conexiones remotas (tailnet, etc)
    const getSocketUrl = () => {
      if (process.env.NEXT_PUBLIC_SOCKET_SERVER_URL) {
        return process.env.NEXT_PUBLIC_SOCKET_SERVER_URL;
      }
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const port = window.location.port || '3012';
      return `${protocol}//${hostname}:${port}`;
    };

    const socketUrl = getSocketUrl();

    const newSocket = io(socketUrl, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err);
    });

    newSocket.connect();
    socketRef.current = newSocket;

    // Esperar a que el socket esté conectado para obtener el ID
    newSocket.on('connect', () => {
      if (newSocket.id) {
        currentPlayerIdRefLocal.current = browserId;
        currentPlayerIdRef.current = browserId;
      }
      newSocket.emit('join-room', { roomId, playerName: name, browserId });
    });

    newSocket.on('join-error', (data: { error: string; message: string }) => {
      callbacksRef.current.onJoinError(data);
      // Redirigir al home según el tipo de error
      if (data.error === 'room_not_found' || data.error === 'game_already_started') {
        window.location.href = '/';
      }
    });

    newSocket.on('room-joined', (data: { roomId: string; playerId: string; players: any[] }) => {
      currentPlayerIdRefLocal.current = data.playerId;
      currentPlayerIdRef.current = data.playerId;
      callbacksRef.current.onRoomJoined(data);
    });

    newSocket.on('player-joined', (data: { playerId: string; playerName: string; players: any[] }) => {
      callbacksRef.current.onPlayerJoined(data);
    });

    newSocket.on('players-list', (data: { players: any[] }) => {
      callbacksRef.current.onPlayersList(data);
    });

    newSocket.on('player-left', (data: { playerId: string; players: any[] }) => {
      callbacksRef.current.onPlayerLeft(data);
    });

    newSocket.on('game-started', (data: { gameState: GameState }) => {
      previousTurnIndexRef.current = data.gameState.currentPlayerIndex;
      callbacksRef.current.onGameStarted(data.gameState);
    });

    newSocket.on('game-state', (state: GameState) => {
      const newTurnIndex = state.currentPlayerIndex;
      const currentTurnPlayer = state.players[newTurnIndex];
      const isMyTurn = currentTurnPlayer?.id === currentPlayerIdRefLocal.current;

      // Detectar cambio de turno hacia mí
      if (newTurnIndex !== previousTurnIndexRef.current) {
        callbacksRef.current.onTurnChange(isMyTurn, newTurnIndex, currentPlayerIdRefLocal.current!);
        previousTurnIndexRef.current = newTurnIndex;
      }

      callbacksRef.current.onGameState(state);
    });

    newSocket.on('player-notification', (data: { playerId: string; message: string; type: string }) => {
      callbacksRef.current.onPlayerNotification(data);
    });

    newSocket.on('narration', (data: { message: string; senderId?: string }) => {
      callbacksRef.current.onNarration(data);
    });

    newSocket.on('game-restarted', (data: { gameState: GameState }) => {
      previousTurnIndexRef.current = data.gameState.currentPlayerIndex;
      callbacksRef.current.onGameRestarted(data.gameState);
    });

    newSocket.on('error', ({ message }: { message: string }) => {
      alert(message);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [roomId, currentPlayerIdRef]);

  return socketRef;
}
