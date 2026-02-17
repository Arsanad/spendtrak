/**
 * Supabase Edge Function: email-inbound
 * Receives forwarded emails from iCloud (via Cloudflare worker)
 * Sends ALL emails to Gemini AI for intelligent financial transaction detection
 *
 * - Saves ALL emails to processed_emails_oauth (not just receipts)
 * - Stores gemini_response for debugging
 * - Only creates transactions for confirmed receipts
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getCategoryMap } from '../_shared/categories.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

Deno.serve(async (req) => {
  try {
    // Parse request body from Cloudflare worker
    const { from, to, subject, rawEmail, messageId, date } = await req.json();

    console.log('Received email:', { from, to, subject });

    // Extract user ID from recipient address (receipts-{user_id}@spendtrak.app)
    const match = to.match(/^receipts-([a-zA-Z0-9-]+)@spendtrak\.app$/i);
    if (!match) {
      console.error('Invalid recipient format:', to);
      return new Response(JSON.stringify({ error: 'Invalid recipient format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = match[1];
    console.log('Extracted user ID:', userId);

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Dynamically fetch category map from DB (falls back to hardcoded if DB fails)
    const { map: CATEGORY_MAP, defaultCategoryId: DEFAULT_CATEGORY_ID } = await getCategoryMap(supabase);

    // Generate a stable email identifier for dedup
    const emailMessageId = messageId || `icloud-${Date.now()}-${subject?.substring(0, 30)}`;

    // Check if already processed
    const { data: existing } = await supabase
      .from('processed_emails_oauth')
      .select('id')
      .eq('user_id', userId)
      .eq('gmail_message_id', emailMessageId)
      .single();

    if (existing) {
      console.log('Email already processed:', emailMessageId);
      return new Response(JSON.stringify({ message: 'Already processed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Look up or create iCloud forwarding connection record
    let connectionId: string | null = null;
    const { data: existingConnection } = await supabase
      .from('email_connections_oauth')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', 'icloud')
      .single();

    if (existingConnection) {
      connectionId = existingConnection.id;
    }

    // Extract body text for storage
    const bodyText = typeof rawEmail === 'string' ? rawEmail : '';

    console.log(`Analyzing email: "${subject}" from ${from}`);
    console.log(`Email body length: ${bodyText.length} chars`);

    // Send ALL emails to Gemini for intelligent financial transaction detection
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
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

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);

      // Save email even on Gemini failure
      await supabase.from('processed_emails_oauth').insert({
        user_id: userId,
        email_connection_id: connectionId,
        gmail_message_id: emailMessageId,
        email_subject: (subject || '').substring(0, 255),
        email_from: (from || '').substring(0, 255),
        email_date: date ? new Date(date).toISOString() : new Date().toISOString(),
        email_body: bodyText.substring(0, 10000),
        was_receipt: false,
        gemini_response: { error: `Gemini API ${geminiResponse.status}` },
      });

      return new Response(JSON.stringify({ error: 'Gemini API error', saved: true }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const geminiData = await geminiResponse.json();
    let parsedReceipt = null;
    let geminiResponseToSave = null;

    try {
      console.log(`Gemini status: ${geminiResponse.status}`);
      console.log(`Gemini raw response:`, JSON.stringify(geminiData).substring(0, 500));

      if (geminiData.error) {
        console.error('Gemini API error:', geminiData.error);
        geminiResponseToSave = { error: geminiData.error };
        throw new Error(geminiData.error.message || 'Gemini API error');
      }

      let responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log(`Gemini text:`, responseText.substring(0, 300));

      if (!responseText) {
        console.error('Empty Gemini response');
        geminiResponseToSave = { error: 'Empty response' };
        throw new Error('Empty Gemini response');
      }

      responseText = responseText.replace(/```json\n?/g, '').replace(/```/g, '').trim();
      parsedReceipt = JSON.parse(responseText);
      geminiResponseToSave = parsedReceipt;

      console.log('Parsed receipt:', parsedReceipt);
    } catch (parseError: any) {
      console.error('Failed to parse Gemini response:', parseError.message);

      // Save the email even if Gemini parsing failed
      await supabase.from('processed_emails_oauth').insert({
        user_id: userId,
        email_connection_id: connectionId,
        gmail_message_id: emailMessageId,
        email_subject: (subject || '').substring(0, 255),
        email_from: (from || '').substring(0, 255),
        email_date: date ? new Date(date).toISOString() : new Date().toISOString(),
        email_body: bodyText.substring(0, 10000),
        was_receipt: false,
        gemini_response: geminiResponseToSave,
      });

      return new Response(JSON.stringify({ error: 'Failed to parse Gemini response', saved: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Save to processed_emails_oauth with full details (ALL emails, not just receipts)
    await supabase.from('processed_emails_oauth').insert({
      user_id: userId,
      email_connection_id: connectionId,
      gmail_message_id: emailMessageId,
      email_subject: (subject || '').substring(0, 255),
      email_from: (from || '').substring(0, 255),
      email_date: date ? new Date(date).toISOString() : new Date().toISOString(),
      email_body: bodyText.substring(0, 10000),
      was_receipt: parsedReceipt.isReceipt === true,
      gemini_response: parsedReceipt,
    });

    // Create transaction only if valid receipt (matches gmail/outlook webhook logic)
    if (parsedReceipt.isReceipt && parsedReceipt.confidence > 0.6 && parsedReceipt.amount > 0) {
      const categoryId = CATEGORY_MAP[parsedReceipt.category] || DEFAULT_CATEGORY_ID;

      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          amount: -Math.abs(parsedReceipt.amount),
          currency: parsedReceipt.currency || 'USD',
          transaction_type: 'purchase',
          category_id: categoryId,
          merchant_name: parsedReceipt.merchant || 'Unknown',
          notes: `${parsedReceipt.description || ''} [Imported from iCloud forwarding]`.trim(),
          transaction_date: parsedReceipt.date || new Date().toISOString().split('T')[0],
          source: 'email',
        })
        .select()
        .single();

      if (!txError) {
        console.log(`Imported: ${parsedReceipt.merchant} - ${parsedReceipt.amount} ${parsedReceipt.currency} - ${parsedReceipt.category}`);
        return new Response(JSON.stringify({ success: true, transaction, wasReceipt: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        console.error('Failed to insert transaction:', txError);
        return new Response(JSON.stringify({ error: 'Failed to create transaction', saved: true }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    console.log(`Skipped transaction: isReceipt=${parsedReceipt.isReceipt}, confidence=${parsedReceipt.confidence}, amount=${parsedReceipt.amount}`);
    return new Response(JSON.stringify({ success: true, wasReceipt: false, saved: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error processing email:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
