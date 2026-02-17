/**
 * Gamification Service
 * Handles achievements, challenges, points, streaks, and leaderboards
 */

import { supabase } from './supabase';
import type {
  Achievement,
  UserAchievement,
  UserAchievementWithDetails,
  Challenge,
  UserChallenge,
  UserChallengeWithDetails,
  UserGamification,
  UserGamificationWithLevel,
  LeaderboardData,
  LeaderboardPeriod,
  LeaderboardType,
  PointsActivity,
  PointsSummary,
  StreakInfo,
  GamificationSummary,
  AddPointsInput,
  LevelInfo,
} from '@/types';
import { getLevelForPoints, getNextLevel, LEVELS, POINTS_VALUES } from '@/types/gamification';

// ============================================
// USER GAMIFICATION
// ============================================

/**
 * Get user's gamification profile
 */
export async function getUserGamification(): Promise<UserGamificationWithLevel> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_gamification')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;

  // Create default profile if none exists
  if (!data) {
    const { data: newProfile, error: createError } = await supabase
      .from('user_gamification')
      .insert({
        user_id: user.id,
        total_points: 0,
        current_level: 1,
        current_streak: 0,
        longest_streak: 0,
        achievements_unlocked: 0,
        challenges_completed: 0,
      })
      .select()
      .single();

    if (createError) throw createError;

    return enrichWithLevelInfo(newProfile);
  }

  return enrichWithLevelInfo(data);
}

/**
 * Enrich user gamification with level info
 */
function enrichWithLevelInfo(profile: UserGamification): UserGamificationWithLevel {
  const levelInfo = getLevelForPoints(profile.total_points);
  const nextLevel = getNextLevel(levelInfo.level);

  let pointsToNext = 0;
  let progress = 100;

  if (nextLevel) {
    pointsToNext = nextLevel.min_points - profile.total_points;
    const levelPoints = profile.total_points - levelInfo.min_points;
    const levelRange = nextLevel.min_points - levelInfo.min_points;
    progress = (levelPoints / levelRange) * 100;
  }

  return {
    ...profile,
    level_info: levelInfo,
    points_to_next_level: pointsToNext,
    level_progress_percentage: Math.min(progress, 100),
  };
}

// ============================================
// POINTS
// ============================================

/**
 * Add points to user
 */
export async function addPoints(input: AddPointsInput): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Call the database function
  const { data, error } = await supabase.rpc('add_user_points', {
    p_user_id: user.id,
    p_points: input.points,
    p_activity_type: input.activity_type,
    p_description: input.description || `Earned ${input.points} points`,
  });

  if (error) throw error;

  // Check for level up
  const profile = await getUserGamification();
  await checkLevelUpAchievements(profile.current_level);

  return data;
}

/**
 * Get points summary
 */
export async function getPointsSummary(): Promise<PointsSummary> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const today = new Date().toISOString().split('T')[0];
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date();
  monthStart.setDate(1);

  // Get profile for total points
  const { data: profile } = await supabase
    .from('user_gamification')
    .select('total_points')
    .eq('user_id', user.id)
    .single();

  // Get points activities - simulated since we don't have a points_activities table yet
  // In a real implementation, we'd query the actual activities table

  return {
    total_points: profile?.total_points || 0,
    points_today: 0,
    points_this_week: 0,
    points_this_month: 0,
    recent_activities: [],
  };
}

/**
 * Award points for specific activity
 */
export async function awardActivityPoints(activityType: keyof typeof POINTS_VALUES): Promise<void> {
  const points = POINTS_VALUES[activityType];
  await addPoints({
    activity_type: activityType,
    points,
    description: `Earned ${points} points for ${activityType.replace(/_/g, ' ')}`,
  });
}

// ============================================
// ACHIEVEMENTS
// ============================================

/**
 * Get all achievements
 */
