export interface AudioConfig {
  enabled: boolean;
  volume: number;
}

let audioConfig: AudioConfig = {
  enabled: true,
  volume: 0.5,
};

export function setAudioConfig(config: Partial<AudioConfig>): void {
  audioConfig = { ...audioConfig, ...config };
}

export function getAudioConfig(): AudioConfig {
  return { ...audioConfig };
}

export function isAudioEnabled(): boolean {
  return audioConfig.enabled;
}

export function playTone(frequency: number, duration: number): void {
  if (!audioConfig.enabled) return;

  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(audioConfig.volume * 0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.error('Error playing tone:', error);
  }
}

export function playSuccessSound(): void {
  playTone(880, 0.1);
  setTimeout(() => playTone(1100, 0.15), 100);
}

export function playWarningSound(): void {
  playTone(330, 0.2);
  setTimeout(() => playTone(290, 0.3), 200);
}

export function playErrorSound(): void {
  playTone(200, 0.2);
  setTimeout(() => playTone(180, 0.2), 200);
}

export function playInfoSound(): void {
  playTone(440, 0.15);
}

export function playTurnNotificationSound(): void {
  playSuccessSound();
}

export function playVirusSound(): void {
  playWarningSound();
}

export function playMedicineSound(): void {
  playSuccessSound();
}

export function playDiscardSound(): void {
  playTone(220, 0.1);
}

export function playSystemSound(): void {
  playTone(660, 0.15);
  setTimeout(() => playTone(880, 0.1), 150);
}
