/**
 * Supabase Edge Function: gmail-webhook
 * Receives Gmail push notifications via Google Pub/Sub
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

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Dynamically fetch category map from DB (falls back to hardcoded if DB fails)
    const { map: CATEGORY_MAP, defaultCategoryId: DEFAULT_CATEGORY_ID } = await getCategoryMap(supabase);

    // Parse Pub/Sub message
    const body = await req.json();
    
    // Pub/Sub sends message in this format
    const message = body.message;
    if (!message) {
      console.log('No message in request, possibly a subscription verification');
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' }
      });
    }

    // Decode base64 data from Pub/Sub
    const decodedData = atob(message.data);
    const notification = JSON.parse(decodedData);
    
    console.log('Gmail notification received:', notification);

    const { emailAddress, historyId } = notification;
    
    if (!emailAddress || !historyId) {
      console.log('Missing emailAddress or historyId');
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' }
      });
    }

    // Find the user's Gmail connection
    const { data: connection, error: connError } = await supabase
      .from('email_connections_oauth')
      .select('*')
      .eq('email', emailAddress.toLowerCase())
      .eq('provider', 'gmail')
      .single();

    if (connError || !connection) {
      console.log('No OAuth connection found for:', emailAddress);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' }
      });
    }

    // Check if we need to refresh the access token
    let accessToken = connection.access_token;
    const tokenExpiry = new Date(connection.token_expires_at);
    
    if (tokenExpiry <= new Date()) {
      // Refresh the token
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
          refresh_token: connection.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      const tokenData = await refreshResponse.json();
      
      if (tokenData.access_token) {
        accessToken = tokenData.access_token;
        
        // Update stored token
        await supabase.from('email_connections_oauth').update({
          access_token: tokenData.access_token,
          token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        }).eq('id', connection.id);
      } else {
        console.error('Failed to refresh token');
        return new Response(JSON.stringify({ success: false, error: 'Token refresh failed' }), {
          status: 500,
          headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' }
        });
      }
    }

    // Get message history since last historyId
    const lastHistoryId = connection.last_history_id || historyId;
    
    const historyResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${lastHistoryId}&historyTypes=messageAdded`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    const historyData = await historyResponse.json();
    
    if (!historyData.history) {
      console.log('No new messages in history');
      // Update historyId anyway
      await supabase.from('email_connections_oauth').update({
        last_history_id: historyId,
      }).eq('id', connection.id);
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' }
      });
    }

    // Extract new message IDs
    const messageIds: string[] = [];
    for (const historyItem of historyData.history) {
      if (historyItem.messagesAdded) {
        for (const msg of historyItem.messagesAdded) {
          messageIds.push(msg.message.id);
        }
      }
    }

    console.log(`Found ${messageIds.length} new messages`);

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    let emailsAnalyzed = 0;
    let receiptsFound = 0;
    let receiptsImported = 0;

    // Process each new message - send ALL to Gemini AI
    for (const msgId of messageIds) {
      try {
        // Check if already processed
        const { data: existing } = await supabase
          .from('processed_emails_oauth')
          .select('id')
          .eq('user_id', connection.user_id)
          .eq('gmail_message_id', msgId)
          .single();

        if (existing) {
          continue;
        }

        // Fetch full message
        const msgResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=full`,
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        );

        const msgData = await msgResponse.json();
        
        // Extract headers
        const headers = msgData.payload?.headers || [];
        const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
        
        const from = getHeader('From');
        const subject = getHeader('Subject');
        const date = getHeader('Date');

        // Extract body text
        let bodyText = '';
        const extractText = (part: any): string => {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
          }
          if (part.parts) {
            return part.parts.map(extractText).join('\n');
          }
          return '';
        };
        
        bodyText = extractText(msgData.payload);
        if (!bodyText && msgData.snippet) {
          bodyText = msgData.snippet;
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
          // Log raw Gemini response for debugging
          console.log(`Gemini status: ${geminiResponse.status}`);
          console.log(`Gemini raw response for ${msgId}:`, JSON.stringify(geminiData).substring(0, 500));
          
          // Check for API errors
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
          // Map category name to category_id
          const categoryId = CATEGORY_MAP[parsedReceipt.category] || DEFAULT_CATEGORY_ID;

          const { error: txError } = await supabase.from('transactions').insert({
            user_id: connection.user_id,
            amount: -Math.abs(parsedReceipt.amount),
            currency: parsedReceipt.currency || 'AED',
            transaction_type: 'purchase',
            category_id: categoryId,
            merchant_name: parsedReceipt.merchant || 'Unknown',
            notes: `${parsedReceipt.description || ''} [Imported from email]`.trim(),
            transaction_date: parsedReceipt.date || new Date().toISOString().split('T')[0],
            source: 'email',
          });

          if (!txError) {
            receiptsImported++;
            console.log(`✅ Imported: ${parsedReceipt.merchant} - ${parsedReceipt.amount} ${parsedReceipt.currency} - ${parsedReceipt.category}`);
          } else {
            console.error(`Failed to insert transaction:`, txError);
          }
        } else {
          console.log(`Skipped: isReceipt=${parsedReceipt.isReceipt}, confidence=${parsedReceipt.confidence}, amount=${parsedReceipt.amount}`);
        }

      } catch (msgError: any) {
        console.error(`Error processing message ${msgId}:`, msgError.message);
      }
    }

    // Update connection with latest historyId
    await supabase.from('email_connections_oauth').update({
      last_history_id: historyId,
      last_sync_at: new Date().toISOString(),
      last_sync_status: 'success',
      updated_at: new Date().toISOString(),
    }).eq('id', connection.id);

    console.log(`Processed: ${emailsAnalyzed} emails analyzed, ${receiptsFound} receipts found, ${receiptsImported} imported`);

    return new Response(
      JSON.stringify({ success: true, receiptsFound, receiptsImported }),
      { headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Gmail webhook error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    );
  }
});