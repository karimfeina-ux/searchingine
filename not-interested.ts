// Cloudflare Pages Function -> POST /api/prospects/[id]/not-interested
import { D1Env, d1DeleteProspect, handleOptions, json } from '../../../_lib/d1';

export const onRequestOptions = async () => handleOptions();

export const onRequestPost = async ({ params, env }: { params: { id: string }; env: D1Env }) => {
  if (!env.DB) {
    return json({ error: 'Cloudflare D1 database binding DB is not configured' }, 503);
  }

  try {
    const result = await d1DeleteProspect(env.DB, params.id);
    return json({ success: true, deletedId: params.id, reason: 'Excluded and removed from research' });
  } catch (err: any) {
    return json({ error: err?.message || 'Error marking not interested' }, 500);
  }
};
