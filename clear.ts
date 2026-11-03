// Cloudflare Pages Function -> POST /api/prospects/clear
import { D1Env, d1ClearProspects, handleOptions, json } from '../../_lib/d1';

export const onRequestOptions = async () => handleOptions();

export const onRequestPost = async ({ request, env }: { request: Request; env: D1Env }) => {
  if (!env.DB) {
    return json({ success: true, deletedCount: 0, remainingCount: 0 });
  }

  try {
    const body: any = await request.json().catch(() => ({}));
    const result = await d1ClearProspects(env.DB, {
      ...body,
      keepContacted: true,
      cleanAll: false
    });
    return json(result);
  } catch (err: any) {
    return json({ error: err?.message || 'Error clearing prospects' }, 500);
  }
};
