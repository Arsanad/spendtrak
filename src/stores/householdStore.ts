/**
 * Household Store
 * Zustand store for partner/spouse sharing state management
 * Uses local storage (devStorage) for offline-first functionality
 */

import { create } from 'zustand';
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
  SharedBudgetWithCategory,
  SharedGoal,
  SharedGoalWithContributions,
} from '@/types';
import {
  getDevHouseholds,
  getDevHousehold,
  saveDevHousehold,
  updateDevHousehold,
  deleteDevHousehold,
  getDevHouseholdMembers,
  saveDevHouseholdMember,
  deleteDevHouseholdMember,
  getDevMyMembership,
  type DevHousehold,
  type DevHouseholdMember,
} from '@/services/devStorage';
import * as householdService from '@/services/household';

interface HouseholdState {
  // Data
  households: Household[];
  currentHousehold: Household | null;
  members: HouseholdMemberWithUser[];
  myMembership: HouseholdMember | null;
  invitations: HouseholdInvitation[];
  myInvitations: HouseholdInvitation[];
  sharedBudgets: SharedBudgetWithCategory[];
  sharedGoals: SharedGoalWithContributions[];

  // UI state
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Household actions
  fetchHouseholds: () => Promise<void>;
  selectHousehold: (householdId: string | null) => Promise<void>;
  createHousehold: (data: Omit<HouseholdInsert, 'created_by'>) => Promise<Household>;
  updateHousehold: (householdId: string, updates: HouseholdUpdate) => Promise<void>;
  deleteHousehold: (householdId: string) => Promise<void>;
  leaveHousehold: (householdId: string) => Promise<void>;

  // Member actions
  fetchMembers: (householdId: string) => Promise<void>;
  updateMemberPermissions: (memberId: string, updates: HouseholdMemberUpdate) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;

