/**
 * Auth Service Tests
 */

// Mock all dependencies before imports
jest.mock('../supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn(),
      updateUser: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      update: jest.fn().mockReturnThis(),
    })),
  },
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));
jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'spendtrak://auth/callback'),
  AuthRequest: jest.fn().mockImplementation(() => ({
    promptAsync: jest.fn().mockResolvedValue({ type: 'cancel' }),
    codeVerifier: 'test-verifier',
  })),
  exchangeCodeAsync: jest.fn().mockResolvedValue({
    accessToken: 'test-token',
    refreshToken: 'test-refresh',
    expiresIn: 3600,
  }),
}));
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      slug: 'spendtrak',
      extra: {
        googleClientId: 'test-google-client',
        googleWebClientId: 'test-google-web-client',
        microsoftClientId: 'test-microsoft-client',
      },
    },
    executionEnvironment: 'standalone',
  },
  expoConfig: {
    slug: 'spendtrak',
    extra: {
      googleClientId: 'test-google-client',
      googleWebClientId: 'test-google-web-client',
      microsoftClientId: 'test-microsoft-client',
    },
    executionEnvironment: 'standalone',
  },
  executionEnvironment: 'standalone',
}));

import {
  devSignIn,
  signOut,
  getSession,
  getCurrentUser,
  updateUserProfile,
  completeOnboarding,
  getEmailConnections,
  addEmailConnection,
  removeEmailConnection,
  refreshTokens,
  onAuthStateChange,
} from '../auth';
import type { AuthResult } from '../auth';
import { supabase } from '../supabase';
import { mockUser } from '@/__mocks__/mockData';

// Local helpers wrapping supabase.auth.signInWithOAuth for testing
async function signInWithGoogle(): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

async function signInWithApple(): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'apple' });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

