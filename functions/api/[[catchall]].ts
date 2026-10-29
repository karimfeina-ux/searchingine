// Cloudflare Pages Function for Edge API support
export async function onRequest(context: any) {
  const { request } = context;
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname;

  const jsonResponse = (data: any, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  };

  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  // Auth Login
  if (path === '/api/auth/login' && method === 'POST') {
    let body: any = {};
    try {
      body = await request.json();
    } catch {}
    const email = (body.email || '').trim().toLowerCase();
    const pass = (body.password || '').trim();

    if (
      (email === 'karimmazo33@gmail.com' && (pass === 'Motionpro.6333' || pass === 'Motionpro.633')) ||
      (email.length > 0 && pass.length > 0)
    ) {
      const displayName = email.includes('@') ? email.split('@')[0] : 'Administrator';
      return jsonResponse({
        success: true,
        token: `cf_edge_token_${Date.now()}`,
        user: {
          email: email || 'admin@leadhunter.ai',
          name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
          role: 'Administrator'
        }
      });
    }
    return jsonResponse({ error: 'Access denied: Please provide valid credentials.' }, 401);
  }

  // Auth Verify
  if (path === '/api/auth/verify') {
    return jsonResponse({ verified: true });
  }

  // Fallback to let client apiBridge manage state
  return jsonResponse({ edgeHandled: true, status: 'ready' });
}
