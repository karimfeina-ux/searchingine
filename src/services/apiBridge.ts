import {
  getClientSettings,
  saveClientSettings,
  getStoredProspects,
  saveStoredProspects,
  addExclusion,
  runClientDeepSearch,
  computeStats,
  createClientBrief
} from './clientDataEngine.ts';
import type { Prospect } from '../types/index.ts';

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlString = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

  // Only intercept /api/ routes
  if (!urlString.includes('/api/')) {
    return window.fetch(input, init);
  }

  // Try live server first if available, cleanly fallback to client engine on Cloudflare Pages (404/HTML error or network failure)
  try {
    const res = await window.fetch(input, init);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok || (res.status === 401 && contentType.includes('application/json'))) {
      return res;
    }
    // If server returned 404 (common on static Cloudflare Pages when hitting /api/*), fallback to client engine
    if (res.status === 404 || contentType.includes('text/html')) {
      return handleClientApiRoute(urlString, init);
    }
    return res;
  } catch {
    // Network failed or offline: handle via client engine
    return handleClientApiRoute(urlString, init);
  }
}

async function handleClientApiRoute(urlString: string, init?: RequestInit): Promise<Response> {
  const url = new URL(urlString, window.location.origin);
  const path = url.pathname;
  const method = (init?.method || 'GET').toUpperCase();
  let body: any = {};

  if (init?.body && typeof init.body === 'string') {
    try {
      body = JSON.parse(init.body);
    } catch {}
  }

  const jsonResponse = (data: any, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  // 1. Auth Login
  if (path === '/api/auth/login' && method === 'POST') {
    const email = (body.email || '').trim().toLowerCase();
    const pass = (body.password || '').trim();

    if (email === 'karimmazo33@gmail.com' && (pass === 'Motionpro.6333' || pass === 'Motionpro.633')) {
      return jsonResponse({
        success: true,
        token: `cf_token_${Date.now()}`,
        user: {
          email: 'karimmazo33@gmail.com',
          name: 'Karim',
          role: 'Administrator'
        }
      });
    }
    return jsonResponse({ error: 'Access denied: Invalid administrator credentials.' }, 401);
  }

  // 2. Auth Verify
  if (path === '/api/auth/verify') {
    return jsonResponse({ verified: true });
  }

  // 3. Deep Prospect Search (10+ minimum, 0 website, never repeat)
  if (path === '/api/search/deep-prospect' && method === 'POST') {
    const results = runClientDeepSearch(body);
    return jsonResponse(results);
  }

  // 4. Settings
  if (path === '/api/settings') {
    if (method === 'PUT') {
      const updated = saveClientSettings(body);
      return jsonResponse(updated);
    }
    return jsonResponse(getClientSettings());
  }

  // 5. Stats
  if (path === '/api/stats') {
    const prospects = getStoredProspects();
    return jsonResponse(computeStats(prospects));
  }

  // 6. Prospects Collection
  if (path === '/api/prospects' && method === 'GET') {
    const prospects = getStoredProspects();
    const status = url.searchParams.get('status');
    const websiteStatus = url.searchParams.get('websiteStatus');
    const search = (url.searchParams.get('search') || '').toLowerCase();
    const hideContacted = url.searchParams.get('hideContacted') === 'true';
    const isContactedParam = url.searchParams.get('isContacted');

    let filtered = prospects;

    if (hideContacted) {
      filtered = filtered.filter((p) => !p.isContacted && p.status !== 'contacted');
    }
    if (isContactedParam === 'true') {
      filtered = filtered.filter((p) => p.isContacted || p.status === 'contacted');
    }
    if (status) {
      filtered = filtered.filter((p) => p.status === status);
    }
    if (websiteStatus) {
      filtered = filtered.filter((p) => p.websiteStatus === websiteStatus);
    }
    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.category.toLowerCase().includes(search) ||
          p.city.toLowerCase().includes(search)
      );
    }

    return jsonResponse({
      items: filtered,
      total: filtered.length
    });
  }

  // 7. Individual Prospect actions
  const prospectMatch = path.match(/^\/api\/prospects\/([^\/]+)(?:\/(.*))?$/);
  if (prospectMatch) {
    const id = prospectMatch[1];
    const action = prospectMatch[2] || '';
    const prospects = getStoredProspects();
    const prospect = prospects.find((p) => p.id === id);

    if (!prospect) {
      return jsonResponse({ error: 'Prospect not found' }, 404);
    }

    // Click tracking (NEVER REPEAT)
    if (action === 'click' && method === 'POST') {
      prospect.isClicked = true;
      prospect.clickedAt = new Date().toISOString();
      saveStoredProspects(prospects);
      addExclusion(prospect.name, prospect.phone);
      return jsonResponse(prospect);
    }

    // Contact tracking (NEVER REPEAT)
    if (action === 'contact' && method === 'POST') {
      prospect.isContacted = body.contacted !== false;
      prospect.contactedAt = new Date().toISOString();
      if (prospect.isContacted) {
        prospect.status = 'contacted';
        addExclusion(prospect.name, prospect.phone);
      }
      saveStoredProspects(prospects);
      return jsonResponse(prospect);
    }

    // Status change
    if (action === 'status' && method === 'PUT') {
      if (body.status) prospect.status = body.status;
      if (body.notes !== undefined) prospect.notes = body.notes;
      prospect.updatedAt = new Date().toISOString();
      saveStoredProspects(prospects);
      return jsonResponse(prospect);
    }

    // Star toggle
    if (action === 'star' && method === 'POST') {
      prospect.isStarred = !prospect.isStarred;
      prospect.updatedAt = new Date().toISOString();
      saveStoredProspects(prospects);
      return jsonResponse({ isStarred: prospect.isStarred });
    }

    // Generate brief
    if (action === 'generate-brief' && method === 'POST') {
      prospect.brief = createClientBrief(prospect, getClientSettings());
      saveStoredProspects(prospects);
      return jsonResponse(prospect.brief);
    }

    // Get single prospect
    if (!action && method === 'GET') {
      return jsonResponse(prospect);
    }
  }

  // 8. Scheduler & Jobs dummy responses for Cloudflare Pages
  if (path.startsWith('/api/scheduler') || path === '/api/jobs' || path === '/api/providers/status') {
    return jsonResponse({
      isActive: true,
      isCurrentlyRunning: false,
      scheduleTime: '08:00',
      timezone: 'Europe/Madrid',
      providers: [
        { name: 'Google Maps Places Intelligence', status: 'connected', latencyMs: 38 },
        { name: 'Global DNS & WHOIS Registry', status: 'connected', latencyMs: 42 },
        { name: 'OpenStreetMap Nominatim', status: 'connected', latencyMs: 51 },
        { name: 'Cloudflare Edge CDN', status: 'connected', latencyMs: 14 }
      ]
    });
  }

  return jsonResponse({ error: 'Endpoint not found' }, 404);
}
