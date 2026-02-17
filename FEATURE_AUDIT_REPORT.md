# SpendTrak Feature Audit Report
**Date:** 2026-02-12
**Purpose:** Classify all features as AI vs Non-AI for free/premium tier restructuring

---

## COMPLETE FEATURE INVENTORY

### NON-AI FEATURES (Free Tier)

| # | Feature | Screen/Location | Key Files | Description |
|---|---------|-----------------|-----------|-------------|
| 1 | User Authentication | `app/(auth)/signin.tsx`, `signup.tsx`, `verify-email.tsx`, `reset-password.tsx` | `src/stores/authStore.ts`, `src/utils/auth.ts` | Email/password sign up, sign in, OAuth, password reset, email verification |
| 2 | Dashboard / Home | `app/(tabs)/index.tsx` | `src/stores/transactionStore.ts` | Transaction summary, totals, income/expense display, greeting |
| 3 | Manual Expense Entry | `app/(modals)/add-expense.tsx` | `src/stores/transactionStore.ts` | Add transactions with amount, merchant, category, notes, recurring toggle |
| 4 | Transaction Calendar | `app/(tabs)/index.tsx` | `src/components/transactions/TransactionCalendar.tsx` | Calendar view of transactions with daily breakdown |
| 5 | Weekly Transaction View | `app/(tabs)/index.tsx` | `src/components/transactions/WeeklyTransactionList.tsx` | Weekly grouped transaction list |
| 6 | Monthly Transaction Summary | `app/(tabs)/index.tsx` | `src/components/transactions/MonthlyTransactionSummary.tsx` | Monthly aggregated summary |
| 7 | Transaction Search & Filter | `app/(tabs)/index.tsx` | `src/components/transactions/TransactionFilter.tsx` | Search by merchant, filter by category/date/amount |
| 8 | Transaction Detail | `app/transaction/[id].tsx` | `src/stores/transactionStore.ts` | View, edit, delete individual transactions |
| 9 | Alerts | `app/(tabs)/alerts.tsx` | `src/services/alerts.ts` | Budget, goal, subscription, bill, debt, spending pattern alerts with swipe-to-dismiss |
| 10 | Analytics / Stats | `app/(tabs)/stats.tsx` | `src/services/analytics.ts`, `src/services/financialHealth.ts` | Health score, KPIs, cash flow trend, category spending, heatmap, burn rate, budget performance |
| 11 | Category Management | `app/settings/categories.tsx`, `app/(modals)/category-editor.tsx` | `src/config/categories.ts` | Create, edit, delete spending categories |
| 12 | Budget Management | `app/settings/budgets.tsx`, `app/(modals)/add-budget.tsx` | `src/services/budgets.ts`, `src/services/budgetRollover.ts` | Create budgets with limits, track spending vs budget, rollover |
| 13 | Goal Tracking | `app/settings/goals/` | `src/services/gamification.ts` | Set savings goals, track progress, milestone celebrations |
| 14 | Daily Spending Limit | `app/settings/daily-limit.tsx` | `src/services/dailyLimit.ts` | Set and track daily spending cap |
| 15 | Currency Settings | `app/settings/currency.tsx` | `src/services/currencyConverter.ts`, `src/services/exchangeRates.ts` | Multi-currency support with live exchange rates |
| 16 | Language Settings | `app/settings/language.tsx` | `src/translations/` (12 languages) | Arabic, German, English, Spanish, French, Hindi, Japanese, Portuguese, Russian, Turkish, Urdu, Chinese |
| 17 | Profile Management | `app/settings/profile.tsx` | `src/stores/authStore.ts` | Display name, email, profile settings |
| 18 | Privacy Settings | `app/settings/privacy.tsx` | `src/stores/settingsStore.ts` | Analytics opt-out toggle |
| 19 | Help & Support | `app/settings/help.tsx` | — | In-app help and support information |
| 20 | Terms of Service | `app/settings/terms.tsx` | — | Legal terms display |
| 21 | Subscription Management | `app/settings/subscription.tsx` | `src/stores/purchasesStore.ts` | View current plan, upgrade/downgrade, restore purchases |
| 22 | Achievements / Gamification | `app/settings/achievements.tsx` | `src/services/gamification.ts` | XP system, achievement badges, streaks |
| 23 | Bill Calendar | `app/settings/bills.tsx`, `app/(modals)/add-bill.tsx` | `src/services/billCalendar.ts` | Track recurring bills with due dates and reminders |
| 24 | Debt Management | `app/settings/debts.tsx`, `app/(modals)/add-debt.tsx` | `src/services/debtManagement.ts` | Debt tracking with payoff strategies |
| 25 | Subscription Tracking | `app/settings/subscriptions.tsx`, `app/(modals)/add-subscription.tsx`, `edit-subscription.tsx` | `src/services/subscriptions.ts` | Track active subscriptions, costs, renewal dates |
| 26 | Investment Tracking | `app/settings/investments.tsx`, `app/(modals)/add-investment.tsx` | `src/services/investments.ts` | Portfolio monitoring and tracking |
| 27 | Net Worth Tracker | `app/settings/net-worth.tsx`, `app/(modals)/add-asset.tsx`, `add-liability.tsx` | `src/services/netWorth.ts` | Assets, liabilities, net worth calculation |
| 28 | Household / Family Sharing | `app/settings/household.tsx`, `household-categories.tsx`, `household-notifications.tsx` | `src/services/household.ts` | Shared budgets, member management, notifications |
| 29 | Data Export | `app/settings/export.tsx` | `src/services/export.ts` | Export transactions to CSV, PDF, JSON |
| 30 | Behavioral Engine — Detection | Dashboard (background) | `src/services/detection.ts` | Rule-based pattern detection: small recurring, stress spending, end-of-month collapse |
| 31 | Behavioral Engine — Interventions | Dashboard | `src/components/behavior/BehavioralMicroCard.tsx`, `src/services/decisionEngine.ts` | 8-gate decision engine, short observational messages (max 12 words) |
| 32 | Behavioral Engine — Win Celebrations | Dashboard | `src/components/behavior/WinCelebration.tsx`, `src/services/winDetection.ts` | Pattern break, streak, improvement, silent win detection |
| 33 | Behavioral Engine — State Machine | Background | `src/services/stateMachine.ts` | 4-state system: OBSERVING → FOCUSED → COOLDOWN → WITHDRAWN |
| 34 | Behavioral Onboarding | Dashboard (once) | `src/components/onboarding/BehavioralOnboarding.tsx` | One-time explainer of how behavioral intelligence works |
| 35 | Re-engagement Modal | App launch | `src/components/onboarding/ReEngagementModal.tsx` | Brings back lapsed users |
| 36 | Push Notifications | Background | `src/services/pushNotifications.ts` | Budget alerts, bill reminders, goal milestones |
| 37 | Offline Mode | Background | `src/services/offlineQueue.ts` | Transaction queueing and sync when back online |
| 38 | Intro Video / Onboarding | `app/(auth)/_layout.tsx` | `src/components/onboarding/` | First-launch app introduction |
| 39 | QUANTUM Mascot (UI only) | Dashboard | `src/components/quantum/AnimatedQuantumMascot.tsx` | Animated mascot character, emotions, sparkle effects (non-AI display layer) |
| 40 | Income Tracking | Settings | `src/services/incomeTracking.ts` | Track income sources and amounts |
| 41 | Zero-Based Budgeting | Settings | `src/services/zeroBased.ts` | Assign every dollar a job |
| 42 | Transaction Splits | Transaction detail | `src/services/transactionSplits.ts` | Split transactions between people |
| 43 | Device Security | App launch | `src/utils/deviceSecurity.ts` | Jailbreak/root detection |
| 44 | Error Monitoring | Background | `src/services/errorMonitoring.ts` | Sentry error tracking |
| 45 | A/B Testing Framework | Background | `src/services/abTesting.ts` | Feature experiment framework |

