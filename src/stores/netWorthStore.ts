/**
 * Net Worth Store
 * Zustand store for net worth tracking state management
 */

import { create } from 'zustand';
import type {
  Asset,
  AssetInsert,
  AssetUpdate,
  AssetType,
  Liability,
  LiabilityInsert,
  LiabilityUpdate,
  LiabilityType,
  NetWorthSnapshot,
  NetWorthSummary,
} from '@/types';
import * as netWorthService from '@/services/netWorth';
import { eventBus } from '@/services/eventBus';

interface NetWorthState {
  // Data
  assets: Asset[];
  liabilities: Liability[];
  summary: NetWorthSummary | null;
  history: NetWorthSnapshot[];
  selectedAsset: Asset | null;
  selectedLiability: Liability | null;

  // UI state
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Asset actions
  fetchAssets: () => Promise<void>;
  createAsset: (asset: Omit<AssetInsert, 'user_id'>) => Promise<Asset>;
  updateAsset: (assetId: string, updates: AssetUpdate) => Promise<void>;
  deleteAsset: (assetId: string) => Promise<void>;
  selectAsset: (asset: Asset | null) => void;

  // Liability actions
  fetchLiabilities: () => Promise<void>;
  createLiability: (liability: Omit<LiabilityInsert, 'user_id'>) => Promise<Liability>;
  updateLiability: (liabilityId: string, updates: LiabilityUpdate) => Promise<void>;
  deleteLiability: (liabilityId: string) => Promise<void>;
  selectLiability: (liability: Liability | null) => void;

  // Net worth actions
  calculateNetWorth: () => Promise<void>;
  createSnapshot: (notes?: string) => Promise<void>;
  fetchHistory: (months?: number) => Promise<void>;

  // General actions
  refreshAll: () => Promise<void>;
  clearError: () => void;
}

export const useNetWorthStore = create<NetWorthState>((set, get) => ({
  // Initial state
  assets: [],
  liabilities: [],
  summary: null,
  history: [],
  selectedAsset: null,
  selectedLiability: null,
  isLoading: false,
  isRefreshing: false,
  error: null,

  // Fetch all assets
  fetchAssets: async () => {
    set({ isLoading: true, error: null });
    try {
      const assets = await netWorthService.getAssets(true);
      set({ assets, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch assets',
        isLoading: false,
      });
    }
  },

  // Create asset
  createAsset: async (asset) => {
    set({ isLoading: true, error: null });
    try {
      const newAsset = await netWorthService.createAsset(asset);
      const { assets } = get();
      set({
        assets: [newAsset, ...assets],
        isLoading: false,
      });
      get().calculateNetWorth();

      // Emit event for Quantum Alive Experience
      eventBus.emit('asset:created', { name: newAsset.name || 'Asset', value: Number(newAsset.current_value) || 0 });

      return newAsset;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create asset',
        isLoading: false,
      });
      throw error;
    }
  },

  // Update asset
  updateAsset: async (assetId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const updatedAsset = await netWorthService.updateAsset(assetId, updates);
      const { assets, selectedAsset } = get();
      set({
        assets: assets.map(a => a.id === assetId ? updatedAsset : a),
        selectedAsset: selectedAsset?.id === assetId ? updatedAsset : selectedAsset,
        isLoading: false,
      });
      get().calculateNetWorth();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update asset',
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete asset
  deleteAsset: async (assetId) => {
    set({ isLoading: true, error: null });
    try {
      await netWorthService.deleteAsset(assetId);
      const { assets, selectedAsset } = get();
      set({
        assets: assets.filter(a => a.id !== assetId),
        selectedAsset: selectedAsset?.id === assetId ? null : selectedAsset,
        isLoading: false,
      });
      get().calculateNetWorth();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete asset',
        isLoading: false,
      });
      throw error;
    }
  },

  // Select asset
  selectAsset: (asset) => set({ selectedAsset: asset }),

  // Fetch all liabilities
  fetchLiabilities: async () => {
    set({ isLoading: true, error: null });
    try {
      const liabilities = await netWorthService.getLiabilities(true);
      set({ liabilities, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch liabilities',
        isLoading: false,
      });
    }
  },

  // Create liability
  createLiability: async (liability) => {
    set({ isLoading: true, error: null });
    try {
      const newLiability = await netWorthService.createLiability(liability);
      const { liabilities } = get();
      set({
        liabilities: [newLiability, ...liabilities],
        isLoading: false,
      });
      get().calculateNetWorth();

      // Emit event for Quantum Alive Experience
      eventBus.emit('liability:created', { name: newLiability.name || 'Liability', value: Number(newLiability.current_value) || 0 });

      return newLiability;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create liability',
        isLoading: false,
      });
      throw error;
    }
  },

  // Update liability
  updateLiability: async (liabilityId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const updatedLiability = await netWorthService.updateLiability(liabilityId, updates);
      const { liabilities, selectedLiability } = get();
      set({
        liabilities: liabilities.map(l => l.id === liabilityId ? updatedLiability : l),
        selectedLiability: selectedLiability?.id === liabilityId ? updatedLiability : selectedLiability,
        isLoading: false,
      });
      get().calculateNetWorth();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update liability',
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete liability
  deleteLiability: async (liabilityId) => {
    set({ isLoading: true, error: null });
    try {
      await netWorthService.deleteLiability(liabilityId);
      const { liabilities, selectedLiability } = get();
      set({
        liabilities: liabilities.filter(l => l.id !== liabilityId),
        selectedLiability: selectedLiability?.id === liabilityId ? null : selectedLiability,
        isLoading: false,
      });
      get().calculateNetWorth();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete liability',
        isLoading: false,
      });
      throw error;
    }
  },

  // Select liability
  selectLiability: (liability) => set({ selectedLiability: liability }),

  // Calculate net worth
  calculateNetWorth: async () => {
    try {
      const summary = await netWorthService.calculateNetWorth();
      set({ summary });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to calculate net worth',
      });
    }
  },

  // Create snapshot
  createSnapshot: async (notes) => {
    set({ isLoading: true, error: null });
    try {
      await netWorthService.createNetWorthSnapshot(notes);
      await get().fetchHistory();
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create snapshot',
        isLoading: false,
      });
    }
  },

  // Fetch history
  fetchHistory: async (months = 12) => {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      const history = await netWorthService.getNetWorthHistory(
        startDate.toISOString().split('T')[0]
      );
      set({ history });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch history',
      });
    }
  },

  // Refresh all data
  refreshAll: async () => {
    set({ isRefreshing: true });
    try {
      const [assets, liabilities, summary] = await Promise.all([
        netWorthService.getAssets(true),
        netWorthService.getLiabilities(true),
        netWorthService.calculateNetWorth(),
      ]);

      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 12);
      const history = await netWorthService.getNetWorthHistory(
        startDate.toISOString().split('T')[0]
      );

      set({
        assets,
        liabilities,
        summary,
        history,
        isRefreshing: false,
      });
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

export default useNetWorthStore;
