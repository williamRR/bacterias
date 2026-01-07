// Un solo contexto para toda la aplicación
let audioCtx: AudioContext | null = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * Crea un sonido suave con un filtro para que no moleste
 */
function playSoftNote(freqs: number[], type: OscillatorType, duration: number, volume: number) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter(); // Filtro para suavizar el sonido

    osc.type = type;
    filter.type = 'lowpass';
    filter.frequency.value = 1000; // Corta las frecuencias agudas molestas

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    // Secuencia de frecuencias (si hay varias)
    freqs.forEach((freq, i) => {
      osc.frequency.setValueAtTime(freq, now + (i * 0.1));
    });

    // Envolvente suave (Fade in y Fade out)
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  } catch (e) {
    console.warn("Audio bloqueado por el navegador o error", e);
  }
}

// --- Versiones Sutiles ---

export const playTurnNotificationSound = () =>
  playSoftNote([523.25, 659.25], 'sine', 0.6, 0.1); // Do-Mi suave

export const playVirusSound = () =>
  playSoftNote([150, 100], 'triangle', 0.3, 0.05); // Un sutil "thump" hacia abajo

export const playMedicineSound = () =>
  playSoftNote([880, 1174.66], 'sine', 0.5, 0.08); // Un brillo muy agudo pero tenue

export const playDiscardSound = () => {
  // Para el whoosh, el ruido blanco es mejor, pero con triángulo sutil:
  playSoftNote([300, 50], 'triangle', 0.2, 0.04);
};

export const playSystemSound = () =>
  playSoftNote([440, 440], 'sine', 0.15, 0.06); // Un "tap" seco