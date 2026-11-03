// Tiny signed-token helper (HMAC-SHA256 via WebCrypto). Not a route: it exports no onRequest handlers.
export interface AuthEnv {
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
  AUTH_SECRET?: string;
}

const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

async function hmac(secret: string, data: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function signToken(secret: string, email: string, days = 30) {
  const payload = b64url(enc.encode(JSON.stringify({ email, exp: Date.now() + days * 86400000 })));
  return `${payload}.${await hmac(secret, payload)}`;
}

export async function verifyToken(secret: string | undefined, token: string | null): Promise<string | null> {
  if (!secret || !token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig || !safeEqual(sig, await hmac(secret, payload))) return null;
  try {
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return json.exp > Date.now() ? String(json.email) : null;
  } catch {
    return null;
  }
}
