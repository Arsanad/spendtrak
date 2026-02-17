/**
 * Household Service
 * Manages partner/spouse sharing, households, and shared financial features
 */

import { supabase } from './supabase';
import type {
  Household,
  HouseholdInsert,
  HouseholdUpdate,
  HouseholdMember,
  HouseholdMemberWithUser,
  HouseholdMemberUpdate,
  HouseholdInvitation,
  HouseholdRole,
  SharedBudget,
  SharedBudgetInsert,
  SharedBudgetUpdate,
  SharedBudgetWithCategory,
  SharedGoal,
  SharedGoalInsert,
  SharedGoalUpdate,
  SharedGoalContribution,
  SharedGoalWithContributions,
  TransactionAssignment,
  Category,
} from '@/types';

// ============================================
// HOUSEHOLD MANAGEMENT
// ============================================

/**
 * Get all households the user belongs to
 */
export async function getHouseholds(): Promise<Household[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('households')
    .select(`
      *,
      household_members!inner(user_id)
    `)
    .eq('household_members.user_id', user.id)
    .eq('is_active', true);

  if (error) {
    throw new Error(`Failed to fetch households: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single household by ID
 */
export async function getHousehold(householdId: string): Promise<Household> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // SECURITY: Verify user is a member of this household
  const { data: membership } = await supabase
    .from('household_members')
    .select('role')
    .eq('household_id', householdId)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    throw new Error('Access denied: Not a member of this household');
  }

  // Now safe to fetch household data
  const { data, error } = await supabase
    .from('households')
    .select('*')
    .eq('id', householdId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch household: ${error.message}`);
  }

  return data;
}

/**
 * Create a new household
 */
export async function createHousehold(
  household: Omit<HouseholdInsert, 'created_by'>
): Promise<Household> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('households')
    .insert({
      ...household,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create household: ${error.message}`);
  }

  // The trigger automatically adds the creator as owner
  return data;
}

/**
 * Update a household
 */
export async function updateHousehold(
  householdId: string,
  updates: HouseholdUpdate
): Promise<Household> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // SECURITY: Verify user is admin or owner
  const { data: membership } = await supabase
    .from('household_members')
    .select('role')
    .eq('household_id', householdId)
    .eq('user_id', user.id)
    .single();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    throw new Error('Access denied: Admin or owner role required');
  }

  const { data, error } = await supabase
    .from('households')
    .update(updates)
    .eq('id', householdId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update household: ${error.message}`);
  }

  return data;
}

/**
 * Delete a household (soft delete)
 */
export async function deleteHousehold(householdId: string): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // SECURITY: Only owner can delete
  const { data: membership } = await supabase
    .from('household_members')
    .select('role')
    .eq('household_id', householdId)
    .eq('user_id', user.id)
    .single();

  if (!membership || membership.role !== 'owner') {
    throw new Error('Access denied: Only the owner can delete this household');
  }

  const { error } = await supabase
    .from('households')
    .update({ is_active: false })
    .eq('id', householdId);

  if (error) {
    throw new Error(`Failed to delete household: ${error.message}`);
  }
}

// ============================================
// HOUSEHOLD MEMBERS
// ============================================

/**
 * Get all members of a household
 */
export async function getHouseholdMembers(
  householdId: string
): Promise<HouseholdMemberWithUser[]> {
  const { data, error } = await supabase
    .from('household_members')
    .select(`
      *,
      user:users(display_name, email, avatar_url)
    `)
    .eq('household_id', householdId);

  if (error) {
    throw new Error(`Failed to fetch household members: ${error.message}`);
  }

  return data || [];
}

/**
 * Get current user's membership in a household
 */
