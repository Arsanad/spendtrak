/**
 * Supabase Edge Function: send-push-notification
 * Sends push notifications to users via Expo Push API
 *
 * Accepts: { userId, title, body, data? }
 * - Queries user's Expo push token(s) from push_tokens table
 * - Sends via Expo Push API
 * - Removes invalid tokens automatically
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushRequest {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  sound: 'default' | null;
  data?: Record<string, unknown>;
}

interface ExpoPushTicket {
  id?: string;
  status: 'ok' | 'error';
  message?: string;
  details?: { error?: string };
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('origin');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, title, body, data }: PushRequest = await req.json();

    if (!userId || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, title, body' }),
        { status: 400, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user's push tokens
    const { data: tokens, error: tokenError } = await supabase
      .from('push_tokens')
      .select('id, token')
      .eq('user_id', userId);

    if (tokenError) {
      console.error('Failed to fetch push tokens:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens' }),
        { status: 500, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No push tokens registered' }),
        { headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    // Build Expo push messages
    const messages: ExpoPushMessage[] = tokens.map((t) => ({
      to: t.token,
      title,
      body,
      sound: 'default' as const,
      ...(data && { data }),
    }));

    // Send to Expo Push API
    const pushResponse = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const tickets: ExpoPushTicket[] = (await pushResponse.json()).data || [];

    // Process results — remove invalid tokens
    const invalidTokenIds: string[] = [];
    let sentCount = 0;

    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      if (ticket.status === 'ok') {
        sentCount++;
      } else if (ticket.details?.error === 'DeviceNotRegistered') {
        // Token is no longer valid — remove it
        invalidTokenIds.push(tokens[i].id);
        console.log('Removing invalid push token:', tokens[i].token.substring(0, 20) + '...');
      } else {
        console.error('Push error for token:', ticket.message, ticket.details);
      }
    }

    // Delete invalid tokens
    if (invalidTokenIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('push_tokens')
        .delete()
        .in('id', invalidTokenIds);

      if (deleteError) {
        console.error('Failed to delete invalid tokens:', deleteError);
      } else {
        console.log(`Removed ${invalidTokenIds.length} invalid push token(s)`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        failed: tickets.length - sentCount,
        tokensRemoved: invalidTokenIds.length,
      }),
      { headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Push notification error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    );
  }
});
