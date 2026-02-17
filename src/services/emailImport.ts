/**
 * Email Import Service
 * Handles connecting emails and importing receipts via Supabase Edge Functions
 *
 * Supports:
 * - OAuth (Gmail, Outlook): One-tap connection, real-time push notifications
 * - Forwarding (iCloud): Email forwarding rules, real-time processing
 */

import { supabase } from './supabase';
import { EMAIL_PROVIDERS, EmailProvider } from '@/config/emailProviders';
import { logger } from '../utils/logger';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';

// ============================================
// TYPES
// ============================================

export interface EmailConnection {
  id: string;
  user_id: string;
  provider: string;
  email: string;
  is_active: boolean;
  last_sync_at: string | null;
  last_sync_status: 'success' | 'failed' | 'pending' | 'partial' | 'watching' | null;
  last_sync_error: string | null;
  receipts_imported: number;
  created_at: string;
  updated_at: string;
  auth_type: 'oauth' | 'forwarding';
}

// ============================================
// EMAIL IMPORT SERVICE CLASS
// ============================================

class EmailImportService {
  private supabaseUrl: string;

  constructor() {
    this.supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl ||
      process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  }

  // ============================================
  // OAUTH METHODS (Gmail, Outlook)
  // ============================================

  /**
   * Connect Gmail via OAuth
   * Opens browser for Google sign-in, handles callback
   */
  async connectGmailOAuth(): Promise<{ success: boolean; error?: string; email?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Generate environment-appropriate callback URL:
      // - Expo Go: exp://192.168.x.x:8081/--/email-connect
      // - Dev/Prod build: spendtrak://email-connect
      const callbackUrl = AuthSession.makeRedirectUri({ scheme: 'spendtrak', path: 'email-connect' });

      // Build OAuth URL — pass callback so Edge Function redirects to the correct URL
      const oauthUrl = `${this.supabaseUrl}/functions/v1/gmail-oauth-callback?user_id=${user.id}&app_redirect=${encodeURIComponent(callbackUrl)}`;

      logger.email.info('Opening Gmail OAuth flow', { callbackUrl });

      // Open browser for OAuth
      const result = await WebBrowser.openAuthSessionAsync(
        oauthUrl,
        callbackUrl
      );

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const success = url.searchParams.get('success') === 'true';
        const error = url.searchParams.get('error');
        const email = url.searchParams.get('email');

        if (success && email) {
          logger.email.info('Gmail OAuth successful:', email);
          return { success: true, email };
        } else {
          return { success: false, error: error || 'OAuth failed' };
        }
      } else if (result.type === 'cancel') {
        return { success: false, error: 'Cancelled' };
      }