### AI FEATURES (Premium Tier)

| # | Feature | Screen/Location | Key Files | AI Service Used | Description |
|---|---------|-----------------|-----------|-----------------|-------------|
| 1 | QUANTUM AI Financial Consultant | `app/(modals)/ai-consultant.tsx` | `src/services/ai.ts`, `src/stores/aiStore.ts` | Google Gemini 2.0 Flash (`ai-chat`) + OpenAI GPT-4o (`ai-consultant`) | Conversational AI financial advisor with rate limiting (free: 30 msgs/hr) |
| 2 | Receipt Scanner (Camera OCR) | `app/(modals)/camera.tsx` | `src/services/receiptScanner.ts`, `src/stores/receiptStore.ts` | Google Gemini 2.0 Flash Vision (`scan-receipt`) | Camera-based receipt scanning, extracts merchant/items/amounts/tax (free: 10/month) |
| 3 | Gmail Auto-Import | `app/settings/connect-email.tsx` | `src/services/emailImport.ts` | Google Gemini 2.0 Flash (`gmail-webhook`) | OAuth-connected Gmail receipt detection and auto-import |
| 4 | Outlook Auto-Import | `app/settings/connect-email.tsx` | `src/services/emailImport.ts` | Google Gemini 2.0 Flash (`outlook-webhook`) | OAuth-connected Outlook receipt detection and auto-import |
| 5 | iCloud Email Forwarding | `app/settings/connect-email.tsx` | `src/services/emailImport.ts` | Google Gemini 2.0 Flash (`email-inbound`) | Forwarded email receipt parsing and auto-import |
| 6 | Bank Email Sync | Background | `src/services/emailImport.ts` | OpenAI GPT-4o-mini (`sync-emails`) | Parse bank notification emails for transaction data |

