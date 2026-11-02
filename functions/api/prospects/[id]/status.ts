// Cloudflare Pages Function -> PUT /api/prospects/[id]/status
import { D1Env, d1AddExclusion, d1GetProspectById, d1UpsertProspect, handleOptions, json } from '../../../_lib/d1';

export const onRequestOptions = async () => handleOptions();

export const onRequestPut = async ({ params, request, env }: { params: { id: string }; request: Request; env: D1Env }) => {
  if (!env.DB) {
    return json({ error: 'Cloudflare D1 database binding DB is not configured' }, 503);
  }

  try {
    const prospect = await d1GetProspectById(env.DB, params.id);
    if (!prospect) {
      return json({ error: 'Prospect not found' }, 404);
    }

    const body: any = await request.json().catch(() => ({}));
    const now = new Date().toISOString();

    if (body.status) {
      prospect.status = body.status;
      const isContactedLead = ['contacted', 'waiting', 'client_signed'].includes(body.status);
      if (isContactedLead) {
        prospect.isContacted = true;
        prospect.contactedAt = prospect.contactedAt || now;
        await d1AddExclusion(env.DB, prospect.name, prospect.phone);
      } else if (body.status === 'new') {
        prospect.isContacted = false;
        prospect.contactedAt = undefined;
      }
    }

    if (body.notes !== undefined) {
      prospect.notes = body.notes;
    }

    prospect.updatedAt = now;
    const saved = await d1UpsertProspect(env.DB, prospect);
    return json(saved);
  } catch (err: any) {
    return json({ error: err?.message || 'Error updating prospect status' }, 500);
  }
};
