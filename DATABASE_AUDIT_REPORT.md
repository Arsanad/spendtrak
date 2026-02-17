# SPENDTRAK DATABASE SCHEMA & DATA INTEGRITY AUDIT REPORT

**Audit Date:** 2026-02-05
**Auditor:** Claude Code (Automated Security Audit)
**App Version:** v2.0
**Database:** Supabase (PostgreSQL)

---

## EXECUTIVE SUMMARY

| Category | Status | Critical Issues | Warnings |
|----------|--------|-----------------|----------|
| Schema Structure | PASS | 0 | 2 |
| RLS Policies | PASS | 0 | 3 |
| Data Model | PASS | 1 | 2 |
| Query Patterns | NEEDS ATTENTION | 2 | 3 |
| Edge Functions | CRITICAL | 4 | 2 |

**Overall Assessment:** The database schema is well-designed with proper RLS policies on all user data tables. However, several Edge Functions lack JWT authentication, creating potential security vulnerabilities.

---

## SECTION 1: COMPLETE SCHEMA AUDIT

### 1.1 Tables Inventory (67 Tables)

#### Core User Tables
| Table | RLS | Primary Key | Foreign Keys | Status |
|-------|-----|-------------|--------------|--------|
| users | YES | id (UUID) | auth.users(id) | OK |
| user_subscriptions | YES | id (UUID) | auth.users(id) | OK |
| user_gamification | YES | id (UUID) | users(id) | OK |
| user_achievements | YES | id (UUID) | users(id), achievements(id) | OK |
| user_challenges | YES | id (UUID) | users(id), challenges(id) | OK |
| user_cards | YES | id (UUID) | users(id) | OK |
| user_debt_settings | YES | id (UUID) | users(id) | OK |
| user_behavioral_profile | YES | id (UUID) | auth.users(id) | OK |

#### Financial Tables
| Table | RLS | Primary Key | Foreign Keys | Status |
|-------|-----|-------------|--------------|--------|
| transactions | YES | id (UUID) | users(id), categories(id), bank_accounts(id) | OK |
| transaction_splits | YES | id (UUID) | transactions(id), categories(id) | OK |
| transaction_assignments | YES | id (UUID) | transactions(id), households(id), users(id) | OK |
| categories | YES | id (UUID) | users(id) | OK |
| budgets | YES | id (UUID) | users(id), categories(id) | OK |
| budget_history | YES | id (UUID) | budgets(id) | OK |
| financial_goals | YES | id (UUID) | users(id) | OK |
| subscriptions | YES | id (UUID) | users(id), categories(id) | OK |
| debts | YES | id (UUID) | users(id) | OK |
| debt_payments | YES | id (UUID) | debts(id), users(id), transactions(id) | OK |
| income | YES | id (UUID) | users(id), categories(id) | OK |
| bills | YES | id (UUID) | users(id), households(id), categories(id) | OK |
| bill_payments | YES | id (UUID) | bills(id), users(id), transactions(id) | OK |
| bill_reminders | YES | id (UUID) | bills(id), users(id) | OK |

#### Net Worth & Investment Tables
| Table | RLS | Primary Key | Foreign Keys | Status |
|-------|-----|-------------|--------------|--------|
| assets | YES | id (UUID) | users(id) | OK |
| liabilities | YES | id (UUID) | users(id), debts(id) | OK |
| asset_history | YES | id (UUID) | assets(id), users(id) | OK |
| liability_history | YES | id (UUID) | liabilities(id), users(id) | OK |
| net_worth_history | YES | id (UUID) | users(id) | OK |
| investment_holdings | YES | id (UUID) | users(id), bank_accounts(id) | OK |
| investment_snapshots | YES | id (UUID) | users(id) | OK |
| investment_transactions | YES | id (UUID) | users(id), investment_holdings(id) | OK |
| crypto_holdings | YES | id (UUID) | users(id) | OK |
| investment_prices | NO | id (UUID) | None | WARNING: Public table |

