// Cloudflare Pages Function -> POST /api/prospects/[id]/star
import { D1Env, d1GetProspectById, d1UpsertProspect, handleOptions, json } from '../../../_lib/d1';

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

    prospect.isStarred = !prospect.isStarred;
    prospect.updatedAt = new Date().toISOString();
    await d1UpsertProspect(env.DB, prospect);
    return json({ isStarred: prospect.isStarred });
  } catch (err: any) {
    return json({ error: err?.message || 'Error toggling star' }, 500);
  }
};
