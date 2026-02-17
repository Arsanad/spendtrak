/**
 * Email Import Service Tests
 * Tests for OAuth email connection and receipt import
 */

import { emailImportService } from '../emailImport';

// Mock supabase
jest.mock('../supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
    from: jest.fn(() => ({
      upsert: jest.fn().mockResolvedValue({ error: null }),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ error: null }),
      })),
    })),
  },
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    email: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
  },
}));

// Mock email providers
jest.mock('@/config/emailProviders', () => ({
  EMAIL_PROVIDERS: {
    gmail: {
      id: 'gmail',
      name: 'Gmail',
      icon: 'gmail',
      iconColor: '#EA4335',
      useOAuth: true,
    },
    outlook: {
      id: 'outlook',
      name: 'Outlook',
      icon: 'microsoft-outlook',
      iconColor: '#0078D4',
      useOAuth: true,
    },
    icloud: {
      id: 'icloud',
      name: 'iCloud Mail',
      icon: 'apple',
      iconColor: '#555555',
      useForwarding: true,
    },
  },
}));

describe('emailImportService', () => {
  const { supabase } = require('../supabase');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getConnectedEmails', () => {
    it('should return empty array when not authenticated', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const result = await emailImportService.getConnectedEmails();

      expect(result).toEqual([]);
    });

    it('should return list of connected emails', async () => {
      const mockConnections = [
        { id: '1', email: 'test@gmail.com', provider: 'gmail', created_at: '2026-01-01' },
        { id: '2', email: 'test@outlook.com', provider: 'outlook', created_at: '2026-01-02' },
      ];

      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn().mockResolvedValue({ data: mockConnections, error: null }),
          })),
        })),
      });

      const result = await emailImportService.getConnectedEmails();

      expect(result).toHaveLength(2);
      expect(result[0].auth_type).toBe('oauth');
      expect(result[1].auth_type).toBe('oauth');
    });

    it('should identify iCloud connections as forwarding type', async () => {
      const mockConnections = [
        { id: '1', email: 'receipts-123@spendtrak.app', provider: 'icloud', created_at: '2026-01-01' },
      ];

      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn().mockResolvedValue({ data: mockConnections, error: null }),
          })),
        })),
      });

      const result = await emailImportService.getConnectedEmails();

      expect(result).toHaveLength(1);
      expect(result[0].auth_type).toBe('forwarding');
    });
  });

  describe('disconnectEmail', () => {
    it('should disconnect email successfully', async () => {
      const result = await emailImportService.disconnectEmail('connection-id');

      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      supabase.from.mockReturnValueOnce({
        delete: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
        })),
      });

      const result = await emailImportService.disconnectEmail('connection-id');

      expect(result).toBe(false);
    });
  });

  describe('getProvider', () => {
    it('should return provider info by ID', () => {
      const provider = emailImportService.getProvider('gmail');

      expect(provider).toBeDefined();
      expect(provider?.name).toBe('Gmail');
    });

    it('should return undefined for unknown provider', () => {
      const provider = emailImportService.getProvider('unknown');

      expect(provider).toBeUndefined();
    });
  });

  describe('getAllProviders', () => {
    it('should return all available providers', () => {
      const providers = emailImportService.getAllProviders();

      expect(providers).toHaveLength(3);
      expect(providers.some(p => p.id === 'gmail')).toBe(true);
      expect(providers.some(p => p.id === 'outlook')).toBe(true);
      expect(providers.some(p => p.id === 'icloud')).toBe(true);
    });
  });
});
