// Cloudflare Pages Function -> GET /api/health
// Tells the app (and you) whether cloud storage (D1) is really connected.
import { D1Env, ensureTables, handleOptions, json } from '../_lib/d1';

export const onRequestOptions = async () => handleOptions();

export const onRequestGet = async ({ env = {} }: { env?: D1Env }) => {
  const result: Record<string, unknown> = {
    ok: true,
    database: false,
    databaseWorking: false,
    googleMapsKey: Boolean((env?.GOOGLE_MAPS_API_KEY || env?.VITE_GOOGLE_MAPS_API_KEY || '').trim()),
    time: new Date().toISOString()
  };

  const db = env?.DB;
  if (db && typeof db.prepare === 'function') {
    result.database = true;
    try {
      await ensureTables(db);
      const row = await db.prepare('SELECT COUNT(*) as count FROM prospects').first<{ count: number }>();
      result.databaseWorking = true;
      result.prospectCount = row?.count ?? 0;
    } catch (err: any) {
      result.databaseError = err?.message || 'Database query failed';
    }
  }

  return json(result);
};
