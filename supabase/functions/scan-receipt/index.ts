/**
 * Receipt Scanning Edge Function
 *
 * Secure server-side proxy for Gemini Vision API calls.
 * The API key is stored in Supabase secrets, never exposed to client.
 *
 * This function:
 * 1. Verifies user authentication
 * 2. Accepts base64 image data
 * 3. Calls Gemini Vision API with server-side API key
 * 4. Returns parsed receipt data to authenticated users only
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';

// Server-side only - NEVER exposed to client
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Request timeout in milliseconds (receipts may take longer)
const REQUEST_TIMEOUT_MS = 45000;

// System prompt for receipt extraction
const RECEIPT_EXTRACTION_PROMPT = `You are a receipt data extraction expert. Analyze the receipt image and extract all information into the exact JSON schema provided.

Rules:
- Extract ALL visible line items, don't summarize
- Auto-categorize each item based on name (food, grocery, transport, entertainment, utilities, healthcare, shopping, other)
- Convert all prices to numbers (remove currency symbols)
- Detect currency from symbols or context ($ = USD, د.إ = AED, € = EUR, £ = GBP, ¥ = JPY/CNY)
- Date format: YYYY-MM-DD (convert from any format)
- If a field is not visible/readable, omit it (don't guess)
- Set confidence_score based on image quality and extraction certainty
- For unclear items, make best effort but lower confidence_score

Return ONLY valid JSON matching this exact schema:
{
  "merchant": {
    "name": "string",
    "address": "string (optional)",
    "phone": "string (optional)"
  },
  "transaction": {
    "date": "YYYY-MM-DD",
    "time": "HH:MM (optional)",
    "receipt_number": "string (optional)"
  },
  "items": [
    {
      "name": "string",
      "quantity": number,
      "unit_price": number,
      "total_price": number,
      "category": "food|grocery|transport|entertainment|utilities|healthcare|shopping|other"
    }
  ],
  "payment": {
    "subtotal": number,
    "tax": number (optional),
    "tip": number (optional),
    "discount": number (optional),
    "total": number,
    "method": "cash|credit|debit|mobile (optional)",
    "card_last_four": "string (optional)"
  },
  "currency": "USD|AED|EUR|GBP|etc",
  "confidence_score": 0.0-1.0
}

No explanations, only valid JSON.`;

/**
 * Call Gemini Vision API with timeout
 */
async function callGeminiVisionWithTimeout(
  base64Image: string,
  mimeType: string,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: RECEIPT_EXTRACTION_PROMPT },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1, // Low temperature for more consistent extraction
          topK: 32,
          topP: 1,
          maxOutputTokens: 4096,
        },
      }),
      signal: controller.signal,
    });

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Parse and validate receipt JSON from Gemini response
 */
function parseReceiptJson(textContent: string): Record<string, unknown> {
  // Remove markdown code blocks if present
  const jsonString = textContent
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  const parsedData = JSON.parse(jsonString);

  // Validate required fields and adjust confidence if missing
  if (!parsedData.merchant?.name || !parsedData.payment?.total) {
    parsedData.confidence_score = Math.min(parsedData.confidence_score || 0.5, 0.5);
  }

  return parsedData;
}

/**
 * Detect MIME type from base64 header or default to JPEG
 */
function detectMimeType(base64: string): string {
  if (base64.startsWith('/9j/')) return 'image/jpeg';
  if (base64.startsWith('iVBORw0KGgo')) return 'image/png';
  if (base64.startsWith('R0lGOD')) return 'image/gif';
  if (base64.startsWith('UklGR')) return 'image/webp';
  return 'image/jpeg'; // Default
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('origin');

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Check if API key is configured
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured in Supabase secrets');
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 503, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - missing or invalid token' }),
        { status: 401, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { status: 401, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { image, mimeType: providedMimeType } = body;

    if (!image || typeof image !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing or invalid image data' }),
        { status: 400, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    // Validate image size (max ~4MB base64 which is ~3MB actual)
    if (image.length > 4 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ success: false, error: 'Image too large. Please use a smaller image.' }),
        { status: 400, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    // Detect or use provided MIME type
    const mimeType = providedMimeType || detectMimeType(image);

    // Call Gemini Vision API with timeout
    let geminiResponse: Response;
    try {
      geminiResponse = await callGeminiVisionWithTimeout(image, mimeType, REQUEST_TIMEOUT_MS);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return new Response(
          JSON.stringify({ success: false, error: 'Request timed out. Please try again.' }),
          { status: 504, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json().catch(() => ({}));
      console.error('Gemini Vision API error:', geminiResponse.status, errorData);

      // Handle rate limiting
      if (geminiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'RATE_LIMIT' }),
          { status: 429, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: `API error: ${geminiResponse.status}` }),
        { status: 502, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    const data = await geminiResponse.json();

    // Extract text content from Gemini response
    const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      console.error('No content in Gemini response:', data);
      return new Response(
        JSON.stringify({ success: false, error: 'No content in API response' }),
        { status: 500, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response
    let parsedData;
    try {
      parsedData = parseReceiptJson(textContent);
    } catch (parseError) {
      console.error('Failed to parse receipt JSON:', textContent.substring(0, 500));
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to parse receipt data' }),
        { status: 500, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    // Log usage for monitoring (without sensitive data)
    console.log(`Receipt scan: user=${user.id.substring(0, 8)}... merchant=${parsedData.merchant?.name || 'unknown'}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: parsedData,
      }),
      { headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Receipt scan error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    );
  }
});