export async function getMyMembership(householdId: string): Promise<HouseholdMember | null> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('household_members')
    .select('*')
    .eq('household_id', householdId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Update a member's permissions
 */
export async function updateMemberPermissions(
  memberId: string,
  updates: HouseholdMemberUpdate
): Promise<HouseholdMember> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // First fetch the target member to get household_id
  const { data: targetMember, error: targetError } = await supabase
    .from('household_members')
    .select('household_id, user_id, role')
    .eq('id', memberId)
    .single();

  if (targetError || !targetMember) {
    throw new Error('Member not found');
  }

  // SECURITY: Only owner can change roles/permissions
  const { data: requesterMembership } = await supabase
    .from('household_members')
    .select('role')
    .eq('household_id', targetMember.household_id)
    .eq('user_id', user.id)
    .single();

  if (!requesterMembership || requesterMembership.role !== 'owner') {
    throw new Error('Access denied: Only the owner can modify member permissions');
  }

  // Cannot demote owner
  if (targetMember.role === 'owner' && updates.role && updates.role !== 'owner') {
    throw new Error('Cannot change owner role');
  }

  const { data, error } = await supabase
    .from('household_members')
    .update(updates)
    .eq('id', memberId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update member: ${error.message}`);
  }

  return data;
}

/**
 * Remove a member from a household
 */
export async function removeMember(memberId: string): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // First fetch the target member to get household_id and their role
  const { data: targetMember, error: targetError } = await supabase
    .from('household_members')
    .select('household_id, user_id, role')
    .eq('id', memberId)
    .single();

  if (targetError || !targetMember) {
    throw new Error('Member not found');
  }

  // SECURITY: Don't allow removing the owner
  if (targetMember.role === 'owner') {
    throw new Error('Cannot remove the household owner');
  }

  // SECURITY: Verify requester is admin/owner OR removing themselves
  const isRemovingSelf = targetMember.user_id === user.id;

  if (!isRemovingSelf) {
    const { data: requesterMembership } = await supabase
      .from('household_members')
      .select('role')
      .eq('household_id', targetMember.household_id)
      .eq('user_id', user.id)
      .single();

    const hasPermission = requesterMembership &&
      ['owner', 'admin'].includes(requesterMembership.role);

    if (!hasPermission) {
      throw new Error('Access denied: Cannot remove other members');
    }
  }

  const { error } = await supabase
    .from('household_members')
    .delete()
    .eq('id', memberId);

  if (error) {
    throw new Error(`Failed to remove member: ${error.message}`);
  }
}

/**
 * Leave a household (current user)
 */
export async function leaveHousehold(householdId: string): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { error } = await supabase
    .from('household_members')
    .delete()
    .eq('household_id', householdId)
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Failed to leave household: ${error.message}`);
  }
}

// ============================================
// INVITATIONS
// ============================================

/**
 * Generate a unique invite code
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Invite a user to a household
 */
