// Cloudflare Pages Function -> /api/prospects
import { D1Env, d1GetProspects, d1UpsertBatch, d1UpsertProspect, handleOptions, json } from '../../_lib/d1';

export const onRequestOptions = async () => handleOptions();

export const onRequestGet = async ({ request, env = {} }: { request: Request; env?: D1Env }) => {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const websiteStatus = url.searchParams.get('websiteStatus');
    const search = url.searchParams.get('search');
    const hideContacted = url.searchParams.get('hideContacted') === 'true';
    const isContacted = url.searchParams.get('isContacted') === 'true';
    const limit = url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : 500;

    const result = await d1GetProspects(env?.DB, {
      status,
      websiteStatus,
      search,
      hideContacted,
      isContacted,
      limit
    });

    return json(result);
  } catch (err: any) {
    return json({ error: err?.message || 'Failed to fetch prospects' }, 500);
  }
};

export const onRequestPost = async ({ request, env = {} }: { request: Request; env?: D1Env }) => {
  try {
    const body: any = await request.json().catch(() => ({}));
    if (Array.isArray(body)) {
      const result = await d1UpsertBatch(env?.DB, body);
      return json({ success: true, count: result.count });
    }
    if (body.items && Array.isArray(body.items)) {
      const result = await d1UpsertBatch(env?.DB, body.items);
      return json({ success: true, count: result.count });
    }
    if (body.id) {
      const saved = await d1UpsertProspect(env?.DB, body);
      return json(saved);
    }
    return json({ error: 'Invalid payload: expected prospect object or items array' }, 400);
  } catch (err: any) {
    return json({ error: err?.message || 'Failed to save prospects' }, 500);
  }
};

export const onRequestPut = onRequestPost;
