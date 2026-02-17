/**
 * AI Service Tests
 */

import {
  getConversations,
  getConversation,
  createConversation,
  sendMessage,
  getFinancialHealthScore,
  getQuickInsights,
  archiveConversation,
} from '../ai';
import { supabase } from '../supabase';
import { mockUser, mockAIInsights } from '../../__mocks__/mockData';

// Mock supabase
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

// Mock fetch for OpenAI API calls
global.fetch = jest.fn();

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      openaiApiKey: 'test-api-key',
    },
  },
}));

const mockConversation = {
  id: 'conv-1',
  user_id: mockUser.id,
  title: 'Financial Advice',
  messages: [
    { role: 'user', content: 'How can I save money?', timestamp: '2024-01-15T10:00:00Z' },
    { role: 'assistant', content: 'Here are some tips...', timestamp: '2024-01-15T10:00:05Z' },
  ],
  context_snapshot: { monthly_spending: 2500 },
  is_archived: false,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:05Z',
};

describe('AI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('getConversations', () => {
    it('should return all non-archived conversations', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [mockConversation],
              error: null,
            }),
          }),
        }),
      });
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const result = await getConversations();

      expect(supabase.from).toHaveBeenCalledWith('ai_conversations');
      expect(result).toEqual([mockConversation]);
    });

    it('should return empty array when no conversations exist', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const result = await getConversations();

      expect(result).toEqual([]);
    });

    it('should throw error on database failure', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error'),
            }),
          }),
        }),
      });
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      await expect(getConversations()).rejects.toThrow('Database error');
    });
  });

  describe('getConversation', () => {
    it('should return single conversation by id', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockConversation,
              error: null,
            }),
          }),
        }),
      });
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const result = await getConversation('conv-1');

      expect(result).toEqual(mockConversation);
    });

    it('should throw error when conversation not found', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Not found'),
            }),
          }),
        }),
      });
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      await expect(getConversation('invalid-id')).rejects.toThrow('Not found');
    });
  });

  describe('createConversation', () => {
    it('should create new conversation for authenticated user', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
      });

      // Mock for getUserFinancialContext
      const mockFrom = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { ...mockConversation, id: 'new-conv-id' },
                error: null,
              }),
            }),
          }),
        });
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const result = await createConversation('Test Conversation');

      expect(result).toBeDefined();
      expect(result.id).toBe('new-conv-id');
    });

    it('should throw error when not authenticated', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
      });

      await expect(createConversation()).rejects.toThrow('Not authenticated');
    });
  });

  describe('sendMessage', () => {
    it('should throw error when not authenticated', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
      });

      await expect(
        sendMessage({ message: 'Hello', conversation_id: 'conv-1' })
      ).rejects.toThrow('Not authenticated');
    });

    it('should throw error when conversation not found', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
      });

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Conversation not found'),
            }),
          }),
        }),
      });
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      await expect(
        sendMessage({ message: 'Hello', conversation_id: 'invalid-id' })
      ).rejects.toThrow();
    });
  });

  describe('getFinancialHealthScore', () => {
    it('should throw error when not authenticated', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
      });

      await expect(getFinancialHealthScore()).rejects.toThrow('Not authenticated');
    });

    it('should return health score for authenticated user', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
      });

      // Mock all the queries
      const mockFrom = jest.fn().mockImplementation((table) => {
        if (table === 'transactions') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  gte: jest.fn().mockReturnValue({
                    lte: jest.fn().mockResolvedValue({
                      data: [{ amount: 100 }, { amount: 200 }],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'subscriptions') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        }
        if (table === 'budgets') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'financial_goals') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const result = await getFinancialHealthScore();

      expect(result).toHaveProperty('overall_score');
      expect(result).toHaveProperty('components');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('trend');
      expect(result).toHaveProperty('last_updated');
    });
  });

  describe('getQuickInsights', () => {
    it('should return empty array when not authenticated', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
      });

      const result = await getQuickInsights();

      expect(result).toEqual([]);
    });

    it('should return insights for authenticated user', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
      });

      const mockFrom = jest.fn().mockImplementation((table) => {
        if (table === 'transactions') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  gte: jest.fn().mockReturnValue({
                    order: jest.fn().mockReturnValue({
                      limit: jest.fn().mockResolvedValue({
                        data: [{ amount: 600, merchant_name: 'Big Store' }],
                        error: null,
                      }),
                    }),
                    lte: jest.fn().mockResolvedValue({
                      data: [{ amount: 100 }],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'subscriptions') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  lte: jest.fn().mockReturnValue({
                    gte: jest.fn().mockResolvedValue({
                      data: [],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const result = await getQuickInsights();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('archiveConversation', () => {
    it('should archive conversation by id', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      await expect(archiveConversation('conv-1')).resolves.not.toThrow();
      expect(supabase.from).toHaveBeenCalledWith('ai_conversations');
    });

    it('should throw error on archive failure', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: new Error('Archive failed'),
          }),
        }),
      });
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      await expect(archiveConversation('conv-1')).rejects.toThrow('Archive failed');
    });
  });
});