export async function inviteToHousehold(
  householdId: string,
  email: string,
  role: HouseholdRole = 'member'
): Promise<HouseholdInvitation> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const inviteCode = generateInviteCode();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('household_invitations')
    .insert({
      household_id: householdId,
      invited_by: user.id,
      invited_email: email.toLowerCase(),
      role,
      invite_code: inviteCode,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create invitation: ${error.message}`);
  }

  return data;
}

/**
 * Get pending invitations for a household
 */
export async function getHouseholdInvitations(
  householdId: string
): Promise<HouseholdInvitation[]> {
  const { data, error } = await supabase
    .from('household_invitations')
    .select('*')
    .eq('household_id', householdId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString());

  if (error) {
    throw new Error(`Failed to fetch invitations: ${error.message}`);
  }

  return data || [];
}

/**
 * Get invitations for the current user
 */
export async function getMyInvitations(): Promise<HouseholdInvitation[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('household_invitations')
    .select(`
      *,
      household:households(name)
    `)
    .eq('invited_email', user.email?.toLowerCase())
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString());

  if (error) {
    throw new Error(`Failed to fetch invitations: ${error.message}`);
  }

  return data || [];
}

/**
 * Accept an invitation by code
 */
export async function acceptInvitation(inviteCode: string): Promise<HouseholdMember> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // Get the invitation
  const { data: invitation, error: inviteError } = await supabase
    .from('household_invitations')
    .select('*')
    .eq('invite_code', inviteCode)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .single();

  if (inviteError || !invitation) {
    throw new Error('Invalid or expired invitation');
  }

  // Verify email matches (case insensitive)
  if (invitation.invited_email.toLowerCase() !== user.email?.toLowerCase()) {
    throw new Error('This invitation is for a different email address');
  }

  // Add user as member
  const { data: member, error: memberError } = await supabase
    .from('household_members')
    .insert({
      household_id: invitation.household_id,
      user_id: user.id,
      role: invitation.role,
      can_view_transactions: true,
      can_add_transactions: invitation.role !== 'viewer',
      can_edit_budgets: invitation.role === 'admin' || invitation.role === 'owner',
      can_manage_members: invitation.role === 'admin' || invitation.role === 'owner',
    })
    .select()
    .single();

  if (memberError) {
    throw new Error(`Failed to accept invitation: ${memberError.message}`);
  }

  // Update invitation status
  await supabase
    .from('household_invitations')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', invitation.id);

  return member;
}

/**
 * Decline an invitation
 */
export async function declineInvitation(invitationId: string): Promise<void> {
  const { error } = await supabase
    .from('household_invitations')
    .update({ status: 'declined' })
    .eq('id', invitationId);

  if (error) {
    throw new Error(`Failed to decline invitation: ${error.message}`);
  }
}

/**
 * Cancel/revoke an invitation
 */
export async function cancelInvitation(invitationId: string): Promise<void> {
  const { error } = await supabase
    .from('household_invitations')
    .delete()
    .eq('id', invitationId);

  if (error) {
    throw new Error(`Failed to cancel invitation: ${error.message}`);
  }
}

// ============================================
// SHARED BUDGETS
// ============================================

/**
 * Get shared budgets for a household
 */
export async function getSharedBudgets(
  householdId: string
): Promise<SharedBudgetWithCategory[]> {
  const { data, error } = await supabase
    .from('shared_budgets')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('household_id', householdId)
    .eq('is_active', true);

  if (error) {
    throw new Error(`Failed to fetch shared budgets: ${error.message}`);
  }

  // Calculate spent and remaining for each budget
  const budgetsWithProgress = await Promise.all(
    (data || []).map(async (budget) => {
      const { data: transactions } = await supabase
        .from('transaction_assignments')
        .select(`
          transaction:transactions(amount, transaction_date)
        `)
        .eq('household_id', householdId)
        .eq('is_shared', true);

      const spent = (transactions || [])
        .filter((t: any) => {
          if (!budget.category_id || !t.transaction) return false;
          const tx = Array.isArray(t.transaction) ? t.transaction[0] : t.transaction;
          if (!tx) return false;
          const txDate = new Date(tx.transaction_date);
          const startDate = new Date(budget.start_date);
          const endDate = budget.end_date ? new Date(budget.end_date) : new Date();
          return txDate >= startDate && txDate <= endDate;
        })
        .reduce((sum: number, t: any) => {
          const tx = Array.isArray(t.transaction) ? t.transaction[0] : t.transaction;
          return sum + (tx?.amount || 0);
        }, 0);

      return {
        ...budget,
        spent,
        remaining: budget.amount - spent,
        percentage: budget.amount > 0 ? (spent / budget.amount) * 100 : 0,
      };
    })
  );

  return budgetsWithProgress;
}

/**
 * Create a shared budget
 */
export async function createSharedBudget(
  budget: Omit<SharedBudgetInsert, 'household_id'> & { household_id: string }
): Promise<SharedBudget> {
  const { data, error } = await supabase
    .from('shared_budgets')
    .insert(budget)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create shared budget: ${error.message}`);
  }

  return data;
}

/**
 * Update a shared budget
 */
export async function updateSharedBudget(
  budgetId: string,
  updates: SharedBudgetUpdate
): Promise<SharedBudget> {
  const { data, error } = await supabase
    .from('shared_budgets')
    .update(updates)
    .eq('id', budgetId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update shared budget: ${error.message}`);
  }

  return data;
}

/**
 * Delete a shared budget
 */
export async function deleteSharedBudget(budgetId: string): Promise<void> {
  const { error } = await supabase
    .from('shared_budgets')
    .update({ is_active: false })
    .eq('id', budgetId);

  if (error) {
    throw new Error(`Failed to delete shared budget: ${error.message}`);
  }
}

// ============================================
// SHARED GOALS
// ============================================

/**
 * Get shared goals for a household
 */
export async function getSharedGoals(
  householdId: string
): Promise<SharedGoalWithContributions[]> {
  const { data, error } = await supabase
    .from('shared_goals')
    .select(`
      *,
      contributions:shared_goal_contributions(*)
    `)
    .eq('household_id', householdId)
    .eq('is_active', true);

  if (error) {
    throw new Error(`Failed to fetch shared goals: ${error.message}`);
  }

  return (data || []).map(goal => ({
    ...goal,
    total_contributed: goal.contributions?.reduce((sum: number, c: { amount: number }) => sum + c.amount, 0) || 0,
    percentage_complete: goal.target_amount > 0
      ? (goal.current_amount / goal.target_amount) * 100
      : 0,
  }));
}

/**
 * Create a shared goal
 */
export async function createSharedGoal(
  goal: Omit<SharedGoalInsert, 'household_id'> & { household_id: string }
): Promise<SharedGoal> {
  const { data, error } = await supabase
    .from('shared_goals')
    .insert(goal)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create shared goal: ${error.message}`);
  }

  return data;
}

/**
 * Update a shared goal
 */
