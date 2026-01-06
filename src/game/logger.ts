import { Card, Color, OrganSlot, Player, GameState, CardType, TreatmentType } from './types';
import { getBodyEntries, getBodySlots } from './body-utils';
import { getOrganState } from './validation';
import { COLOR_SYSTEM_LABELS, CARD_TYPE_LABELS, TREATMENT_LABELS, ORGAN_STATE_LABELS } from './theme';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  ACTION = 'ACTION',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class GameLogger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 500; // Mantener solo los últimos 500 logs

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private addLog(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
      data,
    };

    this.logs.push(entry);

    // Mantener solo los últimos logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // También imprimir en consola con colores
    const consolePrefix = this.getConsolePrefix(level);
    console.log(`${consolePrefix} [${entry.timestamp}] ${message}`, data || '');
  }

  private getConsolePrefix(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '🔵 [DEBUG]';
      case LogLevel.INFO: return '🟢 [INFO]';
      case LogLevel.WARNING: return '🟡 [WARNING]';
      case LogLevel.ERROR: return '🔴 [ERROR]';
      case LogLevel.ACTION: return '⚡ [ACTION]';
    }
  }

  // Métodos públicos de logging
  debug(message: string, data?: any): void {
    this.addLog(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any): void {
    this.addLog(LogLevel.INFO, message, data);
  }

  warning(message: string, data?: any): void {
    this.addLog(LogLevel.WARNING, message, data);
  }

  error(message: string, data?: any): void {
    this.addLog(LogLevel.ERROR, message, data);
  }

  action(message: string, data?: any): void {
    this.addLog(LogLevel.ACTION, message, data);
  }

  // Métodos específicos para el juego

  /**
   * Registra el estado completo de un jugador
   */
  logPlayerState(player: Player, context?: string): void {
    const handInfo = this.formatHand(player.hand);
    const bodyInfo = this.formatBody(player.body);

    this.info(`👤 JUGADOR: ${player.name} (${player.id})${context ? ` - ${context}` : ''}`, {
      mano: handInfo,
      sistemas: bodyInfo,
    });
  }

  /**
   * Registra el estado completo de todos los jugadores
   */
  logAllPlayersState(gameState: GameState): void {
    this.info('════════════════════════════════════════════════════════════');
    this.info(`📊 ESTADO DEL JUEGO - Turno: ${gameState.currentPlayerIndex}`);
    this.info('════════════════════════════════════════════════════════════');

    gameState.players.forEach((player, index) => {
      const isCurrentTurn = index === gameState.currentPlayerIndex;
      this.logPlayerState(player, isCurrentTurn ? '⭐ TURNO ACTUAL' : '');
    });

    this.info(`📚 Mazo: ${gameState.deck.length} cartas | 🗑️ Descarte: ${gameState.discardPile.length} cartas`);
    this.info('════════════════════════════════════════════════════════════');
  }

  /**
   * Registra cuando se juega una carta
   */
  logCardPlayed(
    card: Card,
    playerName: string,
    targetPlayerName: string,
    targetColor: Color,
    result?: any
  ): void {
    const cardInfo = this.formatCard(card);
    const systemName = COLOR_SYSTEM_LABELS[targetColor];

    this.action(`🎴 ${playerName} jugó ${cardInfo} → ${systemName} de ${targetPlayerName}`, {
      carta: cardInfo,
      objetivo: targetPlayerName,
      sistema: systemName,
      resultado: result,
    });
  }

  /**
   * Registra cuando se juega una carta de tratamiento
   */
  logTreatmentCardPlayed(
    card: Card,
    playerName: string,
    targetPlayerName: string,
    additionalInfo?: any
  ): void {
    const cardInfo = this.formatCard(card);
    const treatmentName = card.treatmentType ? TREATMENT_LABELS[card.treatmentType] : 'DESCONOCIDO';

    this.action(`⚡ ${playerName} usó ${treatmentName} contra ${targetPlayerName}`, {
      carta: cardInfo,
      tratamiento: treatmentName,
      objetivo: targetPlayerName,
      infoAdicional: additionalInfo,
    });
  }

  /**
   * Registra un cambio en un slot/sistema
   */
  logSlotChange(
    playerName: string,
    color: Color,
    before: OrganSlot,
    after: OrganSlot,
    reason: string
  ): void {
    const systemName = COLOR_SYSTEM_LABELS[color];

    this.info(`🔄 Cambio en ${systemName} de ${playerName}: ${reason}`, {
      antes: this.formatSlot(before),
      despues: this.formatSlot(after),
    });
  }

  /**
   * Registra cuando una carta se mueve de un lugar a otro
   */
  logCardMovement(
    card: Card,
    from: string,
    to: string,
    reason?: string
  ): void {
    const cardInfo = this.formatCard(card);
    this.debug(`📦 ${cardInfo} movida: ${from} → ${to}${reason ? ` (${reason})` : ''}`);
  }

  /**
   * Obtiene todos los logs registrados
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Obtiene los logs recientes (últimos N)
   */
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Limpia todos los logs
   */
  clearLogs(): void {
    this.logs = [];
    this.info('🗑️ Logs limpiados');
  }

  /**
   * Exporta los logs como string formateado
   */
  exportLogsAsString(): string {
    return this.logs
      .map(log => {
        const dataStr = log.data ? `\n  ${JSON.stringify(log.data, null, 2)}` : '';
        return `[${log.timestamp}] [${log.level}] ${log.message}${dataStr}`;
      })
      .join('\n');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Métodos privados de formateo
  // ─────────────────────────────────────────────────────────────────────────────

  private formatCard(card: Card): string {
    if (card.name) {
      return `"${card.name}"`;
    }

    const typeLabel = CARD_TYPE_LABELS[card.type];
    const colorLabel = card.color === Color.MULTICOLOR ? 'MULTICOLOR' : COLOR_SYSTEM_LABELS[card.color] || card.color;

    if (card.type === CardType.TREATMENT && card.treatmentType) {
      const treatmentName = TREATMENT_LABELS[card.treatmentType];
      return `${typeLabel}: ${treatmentName}`;
    }

    return `${typeLabel} ${colorLabel}`;
  }

  private formatHand(hand: Card[]): string {
    if (hand.length === 0) return '❌ Vacía';

    return hand.map(card => this.formatCard(card)).join(' | ');
  }

  private formatSlot(slot: OrganSlot): any {
    if (!slot.organCard) {
      return { estado: 'VACÍO', virus: slot.virusCards.length, medicinas: slot.medicineCards.length };
    }

    const organColor = slot.organCard.color === Color.MULTICOLOR
      ? 'MULTICOLOR'
      : COLOR_SYSTEM_LABELS[slot.organCard.color];

    return {
      organo: organColor,
      estado: ORGAN_STATE_LABELS[getOrganState(slot)],
      virus: slot.virusCards.length,
      medicinas: slot.medicineCards.length,
      organoCard: this.formatCard(slot.organCard),
    };
  }

  private formatBody(body: Map<Color, OrganSlot> | Record<string, OrganSlot>): any {
    const entries = getBodyEntries(body);
    const result: Record<string, any> = {};

    entries.forEach(([color, slot]) => {
      const systemName = COLOR_SYSTEM_LABELS[color];
      result[systemName] = this.formatSlot(slot);
    });

    return result;
  }
}

// Singleton instance
export const gameLogger = new GameLogger();

// Exportar tipos y funciones
export { GameLogger };
export type { LogEntry };
