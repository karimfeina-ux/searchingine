// Cloudflare Pages Function -> POST /api/prospects/[id]/contact
import { D1Env, d1AddExclusion, d1GetProspectById, d1UpsertProspect, handleOptions, json } from '../../../_lib/d1';

export const onRequestOptions = async () => handleOptions();

export const onRequestPost = async ({ params, request, env = {} }: { params: { id: string }; request: Request; env?: D1Env }) => {
  try {
    const body: any = await request.json().catch(() => ({}));
    const now = new Date().toISOString();
    let prospect: any = await d1GetProspectById(env?.DB, params.id);

    if (!prospect && body.prospect) {
      prospect = { ...body.prospect, id: params.id };
    }

    if (!prospect) {
      prospect = {
        id: params.id,
        name: body.name || 'Business Contact',
        status: body.status || 'contacted',
        isContacted: true,
        contactedAt: now,
        updatedAt: now
      };
    }

    prospect.isContacted = body.contacted !== false;
    prospect.contactedAt = prospect.contactedAt || now;
    if (body.status) {
      prospect.status = body.status;
    } else if (prospect.isContacted && (!prospect.status || prospect.status === 'new')) {
      prospect.status = 'contacted';
    }
    if (body.notes !== undefined) {
      prospect.notes = body.notes;
    }
    prospect.updatedAt = now;

    await d1AddExclusion(env?.DB, prospect.name, prospect.phone);
    const saved = await d1UpsertProspect(env?.DB, prospect);
    return json(saved);
  } catch (err: any) {
    return json({ error: err?.message || 'Error marking prospect as contacted' }, 500);
  }
};