  // Invitation actions
  inviteMember: (email: string, role?: HouseholdRole) => Promise<HouseholdInvitation>;
  fetchInvitations: () => Promise<void>;
  fetchMyInvitations: () => Promise<void>;
  acceptInvitation: (inviteCode: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
  cancelInvitation: (invitationId: string) => Promise<void>;

  // Shared budget actions
  fetchSharedBudgets: () => Promise<void>;
  createSharedBudget: (budget: Omit<SharedBudget, 'id' | 'created_at' | 'updated_at'>) => Promise<SharedBudget>;
  updateSharedBudget: (budgetId: string, updates: Partial<SharedBudget>) => Promise<void>;
  deleteSharedBudget: (budgetId: string) => Promise<void>;

  // Shared goal actions
  fetchSharedGoals: () => Promise<void>;
  createSharedGoal: (goal: Omit<SharedGoal, 'id' | 'created_at' | 'updated_at'>) => Promise<SharedGoal>;
  updateSharedGoal: (goalId: string, updates: Partial<SharedGoal>) => Promise<void>;
  addGoalContribution: (goalId: string, amount: number, notes?: string) => Promise<void>;
  deleteSharedGoal: (goalId: string) => Promise<void>;

  // General actions
  refreshAll: () => Promise<void>;
  clearError: () => void;
}

export const useHouseholdStore = create<HouseholdState>((set, get) => ({
  // Initial state
  households: [],
  currentHousehold: null,
  members: [],
  myMembership: null,
  invitations: [],
  myInvitations: [],
  sharedBudgets: [],
  sharedGoals: [],
  isLoading: false,
  isRefreshing: false,
  error: null,

  // Fetch all households (from local storage)
  fetchHouseholds: async () => {
    set({ isLoading: true, error: null });
    try {
      const devHouseholds = await getDevHouseholds();
      // Convert DevHousehold to Household type
      const households: Household[] = devHouseholds.map(h => ({
        id: h.id,
        name: h.name,
        currency: h.currency,
        settings: h.settings,
        is_active: h.is_active,
        created_by: h.created_by,
        created_at: h.created_at,
        updated_at: h.updated_at,
      }));
      set({ households, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch households',
        isLoading: false,
      });
    }
  },

  // Select a household (from local storage)
  selectHousehold: async (householdId) => {
    if (!householdId) {
      set({
        currentHousehold: null,
        members: [],
        myMembership: null,
        invitations: [],
        sharedBudgets: [],
        sharedGoals: [],
      });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const [devHousehold, devMembers, devMyMembership] = await Promise.all([
        getDevHousehold(householdId),
        getDevHouseholdMembers(householdId),
        getDevMyMembership(householdId),
      ]);

      if (!devHousehold) {
        throw new Error('Household not found');
      }

      // Convert to expected types
      const household: Household = {
        id: devHousehold.id,
        name: devHousehold.name,
        currency: devHousehold.currency,
        settings: devHousehold.settings,
        is_active: devHousehold.is_active,
        created_by: devHousehold.created_by,
        created_at: devHousehold.created_at,
        updated_at: devHousehold.updated_at,
      };

      const members: HouseholdMemberWithUser[] = devMembers.map(m => ({
        id: m.id,
        household_id: m.household_id,
        user_id: m.user_id,
        role: m.role,
        nickname: null,
        can_view_transactions: m.can_view_transactions,
        can_add_transactions: m.can_add_transactions,
        can_edit_budgets: m.can_edit_budgets,
        can_manage_members: m.can_manage_members,
        joined_at: m.joined_at,
        user: m.user ? {
          display_name: m.user.display_name,
          email: m.user.email,
          avatar_url: m.user.avatar_url || null,
        } : { display_name: null, email: '', avatar_url: null },
      }));

      const myMembership: HouseholdMember | null = devMyMembership ? {
        id: devMyMembership.id,
        household_id: devMyMembership.household_id,
        user_id: devMyMembership.user_id,
        role: devMyMembership.role,
        nickname: null,
        can_view_transactions: devMyMembership.can_view_transactions,
        can_add_transactions: devMyMembership.can_add_transactions,
        can_edit_budgets: devMyMembership.can_edit_budgets,
        can_manage_members: devMyMembership.can_manage_members,
        joined_at: devMyMembership.joined_at,
      } : null;

      set({
        currentHousehold: household,
        members,
        myMembership,
        invitations: [], // Local storage doesn't support invitations yet
        sharedBudgets: [], // Local storage doesn't support shared budgets yet
        sharedGoals: [], // Local storage doesn't support shared goals yet
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to select household',
        isLoading: false,
      });
    }
  },

  // Create household (using local storage)
  createHousehold: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const devHousehold = await saveDevHousehold({
        name: data.name,
        currency: data.currency || 'USD',
        settings: data.settings || {},
        is_active: data.is_active !== false,
        created_by: 'dev_user',
      });

      const newHousehold: Household = {
        id: devHousehold.id,
        name: devHousehold.name,
        currency: devHousehold.currency,
        settings: devHousehold.settings,
        is_active: devHousehold.is_active,
        created_by: devHousehold.created_by,
        created_at: devHousehold.created_at,
        updated_at: devHousehold.updated_at,
      };

      const { households } = get();
      set({
        households: [newHousehold, ...households],
        currentHousehold: newHousehold,
        isLoading: false,
      });

      // Fetch the members (should include the creator as owner)
      await get().fetchMembers(newHousehold.id);

      return newHousehold;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create household',
        isLoading: false,
      });
      throw error;
    }
  },

  // Update household (using local storage)
  updateHousehold: async (householdId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const devHousehold = await updateDevHousehold(householdId, updates);
      const updatedHousehold: Household = {
        id: devHousehold.id,
        name: devHousehold.name,
        currency: devHousehold.currency,
        settings: devHousehold.settings,
        is_active: devHousehold.is_active,
        created_by: devHousehold.created_by,
        created_at: devHousehold.created_at,
        updated_at: devHousehold.updated_at,
      };
      const { households, currentHousehold } = get();
      set({
        households: households.map(h => h.id === householdId ? updatedHousehold : h),
        currentHousehold: currentHousehold?.id === householdId ? updatedHousehold : currentHousehold,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update household',
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete household (using local storage)
  deleteHousehold: async (householdId) => {
    set({ isLoading: true, error: null });
    try {
      await deleteDevHousehold(householdId);
      const { households, currentHousehold } = get();
      set({
        households: households.filter(h => h.id !== householdId),
        currentHousehold: currentHousehold?.id === householdId ? null : currentHousehold,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete household',
        isLoading: false,
      });
      throw error;
    }
  },

  // Leave household (using local storage)
  leaveHousehold: async (householdId) => {
    set({ isLoading: true, error: null });
    try {
      // In local storage, we just delete the household since we're the only user
      await deleteDevHousehold(householdId);
      const { households, currentHousehold } = get();
      set({
        households: households.filter(h => h.id !== householdId),
        currentHousehold: currentHousehold?.id === householdId ? null : currentHousehold,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to leave household',
        isLoading: false,
      });
      throw error;
    }
  },

  // Fetch members (from local storage)
  fetchMembers: async (householdId) => {
    try {
      const [devMembers, devMyMembership] = await Promise.all([
        getDevHouseholdMembers(householdId),
        getDevMyMembership(householdId),
      ]);

      const members: HouseholdMemberWithUser[] = devMembers.map(m => ({
        id: m.id,
        household_id: m.household_id,
        user_id: m.user_id,
        role: m.role,
        nickname: null,
        can_view_transactions: m.can_view_transactions,
        can_add_transactions: m.can_add_transactions,
        can_edit_budgets: m.can_edit_budgets,
        can_manage_members: m.can_manage_members,
        joined_at: m.joined_at,
        user: m.user ? {
          display_name: m.user.display_name,
          email: m.user.email,
          avatar_url: m.user.avatar_url || null,
        } : { display_name: null, email: '', avatar_url: null },
      }));

      const myMembership: HouseholdMember | null = devMyMembership ? {
        id: devMyMembership.id,
        household_id: devMyMembership.household_id,
        user_id: devMyMembership.user_id,
        role: devMyMembership.role,
        nickname: null,
        can_view_transactions: devMyMembership.can_view_transactions,
        can_add_transactions: devMyMembership.can_add_transactions,
        can_edit_budgets: devMyMembership.can_edit_budgets,
        can_manage_members: devMyMembership.can_manage_members,
        joined_at: devMyMembership.joined_at,
      } : null;

      set({ members, myMembership });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch members',
      });
    }
  },

  // Update member permissions
  updateMemberPermissions: async (memberId, updates) => {
    set({ isLoading: true, error: null });
    try {
      await householdService.updateMemberPermissions(memberId, updates);
      const { currentHousehold } = get();
      if (currentHousehold) {
        await get().fetchMembers(currentHousehold.id);
      }
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update member',
        isLoading: false,
      });
      throw error;
    }
  },

  // Remove member (from local storage)
  removeMember: async (memberId) => {
    set({ isLoading: true, error: null });
    try {
      await deleteDevHouseholdMember(memberId);
      const { members } = get();
      set({
        members: members.filter(m => m.id !== memberId),
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to remove member',
        isLoading: false,
      });
      throw error;
    }
  },

  // Invite member
  inviteMember: async (email, role = 'member') => {
    const { currentHousehold } = get();
    if (!currentHousehold) {
      throw new Error('No household selected');
    }

    set({ isLoading: true, error: null });
    try {
      const invitation = await householdService.inviteToHousehold(currentHousehold.id, email, role);
      const { invitations } = get();
      set({
        invitations: [invitation, ...invitations],
        isLoading: false,
      });
      return invitation;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to send invitation',
        isLoading: false,
      });
      throw error;
    }
  },

  // Fetch household invitations
  fetchInvitations: async () => {
    const { currentHousehold } = get();
    if (!currentHousehold) return;

    try {
      const invitations = await householdService.getHouseholdInvitations(currentHousehold.id);
      set({ invitations });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch invitations',
      });
    }
  },

  // Fetch my invitations
  fetchMyInvitations: async () => {
    try {
      const myInvitations = await householdService.getMyInvitations();
      set({ myInvitations });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch invitations',
      });
    }
  },

  // Accept invitation
  acceptInvitation: async (inviteCode) => {
    set({ isLoading: true, error: null });
    try {
      await householdService.acceptInvitation(inviteCode);
      await get().fetchHouseholds();
      await get().fetchMyInvitations();
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to accept invitation',
        isLoading: false,
      });
      throw error;
    }
  },

  // Decline invitation
  declineInvitation: async (invitationId) => {
    set({ isLoading: true, error: null });
    try {
      await householdService.declineInvitation(invitationId);
      const { myInvitations } = get();
      set({
        myInvitations: myInvitations.filter(i => i.id !== invitationId),
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to decline invitation',
        isLoading: false,
      });
      throw error;
    }
  },

  // Cancel invitation
  cancelInvitation: async (invitationId) => {
    set({ isLoading: true, error: null });
    try {
      await householdService.cancelInvitation(invitationId);
      const { invitations } = get();
      set({
        invitations: invitations.filter(i => i.id !== invitationId),
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to cancel invitation',
        isLoading: false,
      });
      throw error;
    }
  },

  // Fetch shared budgets
  fetchSharedBudgets: async () => {
    const { currentHousehold } = get();
    if (!currentHousehold) return;

    try {
      const sharedBudgets = await householdService.getSharedBudgets(currentHousehold.id);
      set({ sharedBudgets });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch shared budgets',
      });
    }
  },

  // Create shared budget
  createSharedBudget: async (budget) => {
    const { currentHousehold } = get();
    if (!currentHousehold) {
      throw new Error('No household selected');
    }

    set({ isLoading: true, error: null });
    try {
      const newBudget = await householdService.createSharedBudget({
        ...budget,
        household_id: currentHousehold.id,
      });
      await get().fetchSharedBudgets();
      set({ isLoading: false });
      return newBudget;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create shared budget',
        isLoading: false,
      });
      throw error;
    }
  },

  // Update shared budget
  updateSharedBudget: async (budgetId, updates) => {
    set({ isLoading: true, error: null });
    try {
      await householdService.updateSharedBudget(budgetId, updates);
      await get().fetchSharedBudgets();
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update shared budget',
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete shared budget
  deleteSharedBudget: async (budgetId) => {
    set({ isLoading: true, error: null });
    try {
      await householdService.deleteSharedBudget(budgetId);
      const { sharedBudgets } = get();
      set({
        sharedBudgets: sharedBudgets.filter(b => b.id !== budgetId),
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete shared budget',
        isLoading: false,
      });
      throw error;
    }
  },

  // Fetch shared goals
  fetchSharedGoals: async () => {
    const { currentHousehold } = get();
    if (!currentHousehold) return;

    try {
      const sharedGoals = await householdService.getSharedGoals(currentHousehold.id);
      set({ sharedGoals });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch shared goals',
      });
    }
  },

  // Create shared goal
  createSharedGoal: async (goal) => {
    const { currentHousehold } = get();
    if (!currentHousehold) {
      throw new Error('No household selected');
    }

    set({ isLoading: true, error: null });
    try {
      const newGoal = await householdService.createSharedGoal({
        ...goal,
        household_id: currentHousehold.id,
      });
      await get().fetchSharedGoals();
      set({ isLoading: false });
      return newGoal;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create shared goal',
        isLoading: false,
      });
      throw error;
    }
  },

  // Update shared goal
  updateSharedGoal: async (goalId, updates) => {
    set({ isLoading: true, error: null });
    try {
      await householdService.updateSharedGoal(goalId, updates);
      await get().fetchSharedGoals();
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update shared goal',
        isLoading: false,
      });
      throw error;
    }
  },

  // Add goal contribution
  addGoalContribution: async (goalId, amount, notes) => {
    set({ isLoading: true, error: null });
    try {
      await householdService.addGoalContribution(goalId, amount, notes);
      await get().fetchSharedGoals();
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to add contribution',
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete shared goal
  deleteSharedGoal: async (goalId) => {
    set({ isLoading: true, error: null });
    try {
      await householdService.deleteSharedGoal(goalId);
      const { sharedGoals } = get();
      set({
        sharedGoals: sharedGoals.filter(g => g.id !== goalId),
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete shared goal',
        isLoading: false,
      });
      throw error;
    }
  },

  // Refresh all
  refreshAll: async () => {
    const { currentHousehold } = get();
    if (!currentHousehold) return;

    set({ isRefreshing: true });
    try {
      await get().selectHousehold(currentHousehold.id);
      set({ isRefreshing: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to refresh data',
        isRefreshing: false,
      });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useHouseholdStore;
