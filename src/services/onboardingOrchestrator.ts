/**
 * Onboarding Orchestrator
 * Fans out collected data to existing services on tunnel completion
 */

import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { createBudget } from '@/services/budgets';
import { saveDevBudget, saveDevGoal } from '@/services/devStorage';
import { supabase } from '@/services/supabase';
import { logger } from '@/utils/logger';
import type { OnboardingData } from '@/types/onboarding';

/**
 * Persist all onboarding data to the app's various stores and backend.
 * Each step is wrapped in try/catch so non-critical failures don't block completion.
 */
export async function completeOnboarding(data: Partial<OnboardingData>): Promise<void> {
  const user = useAuthStore.getState().user;
  const isDevUser = user?.id?.startsWith('dev-user-');

  // 1. Update profile (name + currency)
  try {
    if (data.displayName || data.currencyCode) {
      await useAuthStore.getState().updateProfile({
        display_name: data.displayName,
        default_currency: data.currencyCode,
      });
    }
  } catch (e) {
    logger.general.error('Onboarding: profile update failed', e);
  }

  // 2. Set currency in settings store
  try {
    if (data.currencyCode && data.currencySymbol) {
      useSettingsStore.getState().setCurrency(data.currencyCode, data.currencySymbol);
    }
  } catch (e) {
    logger.general.error('Onboarding: currency set failed', e);
  }

  // 3. Create budgets
  if (data.budgets && data.budgets.length > 0) {
    for (const budget of data.budgets) {
      try {
        if (isDevUser) {
          await saveDevBudget({
            id: `onb-budget-${budget.categoryId}-${Date.now()}`,
            user_id: user!.id,
            category_id: budget.categoryId,
            amount: budget.amount,
            alert_threshold: 80,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        } else {
          await createBudget({
            category_id: budget.categoryId,
            amount: budget.amount,
            alert_threshold: 80,
            period: 'monthly',
          });
        }
      } catch (e) {
        logger.general.error(`Onboarding: budget creation failed for ${budget.categoryId}`, e);
      }
    }
  }

  // 4. Create goal
  if (data.goalName && data.goalAmount) {
    try {
      if (isDevUser) {
        await saveDevGoal({
          id: `onb-goal-${Date.now()}`,
          user_id: user!.id,
          name: data.goalName,
          target_amount: data.goalAmount,
          current_amount: 0,
          target_date: data.goalTargetDate || new Date(Date.now() + 365 * 86400000).toISOString(),
          icon: 'star',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else {
        await supabase.from('financial_goals').insert({
          user_id: user!.id,
          name: data.goalName,
          target_amount: data.goalAmount,
          current_amount: 0,
          target_date: data.goalTargetDate || new Date(Date.now() + 365 * 86400000).toISOString(),
          icon: 'star',
          status: 'active',
        });
      }
    } catch (e) {
      logger.general.error('Onboarding: goal creation failed', e);
    }
  }

  // 5. Save income/situation to user profile (prod only)
  if (!isDevUser && user) {
    try {
      await supabase.from('users').update({
        monthly_income: data.monthlyIncome,
        income_frequency: data.incomeFrequency,
        financial_situation: data.financialSituation,
        pain_points: data.painPoints,
        onboarding_completed_at: new Date().toISOString(),
      }).eq('id', user.id);
    } catch (e) {
      logger.general.error('Onboarding: user profile update failed', e);
    }
  }

  // 6. Mark onboarding complete (critical — always runs)
  try {
    await useAuthStore.getState().completeOnboarding();
  } catch (e) {
    logger.general.error('Onboarding: completeOnboarding failed', e);
  }

  // 7. Mark store complete
  useOnboardingStore.getState().markComplete();
}
