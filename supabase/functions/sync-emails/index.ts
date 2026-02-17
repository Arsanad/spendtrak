/**
 * Sync Emails Edge Function
 * Fetches and parses bank transaction emails
 *
 * NOTE: This function uses OpenAI GPT-4o-mini for email parsing because:
 * 1. GPT-4o-mini excels at structured text extraction from emails
 * 2. Cost-effective for high-volume batch processing of bank notifications
 * 3. Better at handling diverse email formats from global banks
 *
 * Receipt scanning (images) uses Gemini, while email parsing (text) uses OpenAI.
 * This provider split optimizes for each modality's strengths.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

// Global bank email domains - major banks from US, UK, EU, India, Australia, Canada
const BANK_EMAIL_DOMAINS = [
  // United States
  'chase.com', 'jpmchase.com',
  'bankofamerica.com', 'bofa.com',
  'wellsfargo.com', 'wf.com',
  'citi.com', 'citibank.com', 'citigroup.com',
  'usbank.com',
  'capitalone.com',
  'americanexpress.com', 'aexp.com',
  'discover.com', 'discovercard.com',
  // United Kingdom
  'barclays.com', 'barclays.co.uk', 'barclaycard.co.uk',
  'hsbc.com', 'hsbc.co.uk', 'uk.hsbc.com',
  'lloydsbank.com', 'lloydsbank.co.uk',
  'natwest.com',
  'santander.co.uk',
  // Europe
  'deutsche-bank.de', 'db.com',
  'ing.com', 'ing.nl', 'ing.de',
  'bnpparibas.com', 'bnpparibas.fr',
  // India
  'icicibank.com',
  'hdfcbank.com', 'hdfc.com',
  'sbi.co.in', 'onlinesbi.com',
  'axisbank.com',
  // Australia
  'commbank.com.au', 'cba.com.au',
  'anz.com', 'anz.com.au',
  'westpac.com.au',
  'nab.com.au',
  // Canada
  'rbc.com', 'royalbank.com',
  'td.com', 'tdbank.com',
  'scotiabank.com',
];

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('origin');

  try {
    // ===== SECURITY: Require JWT authentication =====
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }
    // ===== END AUTH BLOCK =====

    const { connection_id } = await req.json();
    const user_id = user.id; // From JWT - cannot be spoofed

    // Get email connection
    const { data: connection, error: connectionError } = await supabase
      .from('email_connections')
      .select('*')
      .eq('id', connection_id)
      .eq('user_id', user_id)
      .single();

    if (connectionError || !connection) {
      throw new Error('Email connection not found');
    }

    // Get user's preferred currency
    const { data: user } = await supabase
      .from('users')
      .select('default_currency')
      .eq('id', user_id)
      .single();

    const userCurrency = user?.default_currency || 'USD';

    // Update sync status
    await supabase
      .from('email_connections')
      .update({ sync_status: 'syncing' })
      .eq('id', connection_id);

    let emails: any[] = [];

    if (connection.provider === 'google') {
      emails = await fetchGmailEmails(connection);
    } else if (connection.provider === 'microsoft') {
      emails = await fetchOutlookEmails(connection);
    }

    // Process each email
    const results = [];
    for (const email of emails) {
      // Check if already processed
      const { data: existing } = await supabase
        .from('processed_emails')
        .select('id')
        .eq('message_id', email.id)
        .eq('user_id', user_id)
        .single();

      if (existing) continue;

      // Process as bank transaction email
      const processResult = await processBankEmail(email, user_id, userCurrency, supabase);
      results.push(processResult);
    }

    // Update sync status
    await supabase
      .from('email_connections')
      .update({
        sync_status: 'completed',
        last_sync_at: new Date().toISOString(),
        sync_error: null,
      })
      .eq('id', connection_id);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results
      }),
      { headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error syncing emails:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
    );
  }
});

async function fetchGmailEmails(connection: any) {
  // Refresh token if needed
  const accessToken = await refreshGoogleToken(connection);

  // Build search query for bank emails
  const bankQueries = BANK_EMAIL_DOMAINS.map(d => `from:${d}`).join(' OR ');
  const query = `(${bankQueries}) newer_than:7d`;

  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Gmail messages');
  }

  const data = await response.json();
  const messages = data.messages || [];

  // Fetch full message details
  const emails = [];
  for (const msg of messages.slice(0, 20)) { // Limit to 20 per sync
    const msgResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (msgResponse.ok) {
      const fullMsg = await msgResponse.json();
      emails.push(parseGmailMessage(fullMsg));
    }
  }

  return emails;
}

async function fetchOutlookEmails(connection: any) {
  const accessToken = await refreshMicrosoftToken(connection);

  // Build filter for bank emails
  const filterQueries = BANK_EMAIL_DOMAINS.map(d => `contains(from/emailAddress/address, '${d}')`).join(' or ');

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/messages?$filter=${encodeURIComponent(filterQueries)}&$top=50&$orderby=receivedDateTime desc`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Outlook messages');
  }

  const data = await response.json();
  return (data.value || []).map(parseOutlookMessage);
}

function parseGmailMessage(msg: any) {
  const headers = msg.payload?.headers || [];
  const getHeader = (name: string) =>
    headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;

  let body = '';
  if (msg.payload?.body?.data) {
    body = atob(msg.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
  } else if (msg.payload?.parts) {
    const textPart = msg.payload.parts.find((p: any) => p.mimeType === 'text/plain');
    if (textPart?.body?.data) {
      body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    }
  }

  return {
    id: msg.id,
    threadId: msg.threadId,
    subject: getHeader('Subject') || '',
    from: getHeader('From') || '',
    date: getHeader('Date') || '',
    body,
  };
}

function parseOutlookMessage(msg: any) {
  return {
    id: msg.id,
    threadId: msg.conversationId,
    subject: msg.subject || '',
    from: msg.from?.emailAddress?.address || '',
    date: msg.receivedDateTime || '',
    body: msg.body?.content || '',
  };
}

async function processBankEmail(email: any, userId: string, userCurrency: string, supabase: any) {
  // Use GPT to extract transaction data
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a bank transaction email parser that works with banks worldwide.

Extract transaction details from this bank notification email:
1. amount: Transaction amount (number only)
2. currency: Currency code (USD, EUR, GBP, INR, AUD, CAD, etc.) - detect from the email content
3. merchant_name: Where the transaction occurred
4. transaction_date: Date (format: YYYY-MM-DD)
5. transaction_time: Time if available (HH:MM)
6. card_last_four: Last 4 digits of card
7. transaction_type: purchase, payment, refund, atm
8. category_suggestion: Suggest category based on merchant

Return JSON only:
{
  "amount": number,
  "currency": "string",
  "merchant_name": "string",
  "transaction_date": "YYYY-MM-DD",
  "transaction_time": "HH:MM" | null,
  "card_last_four": "string",
  "transaction_type": "string",
  "category_suggestion": "string",
  "confidence": 0.0-1.0
}`,
        },
        {
          role: 'user',
          content: `Subject: ${email.subject}\n\nBody: ${email.body.substring(0, 2000)}`,
        },
      ],
      max_tokens: 500,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    // Log as error
    await supabase.from('processed_emails').insert({
      user_id: userId,
      message_id: email.id,
      thread_id: email.threadId,
      subject: email.subject,
      sender: email.from,
      received_at: email.date,
      processing_result: 'error',
      error_message: 'Failed to parse with GPT',
    });
    return { id: email.id, status: 'error' };
  }

  const gptData = await response.json();
  const content = gptData.choices[0]?.message?.content;

  let parsedData;
  try {
    const jsonString = content.replace(/```json\n?|\n?```/g, '').trim();
    parsedData = JSON.parse(jsonString);
  } catch {
    await supabase.from('processed_emails').insert({
      user_id: userId,
      message_id: email.id,
      thread_id: email.threadId,
      subject: email.subject,
      sender: email.from,
      received_at: email.date,
      processing_result: 'error',
      error_message: 'Failed to parse GPT response',
    });
    return { id: email.id, status: 'error' };
  }

  // Get category ID
  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .ilike('name', `%${parsedData.category_suggestion}%`)
    .limit(1)
    .single();

  // Create transaction (use detected currency or user's default)
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      amount: parsedData.amount,
      currency: parsedData.currency || userCurrency,
      merchant_name: parsedData.merchant_name,
      category_id: category?.id,
      transaction_date: parsedData.transaction_date,
      transaction_time: parsedData.transaction_time,
      source: 'email',
      card_last_four: parsedData.card_last_four,
      transaction_type: parsedData.transaction_type || 'purchase',
      metadata: { email_id: email.id, confidence: parsedData.confidence },
    })
    .select()
    .single();

  // Log processed email
  await supabase.from('processed_emails').insert({
    user_id: userId,
    message_id: email.id,
    thread_id: email.threadId,
    subject: email.subject,
    sender: email.from,
    received_at: email.date,
    processing_result: 'transaction',
    transaction_id: transaction?.id,
  });

  return { id: email.id, status: 'success', transaction_id: transaction?.id };
}

async function refreshGoogleToken(connection: any) {
  if (!connection.refresh_token) {
    return connection.access_token;
  }

  const tokenExpiry = new Date(connection.token_expires_at);
  if (tokenExpiry > new Date()) {
    return connection.access_token;
  }

  // Refresh token
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
      refresh_token: connection.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Google token');
  }

  const data = await response.json();

  // Update stored token
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  await supabase
    .from('email_connections')
    .update({
      access_token: data.access_token,
      token_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    })
    .eq('id', connection.id);

  return data.access_token;
}

async function refreshMicrosoftToken(connection: any) {
  // Similar pattern to Google token refresh
  return connection.access_token;
}
