import fs from 'fs';
import path from 'path';

const LOGS_DIR = path.join(process.cwd(), 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

class GameLogger {
  private roomId: string;
  private logPath: string;

  constructor(roomId: string) {
    this.roomId = roomId;
    this.logPath = path.join(LOGS_DIR, `game-room-${roomId}.log`);
  }

  private write(level: LogLevel, message: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    const logEntry: Record<string, unknown> = {
      timestamp,
      level,
      room: this.roomId,
      message,
    };

    if (data) {
      logEntry.data = data;
    }

    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(this.logPath, logLine, 'utf-8');
  }

  info(message: string, data?: unknown): void {
    this.write('INFO', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.write('WARN', message, data);
  }

  error(message: string, data?: unknown): void {
    this.write('ERROR', message, data);
  }

  // Game-specific logging methods
  logPlayerJoined(playerName: string, playerId: string): void {
    this.info('Player joined', { playerName, playerId });
  }

  logPlayerLeft(playerName: string, playerId: string): void {
    this.info('Player left', { playerName, playerId });
  }

  logGameStarted(): void {
    this.info('Game started');
  }

  logTurnStarted(playerName: string, turnNumber: number): void {
    this.info('Turn started', { playerName, turnNumber });
  }

  logCardPlayed(playerName: string, cardType: string, cardColor?: string): void {
    this.info('Card played', {
      playerName,
      card: cardType,
      ...(cardColor && { color: cardColor }),
    });
  }

  logTreatmentCard(playerName: string, treatmentType: string, targetPlayer?: string): void {
    this.info('Treatment card played', {
      playerName,
      treatment: treatmentType,
      ...(targetPlayer && { target: targetPlayer }),
    });
  }

  logCardDiscarded(playerName: string, cardType: string): void {
    this.info('Card discarded', { playerName, card: cardType });
  }

  logSystemStateChanged(
    playerName: string,
    system: string,
    oldState: string,
    newState: string
  ): void {
    this.info('System state changed', {
      playerName,
      system,
      oldState,
      newState,
    });
  }

  logGameEnded(winnerName: string): void {
    this.info('Game ended', { winner: winnerName });
  }

  logError(message: string, error?: unknown): void {
    this.error(message, error);
  }
}

// Logger factory
const loggers = new Map<string, GameLogger>();

export function getGameLogger(roomId: string): GameLogger {
  if (!loggers.has(roomId)) {
    loggers.set(roomId, new GameLogger(roomId));
  }
  return loggers.get(roomId)!;
}

export function removeGameLogger(roomId: string): void {
  loggers.delete(roomId);
}
