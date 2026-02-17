/**
 * Onboarding Tunnel Store
 * Persists step progress and collected data for resume-on-crash
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OnboardingData } from '@/types/onboarding';

interface OnboardingStoreState {
  currentStep: number;
  data: Partial<OnboardingData>;
  isComplete: boolean;
  startedAt: string | null;

  // Actions
  setStep: (step: number) => void;
  updateData: (partial: Partial<OnboardingData>) => void;
  markComplete: () => void;
  reset: () => void;
}

const INITIAL_STATE = {
  currentStep: 0,
  data: {},
  isComplete: false,
  startedAt: null as string | null,
};

export const useOnboardingStore = create<OnboardingStoreState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      setStep: (step: number) => {
        const { startedAt } = get();
        set({
          currentStep: step,
          startedAt: startedAt || new Date().toISOString(),
        });
      },

      updateData: (partial: Partial<OnboardingData>) =>
        set((state) => ({
          data: { ...state.data, ...partial },
        })),

      markComplete: () =>
        set({
          isComplete: true,
        }),

      reset: () => set(INITIAL_STATE),
    }),
    {
      name: 'onboarding-tunnel',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
