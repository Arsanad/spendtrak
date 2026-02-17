/**
 * Gamification Service Tests
 */

import {
  getUserGamification,
  getAchievements,
  getUserAchievements,
  updateAchievementProgress,
  getActiveChallenges,
  getUserChallenges,
  startChallenge,
  getStreakInfo,
  getGamificationSummary,
} from '../gamification';
import { supabase } from '../supabase';
import { getLevelForPoints, getNextLevel, calculateLevelProgress, LEVELS } from '@/types/gamification';

// Mock Supabase
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
    rpc: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Helper to create chainable mock query
function createMockQuery(resolvedData: any, error: any = null) {
  const mockQuery: any = {
    select: jest.fn(() => mockQuery),
    insert: jest.fn(() => mockQuery),
    update: jest.fn(() => mockQuery),
    upsert: jest.fn(() => mockQuery),
    eq: jest.fn(() => mockQuery),
    in: jest.fn(() => mockQuery),
    not: jest.fn(() => mockQuery),
    gte: jest.fn(() => mockQuery),
    lte: jest.fn(() => mockQuery),
    or: jest.fn(() => mockQuery),
    order: jest.fn(() => mockQuery),
    limit: jest.fn(() => mockQuery),
    single: jest.fn(() => Promise.resolve({ data: resolvedData, error })),
  };
  mockQuery.then = (resolve: any) => {
    resolve({ data: resolvedData, error });
    return mockQuery;
  };
  return mockQuery;
}

