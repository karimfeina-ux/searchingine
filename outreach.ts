// Cloudflare Pages Function -> /api/prospects/[id]/outreach
import { D1Env, d1GetProspectById, handleOptions, json } from '../../../_lib/d1';

export const onRequestOptions = async () => handleOptions();

export const onRequestGet = async ({ params, env }: { params: { id: string }; env: D1Env }) => {
  if (!env.DB) {
    return json([]);
  }

  try {
    const prospect = await d1GetProspectById(env.DB, params.id);
    if (!prospect) {
      return json({ error: 'Prospect not found' }, 404);
    }
    return json(prospect.outreachDrafts || []);
  } catch (err: any) {
    return json({ error: err?.message || 'Error fetching outreach drafts' }, 500);
  }
};

export const onRequestPost = async ({ params, request, env }: { params: { id: string }; request: Request; env: D1Env }) => {
  if (!env.DB) {
    return json({ error: 'Cloudflare D1 database binding DB is not configured' }, 503);
  }

  try {
    const prospect = await d1GetProspectById(env.DB, params.id);
    if (!prospect) {
      return json({ error: 'Prospect not found' }, 404);
    }

    const body: any = await request.json().catch(() => ({}));
    const channel = body.channel || 'whatsapp';
    const language = body.language || 'es';

    const greeting = language === 'es' ? `Hola ${prospect.name},` : `Hi ${prospect.name},`;
    const pitch = language === 'es'
      ? `Me fijé en que tenéis excelentes reseñas en Google (${(prospect.reviewRating || 4.5).toFixed(1)}★), pero no disponéis de una web propia para reservas directas y captar clientes en ${prospect.city}. Os he preparado una propuesta personalizada para tener una web moderna sin complicaciones.`
      : `I noticed your strong Google reviews (${(prospect.reviewRating || 4.5).toFixed(1)}★), but no independent website for direct bookings and search clients in ${prospect.city}. I put together a quick proposal for a modern site tailored to your business.`;

    const draft = {
      id: `draft_${Date.now()}`,
      prospectId: prospect.id,
      channel,
      recipient: prospect.phone || prospect.email || '',
      subject: language === 'es' ? `Propuesta web para ${prospect.name}` : `Website concept for ${prospect.name}`,
      body: `${greeting}\n\n${pitch}\n\n¿Te interesaría que te comparta una vista previa sin compromiso?`,
      status: 'draft',
      createdAt: new Date().toISOString()
    };

    return json(draft);
  } catch (err: any) {
    return json({ error: err?.message || 'Error generating outreach' }, 500);
  }
};