export async function getAchievements(): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('is_active', true)
    .order('category')
    .order('points', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get user's achievements with progress
 */
export async function getUserAchievements(): Promise<UserAchievementWithDetails[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get all achievements
  const achievements = await getAchievements();

  // Get user's achievement progress
  const { data: userAchievements, error } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', user.id);

  if (error) throw error;

  // Map achievements with user progress
  const userAchievementMap = new Map(
    (userAchievements || []).map(ua => [ua.achievement_id, ua])
  );

  return achievements.map(achievement => {
    const userProgress = userAchievementMap.get(achievement.id);
    const progress = userProgress?.progress || 0;
    const isComplete = progress >= achievement.requirement_value;

    return {
      id: userProgress?.id || '',
      user_id: user.id,
      achievement_id: achievement.id,
      unlocked_at: userProgress?.unlocked_at || '',
      progress,
      is_claimed: userProgress?.is_claimed || false,
      claimed_at: userProgress?.claimed_at || null,
      created_at: userProgress?.created_at || '',
      achievement,
      progress_percentage: Math.min((progress / achievement.requirement_value) * 100, 100),
      is_complete: isComplete,
    };
  });
}

/**
 * Update achievement progress
 */
export async function updateAchievementProgress(
  achievementKey: string,
  progress: number
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get achievement by key
  const { data: achievement, error: achError } = await supabase
    .from('achievements')
    .select('*')
    .eq('key', achievementKey)
    .single();

  if (achError || !achievement) return;

  // Check if already unlocked
  const { data: existing } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', user.id)
    .eq('achievement_id', achievement.id)
    .single();

  if (existing?.unlocked_at) return; // Already unlocked

  const newProgress = existing ? Math.max(existing.progress, progress) : progress;
  const isUnlocked = newProgress >= achievement.requirement_value;

  await supabase
    .from('user_achievements')
    .upsert({
      user_id: user.id,
      achievement_id: achievement.id,
      progress: newProgress,
      unlocked_at: isUnlocked ? new Date().toISOString() : null,
    }, {
      onConflict: 'user_id,achievement_id',
    });

  // Award points if unlocked
  if (isUnlocked && !existing?.unlocked_at) {
    await addPoints({
      activity_type: 'achievement_unlocked',
      points: achievement.points,
      description: `Unlocked achievement: ${achievement.name}`,
      related_entity_type: 'achievement',
      related_entity_id: achievement.id,
    });

    // Update achievements count
    await supabase.rpc('increment_achievements', { p_user_id: user.id });
  }
}

/**
 * Check for level-based achievements
 */
async function checkLevelUpAchievements(level: number): Promise<void> {
  if (level >= 5) {
    await updateAchievementProgress('level_5', level);
  }
  if (level >= 10) {
    await updateAchievementProgress('level_10', level);
  }
}

/**
 * Claim achievement reward
 */
export async function claimAchievement(achievementId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_achievements')
    .update({
      is_claimed: true,
      claimed_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('achievement_id', achievementId)
    .not('unlocked_at', 'is', null);

  if (error) throw error;
}

// ============================================
// CHALLENGES
// ============================================

/**
 * Get active challenges
 */
export async function getActiveChallenges(): Promise<Challenge[]> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('is_active', true)
    .lte('start_date', now)
    .gte('end_date', now)
    .order('end_date');

  if (error) throw error;
  return data || [];
}

/**
 * Get user's challenges with progress
 */
export async function getUserChallenges(): Promise<UserChallengeWithDetails[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_challenges')
    .select(`
      *,
      challenge:challenges(*)
    `)
    .eq('user_id', user.id)
    .in('status', ['active', 'completed'])
    .order('created_at', { ascending: false });

  if (error) throw error;

  const now = new Date();

  return (data || []).filter(uc => uc.challenge).map(uc => {
    const endDate = new Date(uc.challenge.end_date);
    const isExpired = now > endDate;
    const timeRemaining = isExpired ? null : formatTimeRemaining(endDate);

    return {
      ...uc,
      progress_percentage: Math.min(
        (uc.current_progress / uc.challenge.target_value) * 100,
        100
      ),
      time_remaining: timeRemaining,
      is_expired: isExpired,
    };
  });
}

/**
 * Start a challenge
 */
export async function startChallenge(challengeId: string): Promise<UserChallenge> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if already started
  const { data: existing } = await supabase
    .from('user_challenges')
    .select('id')
    .eq('user_id', user.id)
    .eq('challenge_id', challengeId)
    .single();

  if (existing) throw new Error('Challenge already started');

  const { data, error } = await supabase
    .from('user_challenges')
    .insert({
      user_id: user.id,
      challenge_id: challengeId,
      current_progress: 0,
      status: 'active',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update challenge progress
 */
export async function updateChallengeProgress(
  challengeId: string,
  progressIncrement: number
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get current challenge progress
  const { data: userChallenge, error: fetchError } = await supabase
    .from('user_challenges')
    .select(`
      *,
      challenge:challenges(target_value, points_reward)
    `)
    .eq('user_id', user.id)
    .eq('challenge_id', challengeId)
    .eq('status', 'active')
    .single();

  if (fetchError || !userChallenge) return;

  const newProgress = userChallenge.current_progress + progressIncrement;
  const isComplete = newProgress >= userChallenge.challenge.target_value;

  await supabase
    .from('user_challenges')
    .update({
      current_progress: newProgress,
      status: isComplete ? 'completed' : 'active',
      completed_at: isComplete ? new Date().toISOString() : null,
    })
    .eq('id', userChallenge.id);

  // Award points if completed
  if (isComplete) {
    await addPoints({
      activity_type: 'challenge_completed',
      points: userChallenge.challenge.points_reward,
      description: `Completed challenge`,
      related_entity_type: 'challenge',
      related_entity_id: challengeId,
    });

    // Update challenges count
    await supabase.rpc('increment_challenges', { p_user_id: user.id });
  }
}

// ============================================
// STREAKS
// ============================================

/**
 * Get streak info
 */
export async function getStreakInfo(): Promise<StreakInfo> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('user_gamification')
    .select('current_streak, longest_streak, last_activity_date')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    return {
      current_streak: 0,
      longest_streak: 0,
      last_activity_date: null,
      streak_maintained_today: false,
      next_milestone: 3,
      days_to_milestone: 3,
    };
  }

  const today = new Date().toISOString().split('T')[0];
  const streakMaintained = profile.last_activity_date === today;

  // Find next milestone
  const milestones = [3, 7, 14, 30, 60, 90, 180, 365];
  const nextMilestone = milestones.find(m => m > profile.current_streak) || 365;
  const daysToMilestone = nextMilestone - profile.current_streak;

  return {
    current_streak: profile.current_streak,
    longest_streak: profile.longest_streak,
    last_activity_date: profile.last_activity_date,
    streak_maintained_today: streakMaintained,
    next_milestone: nextMilestone,
    days_to_milestone: Math.max(daysToMilestone, 0),
  };
}

/**
 * Update streak (called on daily activity)
 */
export async function updateStreak(): Promise<StreakInfo> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const { data: profile } = await supabase
    .from('user_gamification')
    .select('current_streak, longest_streak, last_activity_date')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    await supabase
      .from('user_gamification')
      .insert({
        user_id: user.id,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: today,
      });
    return getStreakInfo();
  }

  // Already logged today
  if (profile.last_activity_date === today) {
    return getStreakInfo();
  }

  let newStreak = 1;
  if (profile.last_activity_date === yesterdayStr) {
    // Continue streak
    newStreak = profile.current_streak + 1;
  }

  const newLongest = Math.max(newStreak, profile.longest_streak);

  await supabase
    .from('user_gamification')
    .update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_activity_date: today,
    })
    .eq('user_id', user.id);

  // Award streak points
  await addPoints({
    activity_type: 'streak_maintained',
    points: Math.min(newStreak * 2, 50), // Cap at 50 points
    description: `${newStreak} day streak!`,
  });

  // Check streak achievements
  await updateAchievementProgress('streak_7', newStreak);
  await updateAchievementProgress('streak_30', newStreak);

  return getStreakInfo();
}

