/**
 * Gamification Store
 * Manages achievements, challenges, points, streaks, and leaderboards
 */

import { create } from 'zustand';
import { logger } from '@/utils/logger';
import * as gamificationService from '@/services/gamification';
import { eventBus } from '@/services/eventBus';
import type {
  UserGamificationWithLevel,
  UserAchievementWithDetails,
  UserChallengeWithDetails,
  Achievement,
  Challenge,
  StreakInfo,
  PointsSummary,
  LeaderboardData,
  LeaderboardPeriod,
  LeaderboardType,
  GamificationSummary,
  AddPointsInput,
} from '@/types';

interface GamificationState {
  // State
  userProfile: UserGamificationWithLevel | null;
  achievements: UserAchievementWithDetails[];
  challenges: UserChallengeWithDetails[];
  activeChallenges: Challenge[];
  streak: StreakInfo | null;
  points: PointsSummary | null;
  leaderboard: LeaderboardData | null;
  summary: GamificationSummary | null;
  selectedTab: 'overview' | 'achievements' | 'challenges' | 'leaderboard';
  leaderboardType: LeaderboardType;
  leaderboardPeriod: LeaderboardPeriod;
  isLoading: boolean;
  error: string | null;
  showLevelUpModal: boolean;
  newLevel: number | null;

  // Actions
  fetchUserProfile: () => Promise<void>;
  fetchAchievements: () => Promise<void>;
  fetchChallenges: () => Promise<void>;
  fetchStreak: () => Promise<void>;
  fetchPoints: () => Promise<void>;
  fetchLeaderboard: (type?: LeaderboardType, period?: LeaderboardPeriod) => Promise<void>;
  fetchSummary: () => Promise<void>;
  fetchAll: () => Promise<void>;

  addPoints: (input: AddPointsInput) => Promise<void>;
  claimAchievement: (achievementId: string) => Promise<void>;
  startChallenge: (challengeId: string) => Promise<void>;
  updateStreak: () => Promise<void>;
  checkDailyLogin: () => Promise<void>;

  setSelectedTab: (tab: GamificationState['selectedTab']) => void;
  setLeaderboardType: (type: LeaderboardType) => void;
  setLeaderboardPeriod: (period: LeaderboardPeriod) => void;
  dismissLevelUpModal: () => void;
  clearError: () => void;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  // Initial state
  userProfile: null,
  achievements: [],
  challenges: [],
  activeChallenges: [],
  streak: null,
  points: null,
  leaderboard: null,
  summary: null,
  selectedTab: 'overview',
  leaderboardType: 'points',
  leaderboardPeriod: 'weekly',
  isLoading: false,
  error: null,
  showLevelUpModal: false,
  newLevel: null,

  // Fetch user profile
  fetchUserProfile: async () => {
    try {
      const userProfile = await gamificationService.getUserGamification();
      const previousLevel = get().userProfile?.current_level;

      set({ userProfile });

      // Check for level up
      if (previousLevel && userProfile.current_level > previousLevel) {
        set({
          showLevelUpModal: true,
          newLevel: userProfile.current_level,
        });

        // Emit event for Quantum Alive Experience
        eventBus.emit('level:up', { newLevel: userProfile.current_level, previousLevel });
      }
    } catch (error) {
      logger.gamification.error('Failed to fetch user profile:', error);
    }
  },

  // Fetch achievements
  fetchAchievements: async () => {
    try {
      set({ isLoading: true, error: null });
      const achievements = await gamificationService.getUserAchievements();
      set({ achievements, isLoading: false });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
    }
  },

