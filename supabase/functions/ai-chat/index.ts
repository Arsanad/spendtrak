/**
 * AI Chat Edge Function
 *
 * Secure server-side proxy for Gemini AI calls.
 * The API key is stored in Supabase secrets, never exposed to client.
 *
 * This function:
 * 1. Verifies user authentication
 * 2. Validates and sanitizes input
 * 3. Calls Gemini API with server-side API key
 * 4. Returns AI response to authenticated users only
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';

// Server-side only - NEVER exposed to client
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Request timeout in milliseconds
const REQUEST_TIMEOUT_MS = 30000;

/**
 * Sanitize user input to prevent prompt injection attacks
 */
function sanitizeUserInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Limit length (prevent token bombing)
  sanitized = sanitized.slice(0, 2000);

  // Remove common prompt injection patterns
  const injectionPatterns = [
    /ignore\s+(?:all\s+)?(?:previous\s+|above\s+)?instructions?/gi,
    /you\s+are\s+now/gi,
    /new\s+instructions?:/gi,
    /system\s*prompt/gi,
    /\[INST\]/gi,
    /<<SYS>>/gi,
    /<\|im_start\|>/gi,
    /<\|im_end\|>/gi,
    /\[system\]/gi,
    /\[assistant\]/gi,
    /\[user\]/gi,
    /```system/gi,
    /```instruction/gi,
    /override\s+(?:your\s+)?(?:previous\s+)?(?:instructions?|rules?)/gi,
    /disregard\s+(?:your\s+)?(?:previous\s+)?(?:instructions?|rules?)/gi,
    /forget\s+(?:your\s+)?(?:previous\s+)?(?:instructions?|rules?)/gi,
    /pretend\s+(?:you\s+are|to\s+be)/gi,
    /act\s+as\s+(?:if|a|an)/gi,
    /roleplay\s+as/gi,
    /jailbreak/gi,
    /DAN\s+mode/gi,
    /developer\s+mode/gi,
  ];

  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, '[filtered]');
  }

  return sanitized.trim();
}

/**
 * Validate message structure
 */
function validateMessages(messages: unknown): messages is Array<{ role: string; content: string }> {
  if (!Array.isArray(messages)) return false;
  return messages.every(
    (msg) =>
      typeof msg === 'object' &&
      msg !== null &&
      typeof (msg as Record<string, unknown>).role === 'string' &&
      typeof (msg as Record<string, unknown>).content === 'string'
  );
}

/**
 * Call Gemini API with timeout
 */
async function callGeminiWithTimeout(
  contents: unknown[],
  systemPrompt: string | undefined,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        ...(systemPrompt && {
          systemInstruction: { parts: [{ text: systemPrompt }] },
        }),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          topP: 0.95,
          topK: 40,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      }),
      signal: controller.signal,
    });

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
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
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 503, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - missing or invalid token' }),
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
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const { messages, systemPrompt } = body;

    if (!validateMessages(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid messages format' }),
        { status: 400, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize all user messages
    const sanitizedMessages = messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.role === 'user' ? sanitizeUserInput(msg.content) : msg.content }],
    }));

    // Call Gemini API with timeout
    let geminiResponse: Response;
    try {
      geminiResponse = await callGeminiWithTimeout(
        sanitizedMessages,
        systemPrompt,
        REQUEST_TIMEOUT_MS
      );
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return new Response(
          JSON.stringify({
            error: 'Request timed out',
            message: "The AI is taking too long to respond. Please try again."
          }),
          { status: 504, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json().catch(() => ({}));
      console.error('Gemini API error:', geminiResponse.status, errorData);

      // Handle rate limiting
      if (geminiResponse.status === 429) {
        return new Response(
          JSON.stringify({
            error: 'Rate limited',
            message: "Too many requests. Please wait a moment and try again."
          }),
          { status: 429, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          error: 'AI service error',
          message: "I'm having trouble connecting right now. Please try again in a moment."
        }),
        { status: 502, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    const data = await geminiResponse.json();

    // Extract response text
    const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      console.error('No content in Gemini response:', data);
      return new Response(
        JSON.stringify({
          error: 'Empty response',
          message: "I couldn't generate a response. Please try again."
        }),
        { status: 500, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    // Log usage for monitoring (without sensitive data)
    console.log(`AI chat: user=${user.id.substring(0, 8)}... tokens=${data?.usageMetadata?.totalTokenCount || 'unknown'}`);

    return new Response(
      JSON.stringify({
        success: true,
        response: responseText,
        usage: data?.usageMetadata,
      }),
      { headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI chat error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: "Something went wrong. Please try again."
      }),
      { status: 500, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    );
  }
});