---

## AI API CALLS — COMPLETE MAP

Every single AI API call in the codebase:

### Client-Side (Supabase Edge Function Invocations)

| File | Line | Function Invoked | Purpose | Feature It Powers |
|------|------|------------------|---------|-------------------|
| `src/services/ai.ts` | 1053 | `supabase.functions.invoke('ai-chat')` | Send chat message to Gemini | AI Financial Consultant |
| `src/services/receiptScanner.ts` | 274 | `supabase.functions.invoke('scan-receipt')` | Send receipt image to Gemini Vision | Receipt Scanner |

### Server-Side (Direct AI API Calls in Edge Functions)

| File | Line | API Called | Model | Purpose | Feature It Powers |
|------|------|-----------|-------|---------|-------------------|
| `supabase/functions/ai-chat/index.ts` | 96 | `generativelanguage.googleapis.com` | Gemini 2.0 Flash | Chat completion | AI Consultant (quick Q&A) |
| `supabase/functions/ai-consultant/index.ts` | 65 | `api.openai.com/v1/chat/completions` | GPT-4o | Financial coaching | AI Consultant (detailed advice) |
| `supabase/functions/ai-consultant/index.ts` | 139 | `api.openai.com/v1/chat/completions` | GPT-4o-mini | Health score recommendations | AI Consultant (health scoring) |
| `supabase/functions/scan-receipt/index.ts` | 85 | `generativelanguage.googleapis.com` | Gemini 2.0 Flash (Vision) | Receipt OCR | Receipt Scanner |
| `supabase/functions/parse-receipt/index.ts` | 64 | `api.openai.com/v1/chat/completions` | GPT-4o (Vision) | Receipt OCR (LEGACY) | Receipt Scanner (deprecated) |
| `supabase/functions/email-inbound/index.ts` | 83 | `generativelanguage.googleapis.com` | Gemini 2.0 Flash | Email receipt detection | iCloud Email Import |
| `supabase/functions/gmail-webhook/index.ts` | 210 | `generativelanguage.googleapis.com` | Gemini 2.0 Flash | Email receipt detection | Gmail Auto-Import |
| `supabase/functions/outlook-webhook/index.ts` | 216 | `generativelanguage.googleapis.com` | Gemini 2.0 Flash | Email receipt detection | Outlook Auto-Import |
| `supabase/functions/sync-emails/index.ts` | 271 | `api.openai.com/v1/chat/completions` | GPT-4o-mini | Bank email parsing | Bank Email Sync |

