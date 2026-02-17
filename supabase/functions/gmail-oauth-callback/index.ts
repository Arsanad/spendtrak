/**
 * Supabase Edge Function: gmail-oauth-callback
 * Handles OAuth callback from Google, stores tokens, and sets up Gmail push notifications
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
];

// Validate UUID format (since verify_jwt is off, we must validate the state param ourselves)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Allowed redirect schemes for app_redirect (prevents open redirect attacks)
const ALLOWED_REDIRECT_SCHEMES = ['spendtrak:', 'exp:', 'exps:'];

/**
 * Validate an app redirect URL. Returns the URL if safe, null otherwise.
 */
function validateAppRedirect(redirect: string | null): string | null {
  if (!redirect) return null;
  try {
    const u = new URL(redirect);
    return ALLOWED_REDIRECT_SCHEMES.includes(u.protocol) ? redirect : null;
  } catch {
    return null;
  }
}

/**
 * Parse the OAuth state parameter. Supports two formats:
 * - JSON: { uid: "uuid", redir: "spendtrak://..." } (new format with app redirect)
 * - Plain UUID string (legacy format)
 */
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

/**
 * Build redirect URL with query parameters appended.
 */
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
  const state = url.searchParams.get('state'); // Contains user_id
  const error = url.searchParams.get('error');

  // Get environment variables
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const projectId = Deno.env.get('GOOGLE_CLOUD_PROJECT_ID')!;

  // Public API base URL (custom domain) — must match Google Cloud Console redirect URI
  const apiBaseUrl = Deno.env.get('PUBLIC_API_URL') || 'https://api.spendtrak.app';
  const redirectUri = `${apiBaseUrl}/functions/v1/gmail-oauth-callback`;

  // Default deep link back to app (overridden by app_redirect if provided)
  const defaultRedirect = 'spendtrak://email-connect';

  if (error) {
    console.error('OAuth error:', error);
    // On error before state parsing, use default redirect
    return Response.redirect(buildRedirectUrl(defaultRedirect, { error }));
  }

  if (!code || !state) {
    // No code means this is the initial auth request - redirect to Google
    const userId = url.searchParams.get('user_id');

    if (!userId || !UUID_RE.test(userId)) {
      return new Response('Missing or invalid user_id parameter', { status: 400 });
    }

    // Accept optional app_redirect from the client (for Expo Go compatibility)
    const appRedirect = validateAppRedirect(url.searchParams.get('app_redirect'));

    // Encode user_id and app_redirect in state so they survive the OAuth round-trip
    const statePayload = JSON.stringify({ uid: userId, redir: appRedirect });

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', SCOPES.join(' '));
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', statePayload);

    return Response.redirect(authUrl.toString());
  }

  // Parse state — supports JSON (new) and plain UUID (legacy)
  const { uid: userId, redir } = parseState(state);
  const appRedirectUrl = redir || defaultRedirect;

  // Validate user_id is a valid UUID since JWT verification is disabled
  if (!UUID_RE.test(userId)) {
    console.error('Invalid user_id in state:', userId);
    return Response.redirect(buildRedirectUrl(appRedirectUrl, { error: 'invalid_state' }));
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('Token exchange failed:', tokenData);
      return Response.redirect(buildRedirectUrl(appRedirectUrl, { error: 'token_exchange_failed' }));
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    // Get user's email address
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const userInfo = await userInfoResponse.json();
    const email = userInfo.email;

    if (!email) {
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
        provider: 'gmail',
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

    // Set up Gmail push notifications (watch)
    const topicName = `projects/${projectId}/topics/spendtrak-gmail-notifications`;

    const watchResponse = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/watch',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicName,
          labelIds: ['INBOX'],
        }),
      }
    );

    const watchData = await watchResponse.json();

    if (watchData.historyId) {
      // Gmail watch expires after 7 days. Store the expiration so the
      // gmail-watch-renew cron function can renew before it lapses.
      const watchExpiration = watchData.expiration
        ? new Date(parseInt(watchData.expiration)).toISOString()
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Update connection with historyId and watch expiration
      await supabase
        .from('email_connections_oauth')
        .update({
          last_history_id: watchData.historyId,
          last_sync_status: 'watching',
          watch_expiration: watchExpiration,
        })
        .eq('user_id', userId)
        .eq('email', email.toLowerCase());

      console.log(`Gmail watch set up for ${email}, historyId: ${watchData.historyId}, expires: ${watchExpiration}`);
    } else {
      console.error('Failed to set up Gmail watch:', watchData);
    }

    // Redirect back to app with success
    return Response.redirect(buildRedirectUrl(appRedirectUrl, { success: 'true', email }));

  } catch (err: any) {
    console.error('OAuth callback error:', err.message);
    return Response.redirect(buildRedirectUrl(appRedirectUrl, { error: err.message }));
  }
});