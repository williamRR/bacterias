import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState } from '@/game/types';
import { getSocketUrl, getPlayerName, getBrowserId } from '@/utils/socketUtils';
import { setupSocketEventHandlers, setupSocketConnection, type SocketCallbacks } from '@/utils/socketEventHandlers';

interface UseGameSocketOptions {
  roomId: string;
  onGameState: (state: GameState) => void;
  onGameStarted: (state: GameState) => void;
  onRoomJoined: (data: { roomId: string; playerId: string; players: any[]; turnTimeLimit?: number | null }) => void;
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
  onTurnTick,
  onTurnTimeout,
  currentPlayerIdRef,
}: UseGameSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const previousTurnIndexRef = useRef(0);
  const currentPlayerIdRefLocal = useRef<string | null>(null);

  const callbacksRef = useRef<SocketCallbacks>({
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
    onTurnTick,
    onTurnTimeout,
  });

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
      onTurnTick,
      onTurnTimeout,
    };
  });

  useEffect(() => {
    if (socketRef.current) {
      return;
    }

    const socketUrl = getSocketUrl();
    const playerName = getPlayerName();
    const browserId = getBrowserId();

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

    setupSocketConnection(newSocket, roomId, playerName, browserId);

    setupSocketEventHandlers(
      newSocket,
      callbacksRef.current,
      currentPlayerIdRef,
      previousTurnIndexRef,
      currentPlayerIdRefLocal
    );

    socketRef.current = newSocket;

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [roomId, currentPlayerIdRef]);

  return socketRef;
}