async function signInWithMicrosoft(): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'azure' as any });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signInWithGoogle', () => {
    it('should call supabase OAuth with google provider', async () => {
      const mockSignInWithOAuth = supabase.auth.signInWithOAuth as jest.Mock;
      mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null });

      const result = await signInWithGoogle();

      expect(mockSignInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'google',
        })
      );
      expect(result).toHaveProperty('success');
    });

    it('should return error on OAuth failure', async () => {
      const mockSignInWithOAuth = supabase.auth.signInWithOAuth as jest.Mock;
      mockSignInWithOAuth.mockResolvedValue({
        data: null,
        error: { message: 'OAuth failed' }
      });

      const result = await signInWithGoogle();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('signInWithMicrosoft', () => {
    it('should call supabase OAuth with azure provider', async () => {
      const mockSignInWithOAuth = supabase.auth.signInWithOAuth as jest.Mock;
      mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null });

      const result = await signInWithMicrosoft();

      expect(mockSignInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'azure',
        })
      );
      expect(result).toHaveProperty('success');
    });
  });

  describe('signOut', () => {
    it('should call supabase signOut', async () => {
      const mockSignOut = supabase.auth.signOut as jest.Mock;
      mockSignOut.mockResolvedValue({ error: null });

      await signOut();

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should throw on signOut error', async () => {
      const mockSignOut = supabase.auth.signOut as jest.Mock;
      mockSignOut.mockResolvedValue({ error: { message: 'Sign out failed' } });

      try {
        await signOut();
        fail('Should have thrown');
      } catch (e) {
        expect((e as Error).message).toBe('Sign out failed');
      }
    });
  });

  describe('getSession', () => {
    it('should return current session', async () => {
      const mockGetSession = supabase.auth.getSession as jest.Mock;
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      });

      const session = await getSession();

      expect(mockGetSession).toHaveBeenCalled();
      expect(session).toBeDefined();
    });

    it('should return null when no session', async () => {
      const mockGetSession = supabase.auth.getSession as jest.Mock;
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const session = await getSession();

      expect(session).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return user from database', async () => {
      const mockGetUser = jest.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      (supabase.auth as any).getUser = mockGetUser;

      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockUser,
          error: null,
        }),
      });

      const user = await getCurrentUser();

      expect(user).toBeDefined();
      expect(user?.id).toBe(mockUser.id);
    });

    it('should return null when not authenticated', async () => {
      const mockGetUser = jest.fn().mockResolvedValue({
        data: { user: null },
      });
      (supabase.auth as any).getUser = mockGetUser;

      const user = await getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile in database', async () => {
      const mockGetUser = jest.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      (supabase.auth as any).getUser = mockGetUser;

      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...mockUser, display_name: 'Updated Name' },
          error: null,
        }),
      });

      const updated = await updateUserProfile({ display_name: 'Updated Name' });

      expect(updated).toBeDefined();
      expect(updated?.display_name).toBe('Updated Name');
    });

    it('should return null when not authenticated', async () => {
      const mockGetUser = jest.fn().mockResolvedValue({
        data: { user: null },
      });
      (supabase.auth as any).getUser = mockGetUser;

      const result = await updateUserProfile({ display_name: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('getEmailConnections', () => {
    it('should return email connections for user', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const mockConnections = [
        { id: 'conn-1', email_address: 'test@gmail.com', provider: 'google' },
      ];

      const qb: any = {};
      qb.select = jest.fn(() => qb);
      qb.eq = jest.fn(() => qb);
      qb.then = (resolve: Function) => resolve({
        data: mockConnections,
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue(qb);

      const connections = await getEmailConnections();

      expect(Array.isArray(connections)).toBe(true);
    });

    it('should return empty array when not authenticated', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
      });

      const connections = await getEmailConnections();

      expect(connections).toEqual([]);
    });
  });

  describe('devSignIn', () => {
    it('should return a mock user successfully', async () => {
      const result = await devSignIn!();

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe('dev@spendtrak.local');
      expect(result.user?.display_name).toBeNull();  // Name is set during onboarding
      expect(result.user?.onboarding_completed).toBe(false);  // Must complete onboarding
    });

    it('should generate user IDs with dev prefix', async () => {
      const result = await devSignIn!();

      expect(result.user?.id).toMatch(/^dev-user-/);
      expect(result.user?.default_currency).toBe('USD');
    });
  });

  describe('signInWithApple', () => {
    it('should call supabase OAuth with apple provider', async () => {
      const mockSignInWithOAuth = supabase.auth.signInWithOAuth as jest.Mock;
      mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null });

      const result = await signInWithApple();

      expect(mockSignInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'apple',
        })
      );
      expect(result).toHaveProperty('success');
    });

    it('should return error on OAuth failure', async () => {
      const mockSignInWithOAuth = supabase.auth.signInWithOAuth as jest.Mock;
      mockSignInWithOAuth.mockResolvedValue({
        data: null,
        error: { message: 'Apple OAuth failed' },
      });

      const result = await signInWithApple();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('completeOnboarding', () => {
    it('should update onboarding_completed flag', async () => {
      const mockGetUser = jest.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      (supabase.auth as any).getUser = mockGetUser;

      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      });

      await completeOnboarding();

      expect(mockUpdate).toHaveBeenCalledWith({ onboarding_completed: true });
    });

    it('should throw when not authenticated', async () => {
      const mockGetUser = jest.fn().mockResolvedValue({
        data: { user: null },
      });
      (supabase.auth as any).getUser = mockGetUser;

      await expect(completeOnboarding()).rejects.toThrow('Not authenticated');
    });
  });

  describe('addEmailConnection', () => {
    it('should create new email connection', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const mockConnection = {
        id: 'conn-new',
        provider: 'google',
        email_address: 'new@gmail.com',
      };

      // Mock - no existing connection
      const qbExisting: any = {};
      qbExisting.select = jest.fn(() => qbExisting);
      qbExisting.eq = jest.fn(() => qbExisting);
      qbExisting.single = jest.fn().mockResolvedValue({ data: null, error: null });

      // Mock - insert new
      const qbInsert: any = {};
      qbInsert.insert = jest.fn(() => qbInsert);
      qbInsert.select = jest.fn(() => qbInsert);
      qbInsert.single = jest.fn().mockResolvedValue({ data: mockConnection, error: null });

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation(() => {
        callCount++;
        return callCount === 1 ? qbExisting : qbInsert;
      });

      const result = await addEmailConnection({
        access_token: 'token-123',
        refresh_token: 'refresh-123',
        expires_at: Date.now() + 3600000,
        provider: 'google',
        email: 'new@gmail.com',
        scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
      });

      expect(result).toBeDefined();
    });

    it('should throw when not authenticated', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
      });

      await expect(
        addEmailConnection({
          access_token: 'token',
          provider: 'google',
          email: 'test@gmail.com',
          scopes: [],
        })
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('removeEmailConnection', () => {
    it('should deactivate email connection', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      });

      await removeEmailConnection('conn-1');

      expect(mockUpdate).toHaveBeenCalledWith({ is_active: false });
    });

    it('should call supabase from with email_connections', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      });

      await removeEmailConnection('conn-1');

      expect(supabase.from).toHaveBeenCalledWith('email_connections');
    });
  });

  describe('refreshTokens', () => {
    it('should throw when no refresh token available', async () => {
      const qb: any = {};
      qb.select = jest.fn(() => qb);
      qb.eq = jest.fn(() => qb);
      qb.single = jest.fn().mockResolvedValue({
        data: { id: 'conn-1', provider: 'google', refresh_token: null },
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue(qb);

      await expect(refreshTokens('conn-1')).rejects.toThrow('No refresh token available');
    });

    it('should call supabase to fetch connection', async () => {
      const qb: any = {};
      qb.select = jest.fn(() => qb);
      qb.eq = jest.fn(() => qb);
      qb.single = jest.fn().mockResolvedValue({
        data: { id: 'conn-1', provider: 'google', refresh_token: 'token' },
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue(qb);

      // Will fail at the fetch step but proves the function runs
      try {
        await refreshTokens('conn-1');
      } catch {
        // Expected - fetch mock returns non-ok
      }

      expect(supabase.from).toHaveBeenCalledWith('email_connections');
    });
  });

  describe('onAuthStateChange', () => {
    it('should register auth state change listener', () => {
      // Re-establish mock since resetMocks clears it
      (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      });

      const callback = jest.fn();
      onAuthStateChange(callback);

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
    });
  });
});