  // Fetch challenges
  fetchChallenges: async () => {
    try {
      set({ isLoading: true, error: null });

      const [userChallenges, activeChallenges] = await Promise.all([
        gamificationService.getUserChallenges(),
        gamificationService.getActiveChallenges(),
      ]);

      set({
        challenges: userChallenges,
        activeChallenges,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
    }
  },

  // Fetch streak info
  fetchStreak: async () => {
    try {
      const streak = await gamificationService.getStreakInfo();
      set({ streak });
    } catch (error) {
      logger.gamification.error('Failed to fetch streak:', error);
    }
  },

  // Fetch points summary
  fetchPoints: async () => {
    try {
      const points = await gamificationService.getPointsSummary();
      set({ points });
    } catch (error) {
      logger.gamification.error('Failed to fetch points:', error);
    }
  },

  // Fetch leaderboard
  fetchLeaderboard: async (type, period) => {
    try {
      set({ isLoading: true, error: null });

      const leaderboardType = type || get().leaderboardType;
      const leaderboardPeriod = period || get().leaderboardPeriod;

      const leaderboard = await gamificationService.getLeaderboard(
        leaderboardType,
        leaderboardPeriod
      );

      set({
        leaderboard,
        leaderboardType,
        leaderboardPeriod,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
    }
  },

  // Fetch summary
  fetchSummary: async () => {
    try {
      set({ isLoading: true, error: null });
      const summary = await gamificationService.getGamificationSummary();
      set({
        summary,
        userProfile: summary.user,
        streak: summary.streak,
        points: summary.points,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
    }
  },

  // Fetch all gamification data
  fetchAll: async () => {
    try {
      set({ isLoading: true, error: null });

      await Promise.all([
        get().fetchSummary(),
        get().fetchAchievements(),
        get().fetchChallenges(),
      ]);

      set({ isLoading: false });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
    }
  },

  // Add points
  addPoints: async (input) => {
    try {
      await gamificationService.addPoints(input);
      await get().fetchUserProfile();
      await get().fetchPoints();

      // Emit event for Quantum Alive Experience
      eventBus.emit('points:earned', { amount: input.points, reason: input.reason || 'action' });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // Claim achievement
  claimAchievement: async (achievementId) => {
    try {
      await gamificationService.claimAchievement(achievementId);

      const achievement = get().achievements.find(a => a.achievement_id === achievementId);

      set((state) => ({
        achievements: state.achievements.map((a) =>
          a.achievement_id === achievementId
            ? { ...a, is_claimed: true, claimed_at: new Date().toISOString() }
            : a
        ),
      }));

      // Emit event for Quantum Alive Experience
      eventBus.emit('achievement:unlocked', {
        name: achievement?.name || 'Achievement',
        id: achievementId,
      });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // Start challenge
  startChallenge: async (challengeId) => {
    try {
      await gamificationService.startChallenge(challengeId);
      await get().fetchChallenges();
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // Update streak
  updateStreak: async () => {
    try {
      const previousStreak = get().streak?.current_streak ?? 0;
      const streak = await gamificationService.updateStreak();
      set({ streak });
      await get().fetchUserProfile();

      // Emit event for Quantum Alive Experience
      const current = streak?.current_streak ?? 0;
      eventBus.emit('streak:updated', { current, isNew: current > previousStreak });
    } catch (error) {
      logger.gamification.error('Failed to update streak:', error);
    }
  },

  // Check daily login
  checkDailyLogin: async () => {
    try {
      await gamificationService.checkDailyLogin();
      await get().fetchUserProfile();
      await get().fetchStreak();
    } catch (error) {
      logger.gamification.error('Failed to check daily login:', error);
    }
  },

  // Set selected tab
  setSelectedTab: (tab) => set({ selectedTab: tab }),

  // Set leaderboard type
  setLeaderboardType: (type) => {
    set({ leaderboardType: type });
    get().fetchLeaderboard(type);
  },

  // Set leaderboard period
  setLeaderboardPeriod: (period) => {
    set({ leaderboardPeriod: period });
    get().fetchLeaderboard(undefined, period);
  },

  // Dismiss level up modal
  dismissLevelUpModal: () => set({ showLevelUpModal: false, newLevel: null }),

  // Clear error
  clearError: () => set({ error: null }),
}));

// Selector hooks for common derived state
export const useUserLevel = () =>
  useGamificationStore((state) => state.userProfile?.current_level ?? 1);

export const useTotalPoints = () =>
  useGamificationStore((state) => state.userProfile?.total_points ?? 0);

export const useCurrentStreak = () =>
  useGamificationStore((state) => state.streak?.current_streak ?? 0);

export const useUnlockedAchievements = () =>
  useGamificationStore((state) =>
    state.achievements.filter((a) => a.is_complete)
  );

export const useInProgressAchievements = () =>
  useGamificationStore((state) =>
    state.achievements
      .filter((a) => !a.is_complete && a.progress > 0)
      .sort((a, b) => b.progress_percentage - a.progress_percentage)
  );

export const useActiveChallengesCount = () =>
  useGamificationStore((state) =>
    state.challenges.filter((c) => c.status === 'active').length
  );
