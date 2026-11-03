// Cloudflare Pages Function -> /api/stats
import { D1Env, d1ComputeStats, handleOptions, json } from '../_lib/d1';

export const onRequestOptions = async () => handleOptions();

export const onRequestGet = async ({ env }: { env: D1Env }) => {
  if (!env.DB) {
    return json({
      totalLeads: 0,
      noWebsiteCount: 0,
      highPriorityCount: 0,
      readyToContactCount: 0,
      clickedCount: 0,
      contactedCount: 0,
      clientsWonCount: 0,
      avgScore: 0
    });
  }

  try {
    const stats = await d1ComputeStats(env.DB);
    return json(stats);
  } catch (err: any) {
    return json({ error: err?.message || 'Error computing stats' }, 500);
  }
};
