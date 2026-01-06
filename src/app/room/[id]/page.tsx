'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, Player, Card, Color, TreatmentType } from '@/game/types';
import { canPlayCard, getOrganState } from '@/game/validation';
import { SLOT_COLORS } from '@/game/body-utils';
import GameBoard from '@/components/GameBoard';
import CollapsiblePlayerBoard from '@/components/CollapsiblePlayerBoard';
import PlayerBoards from '@/components/PlayerBoards';
import Hand from '@/components/Hand';
import Toaster, { useToaster } from '@/components/Toaster';
import Narrator from '@/components/Narrator';
import {
  GAME_THEME,
  UI_LABELS,
  VICTORY_MESSAGES,
  COLOR_SYSTEM_LABELS,
} from '@/game/theme';
import RoomHeader from '@/components/RoomHeader';

// Función para reproducir sonido de notificación usando Oscillator
function playTurnNotificationSound() {
  try {
    const audioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Tono ascendente doble (como "ding-ding")
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime); // E5
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.15); // G5
    oscillator.frequency.setValueAtTime(987.77, audioContext.currentTime + 0.3); // B5

    // Volumen y duración
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);

    console.log('Sound played successfully');
  } catch (e) {
    console.log('Audio error:', e);
  }
}

interface RoomPageProps {
  params: {
    id: string;
  };
}

