/**
 * Parse Receipt Edge Function
 * Uses OpenAI GPT-4o Vision to extract data from receipt images
 *
 * NOTE: This is a LEGACY function. The primary receipt scanning now uses
 * Gemini 2.0 Flash via the scan-receipt Edge Function, which offers:
 * - Lower cost per scan
 * - Faster response times
 * - Better multi-language support
 *
 * This OpenAI-based function is kept for backwards compatibility and may be
 * removed in a future release. New code should use scan-receipt instead.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

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
    const { createClient: createSupabaseClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabaseAuth = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }
    // ===== END AUTH BLOCK =====

    const { image_url } = await req.json();
    const user_id = user.id; // From JWT - cannot be spoofed

    if (!image_url) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    // Call OpenAI GPT-4o Vision API (highest accuracy for receipt parsing)
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a receipt parser that works with receipts from any country.

Extract the following from the receipt image:
1. total_amount: The final total (look for "Total", "Grand Total", or similar)
2. currency: Detect the currency from symbols ($, €, £, ¥, etc.) or text (USD, EUR, GBP, etc.)
3. merchant_name: Store/restaurant name
4. transaction_date: Date of purchase (format: YYYY-MM-DD)
5. items: Array of line items if visible [{name, quantity, price}]
6. payment_method: Card, Cash, or other
7. vat_amount: VAT/tax amount if shown
8. category_suggestion: One of [food-dining, transportation, shopping, entertainment, bills-utilities, health, travel, education, personal-care, housing, family, other]

Return JSON only:
{
  "total_amount": number,
  "currency": "USD",
  "merchant_name": "string",
  "transaction_date": "YYYY-MM-DD",
  "items": [{"name": "string", "quantity": number, "price": number}],
  "payment_method": "card" | "cash" | "other",
  "vat_amount": number | null,
  "category_suggestion": "string",
  "confidence": 0.0-1.0
}

If any field cannot be determined, use null. Always include confidence score.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: image_url },
              },
              {
                type: 'text',
                text: 'Parse this receipt and extract the transaction details. Return only valid JSON.',
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    // Parse the JSON response
    let parsedData;
    try {
      // Remove markdown code blocks if present
      const jsonString = content.replace(/```json\n?|\n?```/g, '').trim();
      parsedData = JSON.parse(jsonString);
    } catch (parseError) {
      throw new Error(`Failed to parse OpenAI response: ${content}`);
    }

    // Validate required fields
    if (!parsedData.total_amount || !parsedData.merchant_name) {
      parsedData.confidence = Math.min(parsedData.confidence || 0.5, 0.5);
    }

    // Update receipt scan record
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: parsedData
      }),
      {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error parsing receipt:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' }
      }
    );
  }
});