#### Household/Sharing Tables
| Table | RLS | Primary Key | Foreign Keys | Status |
|-------|-----|-------------|--------------|--------|
| households | YES | id (UUID) | users(id) | OK |
| household_members | YES | id (UUID) | households(id), users(id) | OK |
| household_invitations | YES | id (UUID) | households(id), users(id) | OK |
| shared_budgets | YES | id (UUID) | households(id), categories(id) | OK |
| shared_goals | YES | id (UUID) | households(id) | OK |
| shared_goal_contributions | YES | id (UUID) | shared_goals(id), users(id) | OK |

#### Email & Receipt Tables
| Table | RLS | Primary Key | Foreign Keys | Status |
|-------|-----|-------------|--------------|--------|
| email_connections | YES | id (UUID) | users(id) | OK |
| email_connections_imap | YES | id (UUID) | auth.users(id) | OK |
| processed_emails | YES | id (UUID) | users(id), email_connections(id), transactions(id), subscriptions(id) | OK |
| processed_emails_imap | YES | id (UUID) | auth.users(id), email_connections_imap(id) | OK |
| receipt_scans | YES | id (UUID) | users(id), transactions(id) | OK |
| receipt_scan_usage | YES | id (UUID) | users(id) | OK |

#### Banking (Plaid) Tables
| Table | RLS | Primary Key | Foreign Keys | Status |
|-------|-----|-------------|--------------|--------|
| connected_accounts | YES | id (UUID) | users(id) | WARNING: Token storage |
| bank_accounts | YES | id (UUID) | connected_accounts(id), users(id) | OK |
| plaid_sync_cursors | YES | id (UUID) | connected_accounts(id) | OK |

#### Behavioral & AI Tables
| Table | RLS | Primary Key | Foreign Keys | Status |
|-------|-----|-------------|--------------|--------|
| ai_conversations | YES | id (UUID) | users(id) | OK |
| ai_chat_usage | YES | id (UUID) | users(id) | OK |
| behavioral_signals | YES | id (UUID) | auth.users(id), transactions(id), categories(id) | OK |
| interventions | YES | id (UUID) | auth.users(id), transactions(id) | OK |
| behavioral_wins | YES | id (UUID) | auth.users(id) | OK |
| state_transitions | YES | id (UUID) | auth.users(id) | OK |

#### Gamification Tables
| Table | RLS | Primary Key | Foreign Keys | Status |
|-------|-----|-------------|--------------|--------|
| achievements | NO | id (UUID) | None | OK: System config |
| challenges | NO | id (UUID) | categories(id) | OK: System config |
| leaderboard_entries | YES | id (UUID) | users(id) | WARNING: Public SELECT |

#### System Tables
| Table | RLS | Primary Key | Foreign Keys | Status |
|-------|-----|-------------|--------------|--------|
| entitlement_features | NO | id (UUID) | None | OK: System config |
| subscription_events | YES | id (UUID) | auth.users(id) | OK |
| savings_log | YES | id (UUID) | users(id) | OK |
| alerts | YES | id (UUID) | users(id) | OK |
| export_history | YES | id (UUID) | users(id) | OK |
| daily_spending_limits | YES | id (UUID) | users(id) | OK |
| daily_spending_log | YES | id (UUID) | users(id) | OK |
| custom_date_presets | YES | id (UUID) | users(id) | OK |
| zero_based_periods | YES | id (UUID) | users(id), households(id) | OK |
| zero_based_allocations | YES | id (UUID) | zero_based_periods(id), users(id), categories(id) | OK |
| zero_based_income_sources | YES | id (UUID) | zero_based_periods(id), users(id), income(id) | OK |

### 1.2 Indexes Summary

**Total Indexes:** 150+

Key index patterns observed:
- All tables have indexes on `user_id` columns
- Composite indexes for common query patterns (e.g., `idx_transactions_user_date`)
- Partial indexes for active records (e.g., `WHERE is_active = TRUE`)
- Unique indexes for constraints (e.g., `UNIQUE(user_id, email)`)

### 1.3 Custom Types (Enums)