---

## EDGE FUNCTIONS — AI CLASSIFICATION

| Edge Function | Contains AI? | AI API Used | Called By | Purpose |
|---------------|-------------|-------------|----------|---------|
| `ai-chat` | **YES** | Google Gemini 2.0 Flash | `src/services/ai.ts` | General financial Q&A chat |
| `ai-consultant` | **YES** | OpenAI GPT-4o + GPT-4o-mini | `src/services/ai.ts` | Personalized financial advice & health scoring |
| `scan-receipt` | **YES** | Google Gemini 2.0 Flash (Vision) | `src/services/receiptScanner.ts` | Receipt image OCR extraction |
| `parse-receipt` | **YES** | OpenAI GPT-4o (Vision) | Legacy — kept for backwards compat | Receipt image OCR (DEPRECATED) |
| `email-inbound` | **YES** | Google Gemini 2.0 Flash | Inbound email webhook | iCloud forwarded email receipt parsing |
| `gmail-webhook` | **YES** | Google Gemini 2.0 Flash | Google Pub/Sub push | Gmail receipt detection and auto-import |
| `outlook-webhook` | **YES** | Google Gemini 2.0 Flash | Microsoft Graph webhook | Outlook receipt detection and auto-import |
| `sync-emails` | **YES** | OpenAI GPT-4o-mini | Background sync job | Bank notification email parsing |
| `gmail-oauth-callback` | No | — | Gmail OAuth flow | OAuth token exchange for Gmail |
| `gmail-watch-renew` | No | — | Cron job (daily) | Renew Gmail push notification watch |
| `outlook-oauth-callback` | No | — | Outlook OAuth flow | OAuth token exchange for Outlook |
| `outlook-watch-renew` | No | — | Cron job (every 2 days) | Renew Outlook webhook subscription |
| `send-push-notification` | No | — | `src/services/pushNotifications.ts` | Deliver push notifications via Expo |
| `verify-entitlement` | No | — | `src/hooks/useFeatureAccess.ts` | Server-side subscription/usage verification |
| `revenuecat-webhook` | No | — | RevenueCat server events | Process subscription purchase/cancel/renewal events |

---

## EXISTING FEATURE GATING

### Core Infrastructure

| File | Line(s) | Check Type | What It Gates |
|------|---------|------------|---------------|
| `src/config/features.ts` | 50-74 | Free tier limits | receipt_scans: 10/mo, ai_messages: 30/hr, budgets: 3, goals: 2, accounts: 2, history: 90 days, categories: 5 |
| `src/config/features.ts` | 75-100 | Premium tier | All features UNLIMITED (-1) |
| `src/stores/tierStore.ts` | 70, 120 | Tier state | Defaults to `'free'`, encrypted via SecureStore |
| `src/stores/tierStore.ts` | 143-200 | `incrementUsage()` | Tracks per-feature usage with server sync |
| `src/stores/purchasesStore.ts` | 56-57 | `isPremium()` / `isFree()` | RevenueCat entitlement check |
| `src/stores/settingsStore.ts` | 442-451 | `useIsPremium()` / `useSubscriptionTier()` | Hooks for subscription state |
| `src/hooks/useFeatureAccess.ts` | 104-325 | `useFeatureAccess()` | Master hook: `canAccess()`, `trackUsage()`, `verifyEntitlementServer()` |
| `src/hooks/useFeatureAccess.ts` | 198-263 | `verifyEntitlementServer()` | Calls `verify-entitlement` edge function for server-side verification |
| `src/hooks/useSubscription.ts` | 82-156 | `useSubscription()` | Purchase flow, restore, tier hierarchy check |
| `src/config/revenuecat.ts` | 112-120 | Product IDs | `spendtrak_premium_monthly` ($9.99), `spendtrak_premium_yearly` ($79.99) |

