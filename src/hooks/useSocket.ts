import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, Player } from '@/game/types';

interface UseSocketProps {
  roomId: string;
  playerName: string;
  onRoomJoined: (data: { roomId: string; playerId: string; players: Player[] }) => void;
  onPlayerJoined: (data: { playerId: string; playerName: string; players: Player[] }) => void;
  onPlayersList: (data: { players: Player[] }) => void;
  onPlayerLeft: (data: { playerId: string; players: Player[] }) => void;
  onGameStarted: (data: { gameState: GameState }) => void;
  onGameState: (state: GameState) => void;
  onError: (data: { message: string }) => void;
  onDisconnect: (reason: string) => void;
  onPlayerNotification: (data: { playerId: string; message: string; type: 'warning' | 'info' | 'success' }) => void;
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
}

export function useSocket({
  roomId,
  playerName,
  onRoomJoined,
  onPlayerJoined,
  onPlayersList,
  onPlayerLeft,
  onGameStarted,
  onGameState,
  onError,
  onDisconnect,
  onPlayerNotification,
}: UseSocketProps): UseSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const roomIdRef = useRef<string>(roomId);

  useEffect(() => {
    if (socketRef.current) {
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || undefined;
    const newSocket = io(socketUrl, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
    setSocket(newSocket);
    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      newSocket.emit('join-room', { roomId, playerName });
    });
    newSocket.connect();

    newSocket.on('room-joined', onRoomJoined);
    newSocket.on('player-joined', onPlayerJoined);
    newSocket.on('players-list', onPlayersList);
    newSocket.on('player-left', onPlayerLeft);
    newSocket.on('game-started', onGameStarted);
    newSocket.on('game-state', onGameState);
    newSocket.on('error', onError);
    newSocket.on('disconnect', onDisconnect);
    newSocket.on('player-notification', onPlayerNotification);

    return () => {
      const currentRoomId = roomIdRef.current;
      roomIdRef.current = roomId;

      if (socketRef.current && currentRoomId !== roomId) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [roomId, playerName]);

  const isConnected = socket?.connected ?? false;

  return { socket, isConnected };
}
