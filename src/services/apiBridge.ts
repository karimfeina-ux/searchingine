import {
  getClientSettings,
  saveClientSettings,
  getStoredProspects,
  saveStoredProspects,
  clearStoredProspects,
  addExclusion,
  computeStats,
  createClientBrief
} from './clientDataEngine.ts';
import type { Prospect } from '../types/index.ts';
import { runRealSearch } from './placesSearch.ts';

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlString = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

  // Only intercept /api/ routes
  if (!urlString.includes('/api/')) {
    return window.fetch(input, init);
  }

  // Try live server first if available, cleanly fallback to client engine on Cloudflare Pages or static environments
  try {
    const res = await window.fetch(input, init);
    const contentType = res.headers.get('content-type') || '';

    // If response is HTML (Cloudflare Pages SPA rewrite: /* /index.html 200) -> execute client engine
    if (contentType.includes('text/html')) {
      return handleClientApiRoute(urlString, init);
    }

    // Live backend returned real JSON
    if (res.ok && contentType.includes('application/json')) {
      return res;
    }

    // Edge check: If backend explicitly returned structured JSON error/auth
    if (res.status === 401 && contentType.includes('application/json')) {
      return res;
    }

    // Any other status or non-JSON payload -> execute client data engine
    return handleClientApiRoute(urlString, init);
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

  // 1. Auth Login (real login is the /api/auth/login Cloudflare Function; reaching here means it is not deployed)
  if (path === '/api/auth/login' && method === 'POST') {
    return jsonResponse({ error: 'Login service not found. Deploy the /functions folder to Cloudflare Pages.' }, 503);
  }

  // 2. Auth Verify
  if (path === '/api/auth/verify') {
    return jsonResponse({ verified: !!localStorage.getItem('leadhunter_admin_token') });
  }

  // 3. Deep Prospect Search (10+ minimum, 0 website, never repeat)
  if (path === '/api/search/deep-prospect' && method === 'POST') {
    try {
      const results = await runRealSearch(body);
      return jsonResponse(results);
    } catch (err: any) {
      return jsonResponse({ error: err?.message || 'Search failed' }, 502);
    }
  }

  // 3b. Google Maps Search Fallback
  if (path === '/api/search/google-maps' && method === 'POST') {
    try {
      const results = await runRealSearch(body);
      return jsonResponse({ ...results, gmpAttribution: 'Google Maps' });
    } catch (err: any) {
      return jsonResponse({ error: err?.message || 'Search failed' }, 502);
    }
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

  // 6b. Clear Prospects Collection to 0
  if (path === '/api/prospects/clear' && method === 'POST') {
    const prev = getStoredProspects();
    const remaining = clearStoredProspects(body || { cleanAll: true });
    return jsonResponse({ success: true, remainingCount: remaining.length, deletedCount: prev.length - remaining.length });
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
        prospect.status = body.status || 'contacted';
        addExclusion(prospect.name, prospect.phone);
      }
      prospect.updatedAt = new Date().toISOString();
      saveStoredProspects(prospects);
      return jsonResponse(prospect);
    }

    // Status change
    if (action === 'status' && method === 'PUT') {
      if (body.status) {
        prospect.status = body.status;
        if (
          body.status === 'contacted' ||
          body.status === 'waiting' ||
          body.status === 'client_signed' ||
          body.status === 'not_interested'
        ) {
          prospect.isContacted = true;
          prospect.contactedAt = prospect.contactedAt || new Date().toISOString();
          addExclusion(prospect.name, prospect.phone);
        }
      }
      if (body.notes !== undefined) prospect.notes = body.notes;
      prospect.updatedAt = new Date().toISOString();
      saveStoredProspects(prospects);
      return jsonResponse(prospect);
    }

    // Delete prospect from research (adds to permanent exclusion so it never comes back)
    if ((action === 'delete' || !action) && method === 'DELETE') {
      addExclusion(prospect.name, prospect.phone);
      const remaining = prospects.filter((p) => p.id !== id);
      saveStoredProspects(remaining);
      return jsonResponse({ success: true, deletedId: id });
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

  // 8. Run discovery now: one real search from the cities/categories in Settings (rotates each click)
  if (path === '/api/scheduler/run-now' && method === 'POST') {
    const st = getClientSettings();
    const cities = st.cities?.length ? st.cities : ['Madrid'];
    const cats = st.categories?.length ? st.categories : ['peluquería'];
    let n = 0;
    try { n = parseInt(localStorage.getItem('leadhunter_run_idx') || '0', 10) || 0; localStorage.setItem('leadhunter_run_idx', String(n + 1)); } catch {}
    try {
      const results = await runRealSearch({ location: cities[n % cities.length], query: cats[Math.floor(n / cities.length) % cats.length] });
      return jsonResponse({ success: true, ...results });
    } catch (err: any) {
      return jsonResponse({ error: err?.message || 'Discovery failed' }, 502);
    }
  }

  if (path === '/api/scheduler/toggle' && method === 'POST') {
    return jsonResponse({ enabled: false });
  }

  if (path === '/api/jobs') {
    return jsonResponse([]);
  }

  if (path.startsWith('/api/scheduler')) {
    return jsonResponse({
      isActive: false,
      isCurrentlyRunning: false,
      scheduleTime: getClientSettings().dailyScheduleTime,
      timezone: 'Europe/Madrid',
      nextScheduledRun: null,
      lastRun: null,
      recentJobs: []
    });
  }

  if (path === '/api/providers/status') {
    return jsonResponse({
      providers: [
        {
          name: 'OpenStreetMap Overpass',
          type: 'Business listings (name, phone, address)',
          status: 'connected',
          pricing: 'Free',
          rateLimits: 'Fair use on public servers',
          notes: 'Source of all leads. Data is volunteer-edited: verify each business on Google Maps before contacting.'
        },
        {
          name: 'OpenStreetMap Nominatim',
          type: 'Location lookup',
          status: 'connected',
          pricing: 'Free',
          rateLimits: '1 request/second',
          notes: 'Turns the city you type into a search area.'
        }
      ],
      estimatedMonthlySpend: 0,
      dailyBudgetCap: 0,
      manualResearchModeAvailable: true
    });
  }

  return jsonResponse({ error: 'Endpoint not found' }, 404);
}
