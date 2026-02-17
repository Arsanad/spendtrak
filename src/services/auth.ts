/**
 * Authentication Service
 * Email/Password Auth + Session Management
 */

import { supabase } from './supabase';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import type { User, EmailConnection, UserUpdate } from '@/types';
import { getErrorMessage } from '@/utils/errors';
import { logger } from '@/utils/logger';

// Redirect URI for OAuth email connection callbacks
const redirectUri = 'spendtrak://auth/callback';

// Redirect URI for email verification and password reset deep links
const confirmRedirectUri = 'spendtrak://auth/confirm';

// OAuth client IDs (used for email connection features, not sign-in)
const GOOGLE_WEB_CLIENT_ID = Constants.expoConfig?.extra?.googleWebClientId || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const MICROSOFT_CLIENT_ID = Constants.expoConfig?.extra?.microsoftClientId || process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_ID;

/**
 * Validate fetch response and throw descriptive error if not OK
 */
async function validateFetchResponse(response: Response, context: string): Promise<void> {
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`${context} failed: ${response.status} - ${errorText}`);
  }
}

/**
 * Safe fetch with JSON parsing and validation
 */
async function safeFetchJson<T>(url: string, options: RequestInit, context: string): Promise<T> {
  const response = await fetch(url, options);
  await validateFetchResponse(response, context);

  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    throw new Error(`${context}: Expected JSON response but got ${contentType}`);
  }

  return response.json();
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface EmailTokens {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  provider: 'google' | 'microsoft';
  email: string;
  scopes: string[];
}

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Password strength requirements
 */