export default function RoomPage({ params }: RoomPageProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [dragTargetColor, setDragTargetColor] = useState<Color | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [actionsThisTurn, setActionsThisTurn] = useState(0);
  const [validTargets, setValidTargets] = useState<Set<string>>(new Set());
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);

  // Para INTERCAMBIO DE PIEZAS de 2 pasos
  const [transplantStep, setTransplantStep] = useState<0 | 1 | 2>(0);
  const [transplantSourceColor, setTransplantSourceColor] = useState<Color | null>(null);

  // Para el historial de eventos del juego
  const [gameLog, setGameLog] = useState<string[]>([]);

  // Para el log técnico detallado para análisis y depuración
  const [debugLog, setDebugLog] = useState<string[]>([]);

  // Para FALLO DE TELETRANSPORTE (seleccionar jugador)
  const [selectingPlayerForMedicalError, setSelectingPlayerForMedicalError] = useState(false);

  // Para el narrador
  const [narratorMessage, setNarratorMessage] = useState<string | null>(null);

  // Para el historial flotante
  const [showLogModal, setShowLogModal] = useState(false);

  const { toasts, addToast, removeToast, success, error, warning, info } = useToaster();

  // Función para agregar eventos al log
  const addToGameLog = useCallback((message: string) => {
    setGameLog(prev => {
      const newLog = [`${new Date().toLocaleTimeString()}: ${message}`, ...prev.slice(0, 19)]; // Mantener solo los últimos 20 eventos
      return newLog;
    });
  }, []);

  // Función para agregar eventos al log técnico detallado para depuración
  const addToDebugLog = useCallback((message: string) => {
    const timestamp = new Date().toISOString();
    setDebugLog(prev => {
      const newLog = [`${timestamp}: ${message}`, ...prev.slice(0, 49)]; // Mantener solo los últimos 50 eventos
      return newLog;
    });
  }, []);

  const socketRef = useRef<Socket | null>(null);
  const roomIdRef = useRef<string>(params.id);
  const previousTurnIndexRef = useRef(0);
  const currentPlayerIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (socketRef.current) {
      console.log('=== SKIPPING: Socket already exists ===');
      return;
    }

    console.log('=== USE EFFECT RUNNING ===');
    console.log('params.id:', params.id);

    // Obtener nombre del localStorage (guardado al crear/unir sala)
    let name = localStorage.getItem('playerName');

    // Si no hay nombre guardado, pedirlo
    if (!name) {
      name = prompt(`Ingresa tu nombre, explorador espacial:`);
      if (!name) {
        alert('Necesitas identificarte para la misión');
        window.location.href = '/';
        return;
      }
      localStorage.setItem('playerName', name);
    }
    setPlayerName(name);

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || undefined;
    const newSocket = io(socketUrl, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
    newSocket.connect();
    setSocket(newSocket);
    socketRef.current = newSocket;

    // Esperar a que el socket esté conectado para obtener el ID
    newSocket.on('connect', () => {
      console.log('Socket connected with ID:', newSocket.id);
      console.log('Emitting join-room with:', { roomId: params.id, playerName: name });
      if (newSocket.id) {
        setCurrentPlayerId(newSocket.id);
        currentPlayerIdRef.current = newSocket.id;
      }
      newSocket.emit('join-room', { roomId: params.id, playerName: name });
    });

    newSocket.on('room-joined', ({ roomId, playerId, players: roomPlayers }) => {
      console.log('=== ROOM JOINED ===');
      console.log('Room ID:', roomId);
      console.log('My player ID:', playerId);
      console.log('My socket ID:', newSocket.id);
      console.log('Current player ID state:', currentPlayerId);
      console.log('Players:', roomPlayers);
      console.log('Players count:', roomPlayers.length);
      roomPlayers.forEach((p: any, i: number) => {
        console.log(`  Player ${i}: ${p.name} (${p.id})`);
      });
      setJoined(true);
      setPlayers(roomPlayers);
      setCurrentPlayerId(playerId);
      currentPlayerIdRef.current = playerId;
      addToGameLog(`Te has unido a la sala ${roomId}`);
      success(`¡Te has unido al sector ${roomId}!`);
    });

    newSocket.on('player-joined', ({ playerId, playerName, players: roomPlayers }) => {
      addToGameLog(`${playerName} se ha unido a la sala`);
      info(`¡${playerName} ha sido asignado a la misión!`);
      if (roomPlayers) {
        setPlayers(roomPlayers);
      }
    });

    newSocket.on('players-list', ({ players: roomPlayers }) => {
      setPlayers(roomPlayers);
    });

    newSocket.on('player-left', ({ playerId, players: roomPlayers }) => {
      console.log('=== PLAYER LEFT ===');
      console.log('Player ID:', playerId);
      console.log('Remaining players:', roomPlayers);
      addToGameLog(`Un jugador ha dejado la sala`);
      setPlayers(roomPlayers);
    });

    newSocket.on('game-started', ({ gameState: state }) => {
      console.log('=== GAME STARTED ===');
      console.log('State:', state);
      setGameState(state);
      setCurrentTurnIndex(state.currentPlayerIndex);
      previousTurnIndexRef.current = state.currentPlayerIndex;
      // Resetear acciones si empieza mi turno
      if (state.players[state.currentPlayerIndex]?.id === currentPlayerId) {
        setActionsThisTurn(0);
      }
      addToGameLog('El juego ha comenzado');
      success('¡La misión ha comenzado! ¡Buena suerte tripulante!');
    });

    newSocket.on('game-state', (state: GameState) => {
      console.log('=== GAME STATE RECEIVED ===');
      console.log('State:', state);
      console.log('Current player index:', state.currentPlayerIndex);
      console.log('Previous turn index:', previousTurnIndexRef.current);

      const newTurnIndex = state.currentPlayerIndex;
      const currentTurnPlayer = state.players[newTurnIndex];
      const isMyTurn = currentTurnPlayer?.id === currentPlayerId;

      // Detectar cambio de turno hacia mí
      if (newTurnIndex !== previousTurnIndexRef.current) {
        console.log('=== TURN CHANGED ===');
        console.log('From:', previousTurnIndexRef.current, 'To:', newTurnIndex);
        console.log('Is my turn?', isMyTurn);

        if (isMyTurn) {
          // Es mi turno - resetear contador
          console.log('Resetting actions count - my turn started');
          setActionsThisTurn(0);
          // Mostrar toast de inicio de turno más prominente
          setTimeout(() => success('🎯 ¡Es tu turno! Realiza al menos 1 acción', 5000), 500);
          // Reproducir sonido de notificación
          setTimeout(() => playTurnNotificationSound(), 600);
          addToGameLog(`Es tu turno`);
        } else if (state.players[previousTurnIndexRef.current]?.id === currentPlayerId) {
          // Era mi turno y terminó - resetear
          console.log('Resetting actions count - my turn ended');
          setActionsThisTurn(0);
          addToGameLog(`Tu turno ha terminado`);
        }

        previousTurnIndexRef.current = newTurnIndex;
      }

      setCurrentTurnIndex(newTurnIndex);
      setGameState(state);
    });

    newSocket.on('error', ({ message }) => {
      console.log('Socket error:', message);
      alert(message);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected, reason:', reason);
    });

    newSocket.on('player-notification', ({ playerId, message, type }: { playerId: string; message: string; type: 'warning' | 'info' | 'success' }) => {
      // Solo mostrar si la notificación es para mí
      if (playerId === currentPlayerIdRef.current) {
        console.log('=== PLAYER NOTIFICATION ===', message, type);
        if (type === 'warning') {
          warning(message);
        } else if (type === 'success') {
          success(message);
        } else {
          info(message);
        }
      }
    });

    newSocket.on('narration', ({ message, senderId }: { message: string, senderId?: string }) => {
      console.log('=== NARRATION ===', message, 'from', senderId);

      // Si soy el que gatilló la acción, el Narrador (holograma) puede ser redundante o causar "ansiedad"
      // ya que ya recibí el toast local de éxito/aviso.
      // Sin embargo, para que el flujo sea fluido, lo mostramos pero con un pequeño delay o solo si no somos el sender.
      // El usuario dice que se ve "dos veces", probablemente se refiere a que ve el Toast + el Narrador.

      if (senderId !== currentPlayerIdRef.current) {
        setNarratorMessage(message);
      }

      // El toast de información sí lo mantenemos para el log visual, pero más corto
      info(message, 3000);
    });

    return () => {
      console.log('=== CLEANUP ===');
      const currentRoomId = roomIdRef.current;
      roomIdRef.current = params.id;

      if (socketRef.current && currentRoomId !== params.id) {
        console.log('=== DISCONNECTING: Room ID changed ===');
        socketRef.current.disconnect();
        socketRef.current = null;
      } else {
        console.log('=== KEEPING: Room ID unchanged (React Strict Mode) ===');
      }
    };
  }, [params.id]);

  // Calcular objetivos válidos cuando se selecciona una carta
  useEffect(() => {
    if (selectedCard && gameState) {
      const targets = new Set<string>();

      // Obtener el jugador actual
      const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
      if (!currentPlayer) {
        setValidTargets(new Set());
        return;
      }

      gameState.players.forEach(player => {
        SLOT_COLORS.forEach(color => {
          if (canPlayCard(selectedCard, currentPlayer, player, color, gameState)) {
            targets.add(`${player.id}-${color}`);
          }
        });
      });

      setValidTargets(targets);
      console.log('Valid targets for card:', selectedCard, Array.from(targets));
    } else {
      setValidTargets(new Set());
    }
  }, [selectedCard, gameState, currentPlayerId]);

  const handleStartGame = () => {
    socket?.emit('start-game', { roomId: params.id });
  };

  const handleCardSelect = (card: Card) => {
    // Si hay un proceso de TRANSPLANT o MEDICAL_ERROR en curso, cancelarlo
    if (transplantStep > 0 || selectingPlayerForMedicalError) {
      warning('Proceso cancelado');
      setTransplantStep(0);
      setTransplantSourceColor(null);
      setSelectingPlayerForMedicalError(false);
      setValidTargets(new Set());
    }

    // Si es MEDICAL_ERROR, iniciar modo de selección de jugador
    if (card.type === 'TREATMENT' && card.treatmentType === TreatmentType.MEDICAL_ERROR) {
      setSelectingPlayerForMedicalError(true);
      setSelectedCard(card);
      setSelectedCards([card]);
      warning('⚠️ FALLO DE TELETRANSPORTE: Esta carta intercambia TODOS tus sistemas por los de otro jugador. Selecciona un jugador o cancela.');
      // No hay objetivos válidos de sistemas - solo jugadores
      setValidTargets(new Set());
      return;
    }

    // Si es TRANSPLANT, iniciar el proceso de 2 pasos
    if (card.type === 'TREATMENT' && card.treatmentType === TreatmentType.TRANSPLANT) {
      setTransplantStep(1);
      setSelectedCard(card);
      setSelectedCards([card]);
      info('INTERCAMBIO DE PIEZAS: Paso 1/2 - Selecciona TU sistema a intercambiar');
      // Calcular objetivos: solo MIS sistemas que tengan órganos
      const myPlayer = gameState?.players.find(p => p.id === currentPlayerId);
      if (myPlayer) {
        const myValidSources = new Set<string>();

        SLOT_COLORS.forEach(color => {
          const slot = myPlayer.body instanceof Map ? myPlayer.body.get(color) : myPlayer.body[color];
          if (slot?.organCard) {
            myValidSources.add(`${currentPlayerId}-${color}`);
          }
        });

        setValidTargets(myValidSources);
        console.log('TRANSPLANT Step 1 - Valid sources:', Array.from(myValidSources));
      }
      return; // Exit early to prevent deselection logic
    }

    // Si ya estaba seleccionada (para non-TRANSPLANT cards), deseleccionar
    if (selectedCard?.id === card.id) {
      setSelectedCard(null);
      setSelectedCards([]);
      setValidTargets(new Set());
      return;
    }

    setSelectedCard(card);
    setSelectedCards([card]);
  };

  const handleOrganClick = (color: Color, player: Player) => {
    if (!selectedCard) return;

    // Si es MEDICAL_ERROR, aceptar CUALQUIER sistema de un oponente
    if (selectingPlayerForMedicalError) {
      if (player.id === currentPlayerId) {
        warning('Debes seleccionar un sistema de un OPONENTE');
        return;
      }
      // Ejecutar MEDICAL_ERROR con cualquier color del oponente (se intercambian todos los sistemas)
      playMedicalErrorCard(selectedCard, player);
      return;
    }

    // Verificar si es un objetivo válido
    const targetKey = `${player.id}-${color}`;
    if (!validTargets.has(targetKey)) {
      console.log('Invalid target:', targetKey);
      console.log('Valid targets:', Array.from(validTargets));
      return;
    }

    // Si es TRANSPLANT en paso 1, guardar el sistema seleccionado y pasar al paso 2
    if (selectedCard.type === 'TREATMENT' && selectedCard.treatmentType === TreatmentType.TRANSPLANT && transplantStep === 1) {
      if (player.id !== currentPlayerId) {
        warning('En el paso 1 debes seleccionar TU propio sistema');
        return;
      }
      setTransplantSourceColor(color);
      setTransplantStep(2);

      const opponentTargets = new Set<string>();
      gameState!.players.forEach(p => {
        if (p.id !== currentPlayerId) {
          SLOT_COLORS.forEach(targetColor => {
            const slot = p.body instanceof Map ? p.body.get(targetColor) : p.body[targetColor];
            if (slot?.organCard) {
              opponentTargets.add(`${p.id}-${targetColor}`);
            }
          });
        }
      });
      setValidTargets(opponentTargets);

      const systemName = COLOR_SYSTEM_LABELS[color];
      info(`INTERCAMBIO DE PIEZAS: Paso 2/2 - Selecciona CUALQUIER sistema del oponente para intercambiar`);
      console.log('TRANSPLANT Step 2 - Opponent targets:', Array.from(opponentTargets));
      return;
    }

    // Si es TRANSPLANT en paso 2, ejecutar el intercambio
    if (selectedCard.type === 'TREATMENT' && selectedCard.treatmentType === TreatmentType.TRANSPLANT && transplantStep === 2) {
      if (player.id === currentPlayerId) {
        warning('En el paso 2 debes seleccionar un sistema del OPONENTE');
        return;
      }

      // Ejecutar el intercambio con sourceColor (tu sistema) y color (sistema del oponente)
      playTransplantCard(selectedCard, transplantSourceColor!, color, player);
      return;
    }

    // Jugar la carta normalmente (para otros casos)
    playCard(selectedCard, color, player);
  };

  const playTransplantCard = (card: Card, sourceColor: Color, targetColor: Color, targetPlayer: Player) => {
    console.log('Playing TRANSPLANT card:', card, 'from', sourceColor, 'to', targetColor, 'of player:', targetPlayer.name);

    const sourceSystemName = COLOR_SYSTEM_LABELS[sourceColor];
    const targetSystemName = COLOR_SYSTEM_LABELS[targetColor];

    success(`¡Intercambio completado: tu ${sourceSystemName} ← ${targetSystemName} de ${targetPlayer.name}!`);

    addToGameLog(`Usaste ${card.name || 'una carta de INTERCAMBIO'} para intercambiar tu ${sourceSystemName} con el ${targetSystemName} de ${targetPlayer.name}`);

    socket?.emit('game-action', {
      roomId: params.id,
      action: {
        type: 'play-card',
        card: card,
        targetPlayerId: targetPlayer.id,
        targetColor: targetColor,
        sourceColor: sourceColor, // Agregar sourceColor para TRANSPLANT
      },
    });

    // Resetear estado de TRANSPLANT
    setTransplantStep(0);
    setTransplantSourceColor(null);

    setSelectedCard(null);
    setSelectedCards([]);
    setValidTargets(new Set());
    setActionsThisTurn(prev => prev + 1);
  };

  const playMedicalErrorCard = (card: Card, targetPlayer: Player) => {
    console.log('Playing MEDICAL_ERROR card with player:', targetPlayer.name);

    warning(`¡Fallo de teletransporte! Tus sistemas han sido intercambiados con ${targetPlayer.name}`);

    socket?.emit('game-action', {
      roomId: params.id,
      action: {
        type: 'play-card',
        card: card,
        targetPlayerId: targetPlayer.id,
        targetColor: Color.RED, // Color arbitrario, se intercambian todos los sistemas
      },
    });

    // Resetear estado de MEDICAL_ERROR
    setSelectingPlayerForMedicalError(false);

    setSelectedCard(null);
    setSelectedCards([]);
    setValidTargets(new Set());
    setActionsThisTurn(prev => prev + 1);
  };

  const playCard = (card: Card, color: Color, targetPlayer: Player) => {
    console.log('Playing card:', card, 'on', color, 'of player:', targetPlayer.name);

    // Mensaje informativo según el tipo de carta
    const systemName = COLOR_SYSTEM_LABELS[color];
    const targetName = targetPlayer.id === currentPlayerId ? 'tu' : `de ${targetPlayer.name}`;

    let logMessage = '';
    if (card.type === 'ORGAN') {
      success(`Sistema ${systemName} instalado`);
      logMessage = `Jugaste ${card.name || 'una carta de SISTEMA'} en ${systemName} ${targetName}`;
    } else if (card.type === 'VIRUS') {
      warning(`¡Sabotaje en ${systemName} ${targetName}!`);
      logMessage = `Jugaste ${card.name || 'una carta de SABOTAJE'} en ${systemName} ${targetName}`;
    } else if (card.type === 'MEDICINE') {
      success(`Reparación aplicada a ${systemName} ${targetName}`);
      logMessage = `Jugaste ${card.name || 'una carta de REPARACIÓN'} en ${systemName} ${targetName}`;
    } else if (card.type === 'TREATMENT') {
      if (card.treatmentType === TreatmentType.TRANSPLANT) {
        success(`¡Intercambio de ${systemName} completado con ${targetPlayer.name}!`);
        logMessage = `Jugaste ${card.name || 'una carta de INTERCAMBIO'} con ${targetPlayer.name}`;
      } else if (card.treatmentType === TreatmentType.ORGAN_THIEF) {
        success(`¡${systemName} robado de ${targetPlayer.name}!`);
        logMessage = `Jugaste ${card.name || 'una carta de ROBO'} de ${systemName} de ${targetPlayer.name}`;
      } else if (card.treatmentType === TreatmentType.LATEX_GLOVE) {
        info(`Interferencia electromagnética: cartas descartadas de oponentes`);
        logMessage = `Jugaste ${card.name || 'una carta de GUANTE DE LÁTEX'}`;
      } else if (card.treatmentType === TreatmentType.MEDICAL_ERROR) {
        warning(`¡Fallo de teletransporte! Cuerpos intercambiados con ${targetPlayer.name}`);
        logMessage = `Jugaste ${card.name || 'una carta de FALLO DE TELETRANSPORTE'} con ${targetPlayer.name}`;
      }
    }

    addToGameLog(logMessage);

    socket?.emit('game-action', {
      roomId: params.id,
      action: {
        type: 'play-card',
        card: card,
        targetPlayerId: targetPlayer.id,
        targetColor: color,
      },
    });

    setSelectedCard(null);
    setSelectedCards([]);
    setValidTargets(new Set());
    setActionsThisTurn(prev => prev + 1);
  };

  const handleDropCard = useCallback((color: Color, targetPlayer: Player) => {
    console.log('Card dropped on:', color, 'of player:', targetPlayer.name);

    // Usar la carta seleccionada actualmente
    if (!selectedCard) {
      console.log('No card selected for drop');
      setIsDragging(false);
      setDragTargetColor(null);
      return;
    }

    // Obtener el jugador actual
    const currentPlayer = gameState?.players.find(p => p.id === currentPlayerId);
    if (!currentPlayer) {
      console.log('Current player not found');
      return;
    }

    // Verificar si es válido
    if (gameState && canPlayCard(selectedCard, currentPlayer, targetPlayer, color, gameState)) {
      playCard(selectedCard, color, targetPlayer);
    } else {
      console.log('Invalid drop target for card:', selectedCard);
      warning('Objetivo no válido para esta carta');
    }

    setIsDragging(false);
    setDragTargetColor(null);
  }, [socket, params.id, currentPlayerId, gameState, selectedCard, playCard, warning]);

  const handleDiscard = () => {
    if (!selectedCard) {
      error('Selecciona una carta para descartar');
      return;
    }

    handleDiscardCard(selectedCard);
  };

  const handleDiscardCard = (card: Card) => {
    console.log('Discarding card:', card);
    info('Carta descartada');
    addToGameLog(`Descartaste una carta`);

    socket?.emit('game-action', {
      roomId: params.id,
      action: {
        type: 'discard-cards',
        cards: [card],
      },
    });

    // Si la carta descartada es la seleccionada, limpiar la selección
    if (selectedCard?.id === card.id) {
      setSelectedCard(null);
      setSelectedCards([]);
      setValidTargets(new Set());
    }
    setActionsThisTurn(prev => prev + 1);
  };

  const handleEndTurn = () => {
    if (actionsThisTurn === 0) {
      warning('Debes jugar o descartar al menos 1 carta antes de terminar tu turno');
      return;
    }

    console.log('Ending turn. Actions this turn:', actionsThisTurn);
    info('Turno terminado. +1 carta extra');
    addToGameLog(`Terminaste tu turno`);

    socket?.emit('game-action', {
      roomId: params.id,
      action: {
        type: 'end-turn',
      },
    });

    // No reseteamos aquí, dejamos que el game-state update lo maneje
  };

  const handleDragStart = (e: React.DragEvent, card: Card) => {
    console.log('Drag started:', card);
    setIsDragging(true);
    setSelectedCard(card);
    // Guardar referencia a la carta arrastrada
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('cardId', card.id);
  };

  const handleDragEnd = () => {
    console.log('Drag ended');
    setIsDragging(false);
    setDragTargetColor(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

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

  if (!gameState) {
    return (
      <main className="min-h-screen text-white p-8 relative">
        <div className="stars-bg"></div>
        <div className="max-w-md mx-auto relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 neon-glow">{GAME_THEME.title}</h1>
            <p className="text-cyan-300">{GAME_THEME.subtitle}</p>
            <div className="mt-4 text-sm text-gray-400">{UI_LABELS.room}: {params.id}</div>
          </div>

          <div className="action-panel rounded-xl p-6 mb-6">
            <h2 className="text-xl mb-4 text-cyan-300 font-bold">{UI_LABELS.players}</h2>
            <ul className="space-y-3">
              {players.map((player) => (
                <li key={player.id} className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg">
                  <span className="text-2xl"></span>
                  <span className="font-bold">{player.name}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center text-gray-400 mb-6">
            <div className="animate-pulse">{UI_LABELS.waitingPlayers}</div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleStartGame}
              disabled={players.length < 2}
              className="w-full btn-space px-6 py-4 rounded-xl font-bold text-lg disabled:opacity-50"
            >
              {players.length < 2 ? UI_LABELS.needPlayers : UI_LABELS.startMission}
            </button>

            <button
              onClick={() => (window.location.href = '/')}
              className="w-full bg-red-900/50 hover:bg-red-800/50 border border-red-500/50 px-6 py-3 rounded-xl transition-all"
            >
              {UI_LABELS.exit}
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (gameState.gameEnded && gameState.winner) {
    const winner = gameState.winner;
    const isWinner = winner.id === currentPlayerId;

    // Mostrar overlay de victoria PERO mantener el tablero visible detrás
    return (
      <main className="min-h-screen text-white pb-52 relative">
        <div className="stars-bg"></div>

        {/* Overlay de victoria - SEMITRANSPARENTE para ver el tablero detrás */}
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="text-center z-10 animate-pulse-glow">
            <div className="text-6xl mb-6">{isWinner ? '🎉' : '🚀'}</div>
            <h1 className={`text-5xl font-bold mb-4 ${isWinner ? 'neon-glow text-cyan-400' : 'text-gray-400'}`}>
              {isWinner ? VICTORY_MESSAGES.win : VICTORY_MESSAGES.lose}
            </h1>
            <p className="text-2xl mb-8 text-gray-300">
              {VICTORY_MESSAGES.winner} <span className="text-cyan-400 font-bold">{winner.name}</span>
            </p>
            <div className="space-y-4">
              <button
                onClick={() => (window.location.href = '/')}
                className="btn-space px-8 py-4 rounded-xl font-bold text-lg block mx-auto hover:scale-105 transition-all"
              >
                Ir al Inicio
              </button>
              <button
                onClick={() => {
                  // Reiniciar la sala para un nuevo juego
                  socket?.emit('restart-game', { roomId: params.id });
                }}
                className="btn-space px-8 py-4 rounded-xl font-bold text-lg block mx-auto hover:scale-105 transition-all"
              >
                Jugar de Nuevo
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-6 italic">
              El tablero permanece visible para revisar el juego final
            </p>
          </div>
        </div>

        {/* CONTENIDO DEL TABLERO AÚN SE MUESTRA DETRÁS */}
        {/* Sistema de Toasts */}
        <Toaster toasts={toasts} onRemove={removeToast} />

        <div className="container mx-auto p-4 relative z-10 opacity-50 pointer-events-none">
          {/* Header con información de sala */}
          <div className="action-panel rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold neon-glow text-cyan-400">{GAME_THEME.title}</h1>
                <div className="text-sm text-gray-400">{UI_LABELS.room}: {params.id}</div>
              </div>
            </div>
          </div>

          {/* Tableros de otros jugadores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {gameState.players
              .filter((p) => p.id !== currentPlayerId)
              .map((player) => (
                <GameBoard
                  key={player.id}
                  player={player}
                  isCurrentPlayer={false}
                  onOrganClick={() => { }}
                  onDrop={() => { }}
                  onDragOver={() => { }}
                  selectedColor={null}
                  isDropTarget={false}
                  targetColor={null}
                  validTargets={new Set()}
                  isSlotValid={() => false}
                  selectedCard={null}
                />
              ))}
          </div>

          {/* Tablero del jugador actual */}
          <div className="mb-6">
            {gameState.players.find((p) => p.id === currentPlayerId) && (
              <GameBoard
                player={gameState.players.find((p) => p.id === currentPlayerId)!}
                isCurrentPlayer={false}
                onOrganClick={() => { }}
                onDrop={() => { }}
                onDragOver={() => { }}
                selectedColor={null}
                isDropTarget={false}
                targetColor={null}
                validTargets={new Set()}
                isSlotValid={() => false}
                selectedCard={null}
              />
            )}
          </div>
        </div>
      </main>
    );
  }

  const currentPlayer = gameState.players[currentTurnIndex];
  const isCurrentPlayer = currentPlayer?.id === currentPlayerId;

  // Función auxiliar para verificar si un slot es válido
  const isSlotValid = (playerId: string, color: Color): boolean => {
    return validTargets.has(`${playerId}-${color}`);
  };

  return (
    <main className="min-h-screen text-white pb-28 md:pb-40 lg:pb-52 relative">
      <div className="stars-bg"></div>

      {/* Narrator - Duración reducida para evitar ansiedad */}
      {narratorMessage && (
        <Narrator
          message={narratorMessage}
          duration={2500}
          onComplete={() => setNarratorMessage(null)}
        />
      )}

      {/* Sistema de Toasts */}
      <Toaster toasts={toasts} onRemove={removeToast} />

      {/* Botón flotante del historial - Estilo terminal */}
      <button
        onClick={() => setShowLogModal(!showLogModal)}
        className="fixed top-4 left-4 z-50 glass-panel hover:bg-cyan-500/10 border-cyan-500/50 rounded-xl p-3 shadow-lg transition-all hover:scale-105 active:scale-95 group"
        title="Consola de Misión"
      >
        <span className="text-xl group-hover:rotate-12 transition-transform inline-block">📟</span>
        {gameLog.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-cyan-500 text-slate-900 text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-black animate-pulse">
            {gameLog.length}
          </span>
        )}
      </button>

      {/* Modal flotante del historial - Estilo Consola Sci-fi */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setShowLogModal(false)} />
          <div className="relative glass-panel border-cyan-500/50 rounded-3xl p-6 max-w-lg w-full max-h-[70vh] overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.15)] scanner-effect">
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
                      [{new Date().toLocaleTimeString()}]
                    </div>
                    <div className="text-sm text-gray-200 font-semibold leading-relaxed">
                      {log.split(': ')[1] || log}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-cyan-500/10 text-[9px] text-cyan-500/40 font-mono flex justify-between uppercase">
              <span>Secure Link Established</span>
              <span className="animate-pulse">Scanning...</span>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto max-w-6xl p-2 md:p-4 relative z-10">
        <RoomHeader
          title={GAME_THEME.title}
          roomId={params.id}
          currentPlayerName={currentPlayer?.name}
          isCurrentPlayer={isCurrentPlayer}
          actionsThisTurn={actionsThisTurn}
          uiLabels={UI_LABELS}
        />

        {/* Instrucciones cuando es tu turno */}
        {isCurrentPlayer && actionsThisTurn === 0 && !selectingPlayerForMedicalError && (
          <div className="glass-panel border-cyan-500/30 rounded-2xl p-3 md:p-4 mb-3 md:mb-6 text-center animate-pulse-slow">
            <p className="text-[10px] md:text-xs font-black text-cyan-400 uppercase tracking-[0.2em]">
              ⚠️ Misión Activa: Selecciona acción para proceder
            </p>
          </div>
        )}

        {/* Advertencia especial para MEDICAL_ERROR */}
        {selectingPlayerForMedicalError && (
          <div className="action-panel rounded-xl p-6 mb-6 text-center border-2 border-red-500/50 bg-red-900/20 animate-pulse">
            <p className="text-red-300 font-bold text-lg mb-2">
              ⚠️ FALLO DE TELETRANSPORTE ⚠️
            </p>
            <p className="text-white mb-3">
              Esta carta intercambia <span className="text-yellow-300 font-bold">TODOS tus sistemas</span> por los de otro jugador
            </p>
            <p className="text-gray-300 mb-4">
              Haz clic en <span className="text-cyan-300">cualquier sistema de un oponente</span> para confirmar, o cancela la operación
            </p>
            <button
              onClick={() => {
                setSelectingPlayerForMedicalError(false);
                setSelectedCard(null);
                setSelectedCards([]);
                setValidTargets(new Set());
                info('Operación cancelada');
              }}
              className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-xl font-bold text-white transition-all"
            >
              ❌ Cancelar Operación
            </button>
          </div>
        )}

        {/* Tableros de otros jugadores (responsive component) */}
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
          isSlotValid={(color) => isSlotValid(currentPlayerId!, color)}
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

        {/* Botón de terminar turno - siempre visible cuando es tu turno */}

        {/* Indicador de carta seleccionada */}
        {selectedCard && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
            <div className="action-panel rounded-xl px-6 py-3 flex items-center gap-3">
              <div className="text-sm">
                <span className="text-cyan-400 font-bold">Seleccionado:</span>
                <span className="ml-2 text-gray-300">
                  {selectedCard.type === 'ORGAN' ? 'SISTEMA' :
                    selectedCard.type === 'VIRUS' ? 'SABOTAJE' :
                      selectedCard.type === 'MEDICINE' ? 'REPARACIÓN' : 'ACCIÓN'}
                </span>
                {selectedCard.treatmentType && (
                  <span className="ml-2 text-yellow-300 text-xs">
                    ({selectedCard.treatmentType})
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedCard(null);
                  setSelectedCards([]);
                  setValidTargets(new Set());
                }}
                className="text-red-400 hover:text-red-300 ml-2 text-xl"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Mano del jugador */}
        <Hand
          cards={(() => {
            const myPlayer = gameState.players.find((p) => p.id === currentPlayerId);
            console.log('=== RENDERING HAND ===');
            console.log('Current player ID:', currentPlayerId);
            console.log('My player:', myPlayer);
            console.log('Cards:', myPlayer?.hand || []);
            return myPlayer?.hand || [];
          })()}
          onCardSelect={handleCardSelect}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onCardDiscard={handleDiscardCard}
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
