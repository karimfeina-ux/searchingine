// Cloudflare Pages Function -> /api/exclusions
import { D1Env, d1AddExclusion, d1GetExclusions, handleOptions, json } from '../_lib/d1';

export const onRequestOptions = async () => handleOptions();

export const onRequestGet = async ({ env }: { env: D1Env }) => {
  if (!env.DB) {
    return json({ names: [], phones: [] });
  }

  try {
    const exclusions = await d1GetExclusions(env.DB);
    return json(exclusions);
  } catch (err: any) {
    return json({ error: err?.message || 'Error fetching exclusions' }, 500);
  }
};

export const onRequestPost = async ({ request, env }: { request: Request; env: D1Env }) => {
  if (!env.DB) {
    return json({ success: true, offline: true });
  }

  try {
    const body: any = await request.json().catch(() => ({}));
    await d1AddExclusion(env.DB, body.name, body.phone);
    return json({ success: true });
  } catch (err: any) {
    return json({ error: err?.message || 'Error saving exclusion' }, 500);
  }
};