### UI Gate Components

| File | Line(s) | Check Type | What It Gates |
|------|---------|------------|---------------|
| `src/components/premium/FeatureGate.tsx` | 288-371 | `<FeatureGate>` component | Wraps premium content; variants: block, blur, badge, inline |
| `src/components/premium/FeatureGate.tsx` | 374-408 | `<UsageLimitGate>` | Specifically for metered features (AI, receipts) |
| `src/components/premium/UpgradePrompt.tsx` | 301-405 | Upgrade modal | Shows pricing and purchase flow |
| `src/components/premium/FeatureDrawer.tsx` | 214-244 | Navigation drawer | Lock icons on premium features, redirects to upgrade |

### Screen-Level Gates

| File | Line(s) | Check Type | What It Gates |
|------|---------|------------|---------------|
| `app/settings/bills.tsx` | 266 | `<FeatureGate feature="bill_calendar" variant="block">` | Bill calendar |
| `app/settings/debts.tsx` | 246 | `<FeatureGate feature="debt_tracking" variant="block">` | Debt management |
| `app/settings/export.tsx` | 780 | `<FeatureGate feature="export_data" variant="block">` | Data export |
| `app/settings/household.tsx` | 168, 184, 225 | `<FeatureGate feature="household_members" variant="block">` | Family sharing |
| `app/settings/net-worth.tsx` | — | `<FeatureGate feature="net_worth">` | Net worth tracker |
| `app/settings/investments.tsx` | — | `<FeatureGate feature="investment_tracking">` | Investment tracking |
| `app/settings/subscriptions.tsx` | — | `<FeatureGate feature="subscriptions_tracking">` | Subscription tracking |
| `app/(tabs)/stats.tsx` | — | `<FeatureGate feature="advanced_analytics">` | Advanced analytics |

### Service-Level Gates

| File | Line(s) | Check Type | What It Gates |
|------|---------|------------|---------------|
| `src/services/ai.ts` | 706-712 | `checkRateLimit()` | AI consultant messages (free: 30/hr, premium: unlimited) |
| `src/services/receiptScanner.ts` | 96-97, 133-134 | Tier + feature config check | Receipt scans (free: 10/mo, premium: unlimited) |
| `app/(modals)/ai-consultant.tsx` | 332-345, 404-410, 479-486 | AI consent + rate limit + usage indicator | AI chat access |

---

## BEHAVIORAL ENGINE CLASSIFICATION

| Component | AI or Rule-Based? | Reason |
|-----------|-------------------|--------|
| State Machine (`src/services/stateMachine.ts`) | **Rule-Based** | Finite state machine with 4 states (OBSERVING/FOCUSED/COOLDOWN/WITHDRAWN), transitions based on confidence thresholds and timers |
| Detection (`src/services/detection.ts`) | **Rule-Based** | Pattern detection using frequency analysis, time-window checks, amount thresholds, and confidence scoring — no ML models |
| Decision Engine (`src/services/decisionEngine.ts`) | **Rule-Based** | 8-gate sequential check: state, enabled, cooldown, daily limit, weekly limit, active behavior, confidence threshold, behavioral moment |
| Behavioral Moment (`src/services/behavioralMoment.ts`) | **Rule-Based** | Time-of-day checks, transaction clustering, budget breach detection — all threshold-based |
| Intervention Messages (`src/config/interventionMessages.ts`) | **Rule-Based** | 120 pre-written messages (max 12 words each), selected by behavior type and moment — no AI generation |
| Message Validator (`src/services/messageValidator.ts`) | **Rule-Based** | String validation: word count ≤12, character limit ≤60, forbidden phrase list, no advice/motivation |
| Win Detection (`src/services/winDetection.ts`) | **Rule-Based** | Compares current vs historical spending patterns, streak counting, improvement detection |
| Failure Handler (`src/services/failureHandler.ts`) | **Rule-Based** | Counts dismissals/ignores, triggers cooldown/withdrawal state transitions |
| AI Guardrails (`src/services/aiGuardrails.ts`) | **Rule-Based** | String validation for AI output — guards the AI layer but is itself rule-based |
| Behavior Store (`src/stores/behaviorStore.ts`) | **Rule-Based** | Orchestrates all above services, persists to Supabase — no AI calls |

