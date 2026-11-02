// Cloudflare Pages Function -> /api/prospects/[id]
import { D1Env, d1DeleteProspect, d1GetProspectById, d1UpsertProspect, handleOptions, json } from '../../_lib/d1';

export const onRequestOptions = async () => handleOptions();

export const onRequestGet = async ({ params, env }: { params: { id: string }; env: D1Env }) => {
  if (!env.DB) {
    return json({ error: 'Cloudflare D1 database binding DB is not configured' }, 503);
  }

  try {
    const prospect = await d1GetProspectById(env.DB, params.id);
    if (!prospect) {
      return json({ error: 'Prospect not found' }, 404);
    }
    return json(prospect);
  } catch (err: any) {
    return json({ error: err?.message || 'Error fetching prospect' }, 500);
  }
};

export const onRequestPut = async ({ params, request, env }: { params: { id: string }; request: Request; env: D1Env }) => {
  if (!env.DB) {
    return json({ error: 'Cloudflare D1 database binding DB is not configured' }, 503);
  }

  try {
    const existing = await d1GetProspectById(env.DB, params.id);
    if (!existing) {
      return json({ error: 'Prospect not found' }, 404);
    }

    const updates = await request.json().catch(() => ({}));
    const merged = { ...existing, ...updates, id: params.id, updatedAt: new Date().toISOString() };
    const saved = await d1UpsertProspect(env.DB, merged);
    return json(saved);
  } catch (err: any) {
    return json({ error: err?.message || 'Error updating prospect' }, 500);
  }
};

export const onRequestDelete = async ({ params, env }: { params: { id: string }; env: D1Env }) => {
  if (!env.DB) {
    return json({ error: 'Cloudflare D1 database binding DB is not configured' }, 503);
  }

  try {
    const result = await d1DeleteProspect(env.DB, params.id);
    return json(result);
  } catch (err: any) {
    return json({ error: err?.message || 'Error deleting prospect' }, 500);
  }
};
