/**
 * Supabase Edge Function: outlook-watch-renew
 *
 * Renews Microsoft Graph webhook subscriptions before they expire.
 * Graph subscriptions have a max TTL of 4230 minutes (~3 days).
 * This function should be invoked every 2 days via a cron job.
 * 
 * Recommended cron schedule: Run every 2 days at 04:00 UTC
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
    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID')!;
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find Outlook OAuth connections whose subscription expires within 24 hours
    // (gives us a 24-hour buffer before the ~3-day expiry)
    const renewBefore = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data: connections, error: queryError } = await supabase
      .from('email_connections_oauth')
      .select('*')
      .eq('provider', 'outlook')
      .not('subscription_id', 'is', null)
      .or(`watch_expiration.is.null,watch_expiration.lte.${renewBefore}`);

    if (queryError) {
      console.error('Failed to query connections:', queryError);
      return new Response(
        JSON.stringify({ success: false, error: queryError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!connections || connections.length === 0) {
      console.log('No Outlook subscriptions need renewal');
      return new Response(
        JSON.stringify({ success: true, renewed: 0, message: 'No subscriptions to renew' }),
        { headers: { 'Content-Type': 'application/json' } },
      );
    }

    console.log(`Found ${connections.length} Outlook subscription(s) to renew`);

    let renewed = 0;
    let recreated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const conn of connections) {
      try {
        // Refresh the access token if expired
        let accessToken = conn.access_token;
        const tokenExpiry = new Date(conn.token_expires_at);

        if (tokenExpiry <= new Date()) {
          const refreshResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              refresh_token: conn.refresh_token,
              grant_type: 'refresh_token',
              scope: 'Mail.Read Mail.ReadWrite offline_access User.Read',
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

          // Update stored token (Microsoft may rotate refresh tokens)
          await supabase.from('email_connections_oauth').update({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || conn.refresh_token,
            token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
          }).eq('id', conn.id);
        }

        // New expiration: max 4230 minutes from now (~2.94 days)
        const newExpiration = new Date(Date.now() + 4230 * 60 * 1000).toISOString();

        // Try to renew the existing subscription via PATCH
        const renewResponse = await fetch(
          `https://graph.microsoft.com/v1.0/subscriptions/${conn.subscription_id}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              expirationDateTime: newExpiration,
            }),
          },
        );

        if (renewResponse.ok) {
          const renewData = await renewResponse.json();
          const watchExpiration = renewData.expirationDateTime
            ? new Date(renewData.expirationDateTime).toISOString()
            : newExpiration;

          await supabase.from('email_connections_oauth').update({
            watch_expiration: watchExpiration,
            updated_at: new Date().toISOString(),
          }).eq('id', conn.id);

          renewed++;
          console.log(`Renewed subscription for ${conn.email}, expires: ${watchExpiration}`);
        } else {
          // Subscription may have expired or been deleted - recreate it
          console.log(`PATCH failed (${renewResponse.status}) for ${conn.email}, recreating subscription...`);

          const apiBaseUrl = Deno.env.get('PUBLIC_API_URL') || 'https://api.spendtrak.app';
          const webhookUrl = `${apiBaseUrl}/functions/v1/outlook-webhook`;
          const createResponse = await fetch(
            'https://graph.microsoft.com/v1.0/subscriptions',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                changeType: 'created',
                notificationUrl: webhookUrl,
                resource: 'me/mailFolders/Inbox/messages',
                expirationDateTime: newExpiration,
                clientState: conn.user_id,
              }),
            },
          );

          const createData = await createResponse.json();

          if (createData.id) {
            const watchExpiration = createData.expirationDateTime
              ? new Date(createData.expirationDateTime).toISOString()
              : newExpiration;

            await supabase.from('email_connections_oauth').update({
              subscription_id: createData.id,
              watch_expiration: watchExpiration,
              updated_at: new Date().toISOString(),
            }).eq('id', conn.id);

            recreated++;
            console.log(`Recreated subscription for ${conn.email}, new id: ${createData.id}, expires: ${watchExpiration}`);
          } else {
            console.error(`Failed to recreate subscription for ${conn.email}:`, createData);
            errors.push(`${conn.email}: recreate failed - ${JSON.stringify(createData.error || createData)}`);
            failed++;
          }
        }
      } catch (connError: any) {
        console.error(`Error renewing subscription for ${conn.email}:`, connError.message);
        errors.push(`${conn.email}: ${connError.message}`);
        failed++;
      }
    }

    console.log(`Outlook subscription renewal complete: ${renewed} renewed, ${recreated} recreated, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        total: connections.length,
        renewed,
        recreated,
        failed,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    console.error('outlook-watch-renew error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});