/**
 * Supabase Edge Function: outlook-webhook
 * Receives Microsoft Graph webhook notifications for new emails
 * Sends ALL emails to Gemini AI for intelligent financial transaction detection
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { getCategoryMap } from '../_shared/categories.ts';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('origin');
  const url = new URL(req.url);

  // Microsoft Graph subscription validation:
  // When creating a subscription, Microsoft sends a GET/POST with ?validationToken=xxx
  // We must respond with the token as plain text within 10 seconds
  const validationToken = url.searchParams.get('validationToken');
  if (validationToken) {
    console.log('Subscription validation request received');
    return new Response(validationToken, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Dynamically fetch category map from DB (falls back to hardcoded if DB fails)
    const { map: CATEGORY_MAP, defaultCategoryId: DEFAULT_CATEGORY_ID } = await getCategoryMap(supabase);

    // Parse Microsoft Graph notification
    const body = await req.json();

    // Microsoft Graph sends notifications in the 'value' array
    const notifications = body.value;
    if (!notifications || notifications.length === 0) {
      console.log('No notifications in request');
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    let totalReceiptsFound = 0;
    let totalReceiptsImported = 0;

    // Process each notification
    for (const notification of notifications) {
      const { clientState, resource, resourceData } = notification;

      // clientState contains user_id for verification
      if (!clientState) {
        console.log('Missing clientState in notification, skipping');
        continue;
      }

      const userId = clientState;

      // Find the user's Outlook connection
      const { data: connection, error: connError } = await supabase
        .from('email_connections_oauth')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', 'outlook')
        .single();

      if (connError || !connection) {
        console.log('No Outlook OAuth connection found for user:', userId);
        continue;
      }

      // Check if we need to refresh the access token
      let accessToken = connection.access_token;
      const tokenExpiry = new Date(connection.token_expires_at);

      if (tokenExpiry <= new Date()) {
        // Refresh the token
        const refreshResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: Deno.env.get('MICROSOFT_CLIENT_ID')!,
            client_secret: Deno.env.get('MICROSOFT_CLIENT_SECRET')!,
            refresh_token: connection.refresh_token,
            grant_type: 'refresh_token',
            scope: 'Mail.Read Mail.ReadWrite offline_access User.Read',
          }),
        });

        const tokenData = await refreshResponse.json();

        if (tokenData.access_token) {
          accessToken = tokenData.access_token;

          // Update stored token
          await supabase.from('email_connections_oauth').update({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || connection.refresh_token,
            token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
          }).eq('id', connection.id);
        } else {
          console.error('Failed to refresh Outlook token:', tokenData);
          continue;
        }
      }

      // Fetch recent unread messages from Inbox
      // resourceData.id may contain the specific message ID
      const messageId = resourceData?.id;
      let messageIds: string[] = [];

      if (messageId) {
        messageIds = [messageId];
      } else {
        // Fetch recent messages if no specific ID provided
        const messagesResponse = await fetch(
          'https://graph.microsoft.com/v1.0/me/mailFolders/Inbox/messages?$top=5&$orderby=receivedDateTime desc&$select=id',
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        const messagesData = await messagesResponse.json();
        if (messagesData.value) {
          messageIds = messagesData.value.map((m: any) => m.id);
        }
      }

      console.log(`Processing ${messageIds.length} Outlook messages for user ${userId}`);

      let emailsAnalyzed = 0;
      let receiptsFound = 0;
      let receiptsImported = 0;

      // Process each message - send ALL to Gemini AI
      for (const msgId of messageIds) {
        try {
          // Check if already processed (reuse gmail_message_id column for all providers)
          const { data: existing } = await supabase
            .from('processed_emails_oauth')
            .select('id')
            .eq('user_id', connection.user_id)
            .eq('gmail_message_id', msgId)
            .single();

          if (existing) {
            continue;
          }

          // Fetch full message from Microsoft Graph
          const msgResponse = await fetch(
            `https://graph.microsoft.com/v1.0/me/messages/${msgId}?$select=id,subject,from,receivedDateTime,body,bodyPreview`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );

          const msgData = await msgResponse.json();

          if (msgData.error) {
            console.error(`Error fetching message ${msgId}:`, msgData.error);
            continue;
          }

          const from = msgData.from?.emailAddress
            ? `${msgData.from.emailAddress.name || ''} <${msgData.from.emailAddress.address || ''}>`
            : '';
          const subject = msgData.subject || '';
          const date = msgData.receivedDateTime || '';

          // Extract body text - Microsoft Graph returns body as HTML or text
          let bodyText = '';
          if (msgData.body?.contentType === 'text') {
            bodyText = msgData.body.content || '';
          } else if (msgData.body?.content) {
            // Strip HTML tags for plain text extraction
            bodyText = msgData.body.content
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/\s+/g, ' ')
              .trim();
          }
          if (!bodyText && msgData.bodyPreview) {
            bodyText = msgData.bodyPreview;
          }

          emailsAnalyzed++;
          console.log(`Analyzing email ${emailsAnalyzed}/${messageIds.length}: "${subject}" from ${from}`);
          console.log(`Email body length: ${bodyText.length} chars`);

          // Throttle Gemini calls
          await delay(1500);

          // Send ALL emails to Gemini for intelligent financial transaction detection
          const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [{
                    text: `You are an intelligent financial transaction detector. Analyze this email and determine if it represents ANY type of financial transaction, payment, purchase, or expense.

Look for contextual clues beyond just keywords:
- Payment confirmations (even without word "receipt")
- Ride sharing trip completions (Uber, Careem, etc.)
- Delivery orders (food, packages)
- Subscription renewals or charges
- Utility bill notifications
- Service payments (telecom, internet, etc.)
- Bank transaction alerts
- Purchase confirmations (even informal)
- Booking confirmations with payments

Email Details:
From: ${from}
Subject: ${subject}
Body: ${bodyText.substring(0, 4000)}

Return ONLY valid JSON (no markdown, no explanation):
{
  "isReceipt": true/false,
  "amount": number (total amount paid, without currency symbol),
  "currency": "AED" or "USD" or appropriate code,
  "merchant": "store/company name",
  "date": "YYYY-MM-DD",
  "category": "Food" | "Transport" | "Shopping" | "Entertainment" | "Utilities" | "Subscriptions" | "Travel" | "Health" | "Education" | "Other",
  "description": "brief description",
  "confidence": 0.0 to 1.0
}

If not a financial transaction, return: {"isReceipt": false, "confidence": 0.0}`
                  }]
                }],
                generationConfig: {
                  temperature: 0.1,
                  maxOutputTokens: 256,
                }
              })
            }
          );

          const geminiData = await geminiResponse.json();
          let parsedReceipt = null;
          let geminiResponseToSave = null;

          try {
            console.log(`Gemini status: ${geminiResponse.status}`);
            console.log(`Gemini raw response for ${msgId}:`, JSON.stringify(geminiData).substring(0, 500));

            if (geminiData.error) {
              console.error(`Gemini API error:`, geminiData.error);
              geminiResponseToSave = { error: geminiData.error };
              throw new Error(geminiData.error.message || 'Gemini API error');
            }

            let responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
            console.log(`Gemini text for ${msgId}:`, responseText.substring(0, 300));

            if (!responseText) {
              console.error(`Empty Gemini response for ${msgId}`);
              geminiResponseToSave = { error: 'Empty response' };
              throw new Error('Empty Gemini response');
            }

            responseText = responseText.replace(/```json\n?/g, '').replace(/```/g, '').trim();
            parsedReceipt = JSON.parse(responseText);
            geminiResponseToSave = parsedReceipt;

            console.log(`Parsed receipt:`, parsedReceipt);
          } catch (parseError: any) {
            console.error(`Failed to parse Gemini response for message ${msgId}:`, parseError.message);

            // Save the email even if Gemini parsing failed
            await supabase.from('processed_emails_oauth').insert({
              user_id: connection.user_id,
              email_connection_id: connection.id,
              gmail_message_id: msgId,
              email_subject: subject.substring(0, 255),
              email_from: from.substring(0, 255),
              email_date: date ? new Date(date).toISOString() : null,
              email_body: bodyText.substring(0, 10000),
              was_receipt: false,
              gemini_response: geminiResponseToSave,
            });
            continue;
          }

          // Save to processed_emails_oauth with full details (ALL emails, not just receipts)
          await supabase.from('processed_emails_oauth').insert({
            user_id: connection.user_id,
            email_connection_id: connection.id,
            gmail_message_id: msgId,
            email_subject: subject.substring(0, 255),
            email_from: from.substring(0, 255),
            email_date: date ? new Date(date).toISOString() : null,
            email_body: bodyText.substring(0, 10000),
            was_receipt: parsedReceipt.isReceipt === true,
            gemini_response: parsedReceipt,
          });

          // Create transaction if valid receipt (safety checks)
          if (parsedReceipt.isReceipt && parsedReceipt.confidence > 0.6 && parsedReceipt.amount > 0) {
            receiptsFound++;
            const categoryId = CATEGORY_MAP[parsedReceipt.category] || DEFAULT_CATEGORY_ID;

            const { error: txError } = await supabase.from('transactions').insert({
              user_id: connection.user_id,
              amount: -Math.abs(parsedReceipt.amount),
              currency: parsedReceipt.currency || 'AED',
              transaction_type: 'purchase',
              category_id: categoryId,
              merchant_name: parsedReceipt.merchant || 'Unknown',
              notes: `${parsedReceipt.description || ''} [Imported from Outlook email]`.trim(),
              transaction_date: parsedReceipt.date || new Date().toISOString().split('T')[0],
              source: 'email',
            });

            if (!txError) {
              receiptsImported++;
              console.log(`Imported: ${parsedReceipt.merchant} - ${parsedReceipt.amount} ${parsedReceipt.currency} - ${parsedReceipt.category}`);
            } else {
              console.error(`Failed to insert transaction:`, txError);
            }
          } else {
            console.log(`Skipped: isReceipt=${parsedReceipt.isReceipt}, confidence=${parsedReceipt.confidence}, amount=${parsedReceipt.amount}`);
          }

        } catch (msgError: any) {
          console.error(`Error processing Outlook message ${msgId}:`, msgError.message);
        }
      }

      totalReceiptsFound += receiptsFound;
      totalReceiptsImported += receiptsImported;

      // Update connection sync status
      await supabase.from('email_connections_oauth').update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'success',
        updated_at: new Date().toISOString(),
      }).eq('id', connection.id);
    }

    console.log(`Outlook webhook processed: ${totalReceiptsFound} receipts found, ${totalReceiptsImported} imported`);

    // Microsoft Graph expects a 202 Accepted response for notifications
    return new Response(
      JSON.stringify({ success: true, receiptsFound: totalReceiptsFound, receiptsImported: totalReceiptsImported }),
      { status: 202, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Outlook webhook error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 202, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    );
  }
});
