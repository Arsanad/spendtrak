/**
 * Investment Store Tests
 */

import { act } from '@testing-library/react-native';
import { useInvestmentStore, usePortfolioValue, usePortfolioGain, useHoldingsCount } from '../investmentStore';
import * as investmentService from '@/services/investments';

// Mock investment service
jest.mock('@/services/investments', () => ({
  getHoldings: jest.fn(),
  getCryptoHoldings: jest.fn(),
  getTransactions: jest.fn(),
  getPortfolioSummary: jest.fn(),
  getPerformance: jest.fn(),
  createHolding: jest.fn(),
  updateHolding: jest.fn(),
  deleteHolding: jest.fn(),
  createCryptoHolding: jest.fn(),
  updateCryptoHolding: jest.fn(),
  deleteCryptoHolding: jest.fn(),
  recordTransaction: jest.fn(),
  updatePrices: jest.fn(),
  updateHoldingPrice: jest.fn(),
  createSnapshot: jest.fn(),
}));

const mockHoldings = [
  {
    id: 'holding-1',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    quantity: 10,
    purchase_price: 150,
    current_price: 175,
    current_value: 1750,
    total_gain: 250,
    gain_percentage: 16.67,
    investment_type: 'stock' as const,
  },
  {
    id: 'holding-2',
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    quantity: 5,
    purchase_price: 2500,
    current_price: 2800,
    current_value: 14000,
    total_gain: 1500,
    gain_percentage: 12.0,
    investment_type: 'stock' as const,
  },
];

const mockCryptoHoldings = [
  {
    id: 'crypto-1',
    symbol: 'BTC',
    name: 'Bitcoin',
    quantity: 0.5,
    purchase_price: 30000,
    current_price: 42000,
    current_value: 21000,
    total_gain: 6000,
    gain_percentage: 40.0,
  },
];

const mockPortfolioSummary = {
  total_value: 36750,
  total_cost: 29250,
  total_gain: 7500,
  total_gain_percentage: 25.64,
  allocation_by_type: {
    stock: 15750,
    crypto: 21000,
  },
};

