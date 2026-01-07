import { useState, useCallback } from 'react';
import { GameState, Player, Card, Color, TreatmentType } from '@/game/types';
import { canPlayCard } from '@/game/validation';
import { SLOT_COLORS } from '@/game/body-utils';

interface UseGameStateProps {
  gameState: GameState | null;
  currentPlayerId: string | null;
}

interface UseGameStateReturn {
  selectedCard: Card | null;
  selectedCards: Card[];
  validTargets: Set<string>;
  actionsThisTurn: number;
  transplantStep: 0 | 1 | 2;
  transplantSourceColor: Color | null;
  selectingPlayerForMedicalError: boolean;
  selectCard: (card: Card) => void;
  incrementActions: () => void;
  resetSelection: () => void;
  setTransplantStep: (step: 0 | 1 | 2) => void;
  setTransplantSourceColor: (color: Color | null) => void;
  setSelectingPlayerForMedicalError: (value: boolean) => void;
}

export function useGameState({ gameState, currentPlayerId }: UseGameStateProps): UseGameStateReturn {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [validTargets, setValidTargets] = useState<Set<string>>(new Set());
  const [actionsThisTurn, setActionsThisTurn] = useState(0);
  const [transplantStep, setTransplantStep] = useState<0 | 1 | 2>(0);
  const [transplantSourceColor, setTransplantSourceColor] = useState<Color | null>(null);
  const [selectingPlayerForMedicalError, setSelectingPlayerForMedicalError] = useState(false);

  const selectCard = useCallback((card: Card) => {
    if (transplantStep > 0 || selectingPlayerForMedicalError) {
      setTransplantStep(0);
      setTransplantSourceColor(null);
      setSelectingPlayerForMedicalError(false);
      setValidTargets(new Set());
    }

    if (card.type === 'TREATMENT' && card.treatmentType === TreatmentType.SINGULARITY) {
      setSelectingPlayerForMedicalError(true);
      setSelectedCard(card);
      setSelectedCards([card]);
      setValidTargets(new Set());
      return;
    }

    if (card.type === 'TREATMENT' && card.treatmentType === TreatmentType.ENERGY_TRANSFER) {
      setTransplantStep(1);
      setSelectedCard(card);
      setSelectedCards([card]);
      calculateTransplantTargets(card, 1);
      return;
    }

    if (selectedCard?.id === card.id) {
      resetSelection();
      return;
    }

    setSelectedCard(card);
    setSelectedCards([card]);
  }, [transplantStep, selectingPlayerForMedicalError, selectedCard]);

  const calculateTransplantTargets = useCallback((card: Card, step: number) => {
    if (!gameState || !currentPlayerId) return;

    const targets = new Set<string>();
    const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
    if (!currentPlayer) {
      setValidTargets(new Set());
      return;
    }

    if (step === 1) {
      SLOT_COLORS.forEach(color => {
        const slot = currentPlayer.body instanceof Map ? currentPlayer.body.get(color) : currentPlayer.body[color];
        if (slot?.organCard) {
          targets.add(`${currentPlayerId}-${color}`);
        }
      });
    } else if (step === 2) {
      gameState.players.forEach(p => {
        if (p.id !== currentPlayerId) {
          SLOT_COLORS.forEach(color => {
            const slot = p.body instanceof Map ? p.body.get(color) : p.body[color];
            if (slot?.organCard) {
              targets.add(`${p.id}-${color}`);
            }
          });
        }
      });
    }

    setValidTargets(targets);
  }, [gameState, currentPlayerId]);

  const incrementActions = useCallback(() => {
    setActionsThisTurn(prev => prev + 1);
  }, []);

  const resetSelection = useCallback(() => {
    setSelectedCard(null);
    setSelectedCards([]);
    setValidTargets(new Set());
    setTransplantStep(0);
    setTransplantSourceColor(null);
    setSelectingPlayerForMedicalError(false);
  }, []);

  return {
    selectedCard,
    selectedCards,
    validTargets,
    actionsThisTurn,
    transplantStep,
    transplantSourceColor,
    selectingPlayerForMedicalError,
    selectCard,
    incrementActions,
    resetSelection,
    setTransplantStep,
    setTransplantSourceColor,
    setSelectingPlayerForMedicalError,
  };
}
