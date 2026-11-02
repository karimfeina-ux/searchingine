// GET /api/auth/verify
import { AuthEnv, verifyToken } from '../../_lib/auth';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*'
    }
  });

export const onRequestOptions = async () =>
  new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });

export const onRequestGet = async ({ request, env = {} }: { request: Request; env?: AuthEnv }) => {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const authSecret = env?.AUTH_SECRET || (typeof process !== 'undefined' ? process.env?.AUTH_SECRET : undefined) || 'leadhunter_session_secret_key';

  if (!token) {
    return json({ verified: false }, 401);
  }

  const email = await verifyToken(authSecret, token);
  if (!email) {
    return json({ verified: false }, 401);
  }

  return json({ verified: true, email });
};
