/**
 * Investment Store
 * Manages investment holdings, portfolio data, and performance tracking
 */

import { create } from 'zustand';
import { logger } from '@/utils/logger';
import * as investmentService from '@/services/investments';
import type {
  InvestmentHoldingWithPerformance,
  CryptoHoldingWithPerformance,
  InvestmentTransaction,
  PortfolioSummary,
  PortfolioPerformance,
  CreateHoldingInput,
  UpdateHoldingInput,
  CreateCryptoHoldingInput,
  RecordTransactionInput,
  InvestmentType,
} from '@/types';

interface InvestmentState {
  // State
  holdings: InvestmentHoldingWithPerformance[];
  cryptoHoldings: CryptoHoldingWithPerformance[];
  transactions: InvestmentTransaction[];
  portfolioSummary: PortfolioSummary | null;
  performance: PortfolioPerformance | null;
  selectedPeriod: PortfolioPerformance['period'];
  selectedHolding: InvestmentHoldingWithPerformance | null;
  filterType: InvestmentType | null;
  isLoading: boolean;
  isUpdatingPrices: boolean;
  error: string | null;

  // Actions
  fetchHoldings: (options?: { investmentType?: InvestmentType }) => Promise<void>;
  fetchCryptoHoldings: () => Promise<void>;
  fetchTransactions: (options?: { holdingId?: string; limit?: number }) => Promise<void>;
  fetchPortfolioSummary: () => Promise<void>;
  fetchPerformance: (period?: PortfolioPerformance['period']) => Promise<void>;
  fetchAll: () => Promise<void>;

  createHolding: (input: CreateHoldingInput) => Promise<void>;
  updateHolding: (id: string, updates: UpdateHoldingInput) => Promise<void>;
  deleteHolding: (id: string) => Promise<void>;

  createCryptoHolding: (input: CreateCryptoHoldingInput) => Promise<void>;
  updateCryptoHolding: (id: string, updates: Partial<any>) => Promise<void>;
  deleteCryptoHolding: (id: string) => Promise<void>;

  recordTransaction: (input: RecordTransactionInput) => Promise<void>;
  updatePrices: () => Promise<void>;
  updateHoldingPrice: (id: string, price: number) => Promise<void>;
  createSnapshot: (notes?: string) => Promise<void>;

  selectHolding: (holding: InvestmentHoldingWithPerformance | null) => void;
  setSelectedPeriod: (period: PortfolioPerformance['period']) => void;
  setFilterType: (type: InvestmentType | null) => void;
  clearError: () => void;
}

