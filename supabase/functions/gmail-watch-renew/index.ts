/**
 * Supabase Edge Function: gmail-watch-renew
 *
 * Renews Gmail push notification watches before they expire.
 * Gmail watches have a 7-day TTL. This function should be invoked
 * daily via a cron job (e.g., pg_cron or an external scheduler):
 *
 *   select cron.schedule(
 *     'renew-gmail-watches',
 *     '0 3 * * *',               -- every day at 03:00 UTC
 *     $$select net.http_post(
 *       url := '<SUPABASE_URL>/functions/v1/gmail-watch-renew',
 *       headers := jsonb_build_object(
 *         'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
 *         'Content-Type', 'application/json'
 *       ),
 *       body := '{}'::jsonb
 *     )$$
 *   );
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    // Only allow POST (from cron) or GET (manual trigger)
    if (req.method !== 'POST' && req.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
    const projectId = Deno.env.get('GOOGLE_CLOUD_PROJECT_ID')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const topicName = `projects/${projectId}/topics/spendtrak-gmail-notifications`;

    // Find Gmail OAuth connections whose watch expires within 48 hours
    // (gives us a 48-hour buffer before the 7-day expiry)
    const renewBefore = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const { data: connections, error: queryError } = await supabase
      .from('email_connections_oauth')
      .select('*')
      .eq('provider', 'gmail')
      .or(`watch_expiration.is.null,watch_expiration.lte.${renewBefore}`);

    if (queryError) {
      console.error('Failed to query connections:', queryError);
      return new Response(
        JSON.stringify({ success: false, error: queryError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!connections || connections.length === 0) {
      console.log('No Gmail watches need renewal');
      return new Response(
        JSON.stringify({ success: true, renewed: 0, message: 'No watches to renew' }),
        { headers: { 'Content-Type': 'application/json' } },
      );
    }

    console.log(`Found ${connections.length} Gmail watch(es) to renew`);

    let renewed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const conn of connections) {
      try {
        // Refresh the access token if expired
        let accessToken = conn.access_token;
        const tokenExpiry = new Date(conn.token_expires_at);

        if (tokenExpiry <= new Date()) {
          const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              refresh_token: conn.refresh_token,
              grant_type: 'refresh_token',
            }),
          });

          const tokenData = await refreshResponse.json();

          if (!tokenData.access_token) {
            console.error(`Token refresh failed for ${conn.email}:`, tokenData);
            errors.push(`${conn.email}: token refresh failed`);
            failed++;
            continue;
          }

          accessToken = tokenData.access_token;

          // Update stored token
          await supabase.from('email_connections_oauth').update({
            access_token: tokenData.access_token,
            token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
          }).eq('id', conn.id);
        }

        // Call Gmail watch() to renew push notifications
        const watchResponse = await fetch(
          'https://gmail.googleapis.com/gmail/v1/users/me/watch',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              topicName,
              labelIds: ['INBOX'],
            }),
          },
        );

        const watchData = await watchResponse.json();

        if (watchData.historyId) {
          const watchExpiration = watchData.expiration
            ? new Date(parseInt(watchData.expiration)).toISOString()
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

          await supabase.from('email_connections_oauth').update({
            last_history_id: watchData.historyId,
            watch_expiration: watchExpiration,
            updated_at: new Date().toISOString(),
          }).eq('id', conn.id);

          renewed++;
          console.log(`Renewed watch for ${conn.email}, expires: ${watchExpiration}`);
        } else {
          console.error(`Watch renewal failed for ${conn.email}:`, watchData);
          errors.push(`${conn.email}: watch call failed - ${JSON.stringify(watchData.error || watchData)}`);
          failed++;
        }
      } catch (connError: any) {
        console.error(`Error renewing watch for ${conn.email}:`, connError.message);
        errors.push(`${conn.email}: ${connError.message}`);
        failed++;
      }
    }

    console.log(`Watch renewal complete: ${renewed} renewed, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        total: connections.length,
        renewed,
        failed,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    console.error('gmail-watch-renew error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
