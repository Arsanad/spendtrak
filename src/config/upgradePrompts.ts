/**
 * SpendTrak Contextual Upgrade Engine
 * Prompt Config - Definitions + interpolation utility
 *
 * Pure TypeScript config (no runtime deps)
 */

import type { FrictionType, UpgradePromptConfig, PromptVariant } from '@/types/upgrade';
import type { FeatureName } from '@/config/features';

// ============================================
// PROMPT DEFINITIONS
// 2-3 variants per friction type, round-robin rotation
// ============================================

export const UPGRADE_PROMPTS: Record<FrictionType, UpgradePromptConfig[]> = {
  MANUAL_ENTRY_FATIGUE: [
    {
      id: 'manual_fatigue_1',
      frictionType: 'MANUAL_ENTRY_FATIGUE',
      title: 'Tired of typing?',
      body: "You've entered {{manualEntries}} transactions manually. Scan receipts instead.",
      cta: 'Try Receipt Scanner',
      icon: 'camera-outline',
      variant: 'card',
      targetFeature: 'receipt_scanner',
      variantIndex: 0,
    },
    {
      id: 'manual_fatigue_2',
      frictionType: 'MANUAL_ENTRY_FATIGUE',
      title: 'Save time on entries',
      body: 'AI can read your receipts in seconds. No more manual typing.',
      cta: 'See How',
      icon: 'flash-outline',
      variant: 'card',
      targetFeature: 'receipt_scanner',
      variantIndex: 1,
    },
  ],

  RECEIPT_MOMENT: [
    {
      id: 'receipt_moment_1',
      frictionType: 'RECEIPT_MOMENT',
      title: 'Got a receipt?',
      body: 'Snap a photo next time — AI extracts all the details automatically.',
      cta: 'Try Scanning',
      icon: 'camera-outline',
      variant: 'card',
      targetFeature: 'receipt_scanner',
      variantIndex: 0,
    },
    {
      id: 'receipt_moment_2',
      frictionType: 'RECEIPT_MOMENT',
      title: 'Faster than typing',
      body: 'Receipt scanning captures merchant, amount, and category in one snap.',
      cta: 'Learn More',
      icon: 'scan-outline',
      variant: 'card',
      targetFeature: 'receipt_scanner',
      variantIndex: 1,
    },
  ],

  EMAIL_OPPORTUNITY: [
    {
      id: 'email_opp_1',
      frictionType: 'EMAIL_OPPORTUNITY',
      title: '{{merchantName}} sends receipts',
      body: 'Connect your email and we\'ll import them automatically.',
      cta: 'Connect Email',
      icon: 'mail-outline',
      variant: 'card',
      targetFeature: 'email_import',
      variantIndex: 0,
    },
    {
      id: 'email_opp_2',
      frictionType: 'EMAIL_OPPORTUNITY',
      title: 'Auto-import receipts',
      body: 'No more manual entry for {{merchantName}} and 40+ other stores.',
      cta: 'Set Up',
      icon: 'mail-outline',
      variant: 'card',
      targetFeature: 'email_import',
      variantIndex: 1,
    },
  ],

  HEALTH_CURIOSITY: [
    {
      id: 'health_curiosity_1',
      frictionType: 'HEALTH_CURIOSITY',
      title: 'Want deeper insights?',
      body: 'AI can analyze your patterns and give personalized recommendations.',
      cta: 'Unlock AI Insights',
      icon: 'heart-outline',
      variant: 'card',
      targetFeature: 'ai_health_recommendations',
      variantIndex: 0,
    },
    {
      id: 'health_curiosity_2',
      frictionType: 'HEALTH_CURIOSITY',
      title: 'Your health score explained',
      body: "Get AI-powered tips on how to improve your financial health.",
      cta: 'Get Recommendations',
      icon: 'sparkles-outline',
      variant: 'card',
      targetFeature: 'ai_health_recommendations',
      variantIndex: 1,
    },
  ],

  REPEAT_CATEGORY_ENTRY: [
    {
      id: 'repeat_cat_1',
      frictionType: 'REPEAT_CATEGORY_ENTRY',
      title: 'Lots of {{categoryId}} entries',
      body: 'Email auto-import can handle these recurring purchases for you.',
      cta: 'Automate This',
      icon: 'repeat-outline',
      variant: 'card',
      targetFeature: 'email_import',
      variantIndex: 0,
    },
    {
      id: 'repeat_cat_2',
      frictionType: 'REPEAT_CATEGORY_ENTRY',
      title: 'Pattern detected',
      body: "You're entering the same category often. Let AI handle the routine.",
      cta: 'See Options',
      icon: 'git-branch-outline',
      variant: 'card',
      targetFeature: 'email_import',
      variantIndex: 1,
    },
  ],

  TIME_SPENT_TRACKING: [
    {
      id: 'time_spent_1',
      frictionType: 'TIME_SPENT_TRACKING',
      title: "You've been at this a while",
      body: 'AI receipt scanning could save you {{screenTimeMinutes}} minutes next time.',
      cta: 'Save Time',
      icon: 'time-outline',
      variant: 'modal',
      targetFeature: 'receipt_scanner',
      variantIndex: 0,
    },
    {
      id: 'time_spent_2',
      frictionType: 'TIME_SPENT_TRACKING',
      title: 'Time is money',
      body: 'Premium users spend 80% less time entering transactions.',
      cta: 'Go Premium',
      icon: 'flash-outline',
      variant: 'modal',
      targetFeature: 'receipt_scanner',
      variantIndex: 1,
    },
  ],

  MISSED_TRANSACTION: [
    {
      id: 'missed_tx_1',
      frictionType: 'MISSED_TRANSACTION',
      title: 'Been away {{daysSinceLastEntry}} days?',
      body: 'Email import catches transactions even when you forget to log them.',
      cta: 'Never Miss One',
      icon: 'alert-circle-outline',
      variant: 'card',
      targetFeature: 'email_import',
      variantIndex: 0,
    },
    {
      id: 'missed_tx_2',
      frictionType: 'MISSED_TRANSACTION',
      title: 'Stay on track automatically',
      body: 'Connect your email so transactions are captured while you\'re away.',
      cta: 'Connect Now',
      icon: 'mail-outline',
      variant: 'card',
      targetFeature: 'email_import',
      variantIndex: 1,
    },
  ],

  FINANCIAL_QUESTION: [
    {
      id: 'fin_question_1',
      frictionType: 'FINANCIAL_QUESTION',
      title: 'Need financial advice?',
      body: 'QUANTUM AI can analyze your spending and answer any question.',
      cta: 'Ask QUANTUM',
      icon: 'chatbubble-ellipses-outline',
      variant: 'modal',
      targetFeature: 'ai_consultant',
      variantIndex: 0,
    },
    {
      id: 'fin_question_2',
      frictionType: 'FINANCIAL_QUESTION',
      title: 'Get personalized guidance',
      body: 'Your AI financial consultant knows your spending patterns.',
      cta: 'Chat Now',
      icon: 'sparkles-outline',
      variant: 'modal',
      targetFeature: 'ai_consultant',
      variantIndex: 1,
    },
  ],

  COMPLEX_BUDGET_SETUP: [
    {
      id: 'complex_budget_1',
      frictionType: 'COMPLEX_BUDGET_SETUP',
      title: 'Budget setup taking long?',
      body: 'AI can suggest optimal budgets based on your actual spending.',
      cta: 'Get AI Budgets',
      icon: 'bulb-outline',
      variant: 'card',
      targetFeature: 'ai_consultant',
      variantIndex: 0,
    },
    {
      id: 'complex_budget_2',
      frictionType: 'COMPLEX_BUDGET_SETUP',
      title: 'Let AI do the math',
      body: 'QUANTUM analyzes your history and recommends budget amounts.',
      cta: 'Try It',
      icon: 'calculator-outline',
      variant: 'card',
      targetFeature: 'ai_consultant',
      variantIndex: 1,
    },
  ],

  TRIAL_EXPIRY: [
    {
      id: 'trial_expiry_1',
      frictionType: 'TRIAL_EXPIRY',
      title: 'Trial ending soon',
      body: 'Your free trial expires in {{hoursRemaining}} hours. Keep your AI features.',
      cta: 'Keep Premium',
      icon: 'diamond-outline',
      variant: 'modal',
      targetFeature: 'ai_consultant',
      variantIndex: 0,
    },
    {
      id: 'trial_expiry_2',
      frictionType: 'TRIAL_EXPIRY',
      title: "Don't lose your AI features",
      body: 'Subscribe now to keep receipt scanning, email import, and QUANTUM.',
      cta: 'Subscribe',
      icon: 'diamond-outline',
      variant: 'modal',
      targetFeature: 'ai_consultant',
      variantIndex: 1,
    },
  ],
};

// ============================================
// UTILITIES
// ============================================

/** Replace {{key}} placeholders with values from metadata */
export function interpolatePrompt(
  prompt: UpgradePromptConfig,
  metadata: Record<string, string | number>
): UpgradePromptConfig {
  const interpolate = (text: string): string =>
    text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const value = metadata[key];
      return value !== undefined ? String(value) : `{{${key}}}`;
    });

  return {
    ...prompt,
    title: interpolate(prompt.title),
    body: interpolate(prompt.body),
  };
}

/** Round-robin prompt variant selection */
export function selectPromptVariant(
  frictionType: FrictionType,
  lastIndex: number | undefined
): UpgradePromptConfig {
  const variants = UPGRADE_PROMPTS[frictionType];
  const nextIndex =
    lastIndex !== undefined ? (lastIndex + 1) % variants.length : 0;
  return variants[nextIndex];
}
