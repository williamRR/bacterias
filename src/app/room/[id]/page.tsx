'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { GameState, Player, Card, Color } from '@/game/types';
import { getOrganState } from '@/game/validation';
import GameBoard from '@/components/GameBoard';
import PlayerBoards from '@/components/PlayerBoards';
import Hand from '@/components/Hand';
import Narrator, { NotificationType } from '@/components/Narrator';
import { GAME_THEME, UI_LABELS } from '@/game/theme';
import RoomHeader from '@/components/RoomHeader';
import GameOverScreen from '@/components/GameOverScreen';
import LobbyScreen from '@/components/LobbyScreen';
import { useGameSocket } from '@/hooks/useGameSocket';
import { useGameActions } from '@/hooks/useGameActions';
import { playTurnNotificationSound } from '@/utils/audio';

interface RoomPageProps {
  params: {
    id: string;
  };
}

export default function RoomPage({ params }: RoomPageProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [dragTargetColor, setDragTargetColor] = useState<Color | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);

  const [gameLog, setGameLog] = useState<string[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [narratorMessage, setNarratorMessage] = useState<string | null>(null);
  const [narratorType, setNarratorType] = useState<NotificationType>('info');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const currentPlayerIdRef = useRef<string | null>(null);

  const notify = useCallback((message: string, type: NotificationType = 'info') => {
    setNarratorMessage(null);
    setTimeout(() => {
      setNarratorMessage(message);
      setNarratorType(type);
    }, 10);
  }, []);

  const addToGameLog = useCallback((message: string) => {
    setGameLog((prev) => {
      const newLog = [`${new Date().toLocaleTimeString()}: ${message}`, ...prev.slice(0, 19)];
      return newLog;
    });
  }, []);

  // Socket callbacks with useCallback to prevent reconnection loops
  const handleGameState = useCallback((state: GameState) => {
    setGameState(state);
    setCurrentTurnIndex(state.currentPlayerIndex);
  }, []);

  const handleGameStarted = useCallback((state: GameState) => {
    setGameState(state);
    setCurrentTurnIndex(state.currentPlayerIndex);
  }, []);

  const handleRoomJoined = useCallback(({ playerId, players: roomPlayers }: { playerId: string; players: Player[] }) => {
    setJoined(true);
    setPlayers(roomPlayers);
    setCurrentPlayerId(playerId);
    setPlayerName(localStorage.getItem('playerName') || '');
    notify(`¡Te has unido al sector ${params.id}!`, 'success');
    addToGameLog(`Te has unido a la sala ${params.id}`);
  }, [params.id, notify, addToGameLog]);

  const handlePlayerJoined = useCallback(({ playerName: newPlayerName, players: roomPlayers }: { playerName: string; players: Player[] }) => {
    notify(`¡${newPlayerName} ha sido asignado a la misión!`, 'info');
    if (roomPlayers) setPlayers(roomPlayers);
    addToGameLog(`${newPlayerName} se ha unido a la sala`);
  }, [notify, addToGameLog]);

  const handlePlayersList = useCallback(({ players: roomPlayers }: { players: Player[] }) => {
    setPlayers(roomPlayers);
  }, []);

  const handlePlayerLeft = useCallback(({ players: roomPlayers }: { players: Player[] }) => {
    setPlayers(roomPlayers);
    addToGameLog('Un jugador ha dejado la sala');
  }, [addToGameLog]);

  const handleJoinError = useCallback(({ message }: { message: string }) => {
    alert(message);
  }, []);

  const handlePlayerNotification = useCallback(({ playerId, message, type }: { playerId: string; message: string; type: string }) => {
    if (playerId === currentPlayerIdRef.current) {
      notify(message, type as NotificationType);
    }
  }, [notify]);

  const handleNarration = useCallback(({ message, senderId }: { message: string; senderId?: string }) => {
    if (senderId !== currentPlayerIdRef.current) {
      notify(message, 'info');
    }
  }, [notify]);

  const handleGameRestarted = useCallback((state: GameState) => {
    setGameState(state);
    setCurrentTurnIndex(state.currentPlayerIndex);
    notify('¡Juego reiniciado! ¡Buena suerte tripulante!', 'success');
    addToGameLog('El juego ha sido reiniciado');
  }, [notify, addToGameLog]);

  const handleTurnChange = useCallback((isMyTurn: boolean) => {
    if (isMyTurn) {
      setTimeout(() => notify('🎯 ¡Es tu turno! Realiza al menos 1 acción', 'success'), 500);
      setTimeout(() => playTurnNotificationSound(), 600);
      addToGameLog('Es tu turno');
    } else {
      addToGameLog('Tu turno ha terminado');
    }
  }, [notify, addToGameLog]);

  // Socket setup
  const socketRef = useGameSocket({
    roomId: params.id,
    onGameState: handleGameState,
    onGameStarted: handleGameStarted,
    onRoomJoined: handleRoomJoined,
    onPlayerJoined: handlePlayerJoined,
    onPlayersList: handlePlayersList,
    onPlayerLeft: handlePlayerLeft,
    onJoinError: handleJoinError,
    onPlayerNotification: handlePlayerNotification,
    onNarration: handleNarration,
    onGameRestarted: handleGameRestarted,
    onTurnChange: handleTurnChange,
    currentPlayerIdRef,
  });

  useEffect(() => {
    setSocket(socketRef.current);
  }, [socketRef]);

  // Game actions
  const {
    selectedCard,
    selectedCards,
    validTargets,
    actionsThisTurn,
    energyTransferStep,
    singularityFirstPlayerId,
    singularitySelectingSecond,
    handleCardSelect,
    handleOrganClick,
    handleCardDiscard,
    handleEndTurn,
    isSlotValid,
    resetActions,
  } = useGameActions({
    socket,
    roomId: params.id,
    currentPlayerId,
    gameState,
    notify,
    addToGameLog,
    onTurnChange: (reset) => {
      if (reset) resetActions();
    },
  });

  // Reset actions when turn changes to me
  const previousTurnIndexRef = useRef<number>(-1);
  useEffect(() => {
    if (gameState && currentTurnIndex !== previousTurnIndexRef.current) {
      const currentPlayer = gameState.players[currentTurnIndex];
      if (currentPlayer?.id === currentPlayerId) {
        resetActions();
      }
      previousTurnIndexRef.current = currentTurnIndex;
    }
  }, [currentTurnIndex, gameState, currentPlayerId, resetActions]);

  const handleDragStart = (e: React.DragEvent, card: Card) => {
    setIsDragging(true);
    handleCardSelect(card);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('cardId', card.id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragTargetColor(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropCard = (color: Color, targetPlayer: Player) => {
    if (!selectedCard) {
      setIsDragging(false);
      setDragTargetColor(null);
      return;
    }

    const currentPlayer = gameState?.players.find((p) => p.id === currentPlayerId);
    if (!currentPlayer) return;

    if (gameState && selectedCard && canPlayCard(selectedCard, currentPlayer, targetPlayer, color, gameState)) {
      handleOrganClick(color, targetPlayer);
    } else {
      notify('Acción no permitida en este sistema', 'warning');
    }

    setIsDragging(false);
    setDragTargetColor(null);
  };

  // Importar canPlayCard
  const canPlayCard = require('@/game/validation').canPlayCard;

  // Estado de carga
  if (!joined) {
    return (
      <main className="min-h-screen text-white p-8 flex items-center justify-center relative">
        <div className="stars-bg"></div>
        <div className="text-center z-10">
          <div className="text-4xl mb-4 animate-bounce"></div>
          <div className="text-xl">{UI_LABELS.join}</div>
        </div>
      </main>
    );
  }

  // Lobby (esperando jugadores)
  if (!gameState) {
    return (
      <LobbyScreen
        roomId={params.id}
        players={players}
        playerName={playerName}
        onStartGame={() => socket?.emit('start-game', { roomId: params.id })}
        onCopyId={async () => {
          await navigator.clipboard.writeText(params.id);
          setCopiedId(true);
          setTimeout(() => setCopiedId(false), 2000);
        }}
        onCopyUrl={async () => {
          await navigator.clipboard.writeText(window.location.href);
          setCopiedUrl(true);
          setTimeout(() => setCopiedUrl(false), 2000);
        }}
        copiedId={copiedId}
        copiedUrl={copiedUrl}
      />
    );
  }

  // Juego terminado
  if (gameState.gameEnded && gameState.winner) {
    return (
      <GameOverScreen
        gameState={gameState}
        currentPlayerId={currentPlayerId}
        socket={socket}
        roomId={params.id}
      />
    );
  }

  // Juego en curso
  const currentPlayer = gameState.players[currentTurnIndex];
  const isCurrentPlayer = currentPlayer?.id === currentPlayerId;

  return (
    <main className="h-screen text-white relative overflow-hidden flex flex-col">
      <div className="nebula-bg"></div>
      <div className="stars-bg"></div>
      <div className="shooting-stars"></div>

      {narratorMessage && (
        <Narrator
          message={narratorMessage}
          type={narratorType}
          onComplete={() => setNarratorMessage(null)}
        />
      )}

      {/* Botón flotante del historial */}
      <button
        onClick={() => setShowLogModal(!showLogModal)}
        className="fixed top-40 md:top-40 left-4 z-50 glass-panel hover:bg-cyan-500/10 border-cyan-500/50 rounded-xl p-2 md:p-3 shadow-lg transition-all hover:scale-105 active:scale-95 group"
        title="Consola de Misión"
      >
        <span className="text-lg md:text-xl group-hover:rotate-12 transition-transform inline-block">📟</span>
        {gameLog.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-cyan-500 text-slate-900 text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-black animate-pulse">
            {gameLog.length}
          </span>
        )}
      </button>

      {/* Botón flotante de salir */}
      <button
        onClick={() => {
          if (window.confirm('¿Estás seguro de que quieres abortar la misión y volver al menú principal?')) {
            window.location.href = '/';
          }
        }}
        className="fixed top-40 md:top-40 right-4 z-50 glass-panel hover:bg-red-500/10 border-cyan-500/50 rounded-xl p-2 md:p-3 shadow-lg transition-all hover:scale-105 active:scale-95 group"
        title="Volver al Menú Principal"
      >
        <span className="text-lg md:text-xl group-hover:scale-110 transition-transform inline-block">🏠</span>
      </button>

      {/* Modal del historial */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setShowLogModal(false)} />
          <div className="relative glass-panel border-cyan-500/50 rounded-3xl p-6 max-w-lg w-full max-h-[70vh] overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.15)]">
            <div className="flex justify-between items-center mb-6 border-b border-cyan-500/20 pb-4">
              <h3 className="text-lg font-black text-cyan-400 flex items-center gap-3 uppercase tracking-[0.2em]">
                <span className="animate-pulse">●</span> Registro de Misión
              </h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all transform hover:rotate-90"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[calc(70vh-140px)] pr-4 scrollbar-thin">
              {gameLog.length === 0 ? (
                <div className="text-gray-500 font-bold text-center py-10 uppercase tracking-widest opacity-40 italic">
                  No se detectan eventos recientes
                </div>
              ) : (
                gameLog.map((log, index) => (
                  <div key={index} className="group/log relative pl-4 border-l-2 border-cyan-500/30 py-2 hover:bg-white/5 transition-colors rounded-r-lg">
                    <div className="text-[10px] font-bold text-cyan-500/60 mb-1 font-mono uppercase">
                      [{log.split(': ')[0]}]
                    </div>
                    <div className="text-sm text-gray-200 font-semibold leading-relaxed">
                      {log.split(': ').slice(1).join(': ')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto max-w-6xl p-2 md:p-3 relative z-10 flex-1 flex flex-col min-h-0">
        <RoomHeader
          title={GAME_THEME.title}
          roomId={params.id}
          currentPlayerName={currentPlayer?.name}
          isCurrentPlayer={isCurrentPlayer}
          actionsThisTurn={actionsThisTurn}
          uiLabels={UI_LABELS}
        />



        {/* Tableros de otros jugadores */}
        <PlayerBoards
          players={gameState.players}
          currentPlayerId={currentPlayerId}
          currentPlayer={currentPlayer}
          isDragging={isDragging}
          dragTargetColor={dragTargetColor}
          validTargets={validTargets}
          selectedCard={selectedCard}
          handleOrganClick={handleOrganClick}
          handleDropCard={handleDropCard}
          handleDragOver={handleDragOver}
          isSlotValid={isSlotValid}
        />

        {/* Tablero del jugador actual */}
        <div className="mb-6">
          {gameState.players.find((p) => p.id === currentPlayerId) && (
            <GameBoard
              player={gameState.players.find((p) => p.id === currentPlayerId)!}
              isCurrentPlayer={isCurrentPlayer}
              onOrganClick={(color) => {
                const player = gameState.players.find((p) => p.id === currentPlayerId)!;
                handleOrganClick(color, player);
              }}
              onDrop={handleDropCard}
              onDragOver={handleDragOver}
              selectedColor={null}
              isDropTarget={isDragging}
              targetColor={dragTargetColor}
              validTargets={validTargets}
              isSlotValid={(color) => isSlotValid(currentPlayerId!, color)}
              selectedCard={selectedCard}
            />
          )}
        </div>



        {/* Mano del jugador */}
        <Hand
          cards={(() => {
            const myPlayer = gameState.players.find((p) => p.id === currentPlayerId);
            return myPlayer?.hand || [];
          })()}
          onCardSelect={handleCardSelect}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onCardDiscard={handleCardDiscard}
          selectedCard={selectedCard}
          selectedCards={selectedCards}
          disabled={!isCurrentPlayer}
          onEndTurn={handleEndTurn}
          actionsThisTurn={actionsThisTurn}
          isCurrentPlayer={isCurrentPlayer}
        />
      </div>
    </main>
  );
}