      return { success: false, error: 'OAuth flow interrupted' };
    } catch (error: any) {
      logger.email.error('Gmail OAuth error:', error);
      return { success: false, error: error.message || 'OAuth failed' };
    }
  }

  /**
   * Connect Outlook via OAuth
   * Opens browser for Microsoft sign-in, handles callback
   */
  async connectOutlookOAuth(): Promise<{ success: boolean; error?: string; email?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Generate environment-appropriate callback URL
      const callbackUrl = AuthSession.makeRedirectUri({ scheme: 'spendtrak', path: 'email-connect' });

      // Build OAuth URL — pass callback so Edge Function redirects to the correct URL
      const oauthUrl = `${this.supabaseUrl}/functions/v1/outlook-oauth-callback?user_id=${user.id}&app_redirect=${encodeURIComponent(callbackUrl)}`;

      logger.email.info('Opening Outlook OAuth flow', { callbackUrl });

      // Open browser for OAuth
      const result = await WebBrowser.openAuthSessionAsync(
        oauthUrl,
        callbackUrl
      );

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const success = url.searchParams.get('success') === 'true';
        const error = url.searchParams.get('error');
        const email = url.searchParams.get('email');

        if (success && email) {
          logger.email.info('Outlook OAuth successful:', email);
          return { success: true, email };
        } else {
          return { success: false, error: error || 'OAuth failed' };
        }
      } else if (result.type === 'cancel') {
        return { success: false, error: 'Cancelled' };
      }

      return { success: false, error: 'OAuth flow interrupted' };
    } catch (error: any) {
      logger.email.error('Outlook OAuth error:', error);
      return { success: false, error: error.message || 'OAuth failed' };
    }
  }

  // ============================================
  // ICLOUD FORWARDING METHODS
  // ============================================

  /**
   * Register iCloud forwarding connection
   * Creates a record in email_connections_oauth so it appears in Connected Emails
   */
  async registerICloudForwarding(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      const forwardingEmail = `receipts-${user.id}@spendtrak.app`;

      const { error } = await supabase
        .from('email_connections_oauth')
        .upsert({
          user_id: user.id,
          provider: 'icloud',
          email: forwardingEmail,
          access_token: 'n/a',
          refresh_token: 'n/a',
          token_expires_at: '2099-12-31T23:59:59Z',
          last_sync_status: 'watching',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,email' });

      if (error) {
        logger.email.error('Register iCloud forwarding error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      logger.email.error('Register iCloud forwarding exception:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // COMMON METHODS
  // ============================================

  /**
   * Get all connected emails (OAuth and forwarding only)
   */
  async getConnectedEmails(): Promise<EmailConnection[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: oauthData, error: oauthError } = await supabase
        .from('email_connections_oauth')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (oauthError || !oauthData) return [];

      return oauthData.map(c => ({
        ...c,
        auth_type: (c.provider === 'icloud' ? 'forwarding' : 'oauth') as 'oauth' | 'forwarding',
        is_active: true,
        receipts_imported: 0,
      }));
    } catch (error) {
      logger.email.error('Get connected emails error:', error);
      return [];
    }
  }

  /**
   * Disconnect an email
   * Revokes OAuth tokens before deleting the connection record
   */
  async disconnectEmail(connectionId: string, _authType: 'oauth' | 'forwarding' = 'oauth'): Promise<boolean> {
    try {
      // Fetch the connection to get provider and token for revocation
      const { data: connection, error: fetchError } = await supabase
        .from('email_connections_oauth')
        .select('provider, access_token')
        .eq('id', connectionId)
        .single();

      if (fetchError) {
        logger.email.error('Failed to fetch connection for revocation:', fetchError);
      }

      // Revoke OAuth tokens if applicable (skip for forwarding connections)
      if (connection?.access_token && connection.access_token !== 'n/a') {
        await this.revokeOAuthToken(connection.provider, connection.access_token);
      }

      const { error } = await supabase
        .from('email_connections_oauth')
        .delete()
        .eq('id', connectionId);

      if (error) {
        logger.email.error('Disconnect email error:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.email.error('Disconnect email exception:', error);
      return false;
    }
  }

  /**
   * Revoke an OAuth access token with the provider
   */
  private async revokeOAuthToken(provider: string, accessToken: string): Promise<void> {
    try {
      if (provider === 'gmail') {
        const response = await fetch(
          `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(accessToken)}`,
          { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        if (response.ok) {
          logger.email.info('Gmail OAuth token revoked successfully');
        } else {
          logger.email.warn('Gmail token revocation returned status:', response.status);
        }
      } else if (provider === 'outlook') {
        const response = await fetch(
          'https://login.microsoftonline.com/common/oauth2/v2.0/logout',
          { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        if (response.ok) {
          logger.email.info('Outlook OAuth token revoked successfully');
        } else {
          logger.email.warn('Outlook token revocation returned status:', response.status);
        }
      }
    } catch (error) {
      // Token revocation failure should not prevent disconnect
      logger.email.warn('OAuth token revocation failed (non-blocking):', error);
    }
  }

  /**
   * Get provider info
   */
  getProvider(providerId: string): EmailProvider | undefined {
    return EMAIL_PROVIDERS[providerId];
  }

  /**
   * Get all providers
   */
  getAllProviders(): EmailProvider[] {
    return Object.values(EMAIL_PROVIDERS);
  }
}

export const emailImportService = new EmailImportService();
export default emailImportService;
