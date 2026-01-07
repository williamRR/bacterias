/**
 * Tipos compartidos para hooks del juego
 */

import type { NotificationType } from '@/components/Narrator';

export type NarratorCallback = (message: string, type?: NotificationType) => void;
export type LogCallback = (message: string) => void;
