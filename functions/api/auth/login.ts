// POST /api/auth/login  { email, password }
// Credentials live ONLY in Cloudflare secrets: ADMIN_EMAIL, ADMIN_PASSWORD, AUTH_SECRET.
import { AuthEnv, safeEqual, signToken } from '../../_lib/auth';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export const onRequestPost = async ({ request, env }: { request: Request; env: AuthEnv }) => {
  try {
    if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD || !env.AUTH_SECRET) {
      return json({ error: 'Login is not configured: add ADMIN_EMAIL, ADMIN_PASSWORD and AUTH_SECRET in Cloudflare (Settings → Variables and Secrets).' }, 500);
    }
    const { email = '', password = '' } = (await request.json()) as { email?: string; password?: string };
    const okEmail = safeEqual(String(email).trim().toLowerCase(), env.ADMIN_EMAIL.trim().toLowerCase());
    const okPass = safeEqual(String(password), env.ADMIN_PASSWORD);
    if (!okEmail || !okPass) {
      await new Promise((r) => setTimeout(r, 600)); // slow down guessing
      return json({ error: 'Access denied: wrong email or password.' }, 401);
    }
    const token = await signToken(env.AUTH_SECRET, env.ADMIN_EMAIL);
    const name = env.ADMIN_EMAIL.split('@')[0];
    return json({ success: true, token, user: { email: env.ADMIN_EMAIL, name: name.charAt(0).toUpperCase() + name.slice(1), role: 'Administrator' } });
  } catch (e: any) {
    return json({ error: e?.message || 'Login error' }, 500);
  }
};