describe('Gamification Service', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('getUserGamification', () => {
    it('should fetch user gamification profile with level info', async () => {
      const mockProfile = {
        id: 'gam-1',
        user_id: 'user-123',
        total_points: 500,
        current_level: 4,
        current_streak: 7,
        longest_streak: 14,
        achievements_unlocked: 5,
        challenges_completed: 3,
      };

      const mockQuery = createMockQuery(mockProfile);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getUserGamification();

      expect(result.total_points).toBe(500);
      expect(result.level_info).toBeDefined();
      expect(result.level_info.level).toBe(4);
      expect(result.level_info.name).toBe('Tracker');
      expect(result.points_to_next_level).toBeDefined();
    });

    it('should create default profile if none exists', async () => {
      const newProfile = {
        user_id: 'user-123',
        total_points: 0,
        current_level: 1,
        current_streak: 0,
        longest_streak: 0,
        achievements_unlocked: 0,
        challenges_completed: 0,
      };

      const notFoundQuery = createMockQuery(null, { code: 'PGRST116' });
      const insertQuery = createMockQuery({ id: 'new-gam', ...newProfile });

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(notFoundQuery)
        .mockReturnValueOnce(insertQuery);

      const result = await getUserGamification();

      expect(result.total_points).toBe(0);
      expect(result.current_level).toBe(1);
    });

    it('should throw error when not authenticated', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(getUserGamification()).rejects.toThrow('Not authenticated');
    });
  });

  describe('getAchievements', () => {
    it('should fetch all active achievements', async () => {
      const mockAchievements = [
        {
          id: 'ach-1',
          key: 'first_transaction',
          name: 'First Steps',
          description: 'Log your first transaction',
          icon: '🚀',
          category: 'tracking',
          rarity: 'common',
          points: 10,
          requirement_value: 1,
          is_active: true,
        },
        {
          id: 'ach-2',
          key: 'streak_7',
          name: 'Week Warrior',
          description: 'Maintain a 7-day streak',
          icon: '🔥',
          category: 'streak',
          rarity: 'uncommon',
          points: 25,
          requirement_value: 7,
          is_active: true,
        },
      ];

      const mockQuery = createMockQuery(mockAchievements);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getAchievements();

      expect(result.length).toBe(2);
      expect(result[0].key).toBe('first_transaction');
    });
  });

  describe('getUserAchievements', () => {
    it('should fetch user achievements with progress', async () => {
      const mockAchievements = [
        {
          id: 'ach-1',
          key: 'streak_7',
          name: 'Week Warrior',
          requirement_value: 7,
          points: 25,
          rarity: 'uncommon',
          is_active: true,
        },
      ];

      const mockUserAchievements = [
        {
          id: 'ua-1',
          user_id: 'user-123',
          achievement_id: 'ach-1',
          progress: 5,
          unlocked_at: null,
          is_claimed: false,
        },
      ];

      const achievementsQuery = createMockQuery(mockAchievements);
      const userAchievementsQuery = createMockQuery(mockUserAchievements);

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(achievementsQuery)
        .mockReturnValueOnce(userAchievementsQuery);

      const result = await getUserAchievements();

      expect(result.length).toBe(1);
      expect(result[0].progress).toBe(5);
      expect(result[0].progress_percentage).toBeCloseTo(71.43, 1); // (5/7)*100
      expect(result[0].is_complete).toBe(false);
    });
  });

  describe('getActiveChallenges', () => {
    it('should fetch active challenges within date range', async () => {
      const mockChallenges = [
        {
          id: 'ch-1',
          name: 'Weekly Saver',
          description: 'Save $100 this week',
          challenge_type: 'weekly',
          target_value: 100,
          points_reward: 50,
          start_date: new Date(Date.now() - 86400000).toISOString(),
          end_date: new Date(Date.now() + 86400000 * 6).toISOString(),
          is_active: true,
        },
      ];

      const mockQuery = createMockQuery(mockChallenges);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getActiveChallenges();

      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Weekly Saver');
    });
  });

  describe('getUserChallenges', () => {
    it('should fetch user challenges with progress and time remaining', async () => {
      const futureDate = new Date(Date.now() + 86400000 * 3); // 3 days from now

      const mockUserChallenges = [
        {
          id: 'uc-1',
          user_id: 'user-123',
          challenge_id: 'ch-1',
          current_progress: 50,
          status: 'active',
          challenge: {
            name: 'Weekly Saver',
            target_value: 100,
            end_date: futureDate.toISOString(),
            points_reward: 50,
          },
        },
      ];

      const mockQuery = createMockQuery(mockUserChallenges);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getUserChallenges();

      expect(result.length).toBe(1);
      expect(result[0].progress_percentage).toBe(50);
      expect(result[0].is_expired).toBe(false);
      expect(result[0].time_remaining).toBeDefined();
    });
  });

  describe('startChallenge', () => {
    it('should start a new challenge', async () => {
      const newChallenge = {
        id: 'uc-new',
        user_id: 'user-123',
        challenge_id: 'ch-1',
        current_progress: 0,
        status: 'active',
      };

      const existingQuery = createMockQuery(null);
      const insertQuery = createMockQuery(newChallenge);

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(existingQuery)
        .mockReturnValueOnce(insertQuery);

      const result = await startChallenge('ch-1');

      expect(result.status).toBe('active');
      expect(result.current_progress).toBe(0);
    });

    it('should throw error if challenge already started', async () => {
      const existingQuery = createMockQuery({ id: 'uc-existing' });
      (mockSupabase.from as jest.Mock).mockReturnValue(existingQuery);

      await expect(startChallenge('ch-1')).rejects.toThrow('Challenge already started');
    });
  });

  describe('getStreakInfo', () => {
    it('should return streak info with milestone tracking', async () => {
      const today = new Date().toISOString().split('T')[0];

      const mockProfile = {
        current_streak: 5,
        longest_streak: 14,
        last_activity_date: today,
      };

      const mockQuery = createMockQuery(mockProfile);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getStreakInfo();

      expect(result.current_streak).toBe(5);
      expect(result.longest_streak).toBe(14);
      expect(result.streak_maintained_today).toBe(true);
      expect(result.next_milestone).toBe(7);
      expect(result.days_to_milestone).toBe(2);
    });

    it('should return default values when no profile exists', async () => {
      const mockQuery = createMockQuery(null);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getStreakInfo();

      expect(result.current_streak).toBe(0);
      expect(result.longest_streak).toBe(0);
      expect(result.streak_maintained_today).toBe(false);
    });
  });

  describe('Level Functions', () => {
    describe('getLevelForPoints', () => {
      it('should return correct level for points', () => {
        expect(getLevelForPoints(0).level).toBe(1);
        expect(getLevelForPoints(50).level).toBe(1);
        expect(getLevelForPoints(100).level).toBe(2);
        expect(getLevelForPoints(500).level).toBe(4);
        expect(getLevelForPoints(1000).level).toBe(5);
        expect(getLevelForPoints(30000).level).toBe(10);
      });

      it('should return correct level name', () => {
        expect(getLevelForPoints(0).name).toBe('Beginner');
        expect(getLevelForPoints(100).name).toBe('Saver');
        expect(getLevelForPoints(500).name).toBe('Tracker');
        expect(getLevelForPoints(30000).name).toBe('Champion');
      });
    });

    describe('getNextLevel', () => {
      it('should return next level info', () => {
        const next = getNextLevel(1);
        expect(next?.level).toBe(2);
        expect(next?.min_points).toBe(100);
      });

      it('should return null for max level', () => {
        const next = getNextLevel(10);
        expect(next).toBeNull();
      });
    });

    describe('calculateLevelProgress', () => {
      it('should calculate progress correctly', () => {
        const { current, progress, pointsToNext } = calculateLevelProgress(150);

        expect(current.level).toBe(2);
        expect(progress).toBeCloseTo(33.33, 0); // (150-100) / (250-100) * 100
        expect(pointsToNext).toBe(100); // 250 - 150
      });

      it('should return 100% progress for max level', () => {
        const { current, progress, pointsToNext } = calculateLevelProgress(50000);

        expect(current.level).toBe(10);
        expect(progress).toBe(100);
        expect(pointsToNext).toBe(0);
      });
    });
  });

  describe('getGamificationSummary', () => {
    it('should return complete gamification summary', async () => {
      const mockProfile = {
        total_points: 500,
        current_level: 4,
        current_streak: 7,
        longest_streak: 14,
        achievements_unlocked: 5,
        challenges_completed: 3,
      };

      const mockAchievements = [
        { id: 'ach-1', key: 'test', name: 'Test', points: 10, requirement_value: 1, rarity: 'common', is_active: true },
      ];

      const mockUserAchievements = [
        { achievement_id: 'ach-1', progress: 1, unlocked_at: new Date().toISOString() },
      ];

      const mockChallenges: any[] = [];
      const mockStreakProfile = { current_streak: 7, longest_streak: 14, last_activity_date: new Date().toISOString().split('T')[0] };

      // Mock all the queries
      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(createMockQuery(mockProfile)) // getUserGamification
        .mockReturnValueOnce(createMockQuery(mockStreakProfile)) // getStreakInfo
        .mockReturnValueOnce(createMockQuery(mockProfile)) // getPointsSummary - profile
        .mockReturnValueOnce(createMockQuery(mockAchievements)) // getUserAchievements - achievements
        .mockReturnValueOnce(createMockQuery(mockUserAchievements)) // getUserAchievements - user achievements
        .mockReturnValueOnce(createMockQuery(mockChallenges)) // getUserChallenges
        .mockReturnValueOnce(createMockQuery(mockAchievements)); // getAchievements

      const result = await getGamificationSummary();

      expect(result.user).toBeDefined();
      expect(result.streak).toBeDefined();
      expect(result.points).toBeDefined();
      expect(result.achievements).toBeDefined();
      expect(result.challenges).toBeDefined();
    });
  });
});
