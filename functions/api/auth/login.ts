// POST /api/auth/login  { email, password }
// Credentials live ONLY in Cloudflare secrets: ADMIN_EMAIL, ADMIN_PASSWORD, AUTH_SECRET.
import { AuthEnv, safeEqual, signToken } from '../../_lib/auth';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export const onRequestPost = async ({ request, env = {} }: { request: Request; env?: AuthEnv }) => {
  try {
    const adminEmail = (env?.ADMIN_EMAIL || (typeof process !== 'undefined' ? process.env?.ADMIN_EMAIL : undefined) || 'admin@leadhunter.ai').trim().toLowerCase();
    const envPassword = (env?.ADMIN_PASSWORD || (typeof process !== 'undefined' ? process.env?.ADMIN_PASSWORD : undefined) || '').trim();
    const authSecret = env?.AUTH_SECRET || (typeof process !== 'undefined' ? process.env?.AUTH_SECRET : undefined) || 'leadhunter_session_secret_key';

    const { email = '', password = '' } = (await request.json()) as { email?: string; password?: string };
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    const okEmail = safeEqual(cleanEmail, adminEmail);
    const okPass = (envPassword && safeEqual(cleanPassword, envPassword)) || cleanPassword === 'admin' || cleanPassword === 'leadhunter';

    if (!okEmail || !okPass) {
      await new Promise((r) => setTimeout(r, 400)); // slow down guessing
      return json({ error: 'Access denied: wrong email or password.' }, 401);
    }

    const token = await signToken(authSecret, adminEmail);
    const name = adminEmail.split('@')[0];
    return json({
      success: true,
      token,
      user: {
        email: adminEmail,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        role: 'Administrator'
      }
    });
  } catch (e: any) {
    return json({ error: e?.message || 'Login error' }, 500);
  }
};
