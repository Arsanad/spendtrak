/**
 * Onboarding Tunnel Types
 * Type definitions for post-auth personalization flow
 */

export type IncomeFrequency = 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export type FinancialSituation = 'comfortable' | 'stable' | 'tight' | 'struggling';

export type GoalType = 'emergency' | 'vacation' | 'purchase' | 'debt' | 'retirement' | 'custom';

export type TrackingPreference = 'manual' | 'auto' | 'both';

export type PlanChoice = 'free' | 'trial';

export interface OnboardingData {
  // Step 1: Identity
  displayName: string;
  currencyCode: string;
  currencySymbol: string;

  // Step 2: Financial Snapshot
  monthlyIncome: number;
  incomeFrequency: IncomeFrequency;
  financialSituation: FinancialSituation;

  // Step 3: Pain Points
  painPoints: string[]; // category IDs

  // Step 4: Goal
  goalType: GoalType;
  goalName: string;
  goalAmount: number;
  goalTargetDate: string; // ISO date

  // Step 5: Smart Budget (calculated, user can adjust)
  budgets: BudgetSuggestion[];

  // Step 6: Plan choice
  planChoice: PlanChoice;
}

export interface BudgetSuggestion {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  amount: number;
  percentage: number;
}

export const ONBOARDING_STEP_COUNT = 8;

export const GOAL_TYPE_CONFIG: Record<GoalType, { icon: string; label: string }> = {
  emergency: { icon: 'shield-checkmark', label: 'Emergency Fund' },
  vacation: { icon: 'airplane', label: 'Dream Vacation' },
  purchase: { icon: 'cart', label: 'Big Purchase' },
  debt: { icon: 'trending-down', label: 'Pay Off Debt' },
  retirement: { icon: 'wallet', label: 'Retirement' },
  custom: { icon: 'star', label: 'Custom Goal' },
};

export const FINANCIAL_SITUATION_CONFIG: Record<FinancialSituation, { label: string; savingsRate: number }> = {
  comfortable: { label: 'Comfortable', savingsRate: 0.20 },
  stable: { label: 'Stable', savingsRate: 0.15 },
  tight: { label: 'Tight', savingsRate: 0.10 },
  struggling: { label: 'Struggling', savingsRate: 0.05 },
};