// ============================================
// LEADERBOARD
// ============================================

/**
 * Get leaderboard data
 */
export async function getLeaderboard(
  type: LeaderboardType = 'points',
  period: LeaderboardPeriod = 'weekly'
): Promise<LeaderboardData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: entries, error } = await supabase
    .from('leaderboard_entries')
    .select(`
      *,
      user:users(display_name, avatar_url)
    `)
    .eq('leaderboard_type', type)
    .eq('period', period)
    .order('rank')
    .limit(100);

  if (error) throw error;

  const enrichedEntries = (entries || []).map(entry => ({
    ...entry,
    is_current_user: entry.user_id === user.id,
  }));

  const currentUserEntry = enrichedEntries.find(e => e.is_current_user);

  return {
    period,
    type,
    entries: enrichedEntries,
    current_user_rank: currentUserEntry?.rank || null,
    current_user_score: currentUserEntry?.score || 0,
    total_participants: entries?.length || 0,
  };
}

// ============================================
// GAMIFICATION SUMMARY
// ============================================

/**
 * Get complete gamification summary
 */
export async function getGamificationSummary(): Promise<GamificationSummary> {
  const [
    userProfile,
    streak,
    points,
    userAchievements,
    userChallenges,
  ] = await Promise.all([
    getUserGamification(),
    getStreakInfo(),
    getPointsSummary(),
    getUserAchievements(),
    getUserChallenges(),
  ]);

  const allAchievements = await getAchievements();
  const unlockedAchievements = userAchievements.filter(a => a.is_complete);
  const inProgressAchievements = userAchievements
    .filter(a => !a.is_complete && a.progress > 0)
    .sort((a, b) => b.progress_percentage - a.progress_percentage)
    .slice(0, 5);

  const activeChallenges = userChallenges.filter(c => c.status === 'active');
  const today = new Date().toISOString().split('T')[0];
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  return {
    user: userProfile,
    streak,
    points,
    achievements: {
      unlocked: unlockedAchievements.length,
      total: allAchievements.length,
      recent: unlockedAchievements.slice(0, 5),
      in_progress: inProgressAchievements,
    },
    challenges: {
      active: activeChallenges,
      completed_today: userChallenges.filter(
        c => c.status === 'completed' && c.completed_at?.startsWith(today)
      ).length,
      completed_this_week: userChallenges.filter(
        c => c.status === 'completed' && new Date(c.completed_at!) > weekStart
      ).length,
    },
    leaderboard_rank: {
      weekly: null, // Would fetch from leaderboard
      monthly: null,
      all_time: null,
    },
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format time remaining
 */
function formatTimeRemaining(endDate: Date): string {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  return 'Less than 1h';
}

/**
 * Check and award daily login points
 */
export async function checkDailyLogin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const today = new Date().toISOString().split('T')[0];

  const { data: profile } = await supabase
    .from('user_gamification')
    .select('last_activity_date')
    .eq('user_id', user.id)
    .single();

  if (profile?.last_activity_date !== today) {
    await updateStreak();
    await awardActivityPoints('daily_login');
    return true;
  }

  return false;
}