describe('Investment Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useInvestmentStore.setState({
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
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useInvestmentStore.getState();

      expect(state.holdings).toEqual([]);
      expect(state.cryptoHoldings).toEqual([]);
      expect(state.portfolioSummary).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('fetchHoldings', () => {
    it('should fetch holdings successfully', async () => {
      (investmentService.getHoldings as jest.Mock).mockResolvedValue(mockHoldings);

      await act(async () => {
        await useInvestmentStore.getState().fetchHoldings();
      });

      const state = useInvestmentStore.getState();
      expect(state.holdings).toEqual(mockHoldings);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle fetch error', async () => {
      (investmentService.getHoldings as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await act(async () => {
        await useInvestmentStore.getState().fetchHoldings();
      });

      const state = useInvestmentStore.getState();
      expect(state.error).toBe('Network error');
      expect(state.isLoading).toBe(false);
    });

    it('should filter by investment type', async () => {
      (investmentService.getHoldings as jest.Mock).mockResolvedValue([mockHoldings[0]]);

      await act(async () => {
        await useInvestmentStore.getState().fetchHoldings({ investmentType: 'stock' });
      });

      expect(investmentService.getHoldings).toHaveBeenCalledWith({
        investmentType: 'stock',
      });
    });
  });

  describe('fetchCryptoHoldings', () => {
    it('should fetch crypto holdings successfully', async () => {
      (investmentService.getCryptoHoldings as jest.Mock).mockResolvedValue(mockCryptoHoldings);

      await act(async () => {
        await useInvestmentStore.getState().fetchCryptoHoldings();
      });

      const state = useInvestmentStore.getState();
      expect(state.cryptoHoldings).toEqual(mockCryptoHoldings);
    });

    it('should handle fetch error', async () => {
      (investmentService.getCryptoHoldings as jest.Mock).mockRejectedValue(
        new Error('API error')
      );

      await act(async () => {
        await useInvestmentStore.getState().fetchCryptoHoldings();
      });

      const state = useInvestmentStore.getState();
      expect(state.error).toBe('API error');
    });
  });

  describe('fetchPortfolioSummary', () => {
    it('should fetch portfolio summary', async () => {
      (investmentService.getPortfolioSummary as jest.Mock).mockResolvedValue(mockPortfolioSummary);

      await act(async () => {
        await useInvestmentStore.getState().fetchPortfolioSummary();
      });

      const state = useInvestmentStore.getState();
      expect(state.portfolioSummary).toEqual(mockPortfolioSummary);
    });
  });

  describe('createHolding', () => {
    it('should create a new holding', async () => {
      (investmentService.createHolding as jest.Mock).mockResolvedValue(undefined);
      (investmentService.getHoldings as jest.Mock).mockResolvedValue(mockHoldings);
      (investmentService.getPortfolioSummary as jest.Mock).mockResolvedValue(mockPortfolioSummary);

      await act(async () => {
        await useInvestmentStore.getState().createHolding({
          symbol: 'TSLA',
          name: 'Tesla Inc.',
          quantity: 5,
          investment_type: 'stock',
        } as any);
      });

      expect(investmentService.createHolding).toHaveBeenCalled();
      expect(investmentService.getHoldings).toHaveBeenCalled();
      expect(investmentService.getPortfolioSummary).toHaveBeenCalled();
    });

    it('should handle create error', async () => {
      (investmentService.createHolding as jest.Mock).mockRejectedValue(
        new Error('Create failed')
      );

      await expect(
        act(async () => {
          await useInvestmentStore.getState().createHolding({
            symbol: 'TSLA',
            name: 'Tesla Inc.',
            quantity: 5,
            investment_type: 'stock',
          } as any);
        })
      ).rejects.toThrow('Create failed');
    });
  });

  describe('updateHolding', () => {
    it('should update an existing holding', async () => {
      useInvestmentStore.setState({ holdings: mockHoldings as any });
      (investmentService.updateHolding as jest.Mock).mockResolvedValue(undefined);
      (investmentService.getPortfolioSummary as jest.Mock).mockResolvedValue(mockPortfolioSummary);

      await act(async () => {
        await useInvestmentStore.getState().updateHolding('holding-1', {
          quantity: 15,
        });
      });

      expect(investmentService.updateHolding).toHaveBeenCalledWith('holding-1', {
        quantity: 15,
      });

      const state = useInvestmentStore.getState();
      const updatedHolding = state.holdings.find((h) => h.id === 'holding-1');
      expect(updatedHolding?.quantity).toBe(15);
    });
  });

  describe('deleteHolding', () => {
    it('should delete a holding', async () => {
      useInvestmentStore.setState({ holdings: mockHoldings as any });
      (investmentService.deleteHolding as jest.Mock).mockResolvedValue(undefined);
      (investmentService.getPortfolioSummary as jest.Mock).mockResolvedValue(mockPortfolioSummary);

      await act(async () => {
        await useInvestmentStore.getState().deleteHolding('holding-1');
      });

      const state = useInvestmentStore.getState();
      expect(state.holdings.find((h) => h.id === 'holding-1')).toBeUndefined();
    });

    it('should clear selected holding if deleted', async () => {
      useInvestmentStore.setState({
        holdings: mockHoldings as any,
        selectedHolding: mockHoldings[0] as any,
      });
      (investmentService.deleteHolding as jest.Mock).mockResolvedValue(undefined);
      (investmentService.getPortfolioSummary as jest.Mock).mockResolvedValue(mockPortfolioSummary);

      await act(async () => {
        await useInvestmentStore.getState().deleteHolding('holding-1');
      });

      const state = useInvestmentStore.getState();
      expect(state.selectedHolding).toBeNull();
    });
  });

  describe('createCryptoHolding', () => {
    it('should create a crypto holding', async () => {
      (investmentService.createCryptoHolding as jest.Mock).mockResolvedValue(undefined);
      (investmentService.getCryptoHoldings as jest.Mock).mockResolvedValue(mockCryptoHoldings);
      (investmentService.getPortfolioSummary as jest.Mock).mockResolvedValue(mockPortfolioSummary);

      await act(async () => {
        await useInvestmentStore.getState().createCryptoHolding({
          symbol: 'ETH',
          name: 'Ethereum',
          quantity: 2,
        } as any);
      });

      expect(investmentService.createCryptoHolding).toHaveBeenCalled();
    });
  });

  describe('updateCryptoHolding', () => {
    it('should update a crypto holding', async () => {
      useInvestmentStore.setState({ cryptoHoldings: mockCryptoHoldings as any });
      (investmentService.updateCryptoHolding as jest.Mock).mockResolvedValue(undefined);
      (investmentService.getPortfolioSummary as jest.Mock).mockResolvedValue(mockPortfolioSummary);

      await act(async () => {
        await useInvestmentStore.getState().updateCryptoHolding('crypto-1', {
          quantity: 1,
        });
      });

      const state = useInvestmentStore.getState();
      const updated = state.cryptoHoldings.find((h) => h.id === 'crypto-1');
      expect(updated?.quantity).toBe(1);
    });
  });

  describe('deleteCryptoHolding', () => {
    it('should delete a crypto holding', async () => {
      useInvestmentStore.setState({ cryptoHoldings: mockCryptoHoldings as any });
      (investmentService.deleteCryptoHolding as jest.Mock).mockResolvedValue(undefined);
      (investmentService.getPortfolioSummary as jest.Mock).mockResolvedValue(mockPortfolioSummary);

      await act(async () => {
        await useInvestmentStore.getState().deleteCryptoHolding('crypto-1');
      });

      const state = useInvestmentStore.getState();
      expect(state.cryptoHoldings.length).toBe(0);
    });
  });

  describe('recordTransaction', () => {
    it('should record a transaction', async () => {
      (investmentService.recordTransaction as jest.Mock).mockResolvedValue(undefined);
      (investmentService.getTransactions as jest.Mock).mockResolvedValue([]);
      (investmentService.getHoldings as jest.Mock).mockResolvedValue(mockHoldings);

      await act(async () => {
        await useInvestmentStore.getState().recordTransaction({
          holding_id: 'holding-1',
          transaction_type: 'buy',
          quantity: 5,
          price: 180,
          transaction_date: '2024-01-15',
        } as any);
      });

      expect(investmentService.recordTransaction).toHaveBeenCalled();
      expect(investmentService.getTransactions).toHaveBeenCalled();
      expect(investmentService.getHoldings).toHaveBeenCalled();
    });
  });

  describe('updatePrices', () => {
    it('should update all prices', async () => {
      (investmentService.updatePrices as jest.Mock).mockResolvedValue(undefined);
      (investmentService.getHoldings as jest.Mock).mockResolvedValue(mockHoldings);
      (investmentService.getCryptoHoldings as jest.Mock).mockResolvedValue(mockCryptoHoldings);
      (investmentService.getPortfolioSummary as jest.Mock).mockResolvedValue(mockPortfolioSummary);

      await act(async () => {
        await useInvestmentStore.getState().updatePrices();
      });

      expect(investmentService.updatePrices).toHaveBeenCalled();

      const state = useInvestmentStore.getState();
      expect(state.isUpdatingPrices).toBe(false);
    });

    it('should handle price update error', async () => {
      (investmentService.updatePrices as jest.Mock).mockRejectedValue(
        new Error('Price update failed')
      );

      await expect(
        act(async () => {
          await useInvestmentStore.getState().updatePrices();
        })
      ).rejects.toThrow('Price update failed');

      const state = useInvestmentStore.getState();
      expect(state.isUpdatingPrices).toBe(false);
      expect(state.error).toBe('Price update failed');
    });
  });

  describe('updateHoldingPrice', () => {
    it('should update a single holding price', async () => {
      useInvestmentStore.setState({ holdings: mockHoldings as any });
      (investmentService.updateHoldingPrice as jest.Mock).mockResolvedValue({
        current_price: 200,
        current_value: 2000,
        last_price_update: new Date().toISOString(),
      });
      (investmentService.getPortfolioSummary as jest.Mock).mockResolvedValue(mockPortfolioSummary);

      await act(async () => {
        await useInvestmentStore.getState().updateHoldingPrice('holding-1', 200);
      });

      const state = useInvestmentStore.getState();
      const updated = state.holdings.find((h) => h.id === 'holding-1');
      expect(updated?.current_price).toBe(200);
    });
  });

  describe('selectHolding', () => {
    it('should select a holding', () => {
      act(() => {
        useInvestmentStore.getState().selectHolding(mockHoldings[0] as any);
      });

      const state = useInvestmentStore.getState();
      expect(state.selectedHolding).toEqual(mockHoldings[0]);
    });

    it('should clear selection', () => {
      useInvestmentStore.setState({ selectedHolding: mockHoldings[0] as any });

      act(() => {
        useInvestmentStore.getState().selectHolding(null);
      });

      const state = useInvestmentStore.getState();
      expect(state.selectedHolding).toBeNull();
    });
  });

  describe('setSelectedPeriod', () => {
    it('should set period and fetch performance', async () => {
      (investmentService.getPerformance as jest.Mock).mockResolvedValue({
        period: '3M',
        data: [],
      });

      await act(async () => {
        useInvestmentStore.getState().setSelectedPeriod('3M');
      });

      const state = useInvestmentStore.getState();
      expect(state.selectedPeriod).toBe('3M');
      expect(investmentService.getPerformance).toHaveBeenCalledWith('3M');
    });
  });

  describe('setFilterType', () => {
    it('should set filter type and fetch filtered holdings', async () => {
      (investmentService.getHoldings as jest.Mock).mockResolvedValue([mockHoldings[0]]);

      await act(async () => {
        useInvestmentStore.getState().setFilterType('stock');
      });

      const state = useInvestmentStore.getState();
      expect(state.filterType).toBe('stock');
    });

    it('should clear filter when null', async () => {
      useInvestmentStore.setState({ filterType: 'stock' });
      (investmentService.getHoldings as jest.Mock).mockResolvedValue(mockHoldings);

      await act(async () => {
        useInvestmentStore.getState().setFilterType(null);
      });

      const state = useInvestmentStore.getState();
      expect(state.filterType).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      useInvestmentStore.setState({ error: 'Some error' });

      act(() => {
        useInvestmentStore.getState().clearError();
      });

      expect(useInvestmentStore.getState().error).toBeNull();
    });
  });

  describe('fetchAll', () => {
    it('should fetch all investment data', async () => {
      (investmentService.getHoldings as jest.Mock).mockResolvedValue(mockHoldings);
      (investmentService.getCryptoHoldings as jest.Mock).mockResolvedValue(mockCryptoHoldings);
      (investmentService.getPortfolioSummary as jest.Mock).mockResolvedValue(mockPortfolioSummary);
      (investmentService.getPerformance as jest.Mock).mockResolvedValue({
        period: '1M',
        data: [],
      });

      await act(async () => {
        await useInvestmentStore.getState().fetchAll();
      });

      expect(investmentService.getHoldings).toHaveBeenCalled();
      expect(investmentService.getCryptoHoldings).toHaveBeenCalled();
      expect(investmentService.getPortfolioSummary).toHaveBeenCalled();
      expect(investmentService.getPerformance).toHaveBeenCalled();
    });
  });
});
