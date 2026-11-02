// Cloudflare Pages Function -> PUT /api/prospects/[id]/status
import { D1Env, d1AddExclusion, d1GetProspectById, d1UpsertProspect, handleOptions, json } from '../../../_lib/d1';

export const onRequestOptions = async () => handleOptions();

export const onRequestPut = async ({ params, request, env }: { params: { id: string }; request: Request; env: D1Env }) => {
  try {
    const body: any = await request.json().catch(() => ({}));
    const now = new Date().toISOString();
    let prospect: any = null;

    if (env.DB) {
      prospect = await d1GetProspectById(env.DB, params.id);
    }

    if (!prospect && body.prospect) {
      prospect = { ...body.prospect, id: params.id };
    }

    if (!prospect) {
      prospect = {
        id: params.id,
        name: body.name || 'Business Contact',
        status: body.status || 'new',
        updatedAt: now
      };
    }

    if (body.status) {
      prospect.status = body.status;
      const isContactedLead = ['contacted', 'waiting', 'client_signed'].includes(body.status);
      if (isContactedLead) {
        prospect.isContacted = true;
        prospect.contactedAt = prospect.contactedAt || now;
      } else if (body.status === 'new') {
        prospect.isContacted = false;
        prospect.contactedAt = undefined;
      }
    }

    if (body.notes !== undefined) {
      prospect.notes = body.notes;
    }

    prospect.updatedAt = now;

    if (env.DB) {
      if (prospect.isContacted) {
        await d1AddExclusion(env.DB, prospect.name, prospect.phone);
      }
      const saved = await d1UpsertProspect(env.DB, prospect);
      return json(saved);
    }

    return json({ ...prospect, d1Configured: false });
  } catch (err: any) {
    return json({ error: err?.message || 'Error updating prospect status' }, 500);
  }
};
