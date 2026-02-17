/**
 * Supabase Edge Function: outlook-oauth-callback
 * Handles OAuth callback from Microsoft, stores tokens, and sets up Graph webhook subscription
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SCOPES = [
  'Mail.Read',
  'Mail.ReadWrite',
  'offline_access',
  'User.Read',
];

// Validate UUID format
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Allowed redirect schemes for app_redirect (prevents open redirect attacks)
const ALLOWED_REDIRECT_SCHEMES = ['spendtrak:', 'exp:', 'exps:'];

function validateAppRedirect(redirect: string | null): string | null {
  if (!redirect) return null;
  try {
    const u = new URL(redirect);
    return ALLOWED_REDIRECT_SCHEMES.includes(u.protocol) ? redirect : null;
  } catch {
    return null;
  }
}

function parseState(state: string): { uid: string; redir: string | null } {
  try {
    const parsed = JSON.parse(state);
    if (parsed && typeof parsed.uid === 'string') {
      return { uid: parsed.uid, redir: parsed.redir || null };
    }
  } catch {
    // Not JSON — treat as plain UUID (backward compat)
  }
  return { uid: state, redir: null };
}

function buildRedirectUrl(base: string, params: Record<string, string>): string {
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  // Get environment variables
  const clientId = Deno.env.get('MICROSOFT_CLIENT_ID')!;
  const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET')!;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Public API base URL (custom domain) — must match Azure AD redirect URI
  const apiBaseUrl = Deno.env.get('PUBLIC_API_URL') || 'https://api.spendtrak.app';
  const redirectUri = `${apiBaseUrl}/functions/v1/outlook-oauth-callback`;

  // Default deep link back to app (overridden by app_redirect if provided)
  const defaultRedirect = 'spendtrak://email-connect';

  if (error) {
    console.error('OAuth error:', error, errorDescription);
    return Response.redirect(buildRedirectUrl(defaultRedirect, { error }));
  }

  if (!code || !state) {
    // No code means this is the initial auth request - redirect to Microsoft
    const userId = url.searchParams.get('user_id');

    if (!userId || !UUID_RE.test(userId)) {
      return new Response('Missing or invalid user_id parameter', { status: 400 });
    }

    // Accept optional app_redirect from the client (for Expo Go compatibility)
    const appRedirect = validateAppRedirect(url.searchParams.get('app_redirect'));

    // Encode user_id and app_redirect in state so they survive the OAuth round-trip
    const statePayload = JSON.stringify({ uid: userId, redir: appRedirect });

    const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', SCOPES.join(' '));
    authUrl.searchParams.set('response_mode', 'query');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', statePayload);

    return Response.redirect(authUrl.toString());
  }

  // Parse state — supports JSON (new) and plain UUID (legacy)
  const { uid: userId, redir } = parseState(state);
  const appRedirectUrl = redir || defaultRedirect;

  // Validate user_id is a valid UUID
  if (!UUID_RE.test(userId)) {
    console.error('Invalid user_id in state:', userId);
    return Response.redirect(buildRedirectUrl(appRedirectUrl, { error: 'invalid_state' }));
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        scope: SCOPES.join(' '),
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('Token exchange failed:', tokenData);
      return Response.redirect(buildRedirectUrl(appRedirectUrl, { error: 'token_exchange_failed' }));
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    // Get user's email address from Microsoft Graph
    const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const userInfo = await userInfoResponse.json();
    const email = userInfo.mail || userInfo.userPrincipalName;

    if (!email) {
      console.error('No email found in user info:', userInfo);
      return Response.redirect(buildRedirectUrl(appRedirectUrl, { error: 'no_email' }));
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store OAuth connection
    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    const { error: upsertError } = await supabase
      .from('email_connections_oauth')
      .upsert({
        user_id: userId,
        provider: 'outlook',
        email: email.toLowerCase(),
        access_token,
        refresh_token,
        token_expires_at: tokenExpiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,email' });

    if (upsertError) {
      console.error('Failed to store connection:', upsertError);
      return Response.redirect(buildRedirectUrl(appRedirectUrl, { error: 'storage_failed' }));
    }

    // Set up Microsoft Graph webhook subscription for mail
    const webhookUrl = `${apiBaseUrl}/functions/v1/outlook-webhook`;
    // Microsoft Graph subscriptions max out at 4230 minutes (~2.94 days)
    const expirationDateTime = new Date(Date.now() + 4230 * 60 * 1000).toISOString();

    const subscriptionResponse = await fetch(
      'https://graph.microsoft.com/v1.0/subscriptions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          changeType: 'created',
          notificationUrl: webhookUrl,
          resource: 'me/mailFolders/Inbox/messages',
          expirationDateTime,
          clientState: userId, // user_id as client state for webhook verification
        }),
      }
    );

    const subscriptionData = await subscriptionResponse.json();

    if (subscriptionData.id) {
      const watchExpiration = subscriptionData.expirationDateTime
        ? new Date(subscriptionData.expirationDateTime).toISOString()
        : expirationDateTime;

      // Update connection with subscription ID and expiration
      await supabase
        .from('email_connections_oauth')
        .update({
          subscription_id: subscriptionData.id,
          last_sync_status: 'watching',
          watch_expiration: watchExpiration,
        })
        .eq('user_id', userId)
        .eq('email', email.toLowerCase());

      console.log(`Outlook subscription created for ${email}, id: ${subscriptionData.id}, expires: ${watchExpiration}`);
    } else {
      console.error('Failed to create Outlook subscription:', subscriptionData);
      // Still continue - user can manually sync or subscription can be retried
    }

    // Redirect back to app with success
    return Response.redirect(buildRedirectUrl(appRedirectUrl, { success: 'true', email }));

  } catch (err: any) {
    console.error('OAuth callback error:', err.message);
    return Response.redirect(buildRedirectUrl(appRedirectUrl, { error: err.message }));
  }
});
