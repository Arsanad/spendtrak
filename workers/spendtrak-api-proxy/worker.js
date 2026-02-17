export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      });
    }

    const url = new URL(request.url);

    // Replace custom domain with actual Supabase URL
    url.hostname = 'khzzyztmurvdzemlnbym.supabase.co';

    // Create new request with modified URL
    // CRITICAL: redirect must be 'manual' so that Edge Function redirects
    // (e.g. to Google OAuth or spendtrak:// deep links) are passed through
    // to the browser instead of being followed internally by the Worker.
    const modifiedRequest = new Request(url.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'manual',
    });

    // Forward to Supabase
    const response = await fetch(modifiedRequest);

    // Return response with CORS headers
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', '*');

    return newResponse;
  },
};