| Type Name | Values |
|-----------|--------|
| debt_type | credit_card, loan, mortgage, student_loan, auto_loan, personal_loan, medical, other |
| payoff_strategy | snowball, avalanche, custom |
| income_source | salary, freelance, investment, rental, business, gift, refund, other |
| income_frequency | one_time, weekly, biweekly, monthly, quarterly, yearly |
| asset_type | cash, checking, savings, investment, retirement, real_estate, vehicle, cryptocurrency, collectibles, business, other |
| liability_type | credit_card, mortgage, auto_loan, student_loan, personal_loan, medical_debt, tax_debt, other |
| household_role | owner, admin, member, viewer |
| invite_status | pending, accepted, declined, expired |
| bill_status | pending, paid, overdue, cancelled, scheduled |
| connection_status | active, error, pending_reauth, disconnected |
| bank_account_type | depository, credit, loan, investment, other |
| investment_type | stock, etf, mutual_fund, bond, crypto, cash, option, other |
| behavior_type | small_recurring, stress_spending, end_of_month |
| intervention_type | immediate, reflective, reinforcement |
| win_type | pattern_break, avoidance, improvement, streak |

---

## SECTION 2: DATA MODEL VALIDATION

### 2.1 Column Type Analysis

| Issue | Table.Column | Current | Recommendation | Severity |
|-------|--------------|---------|----------------|----------|
| Sensitive data in plain text | connected_accounts.plaid_access_token | TEXT | Encrypt at rest | CRITICAL |
| Interest rate precision | debts.interest_rate | DECIMAL(5,4) | OK for 0.1999 = 19.99% | OK |
| Amount precision | transactions.amount | DECIMAL(12,2) | OK | OK |
| Large amounts | assets.current_value | DECIMAL(15,2) | OK for high net worth | OK |

### 2.2 NOT NULL Constraints

**Well-Constrained Tables:**
- `users.email` - NOT NULL UNIQUE
- `transactions.user_id, amount, merchant_name, transaction_date, source` - All NOT NULL
- `budgets.user_id, amount` - NOT NULL
- `debts.user_id, name, original_balance, current_balance` - NOT NULL

**Missing Constraints (Low Risk):**
- `budgets.name` - Can be NULL (category provides context)
- `subscriptions.display_name` - Can be NULL (uses merchant_name)

### 2.3 DEFAULT Values

All critical columns have appropriate defaults:
- `created_at`, `updated_at` - DEFAULT NOW()
- `is_active`, `is_deleted` - DEFAULT TRUE/FALSE
- `currency` - DEFAULT 'USD'
- `language` - DEFAULT 'en'
- `timezone` - DEFAULT 'UTC'

### 2.4 CHECK Constraints

Properly validated fields:
- `transactions.source` IN ('email', 'receipt', 'manual', 'import')
- `transactions.transaction_type` IN ('purchase', 'payment', 'refund', 'atm', 'transfer')
- `subscriptions.frequency` IN ('weekly', 'monthly', 'quarterly', 'yearly')
- `alerts.severity` IN ('info', 'warning', 'critical')
- `user_subscriptions.current_entitlement` IN ('free', 'plus', 'premium')
- `bills.due_day` CHECK (due_day >= 1 AND due_day <= 31)

### 2.5 Foreign Key Relationships

All foreign keys properly configured with:
- `ON DELETE CASCADE` - For dependent data (e.g., transactions when user deleted)
- `ON DELETE SET NULL` - For optional references (e.g., category_id)
- `REFERENCES auth.users(id)` - For primary user reference

### 2.6 Timestamp Columns

All tables with `updated_at` have corresponding triggers:
```sql
CREATE TRIGGER update_{table}_updated_at
  BEFORE UPDATE ON {table}
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## SECTION 3: RLS POLICY AUDIT

### 3.1 RLS Status Summary

| Status | Count |
|--------|-------|
| RLS Enabled | 62 |
| RLS Not Required (System Tables) | 5 |

### 3.2 Policy Patterns Analysis

#### Standard User Isolation (CORRECT)
Most tables use the correct pattern:
```sql
-- SELECT
USING (auth.uid() = user_id)
-- INSERT
WITH CHECK (auth.uid() = user_id)
-- UPDATE
USING (auth.uid() = user_id)
-- DELETE
USING (auth.uid() = user_id)
```

#### Complex Multi-User Policies (CORRECT)
Household tables properly implement role-based access:
```sql
-- household_members SELECT
USING (EXISTS (
  SELECT 1 FROM household_members hm
  WHERE hm.household_id = household_members.household_id
  AND hm.user_id = auth.uid()
))

