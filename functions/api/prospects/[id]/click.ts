// Cloudflare Pages Function -> POST /api/prospects/[id]/click
import { D1Env, d1AddExclusion, d1GetProspectById, d1UpsertProspect, handleOptions, json } from '../../../_lib/d1';

export const onRequestOptions = async () => handleOptions();

export const onRequestPost = async ({ params, env }: { params: { id: string }; env: D1Env }) => {
  if (!env.DB) {
    return json({ error: 'Cloudflare D1 database binding DB is not configured' }, 503);
  }

  try {
    const prospect = await d1GetProspectById(env.DB, params.id);
    if (!prospect) {
      return json({ error: 'Prospect not found' }, 404);
    }

    const now = new Date().toISOString();
    prospect.isClicked = true;
    prospect.clickedAt = now;
    prospect.updatedAt = now;

    await d1AddExclusion(env.DB, prospect.name, prospect.phone);
    const saved = await d1UpsertProspect(env.DB, prospect);
    return json(saved);
  } catch (err: any) {
    return json({ error: err?.message || 'Error tracking click' }, 500);
  }
};
