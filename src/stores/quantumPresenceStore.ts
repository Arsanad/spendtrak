/**
 * Quantum Presence Store
 * Manages Quantum's visible state across the entire app.
 * The single source of truth for what Quantum is doing right now.
 */

import { create } from 'zustand';
import type { QuantumResponse } from '@/services/quantumReactor';

export type PresenceMode = 'idle' | 'toast' | 'celebration' | 'sleeping';

interface QuantumPresenceState {
  // Current visual state
  mode: PresenceMode;
  currentMessage: string | null;
  currentEmotion: string;
  isVisible: boolean;

  // Toast state
  toastQueue: QuantumResponse[];
  activeToast: QuantumResponse | null;

  // Celebration state
  activeCelebration: QuantumResponse | null;

  // Time-aware greeting
  greeting: string | null;
  showGreeting: boolean;

  // Gamification visibility
  streakCount: number;
  currentLevel: number;
  showLevelUp: boolean;
  levelUpLevel: number | null;

  // Actions
  showToast: (response: QuantumResponse) => void;
  dismissToast: () => void;
  showCelebration: (response: QuantumResponse) => void;
  dismissCelebration: () => void;
  setGreeting: (greeting: string) => void;
  dismissGreeting: () => void;
  updateStreak: (count: number) => void;
  updateLevel: (level: number) => void;
  showLevelUpCelebration: (level: number) => void;
  dismissLevelUp: () => void;
  setEmotion: (emotion: string) => void;
  reset: () => void;
}

export const useQuantumPresenceStore = create<QuantumPresenceState>((set, get) => ({
  // Initial state
  mode: 'idle',
  currentMessage: null,
  currentEmotion: 'idle',
  isVisible: true,
  toastQueue: [],
  activeToast: null,
  activeCelebration: null,
  greeting: null,
  showGreeting: false,
  streakCount: 0,
  currentLevel: 1,
  showLevelUp: false,
  levelUpLevel: null,

  // Show a toast message from Quantum
  showToast: (response) => {
    const { activeToast } = get();

    // If there's an active toast, queue this one
    if (activeToast) {
      set((state) => ({
        toastQueue: [...state.toastQueue, response],
      }));
      return;
    }

    set({
      mode: 'toast',
      activeToast: response,
      currentMessage: response.message,
      currentEmotion: response.emotion || 'idle',
    });

    // Auto-dismiss after duration
    const duration = response.duration || 2000;
    setTimeout(() => {
      get().dismissToast();
    }, duration);
  },

  // Dismiss the current toast
  dismissToast: () => {
    const { toastQueue } = get();

    if (toastQueue.length > 0) {
      // Show next in queue
      const [next, ...rest] = toastQueue;
      set({
        activeToast: next,
        currentMessage: next.message,
        currentEmotion: next.emotion || 'idle',
        toastQueue: rest,
      });

      const duration = next.duration || 2000;
      setTimeout(() => {
        get().dismissToast();
      }, duration);
    } else {
      set({
        mode: 'idle',
        activeToast: null,
        currentMessage: null,
        currentEmotion: 'idle',
      });
    }
  },

  // Show a celebration overlay
  showCelebration: (response) => {
    set({
      mode: 'celebration',
      activeCelebration: response,
      currentMessage: response.message,
      currentEmotion: response.emotion || 'celebrating',
    });

    // Auto-dismiss after duration
    const duration = response.duration || 4000;
    setTimeout(() => {
      get().dismissCelebration();
    }, duration);
  },

  // Dismiss celebration
  dismissCelebration: () => {
    set({
      mode: 'idle',
      activeCelebration: null,
      currentMessage: null,
      currentEmotion: 'idle',
    });
  },

  // Set time-aware greeting
  setGreeting: (greeting) => {
    set({
      greeting,
      showGreeting: true,
    });
  },

  // Dismiss greeting
  dismissGreeting: () => {
    set({
      showGreeting: false,
    });
  },

  // Update streak count
  updateStreak: (count) => {
    set({ streakCount: count });
  },

  // Update level
  updateLevel: (level) => {
    set({ currentLevel: level });
  },

  // Show level up celebration
  showLevelUpCelebration: (level) => {
    set({
      showLevelUp: true,
      levelUpLevel: level,
    });
  },

  // Dismiss level up
  dismissLevelUp: () => {
    set({
      showLevelUp: false,
      levelUpLevel: null,
    });
  },

  // Set current emotion
  setEmotion: (emotion) => {
    set({ currentEmotion: emotion });
  },

  // Reset all state
  reset: () => {
    set({
      mode: 'idle',
      currentMessage: null,
      currentEmotion: 'idle',
      isVisible: true,
      toastQueue: [],
      activeToast: null,
      activeCelebration: null,
      greeting: null,
      showGreeting: false,
      showLevelUp: false,
      levelUpLevel: null,
    });
  },
}));

// Selector hooks
export const useQuantumMode = () =>
  useQuantumPresenceStore((s) => s.mode);

export const useQuantumToast = () =>
  useQuantumPresenceStore((s) => s.activeToast);

export const useQuantumCelebration = () =>
  useQuantumPresenceStore((s) => s.activeCelebration);

export const useQuantumGreeting = () =>
  useQuantumPresenceStore((s) => ({ greeting: s.greeting, showGreeting: s.showGreeting }));

export const useQuantumStreak = () =>
  useQuantumPresenceStore((s) => s.streakCount);

export const useQuantumLevel = () =>
  useQuantumPresenceStore((s) => s.currentLevel);
