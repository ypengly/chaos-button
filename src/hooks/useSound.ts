import { useCallback, useEffect, useRef } from 'react';
import type { SoundKind } from '../types';

interface Note {
  /** Frequency in Hz. */
  freq: number;
  /** Start offset in seconds. */
  at: number;
  /** Duration in seconds. */
  length: number;
  type?: OscillatorType;
}

const VOLUME = 0.05;
/** Minimum gap between sounds so rapid presses never pile up into noise. */
const MIN_GAP_MS = 110;

const SOUNDS: Record<SoundKind, Note[]> = {
  press: [
    { freq: 392, at: 0, length: 0.07, type: 'triangle' },
    { freq: 523, at: 0.05, length: 0.09, type: 'triangle' },
  ],
  rare: [
    { freq: 523, at: 0, length: 0.1, type: 'sine' },
    { freq: 659, at: 0.09, length: 0.1, type: 'sine' },
    { freq: 784, at: 0.18, length: 0.16, type: 'sine' },
  ],
  supreme: [
    { freq: 392, at: 0, length: 0.12, type: 'triangle' },
    { freq: 523, at: 0.1, length: 0.12, type: 'triangle' },
    { freq: 659, at: 0.2, length: 0.12, type: 'triangle' },
    { freq: 784, at: 0.3, length: 0.12, type: 'triangle' },
    { freq: 1047, at: 0.4, length: 0.3, type: 'sine' },
  ],
  levelup: [
    { freq: 440, at: 0, length: 0.09, type: 'square' },
    { freq: 554, at: 0.09, length: 0.09, type: 'square' },
    { freq: 659, at: 0.18, length: 0.16, type: 'square' },
  ],
  achievement: [
    { freq: 659, at: 0, length: 0.08, type: 'sine' },
    { freq: 880, at: 0.08, length: 0.16, type: 'sine' },
  ],
  toggle: [{ freq: 600, at: 0, length: 0.06, type: 'sine' }],
};

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

function createContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
  if (!Ctor) return null;
  try {
    return new Ctor();
  } catch {
    return null;
  }
}

export interface SoundControls {
  /** Plays a sound only when sound is enabled in settings. */
  play: (kind: SoundKind) => void;
  /** Plays a sound regardless of the setting. Used for the confirmation blip when the user turns sound on. */
  preview: (kind: SoundKind) => void;
}

/**
 * Tiny Web Audio synth: no audio files are shipped or referenced. Sound is silent
 * unless `enabled` is true, and the AudioContext is only created lazily from a
 * user-triggered call (a press or the toggle), which satisfies autoplay policies.
 */
export function useSound(enabled: boolean): SoundControls {
  const contextRef = useRef<AudioContext | null>(null);
  const lastPlayRef = useRef(0);
  const busyUntilRef = useRef(0);

  useEffect(() => {
    return () => {
      const context = contextRef.current;
      contextRef.current = null;
      if (context && context.state !== 'closed') {
        void context.close().catch(() => undefined);
      }
    };
  }, []);

  const emit = useCallback((kind: SoundKind) => {
      const nowMs = performance.now();
      const isSupreme = kind === 'supreme';
      // Throttle, and never let small sounds cut across a long celebratory one.
      if (!isSupreme && nowMs < busyUntilRef.current) return;
      if (nowMs - lastPlayRef.current < MIN_GAP_MS) return;

      if (!contextRef.current) contextRef.current = createContext();
      const context = contextRef.current;
      if (!context) return;

      try {
        if (context.state === 'suspended') void context.resume().catch(() => undefined);
        const notes = SOUNDS[kind];
        const start = context.currentTime + 0.01;
        for (const note of notes) {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.type = note.type ?? 'sine';
          oscillator.frequency.setValueAtTime(note.freq, start + note.at);
          gain.gain.setValueAtTime(0.0001, start + note.at);
          gain.gain.exponentialRampToValueAtTime(VOLUME, start + note.at + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + note.at + note.length);
          oscillator.connect(gain).connect(context.destination);
          oscillator.start(start + note.at);
          oscillator.stop(start + note.at + note.length + 0.02);
        }
        const totalMs = Math.max(...notes.map((note) => (note.at + note.length) * 1000));
        lastPlayRef.current = nowMs;
        busyUntilRef.current = isSupreme ? nowMs + totalMs : 0;
      } catch {
        // Audio is a nice-to-have; failures must never break the experience.
      }
    }, []);

  const play = useCallback(
    (kind: SoundKind) => {
      if (enabled) emit(kind);
    },
    [enabled, emit],
  );

  return { play, preview: emit };
}