**Verdict:** The entire Behavioral Engine v2.0 is **100% rule-based**. It uses classical algorithms (finite state machines, threshold-based detection, confidence scoring, time-window analysis). No machine learning or AI APIs are involved in detection, decision-making, or message selection.

---

## SUMMARY

- **Total Features Identified:** 51
- **Non-AI Features (Free):** 45
- **AI Features (Premium):** 6
- **Edge Functions Total:** 15 (8 contain AI, 7 do not)
- **AI API Calls Found:** 9 server-side calls across 8 edge functions + 2 client-side edge function invocations
- **AI Providers Used:** Google Gemini 2.0 Flash (6 functions), OpenAI GPT-4o/4o-mini (3 functions)
- **Pricing:** $9.99/month or $79.99/year via RevenueCat

### AI Provider Strategy

| Provider | Model | Used For | Why |
|----------|-------|----------|-----|
| Google Gemini 2.0 Flash | Text | AI chat Q&A, email receipt detection | Lower cost for high-volume operations |
| Google Gemini 2.0 Flash | Vision | Receipt image scanning | Lower cost vs OpenAI Vision |
| OpenAI GPT-4o | Text | Detailed financial coaching | Higher quality for nuanced advice |
| OpenAI GPT-4o-mini | Text | Health score recs, bank email parsing | Cost-effective for simpler text tasks |
| OpenAI GPT-4o | Vision | Receipt scanning (LEGACY) | Deprecated in favor of Gemini Vision |

---

## UNCERTAIN / NEEDS DECISION

| Feature | Why It's Unclear | My Recommendation |
|---------|-----------------|-------------------|
| Email Connection (OAuth setup) | The OAuth connection flow itself is non-AI, but the feature is useless without the AI-powered email parsing backend | **Classify as AI feature** — the entire email import pipeline depends on AI to extract receipt data from emails |
| QUANTUM Mascot (UI layer) | The animated mascot on the dashboard is pure UI/animation, but tapping it opens the AI consultant | **Classify as Non-AI** — the mascot display is decorative; the AI consultant it links to is separately gated |
| Behavioral Engine messages | Messages are pre-written (non-AI), but `src/config/interventionMessages.ts` has a `generateDynamicMessage()` function that could theoretically use AI | **Classify as Non-AI** — `generateDynamicMessage()` uses string templates with variable substitution, not AI generation |
| Financial Health Score | Calculated in `src/services/financialHealth.ts` (rule-based) but the AI consultant also generates health score recommendations via GPT-4o-mini | **Split classification** — the score itself is Non-AI (free); the AI-generated recommendations are AI (premium) |
| Advanced Analytics | Currently gated as premium via `<FeatureGate>`, but the analytics are pure aggregation/charting with no AI | **Needs business decision** — technically Non-AI, but currently premium-gated. Keep as premium for business reasons or move to free? |
| Bill Calendar, Debt Tracking, Exports, Household, Net Worth, Investments, Subscriptions | Currently gated as premium via `<FeatureGate>`, but none use AI | **Needs business decision** — all are Non-AI features currently behind the paywall. The audit prompt says free tier = ALL non-AI features. Moving these to free would be a significant tier restructure |