export const useInvestmentStore = create<InvestmentState>((set, get) => ({
  // Initial state
  holdings: [],
  cryptoHoldings: [],
  transactions: [],
  portfolioSummary: null,
  performance: null,
  selectedPeriod: '1M',
  selectedHolding: null,
  filterType: null,
  isLoading: false,
  isUpdatingPrices: false,
  error: null,

  // Fetch all holdings
  fetchHoldings: async (options = {}) => {
    try {
      set({ isLoading: true, error: null });

      const holdings = await investmentService.getHoldings({
        investmentType: options.investmentType || get().filterType || undefined,
      });

      set({ holdings, isLoading: false });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
    }
  },

  // Fetch crypto holdings
  fetchCryptoHoldings: async () => {
    try {
      set({ isLoading: true, error: null });

      const cryptoHoldings = await investmentService.getCryptoHoldings();

      set({ cryptoHoldings, isLoading: false });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
    }
  },

  // Fetch transactions
  fetchTransactions: async (options = {}) => {
    try {
      set({ isLoading: true, error: null });

      const transactions = await investmentService.getTransactions({
        holdingId: options.holdingId,
        limit: options.limit || 50,
      });

      set({ transactions, isLoading: false });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
    }
  },

  // Fetch portfolio summary
  fetchPortfolioSummary: async () => {
    try {
      const portfolioSummary = await investmentService.getPortfolioSummary();
      set({ portfolioSummary });
    } catch (error) {
      logger.investment.error('Failed to fetch portfolio summary:', error);
    }
  },

  // Fetch performance data
  fetchPerformance: async (period) => {
    try {
      const selectedPeriod = period || get().selectedPeriod;
      const performance = await investmentService.getPerformance(selectedPeriod);
      set({ performance, selectedPeriod });
    } catch (error) {
      logger.investment.error('Failed to fetch performance:', error);
    }
  },

  // Fetch all investment data
  fetchAll: async () => {
    try {
      set({ isLoading: true, error: null });

      await Promise.all([
        get().fetchHoldings(),
        get().fetchCryptoHoldings(),
        get().fetchPortfolioSummary(),
        get().fetchPerformance(),
      ]);

      set({ isLoading: false });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
    }
  },

  // Create a new holding
  createHolding: async (input) => {
    try {
      set({ isLoading: true, error: null });

      await investmentService.createHolding(input);

      // Refresh data
      await get().fetchHoldings();
      await get().fetchPortfolioSummary();

      set({ isLoading: false });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
      throw error;
    }
  },

  // Update a holding
  updateHolding: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });

      await investmentService.updateHolding(id, updates);

      // Update in local state
      set((state) => ({
        holdings: state.holdings.map((h) =>
          h.id === id ? { ...h, ...updates } : h
        ),
        isLoading: false,
      }));

      await get().fetchPortfolioSummary();
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete a holding
  deleteHolding: async (id) => {
    try {
      set({ isLoading: true, error: null });

      await investmentService.deleteHolding(id);

      set((state) => ({
        holdings: state.holdings.filter((h) => h.id !== id),
        selectedHolding: state.selectedHolding?.id === id ? null : state.selectedHolding,
        isLoading: false,
      }));

      await get().fetchPortfolioSummary();
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
      throw error;
    }
  },

  // Create a crypto holding
  createCryptoHolding: async (input) => {
    try {
      set({ isLoading: true, error: null });

      await investmentService.createCryptoHolding(input);

      await get().fetchCryptoHoldings();
      await get().fetchPortfolioSummary();

      set({ isLoading: false });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
      throw error;
    }
  },

  // Update a crypto holding
  updateCryptoHolding: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });

      await investmentService.updateCryptoHolding(id, updates);

      set((state) => ({
        cryptoHoldings: state.cryptoHoldings.map((h) =>
          h.id === id ? { ...h, ...updates } : h
        ),
        isLoading: false,
      }));

      await get().fetchPortfolioSummary();
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete a crypto holding
  deleteCryptoHolding: async (id) => {
    try {
      set({ isLoading: true, error: null });

      await investmentService.deleteCryptoHolding(id);

      set((state) => ({
        cryptoHoldings: state.cryptoHoldings.filter((h) => h.id !== id),
        isLoading: false,
      }));

      await get().fetchPortfolioSummary();
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
      throw error;
    }
  },

  // Record a transaction
  recordTransaction: async (input) => {
    try {
      set({ isLoading: true, error: null });

      await investmentService.recordTransaction(input);

      // Refresh affected data
      await get().fetchTransactions({ holdingId: input.holding_id });
      if (input.holding_id) {
        await get().fetchHoldings();
      }

      set({ isLoading: false });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
      throw error;
    }
  },

  // Update all prices
  updatePrices: async () => {
    try {
      set({ isUpdatingPrices: true, error: null });

      await investmentService.updatePrices();

      // Refresh holdings with new prices
      await get().fetchHoldings();
      await get().fetchCryptoHoldings();
      await get().fetchPortfolioSummary();

      set({ isUpdatingPrices: false });
    } catch (error) {
      set({
        error: (error as Error).message,
        isUpdatingPrices: false,
      });
      throw error;
    }
  },

  // Update a single holding's price
  updateHoldingPrice: async (id, price) => {
    try {
      const updated = await investmentService.updateHoldingPrice(id, price);

      set((state) => ({
        holdings: state.holdings.map((h) =>
          h.id === id
            ? {
                ...h,
                current_price: updated.current_price,
                current_value: updated.current_value,
                last_price_update: updated.last_price_update,
              }
            : h
        ),
      }));

      await get().fetchPortfolioSummary();
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // Create a portfolio snapshot
  createSnapshot: async (notes) => {
    try {
      set({ isLoading: true, error: null });

      await investmentService.createSnapshot(notes);

      set({ isLoading: false });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
      throw error;
    }
  },

  // Select a holding for detail view
  selectHolding: (holding) => {
    set({ selectedHolding: holding });
  },

  // Set selected period for performance chart
  setSelectedPeriod: (period) => {
    set({ selectedPeriod: period });
    get().fetchPerformance(period);
  },

  // Set filter type
  setFilterType: (type) => {
    set({ filterType: type });
    get().fetchHoldings({ investmentType: type || undefined });
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

// Selector hooks for common derived state
export const usePortfolioValue = () =>
  useInvestmentStore((state) => state.portfolioSummary?.total_value ?? 0);

export const usePortfolioGain = () =>
  useInvestmentStore((state) => ({
    absolute: state.portfolioSummary?.total_gain ?? 0,
    percentage: state.portfolioSummary?.total_gain_percentage ?? 0,
  }));

export const useHoldingsCount = () =>
  useInvestmentStore((state) => state.holdings.length + state.cryptoHoldings.length);

export const useTopHoldings = (limit = 5) =>
  useInvestmentStore((state) =>
    [...state.holdings]
      .sort((a, b) => (b.current_value || 0) - (a.current_value || 0))
      .slice(0, limit)
  );

export const useAllocationByType = () =>
  useInvestmentStore((state) => state.portfolioSummary?.allocation_by_type ?? {});