-- shared_budgets ALL (for authorized editors)
USING (EXISTS (
  SELECT 1 FROM household_members hm
  WHERE hm.household_id = shared_budgets.household_id
  AND hm.user_id = auth.uid()
  AND (hm.role IN ('owner', 'admin') OR hm.can_edit_budgets = true)
))
```

#### Subquery-Based Ownership (CORRECT)
Transaction splits verify ownership through parent:
```sql
USING (transaction_id IN (
  SELECT id FROM public.transactions WHERE user_id = auth.uid()
))
```

### 3.3 Policy Gaps & Warnings

| Table | Issue | Risk | Recommendation |
|-------|-------|------|----------------|
| leaderboard_entries | SELECT uses `USING (true)` | LOW | Intentional for public leaderboard - OK |
| processed_emails | No INSERT policy | LOW | Handled by service role - OK |
| achievements | No RLS | NONE | System seed data - OK |
| entitlement_features | No RLS | NONE | System config - OK |
| investment_prices | No RLS | LOW | Public market data - Consider adding user filter |

### 3.4 Service Role Policies

Subscription tables correctly allow service role access for webhooks:
```sql
CREATE POLICY "Service role can manage subscriptions" ON public.user_subscriptions
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');
```

---

## SECTION 4: QUERY AUDIT

### 4.1 Service Files Analyzed

| File | User Filter | Error Handling | Status |
|------|-------------|----------------|--------|
| transactions.ts | YES (RLS + explicit) | YES | OK |
| budgets.ts | YES (explicit) | YES | OK |
| subscriptions.ts | YES (explicit) | YES | OK |
| investments.ts | YES (explicit) | YES | OK |
| household.ts | YES (explicit) | YES | OK |
| netWorth.ts | YES (explicit) | YES | OK |
| billCalendar.ts | YES (explicit) | YES | OK |
| gamification.ts | YES (explicit) | YES | OK |
| ai.ts | YES (RPC) | YES | OK |
| export.ts | NO (RLS only) | YES | WARNING |
| budgetRollover.ts | PARTIAL | YES | WARNING |

### 4.2 Critical Query Issues

#### Issue 1: export.ts - Missing User Filter (MEDIUM)

**Location:** `src/services/export.ts`
```typescript
// CURRENT: Relies entirely on RLS
const { data, error } = await supabase
  .from('transactions')
  .select(`*, category:categories(*)`)
  .eq('is_deleted', false);
```

**Risk:** While RLS provides protection, defense-in-depth requires explicit filtering.

**Recommendation:**
```typescript
const userId = await getAuthenticatedUserId();
const { data, error } = await supabase
  .from('transactions')
  .select(`*, category:categories(*)`)
  .eq('user_id', userId)  // ADD THIS
  .eq('is_deleted', false);
```

#### Issue 2: budgetRollover.ts - Missing User Filter (MEDIUM)

**Location:** `src/services/budgetRollover.ts:getBudgetWithRollover`
```typescript
// Query budget by ID without user filter
const { data, error } = await supabase
  .from('budgets')
  .select('*')
  .eq('id', budgetId)
  .single();
```

**Risk:** RLS protects data, but explicit filter prevents IDOR attempts.

**Recommendation:** Add `.eq('user_id', userId)` to all budget queries.

### 4.3 Query Pattern Analysis

#### .single() Usage (CORRECT)
All `.single()` calls are preceded by specific filters:
```typescript
.eq('id', budgetId)
.eq('user_id', userId)
.single()
```

#### .limit() Usage (CORRECT)
Queries with potentially large results use limits:
```typescript
.order('created_at', { ascending: false })
.limit(50)
```

#### N+1 Query Prevention (MOSTLY OK)
Most services use JOIN syntax:
```typescript
.select('*, category:categories(*)')
```

**Exception:** `gamification.ts` loads achievements separately - acceptable for small dataset.

### 4.4 Dev Mode Security

Several services check for dev mode users:
```typescript
if (storeUser?.id?.startsWith('dev-user-')) {
  return storeUser.id;
}
```

**Risk:** LOW - Dev mode only works locally with proper guards.

---

## SECTION 5: EDGE FUNCTIONS AUDIT

### 5.1 Edge Function Inventory

| Function | Auth Method | Input Validation | Error Handling | Status |
|----------|-------------|------------------|----------------|--------|
| ai-consultant | NONE (service role) | Basic | Good | CRITICAL |
| sync-emails | NONE (service role) | Basic | Good | CRITICAL |
| parse-receipt | NONE (service role) | Basic | Good | CRITICAL |
| test-email-connection | NONE | Good | Good | CRITICAL |
| connect-email | JWT (Auth header) | Good | Good | OK |
| fetch-email-receipts | JWT (Auth header) | Good | Good | OK |
| revenuecat-webhook | Bearer Token | Good | Good | OK |

### 5.2 Critical Security Issues

#### Issue 1: ai-consultant - No JWT Verification (CRITICAL)

**Location:** `supabase/functions/ai-consultant/index.ts`

**Current Code:**
```typescript
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!  // BYPASSES RLS
);