export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<AuthResult & { emailConfirmedAt?: string | null }> {
  try {
    if (__DEV__) console.log('[Auth] Email Sign-In started for:', email.substring(0, 3) + '***');

    // Validate email format
    if (!validateEmail(email)) {
      return { success: false, error: 'Invalid email address' };
    }

    // Validate password is not empty
    if (!password || password.length === 0) {
      return { success: false, error: 'Password is required' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.auth.error('Email sign in error:', error);
      return { success: false, error: error.message };
    }

    if (__DEV__) console.log('[Auth] Email sign in successful, session:', data.session ? 'present' : 'missing');

    if (!data.session) {
      return { success: false, error: 'No session returned from authentication' };
    }

    // Use the user ID from signInWithPassword directly instead of calling getUser() again
    const userId = data.session.user.id;
    const userEmail = data.session.user.email || email;
    if (__DEV__) console.log('[Auth] Fetching user profile from database for:', userId);

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    let user: User;
    if (profileError) {
      if (profileError.code === 'PGRST116') {
        // User not in database yet, create record
        if (__DEV__) console.log('[Auth] User not in database, creating record...');
        user = await createUserRecord(userId, userEmail);
      } else {
        throw profileError;
      }
    } else {
      user = profile;
    }

    if (__DEV__) console.log('[Auth] Sign in complete for user:', user.id);
    return {
      success: true,
      user,
      emailConfirmedAt: data.session.user.email_confirmed_at,
    };
  } catch (error: unknown) {
    logger.auth.error('Email sign in error:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    // Validate email format
    if (!validateEmail(email)) {
      return { success: false, error: 'Invalid email address' };
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return { success: false, error: passwordValidation.errors[0] };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: confirmRedirectUri,
      },
    });

    if (error) {
      logger.auth.error('Email sign up error:', error);
      return { success: false, error: error.message };
    }

    // Check if email confirmation is required
    if (data.user && !data.session) {
      return {
        success: true,
        user: undefined,
        error: 'Please check your email to confirm your account',
      };
    }

    if (!data.session) {
      return { success: false, error: 'No session returned from registration' };
    }

    const user = await getCurrentUser();
    if (user) {
      return { success: true, user };
    }

    return { success: false, error: 'Failed to retrieve user after registration' };
  } catch (error: unknown) {
    logger.auth.error('Email sign up error:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Request password reset email
 */
export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!validateEmail(email)) {
      return { success: false, error: 'Invalid email address' };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: confirmRedirectUri,
    });

    if (error) {
      logger.auth.error('Password reset error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: unknown) {
    logger.auth.error('Password reset error:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Dev sign in - bypasses OAuth AND database for development testing
 * Creates a mock user session without touching Supabase at all
 *
 * SECURITY: This function is ONLY defined in development builds.
 * In production, devSignIn is undefined and completely inaccessible.
 */
export const devSignIn: (() => Promise<AuthResult>) | undefined = __DEV__
  ? async (): Promise<AuthResult> => {
      try {
        // Create a mock user that doesn't require any Supabase operations
        // Use a fixed ID so data persists across sessions
        const mockUser: User = {
          id: 'dev-user-local-testing',
          email: 'dev@spendtrak.local',
          display_name: null,  // Will be set during onboarding
          avatar_url: null,
          default_currency: 'USD',
          language: 'en',
          timezone: 'UTC',
          onboarding_completed: true,  // Skip onboarding for dev users (no Supabase session to complete it)
          notification_preferences: {
            push_enabled: true,
            email_digest: false,
            alert_unusual_spending: true,
            alert_subscriptions: true,
            alert_budget: true,
            alert_bills: true,
            quiet_hours_start: null,
            quiet_hours_end: null,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        return { success: true, user: mockUser };
      } catch (error: unknown) {
        logger.auth.error('Dev sign in error:', error);
        return { success: false, error: getErrorMessage(error) };
      }
    }
  : undefined;

/**
 * Connect Google email for transaction syncing (separate from auth)
 */
export async function connectGoogleEmail(): Promise<EmailTokens | null> {
  try {
    const discovery = {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
    };

    const request = new AuthSession.AuthRequest({
      clientId: GOOGLE_WEB_CLIENT_ID,
      scopes: [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/gmail.readonly',
      ],
      redirectUri,
      usePKCE: true,
      extraParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    });

    const result = await request.promptAsync(discovery);

    if (result.type === 'success' && result.params.code) {
      // Exchange code for tokens
      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId: GOOGLE_WEB_CLIENT_ID,
          code: result.params.code,
          redirectUri,
          extraParams: {
            code_verifier: request.codeVerifier!,
          },
        },
        discovery
      );

      // Get user email with validated response
      const userInfo = await safeFetchJson<{ email: string }>(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        { headers: { Authorization: `Bearer ${tokenResponse.accessToken}` } },
        'Google user info fetch'
      );

      if (!userInfo.email) {
        throw new Error('No email returned from Google user info');
      }

      const tokens: EmailTokens = {
        access_token: tokenResponse.accessToken,
        refresh_token: tokenResponse.refreshToken,
        expires_at: tokenResponse.expiresIn
          ? Date.now() + tokenResponse.expiresIn * 1000
          : undefined,
        provider: 'google',
        email: userInfo.email,
        scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
      };

      // Save to database
      await addEmailConnection(tokens);

      return tokens;
    }

    return null;
  } catch (error) {
    logger.auth.error('Google email connection error:', error);
    return null;
  }
}

/**
 * Connect Microsoft email for transaction syncing
 */
export async function connectMicrosoftEmail(): Promise<EmailTokens | null> {
  try {
    const discovery = {
      authorizationEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    };

    const request = new AuthSession.AuthRequest({
      clientId: MICROSOFT_CLIENT_ID,
      scopes: [
        'openid',
        'email',
        'profile',
        'offline_access',
        'https://graph.microsoft.com/Mail.Read',
      ],
      redirectUri,
      usePKCE: true,
    });

    const result = await request.promptAsync(discovery);

    if (result.type === 'success' && result.params.code) {
      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId: MICROSOFT_CLIENT_ID,
          code: result.params.code,
          redirectUri,
          extraParams: {
            code_verifier: request.codeVerifier!,
          },
        },
        discovery
      );

      // Get user email with validated response
      const userInfo = await safeFetchJson<{ mail?: string; userPrincipalName?: string }>(
        'https://graph.microsoft.com/v1.0/me',
        { headers: { Authorization: `Bearer ${tokenResponse.accessToken}` } },
        'Microsoft user info fetch'
      );

      const email = userInfo.mail || userInfo.userPrincipalName;
      if (!email) {
        throw new Error('No email returned from Microsoft user info');
      }

      const tokens: EmailTokens = {
        access_token: tokenResponse.accessToken,
        refresh_token: tokenResponse.refreshToken,
        expires_at: tokenResponse.expiresIn
          ? Date.now() + tokenResponse.expiresIn * 1000
          : undefined,
        provider: 'microsoft',
        email,
        scopes: ['https://graph.microsoft.com/Mail.Read'],
      };

      // Save to database
      await addEmailConnection(tokens);

      return tokens;
    }

    return null;
  } catch (error) {
    logger.auth.error('Microsoft email connection error:', error);
    return null;
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get current session
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Get current user from database
 */
export async function getCurrentUser(): Promise<User | null> {
  if (__DEV__) console.log('[Auth] getCurrentUser called');
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    logger.auth.error('getUser error:', authError.message);
  }

  if (__DEV__) console.log('[Auth] Supabase auth user:', user ? user.id : 'null');

  if (!user) return null;

  if (__DEV__) console.log('[Auth] Fetching user profile from database for:', user.id);
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    if (__DEV__) console.log('[Auth] Database query error:', error.code, error.message);
    // User might not exist in our users table yet
    if (error.code === 'PGRST116') {
      // Create user record
      if (__DEV__) console.log('[Auth] User not in database, creating record...');
      const newUser = await createUserRecord(user.id, user.email || '');
      if (__DEV__) console.log('[Auth] User record created:', newUser?.id);
      return newUser;
    }
    throw error;
  }

  if (__DEV__) console.log('[Auth] User profile found:', data?.id);
  return data;
}

/**
 * Default notification preferences for new users
 */
const DEFAULT_NOTIFICATION_PREFERENCES = {
  push_enabled: true,
  email_digest: false,
  alert_unusual_spending: true,
  alert_subscriptions: true,
  alert_budget: true,
  alert_bills: true,
  quiet_hours_start: null,
  quiet_hours_end: null,
};

/**
 * Create user record in database
 * IMPORTANT: This requires an active Supabase session where auth.uid() matches userId
 *
 * @param userId - The Supabase auth user ID
 * @param email - User's email address
 * @param extraFields - Optional additional fields (e.g., display_name from Apple)
 */
export async function createUserRecord(
  userId: string,
  email: string,
  extraFields?: { display_name?: string | null }
): Promise<User> {
  if (__DEV__) console.log('[Auth] createUserRecord called with userId:', userId);

  // CRITICAL: Verify session is set and matches the userId we're inserting
  // RLS policy requires: auth.uid() = id
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    logger.auth.error('createUserRecord - session error:', sessionError.message);
    throw new Error(`Session error: ${sessionError.message}`);
  }

  if (!sessionData?.session) {
    logger.auth.error('createUserRecord - NO SESSION! Cannot insert user without session.');
    throw new Error('No active session - cannot create user record');
  }

  const sessionUserId = sessionData.session.user?.id;
  if (__DEV__) console.log('[Auth] createUserRecord - session user id:', sessionUserId);

  if (sessionUserId !== userId) {
    logger.auth.error('createUserRecord - USER ID MISMATCH!', {
      insertingId: userId,
      sessionUserId: sessionUserId,
    });
    throw new Error(`User ID mismatch: inserting ${userId} but session has ${sessionUserId}`);
  }

  if (__DEV__) console.log('[Auth] createUserRecord - session verified, inserting user...');

  const userData = {
    id: userId,
    email,
    default_currency: 'USD',
    language: 'en',
    timezone: 'UTC',
    onboarding_completed: false,
    notification_preferences: DEFAULT_NOTIFICATION_PREFERENCES,
    // Merge extra fields (e.g., display_name from Apple Sign In)
    ...(extraFields?.display_name ? { display_name: extraFields.display_name } : {}),
  };

  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single();

  if (error) {
    logger.auth.error('createUserRecord - INSERT FAILED:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw error;
  }

  if (__DEV__) console.log('[Auth] createUserRecord - SUCCESS! User created:', data?.id);
  return data;
}

/**
 * Update user profile
 */
export async function updateUserProfile(updates: UserUpdate): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Complete onboarding
 */
export async function completeOnboarding(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('users')
    .update({ onboarding_completed: true })
    .eq('id', user.id);

  if (error) throw error;
}

/**
 * Get email connections for current user
 */
export async function getEmailConnections(): Promise<EmailConnection[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('email_connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (error) throw error;
  return data || [];
}

/**
 * Add email connection
 */
export async function addEmailConnection(tokens: EmailTokens): Promise<EmailConnection> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Check if connection already exists
  const { data: existing } = await supabase
    .from('email_connections')
    .select('id')
    .eq('user_id', user.id)
    .eq('email_address', tokens.email)
    .single();

  if (existing) {
    // Update existing connection
    const { data, error } = await supabase
      .from('email_connections')
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: tokens.expires_at ? new Date(tokens.expires_at).toISOString() : null,
        scopes: tokens.scopes,
        is_active: true,
        sync_status: 'pending',
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Create new connection
  const { data, error } = await supabase
    .from('email_connections')
    .insert({
      user_id: user.id,
      provider: tokens.provider,
      email_address: tokens.email,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: tokens.expires_at ? new Date(tokens.expires_at).toISOString() : null,
      scopes: tokens.scopes,
      is_active: true,
      sync_status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Remove email connection
 */
export async function removeEmailConnection(connectionId: string): Promise<void> {
  // SECURITY: Verify user owns this connection
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { error } = await supabase
    .from('email_connections')
    .update({ is_active: false, disconnected_at: new Date().toISOString() })
    .eq('id', connectionId)
    .eq('user_id', user.id);  // SECURITY: Add user_id verification

  if (error) throw error;
}

/**
 * Refresh email tokens
 */
export async function refreshTokens(connectionId: string): Promise<{ success: boolean; error?: string }> {
  // SECURITY: Verify user owns this connection
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // First verify ownership before doing anything
  const { data: connection, error: fetchError } = await supabase
    .from('email_connections')
    .select('*')
    .eq('id', connectionId)
    .eq('user_id', user.id)  // SECURITY: Verify ownership
    .single();

  if (fetchError || !connection) {
    return { success: false, error: 'Connection not found or access denied' };
  }

  if (!connection.refresh_token) {
    return { success: false, error: 'No refresh token available' };
  }

  let tokenEndpoint: string;
  let clientId: string;

  if (connection.provider === 'google') {
    tokenEndpoint = 'https://oauth2.googleapis.com/token';
    clientId = GOOGLE_WEB_CLIENT_ID;
  } else {
    tokenEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
    clientId = MICROSOFT_CLIENT_ID;
  }

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: connection.refresh_token,
    }),
  });

  if (!response.ok) {
    return { success: false, error: 'Failed to refresh tokens' };
  }

  const tokens = await response.json();

  const { error: updateError } = await supabase
    .from('email_connections')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || connection.refresh_token,
      token_expires_at: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
    })
    .eq('id', connectionId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      const user = await getCurrentUser();
      callback(user);
    } else {
      callback(null);
    }
  });
}

export default {
  signInWithEmail,
  signUpWithEmail,
  requestPasswordReset,
  validateEmail,
  validatePassword,
  connectGoogleEmail,
  connectMicrosoftEmail,
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
};