export async function updateSharedGoal(
  goalId: string,
  updates: SharedGoalUpdate
): Promise<SharedGoal> {
  const { data, error } = await supabase
    .from('shared_goals')
    .update(updates)
    .eq('id', goalId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update shared goal: ${error.message}`);
  }

  return data;
}

/**
 * Add contribution to a shared goal
 */
export async function addGoalContribution(
  goalId: string,
  amount: number,
  notes?: string
): Promise<SharedGoalContribution> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('shared_goal_contributions')
    .insert({
      goal_id: goalId,
      user_id: user.id,
      amount,
      notes,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add contribution: ${error.message}`);
  }

  // Update goal's current amount
  await supabase.rpc('increment_shared_goal_amount', {
    p_goal_id: goalId,
    p_amount: amount,
  });

  return data;
}

/**
 * Delete a shared goal
 */
export async function deleteSharedGoal(goalId: string): Promise<void> {
  const { error } = await supabase
    .from('shared_goals')
    .update({ is_active: false })
    .eq('id', goalId);

  if (error) {
    throw new Error(`Failed to delete shared goal: ${error.message}`);
  }
}

// ============================================
// TRANSACTION ASSIGNMENTS
// ============================================

/**
 * Assign a transaction to a household
 */
export async function assignTransaction(
  transactionId: string,
  householdId: string,
  options: {
    assignedTo?: string;
    isShared?: boolean;
    splitPercentage?: number;
    notes?: string;
  } = {}
): Promise<TransactionAssignment> {
  const { data, error } = await supabase
    .from('transaction_assignments')
    .insert({
      transaction_id: transactionId,
      household_id: householdId,
      assigned_to: options.assignedTo || null,
      is_shared: options.isShared ?? true,
      split_percentage: options.splitPercentage ?? 100,
      notes: options.notes || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to assign transaction: ${error.message}`);
  }

  return data;
}

/**
 * Get household transactions
 */
export async function getHouseholdTransactions(
  householdId: string,
  startDate?: string,
  endDate?: string
): Promise<any[]> {
  let query = supabase
    .from('transaction_assignments')
    .select(`
      *,
      transaction:transactions(
        *,
        category:categories(*)
      ),
      assigned_to_user:users!assigned_to(display_name, avatar_url)
    `)
    .eq('household_id', householdId);

  if (startDate) {
    query = query.gte('transaction.transaction_date', startDate);
  }
  if (endDate) {
    query = query.lte('transaction.transaction_date', endDate);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch household transactions: ${error.message}`);
  }

  return data || [];
}

/**
 * Remove transaction from household
 */
export async function unassignTransaction(assignmentId: string): Promise<void> {
  const { error } = await supabase
    .from('transaction_assignments')
    .delete()
    .eq('id', assignmentId);

  if (error) {
    throw new Error(`Failed to unassign transaction: ${error.message}`);
  }
}

/**
 * Get household spending summary
 */
export async function getHouseholdSpendingSummary(
  householdId: string,
  startDate: string,
  endDate: string
): Promise<{
  total_spending: number;
  by_member: Array<{ user_id: string; display_name: string; amount: number }>;
  by_category: Array<{ category: Category | null; amount: number }>;
}> {
  const transactions = await getHouseholdTransactions(householdId, startDate, endDate);

  const totalSpending = transactions.reduce(
    (sum, t) => sum + (t.transaction?.amount || 0) * (t.split_percentage / 100),
    0
  );

  // Group by member
  const byMemberMap = new Map<string, { display_name: string; amount: number }>();
  for (const t of transactions) {
    if (t.assigned_to) {
      const existing = byMemberMap.get(t.assigned_to) || {
        display_name: t.assigned_to_user?.display_name || 'Unknown',
        amount: 0,
      };
      existing.amount += (t.transaction?.amount || 0) * (t.split_percentage / 100);
      byMemberMap.set(t.assigned_to, existing);
    }
  }

  // Group by category
  const byCategoryMap = new Map<string | null, { category: Category | null; amount: number }>();
  for (const t of transactions) {
    const categoryId = t.transaction?.category_id || null;
    const existing = byCategoryMap.get(categoryId) || {
      category: t.transaction?.category || null,
      amount: 0,
    };
    existing.amount += (t.transaction?.amount || 0) * (t.split_percentage / 100);
    byCategoryMap.set(categoryId, existing);
  }

  return {
    total_spending: totalSpending,
    by_member: Array.from(byMemberMap.entries()).map(([user_id, data]) => ({
      user_id,
      ...data,
    })),
    by_category: Array.from(byCategoryMap.values()),
  };
}