const { action, messages, user_id, context } = body;
// user_id accepted from request body without verification
```

**Risk:** Anyone can call this function with any user_id, accessing other users' financial data.

**Recommendation:**
```typescript
// Extract and verify JWT from Authorization header
const authHeader = req.headers.get('Authorization');
if (!authHeader?.startsWith('Bearer ')) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
}

const token = authHeader.substring(7);
const { data: { user }, error: authError } = await supabase.auth.getUser(token);
if (authError || !user) {
  return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
}

// Use user.id instead of body.user_id
const userId = user.id;
```

#### Issue 2: sync-emails - No JWT Verification (CRITICAL)

**Location:** `supabase/functions/sync-emails/index.ts`

Same vulnerability as ai-consultant. Accepts `user_id` from request body.

#### Issue 3: parse-receipt - No JWT Verification (CRITICAL)

**Location:** `supabase/functions/parse-receipt/index.ts`

Same vulnerability. Uses service role key without user verification.

#### Issue 4: test-email-connection - No Authentication (CRITICAL)

**Location:** `supabase/functions/test-email-connection/index.ts`

**Risk:** Function accepts email credentials and tests IMAP connection without any authentication. Could be abused for credential validation attacks.

**Recommendation:** Require JWT authentication before accepting credentials.

### 5.3 Edge Function Security Checklist

| Requirement | ai-consultant | sync-emails | parse-receipt | test-email | connect-email | fetch-email | webhook |
|-------------|---------------|-------------|---------------|------------|---------------|-------------|---------|
| JWT Verification | NO | NO | NO | NO | YES | YES | N/A |
| Rate Limiting | Via RPC | NO | Via RPC | NO | NO | NO | N/A |
| Input Sanitization | Basic | YES | Basic | YES | YES | YES | YES |
| Error Messages | Safe | Safe | Safe | Safe | Safe | Safe | Safe |
| CORS Configured | YES | YES | YES | YES | YES | YES | YES |
| Secrets in Env | YES | YES | YES | YES | YES | YES | YES |

### 5.4 CORS Configuration

**Location:** `supabase/functions/_shared/cors.ts`

```typescript
const ALLOWED_ORIGINS = [
  'http://localhost:8081',
  'http://localhost:19006',
  // Add production domain
];
```

**Warning:** Production domain should be added before deployment.

### 5.5 Encryption

**Location:** `supabase/functions/_shared/encryption.ts`

IMAP passwords are encrypted using AES-256-GCM:
- 256-bit key from environment variable
- Random IV per encryption
- Authentication tag included
- Proper key derivation

**Status:** GOOD

---

## SECTION 6: REMEDIATION PRIORITIES

### Critical (Fix Before Production)

1. **Add JWT verification to ai-consultant Edge Function**
   - Risk: Unauthorized access to user financial data
   - Effort: 1-2 hours

2. **Add JWT verification to sync-emails Edge Function**
   - Risk: Unauthorized email sync operations
   - Effort: 1-2 hours

3. **Add JWT verification to parse-receipt Edge Function**
   - Risk: Unauthorized receipt processing
   - Effort: 1-2 hours

4. **Add authentication to test-email-connection**
   - Risk: Credential validation abuse
   - Effort: 1 hour

### High Priority

5. **Encrypt Plaid access tokens at rest**
   - Table: connected_accounts.plaid_access_token
   - Risk: Token exposure if database compromised
   - Effort: 2-4 hours

6. **Add explicit user_id filter to export.ts**
   - Defense-in-depth
   - Effort: 30 minutes

7. **Add user_id filter to budgetRollover.ts**
   - Defense-in-depth
   - Effort: 30 minutes

### Medium Priority

8. **Add rate limiting to Edge Functions without it**
   - Functions: sync-emails, test-email-connection
   - Effort: 2-3 hours

9. **Add production domain to CORS whitelist**
   - Effort: 5 minutes

### Low Priority

10. **Consider RLS for investment_prices table**
    - Currently public market data
    - Effort: 30 minutes

---

## SECTION 7: SUMMARY

### What's Working Well

1. **RLS Implementation:** All user data tables have proper Row Level Security enabled with correct policies
2. **Data Model:** Well-designed schema with proper types, constraints, and indexes
3. **Foreign Keys:** Cascading deletes properly configured
4. **Timestamp Management:** Automatic updated_at triggers on all tables
5. **IMAP Password Encryption:** AES-256-GCM encryption properly implemented
6. **Household Sharing:** Complex RLS policies correctly implement role-based access
7. **Subscription System:** Well-designed with proper event logging

### Critical Gaps

1. **Edge Function Authentication:** 4 of 7 Edge Functions lack JWT verification
2. **Plaid Token Storage:** Access tokens stored in plain text
3. **Defense-in-Depth:** Some queries rely solely on RLS without explicit user_id filtering

### Risk Assessment

| Risk Level | Count | Examples |
|------------|-------|----------|
| Critical | 4 | Edge Functions without auth |
| High | 1 | Plaid token storage |
| Medium | 2 | Missing user_id filters |
| Low | 3 | Public leaderboard, CORS config |

---

## APPENDIX A: FUNCTION INVENTORY

### PostgreSQL Functions (Security Definer)

| Function | Purpose | Security |
|----------|---------|----------|
| get_monthly_spending_by_category | Analytics | SECURITY DEFINER |
| get_subscription_summary | Subscription totals | SECURITY DEFINER |
| can_scan_receipt | Free tier check | SECURITY DEFINER |
| increment_scan_usage | Usage tracking | SECURITY DEFINER |
| get_total_savings | Savings calculation | SECURITY DEFINER |
| calculate_monthly_interest | Debt calculation | IMMUTABLE |
| get_debt_summary | Debt overview | SECURITY DEFINER |
| get_cash_flow | Income/expense | SECURITY DEFINER |
| calculate_net_worth | Net worth calc | SECURITY DEFINER |
| get_behavioral_context | AI context | SECURITY DEFINER |
| can_send_ai_message | Rate limiting | SECURITY DEFINER |
| increment_ai_chat_usage | Usage tracking | SECURITY DEFINER |
| get_user_subscription | Subscription status | SECURITY DEFINER |
| check_feature_access | Entitlement check | SECURITY DEFINER |
| update_subscription_from_webhook | RevenueCat handler | SECURITY DEFINER |

All SECURITY DEFINER functions properly check `p_user_id` parameter matches authenticated user context.

---

## APPENDIX B: MIGRATION FILE INVENTORY

| File | Purpose | Tables Created |
|------|---------|----------------|
| 001_schema.sql | Core schema | 15 tables |
| 002_phase1_features.sql | Splits, rollover, limits | 7 tables |
| 003_phase2_features.sql | Debt, income | 4 tables |
| 004_phase3_features.sql | Net worth, households, bills, ZBB | 22 tables |
| 005_phase4_features.sql | Plaid, investments, gamification | 14 tables |
| 006_behavioral_layer.sql | Behavioral tracking | 4 tables |
| 007_behavioral_layer_v2.sql | State machine | 5 tables (replaced) |
| 009_ai_rate_limiting.sql | AI usage tracking | 1 table |
| 010_subscription_system.sql | RevenueCat integration | 3 tables |
| 011_fix_users_insert_policy.sql | Policy fix | 0 tables |
| 20240131_email_import_imap_tables.sql | IMAP email | 2 tables |

---

**End of Audit Report**
