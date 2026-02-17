/**
 * Gamification Types - Phase 4C
 * Types for achievements, challenges, points, and leaderboards
 */

// ============================================
// ACHIEVEMENT TYPES
// ============================================

export type AchievementCategory =
  | 'savings'
  | 'budgeting'
  | 'tracking'
  | 'investing'
  | 'streak'
  | 'milestone'
  | 'special';

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  points: number;
  requirement_value: number;
  requirement_type: string;
  is_hidden: boolean;
  is_active: boolean;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  progress: number;
  is_claimed: boolean;
  claimed_at: string | null;
  created_at: string;
}

export interface UserAchievementWithDetails extends UserAchievement {
  achievement: Achievement;
  progress_percentage: number;
  is_complete: boolean;
}

// ============================================
// CHALLENGE TYPES
// ============================================

export type ChallengeType = 'daily' | 'weekly' | 'monthly' | 'special';
export type ChallengeStatus = 'active' | 'completed' | 'failed' | 'expired';

export interface Challenge {
  id: string;
  name: string;
  description: string;
  icon: string;
  challenge_type: ChallengeType;
  target_value: number;
  target_type: string;
  points_reward: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  current_progress: number;
  status: ChallengeStatus;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface UserChallengeWithDetails extends UserChallenge {
  challenge: Challenge;
  progress_percentage: number;
  time_remaining: string | null;
  is_expired: boolean;
}

// ============================================
// USER GAMIFICATION TYPES
// ============================================

export interface UserGamification {
  id: string;
  user_id: string;
  total_points: number;
  current_level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  achievements_unlocked: number;
  challenges_completed: number;
  created_at: string;
  updated_at: string;
}

export interface LevelInfo {
  level: number;
  name: string;
  min_points: number;
  max_points: number;
  icon: string;
  color: string;
}

export interface UserGamificationWithLevel extends UserGamification {
  level_info: LevelInfo;
  points_to_next_level: number;
  level_progress_percentage: number;
}

// ============================================
// LEADERBOARD TYPES
// ============================================

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all_time';
export type LeaderboardType = 'points' | 'savings' | 'streak' | 'achievements';

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  period: LeaderboardPeriod;
  leaderboard_type: LeaderboardType;
  score: number;
  rank: number;
  period_start: string;
  period_end: string;
  created_at: string;
}

export interface LeaderboardEntryWithUser extends LeaderboardEntry {
  user: {
    display_name: string | null;
    avatar_url: string | null;
  };
  is_current_user: boolean;
}

export interface LeaderboardData {
  period: LeaderboardPeriod;
  type: LeaderboardType;
  entries: LeaderboardEntryWithUser[];
  current_user_rank: number | null;
  current_user_score: number;
  total_participants: number;
}

// ============================================
// POINTS & REWARDS TYPES
// ============================================

export type PointsActivityType =
  | 'transaction_logged'
  | 'budget_met'
  | 'goal_progress'
  | 'streak_maintained'
  | 'achievement_unlocked'
  | 'challenge_completed'
  | 'referral'
  | 'daily_login'
  | 'weekly_summary_viewed'
  | 'subscription_cancelled'
  | 'savings_milestone';

export interface PointsActivity {
  id: string;
  user_id: string;
  activity_type: PointsActivityType;
  points_earned: number;
  description: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  created_at: string;
}

export interface PointsSummary {
  total_points: number;
  points_today: number;
  points_this_week: number;
  points_this_month: number;
  recent_activities: PointsActivity[];
}

// ============================================
// STREAK TYPES
// ============================================

export interface StreakInfo {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  streak_maintained_today: boolean;
  next_milestone: number;
  days_to_milestone: number;
}

// ============================================
// GAMIFICATION SUMMARY TYPES
// ============================================

export interface GamificationSummary {
  user: UserGamificationWithLevel;
  streak: StreakInfo;
  points: PointsSummary;
  achievements: {
    unlocked: number;
    total: number;
    recent: UserAchievementWithDetails[];
    in_progress: UserAchievementWithDetails[];
  };
  challenges: {
    active: UserChallengeWithDetails[];
    completed_today: number;
    completed_this_week: number;
  };
  leaderboard_rank: {
    weekly: number | null;
    monthly: number | null;
    all_time: number | null;
  };
}

// ============================================
// API INPUT TYPES
// ============================================

export interface AddPointsInput {
  activity_type: PointsActivityType;
  points: number;
  description?: string;
  related_entity_type?: string;
  related_entity_id?: string;
}

export interface StartChallengeInput {
  challenge_id: string;
}

export interface UpdateChallengeProgressInput {
  user_challenge_id: string;
  progress_increment: number;
}

// ============================================
// CONSTANTS
// ============================================

export const LEVELS: LevelInfo[] = [
  { level: 1, name: 'Beginner', min_points: 0, max_points: 99, icon: 'sprout', color: '#22C55E' },
  { level: 2, name: 'Saver', min_points: 100, max_points: 249, icon: 'piggy-bank', color: '#3B82F6' },
  { level: 3, name: 'Budgeter', min_points: 250, max_points: 499, icon: 'calculator', color: '#8B5CF6' },
  { level: 4, name: 'Tracker', min_points: 500, max_points: 999, icon: 'target', color: '#F59E0B' },
  { level: 5, name: 'Planner', min_points: 1000, max_points: 1999, icon: 'calendar', color: '#EC4899' },
  { level: 6, name: 'Investor', min_points: 2000, max_points: 3999, icon: 'trending-up', color: '#14B8A6' },
  { level: 7, name: 'Expert', min_points: 4000, max_points: 7999, icon: 'award', color: '#F97316' },
  { level: 8, name: 'Master', min_points: 8000, max_points: 14999, icon: 'star', color: '#EF4444' },
  { level: 9, name: 'Legend', min_points: 15000, max_points: 29999, icon: 'crown', color: '#A855F7' },
  { level: 10, name: 'Champion', min_points: 30000, max_points: Infinity, icon: 'trophy', color: '#FFD700' },
];

export const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: '#9CA3AF',
  uncommon: '#22C55E',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#FFD700',
};

export const POINTS_VALUES: Record<PointsActivityType, number> = {
  transaction_logged: 5,
  budget_met: 25,
  goal_progress: 10,
  streak_maintained: 10,
  achievement_unlocked: 50,
  challenge_completed: 100,
  referral: 500,
  daily_login: 5,
  weekly_summary_viewed: 10,
  subscription_cancelled: 50,
  savings_milestone: 100,
};

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 90, 180, 365];

export function getLevelForPoints(points: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].min_points) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

export function getNextLevel(currentLevel: number): LevelInfo | null {
  const nextIndex = LEVELS.findIndex(l => l.level === currentLevel) + 1;
  return nextIndex < LEVELS.length ? LEVELS[nextIndex] : null;
}

export function calculateLevelProgress(points: number): { current: LevelInfo; progress: number; pointsToNext: number } {
  const current = getLevelForPoints(points);
  const next = getNextLevel(current.level);

  if (!next) {
    return { current, progress: 100, pointsToNext: 0 };
  }

  const levelPoints = points - current.min_points;
  const levelRange = next.min_points - current.min_points;
  const progress = (levelPoints / levelRange) * 100;
  const pointsToNext = next.min_points - points;

  return { current, progress: Math.min(progress, 100), pointsToNext };
}
