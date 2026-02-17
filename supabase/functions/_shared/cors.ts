/**
 * Shared CORS Configuration for SpendTrak Edge Functions
 *
 * Replaces wildcard (*) CORS with specific allowed origins for security.
 */

// Allowed origins for SpendTrak
const ALLOWED_ORIGINS = [
  'https://spendtrak.app',
  'https://www.spendtrak.app',
  'http://localhost:8081',  // Expo dev
  'http://localhost:19006', // Expo web dev
  'exp://localhost:8081',   // Expo Go
];

// For production, set this via environment variable
const PRODUCTION_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || 'https://spendtrak.app';

/**
 * Get CORS headers for the given request origin
 */
export function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  // Check if the request origin is allowed
  const origin = requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)
    ? requestOrigin
    : PRODUCTION_ORIGIN;

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Handle CORS preflight requests
 * Returns a Response for OPTIONS requests, null otherwise
 */
export function handleCors(req: Request): Response | null {
  const origin = req.headers.get('origin');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(origin),
    });
  }

  return null; // Continue to main handler
}
