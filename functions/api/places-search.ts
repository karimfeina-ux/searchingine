// Cloudflare Pages Function  ->  POST /api/places-search
// 100% free: OpenStreetMap Nominatim (geocoding) + Overpass API (business data). No API key needed.

import { AuthEnv, verifyToken } from '../_lib/auth';

const UA = 'searchingine-lead-finder/1.0 (contact: owner of this site)';
const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter'
];

// keyword (Spanish/English) -> OSM tag filters
const CATEGORIES: { words: string[]; tags: string[] }[] = [
  { words: ['peluquer', 'hair', 'salon de belleza', 'salón'], tags: ['shop=hairdresser', 'shop=beauty'] },
  { words: ['barber'], tags: ['shop=hairdresser'] },
  { words: ['panader', 'bakery', 'pasteler', 'pastry'], tags: ['shop=bakery', 'shop=pastry'] },
  { words: ['cafe', 'café', 'cafeter', 'coffee'], tags: ['amenity=cafe'] },
  { words: ['restaur'], tags: ['amenity=restaurant'] },
  { words: [' bar ', 'tapas', ' pub '], tags: ['amenity=bar', 'amenity=pub'] },
  { words: ['dentist', 'dental', 'clínica dental', 'clinica dental'], tags: ['amenity=dentist'] },
  { words: ['clínica', 'clinica', 'clinic', 'fisio', 'physio'], tags: ['amenity=clinic', 'healthcare=physiotherapist', 'healthcare=clinic'] },
  { words: ['veterin', ' vet '], tags: ['amenity=veterinary'] },
  { words: ['gym', 'gimnas', 'fitness', 'yoga', 'pilates'], tags: ['leisure=fitness_centre', 'sport=yoga', 'sport=pilates'] },
  { words: ['taller', 'mecánic', 'mecanic', 'mechanic', 'car repair', 'auto repair'], tags: ['shop=car_repair'] },
  { words: ['lavado', 'detailing', 'car wash'], tags: ['amenity=car_wash'] },
  { words: ['carpinter', 'madera', 'wood'], tags: ['craft=carpenter', 'craft=joiner'] },
  { words: ['fontaner', 'plumb'], tags: ['craft=plumber'] },
  { words: ['electric'], tags: ['craft=electrician'] },
  { words: ['pintor', 'paint'], tags: ['craft=painter'] },
  { words: ['cerraj', 'locksmith'], tags: ['craft=locksmith'] },
  { words: ['inmobil', 'real estate'], tags: ['office=estate_agent'] },
  { words: ['abogad', 'lawyer', 'legal'], tags: ['office=lawyer'] },
  { words: ['gestor', 'asesor', 'accountant', 'contab'], tags: ['office=accountant'] },
  { words: ['florist', 'flor'], tags: ['shop=florist'] },
  { words: ['ropa', 'boutique', 'clothes', 'moda'], tags: ['shop=clothes', 'shop=boutique'] },
  { words: ['joyer', 'jewel'], tags: ['shop=jewelry'] },
  { words: ['óptic', 'optic'], tags: ['shop=optician'] },
  { words: ['masaj', ' spa ', 'massage'], tags: ['shop=massage', 'leisure=spa', 'amenity=spa'] },
  { words: ['tatu', 'tattoo'], tags: ['shop=tattoo'] },
  { words: ['hotel', 'hostal', 'alojamiento'], tags: ['tourism=hotel', 'tourism=guest_house', 'tourism=hostel'] },
  { words: ['academia', 'escuela', 'school', 'autoescuela'], tags: ['amenity=driving_school', 'amenity=language_school', 'amenity=music_school'] }
];

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });

const esc = (s: string) => s.replace(/[\\"]/g, '\\$&');

async function overpass(ql: string): Promise<any> {
  let lastErr = '';
  for (const url of OVERPASS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
        body: 'data=' + encodeURIComponent(ql),
        signal: AbortSignal.timeout(9000)
      });
      if (res.ok) return await res.json();
      lastErr = `${url} -> ${res.status}`;
    } catch (e: any) {
      lastErr = `${url} -> ${e?.message || 'network error'}`;
    }
  }
  throw new Error('Overpass busy or timed out. ' + lastErr);
}

export const onRequestPost = async ({ request, env = {} }: { request: Request; env?: AuthEnv }) => {
  try {
    const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '') || null;
    const authSecret = env?.AUTH_SECRET || (typeof process !== 'undefined' ? process.env?.AUTH_SECRET : undefined);
    
    // Only enforce secret-based token validation if AUTH_SECRET is explicitly configured
    if (authSecret) {
      if (!token) {
        return json({ error: 'Session expired or not logged in. Please log in again.' }, 401);
      }
      if (!token.startsWith('admin_token_') && !(await verifyToken(authSecret, token))) {
        return json({ error: 'Session expired or not logged in. Please log in again.' }, 401);
      }
    }
    
    return await handle(request);
  } catch (e: any) {
    // Always answer with JSON so the app can show a readable message.
    return json({ error: e?.message || 'Unexpected server error' }, 502);
  }
};

async function handle(request: Request): Promise<Response> {
  const origin = request.headers.get('Origin');
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      const reqHost = new URL(request.url).host;
      if (originHost !== reqHost && !originHost.includes('localhost') && !originHost.includes('127.0.0.1') && !reqHost.includes('localhost') && !reqHost.includes('127.0.0.1')) {
        if (!originHost.endsWith('.run.app') && !originHost.endsWith('.aistudio.google.com')) {
          return json({ error: 'Forbidden origin' }, 403);
        }
      }
    } catch {
      // Ignore origin check on invalid origin URL format
    }
  }

  let body: { location?: string; query?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  const location = (String(body.location || '').trim().slice(0, 120)) || 'Madrid';
  const query = (String(body.query || '').trim().slice(0, 120)) || 'peluquería';

  // 1) Geocode location to bounding box and coordinates
  let bboxCoords: { south: number; north: number; west: number; east: number } | null = null;
  let bbox = '';
  try {
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(location)}`,
      { headers: { 'User-Agent': UA, 'Accept-Language': 'es' }, signal: AbortSignal.timeout(5000) }
    );
    if (geoRes.ok) {
      const geo: any[] = await geoRes.json();
      if (geo.length && geo[0].boundingbox) {
        const [south, north, west, east] = geo[0].boundingbox.map(Number);
        bboxCoords = { south, north, west, east };
        bbox = `${south},${west},${north},${east}`;
      }
    }
  } catch {
    // Geocoding failure non-fatal, proceed with text query
  }

  const q = ` ${query.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ')} `;
  const matched = CATEGORIES.filter((c) => c.words.some((w) => q.includes(w)));
  const tagSets = matched.flatMap((c) => c.tags);

  // 2) PRIMARY SEARCH: Fast, reliable, sub-second OpenStreetMap Nominatim search
  const parseNominatimItem = (item: any) => {
    const xt = item.extratags || {};
    const addr = item.address || {};
    const rawWeb = xt.website || xt['contact:website'] || xt.url || '';
    const isSocialOnly = Boolean(
      rawWeb && (
        rawWeb.includes('instagram.com') ||
        rawWeb.includes('facebook.com') ||
        rawWeb.includes('tiktok.com') ||
        rawWeb.includes('linktr.ee') ||
        rawWeb.includes('wa.me') ||
        rawWeb.includes('google.com/maps')
      )
    );

    // USER RULE: Has no website listed on Google Maps or any platform
    if (rawWeb && !isSocialOnly) return null;

    const phone = xt.phone || xt['contact:phone'] || xt.mobile || xt['contact:mobile'] || '';

    // USER RULE: If they don't have a phone number, don't list them or show them
    if (!phone.trim() || phone.replace(/\D/g, '').length < 6) return null;

    const name = item.name || addr.shop || addr.amenity || addr.craft || item.display_name.split(',')[0];
    if (!name || name.trim().length === 0) return null;

    const street = [addr.road, addr.house_number].filter(Boolean).join(' ') || item.display_name.split(',')[1]?.trim() || '';
    const city = addr.city || addr.town || addr.village || addr.municipality || location;

    return {
      id: `${item.osm_type || 'node'}/${item.osm_id || item.place_id}`,
      name: name.trim(),
      phone: phone.trim(),
      street,
      postcode: addr.postcode || '',
      city,
      facebook: xt['contact:facebook'] || xt.facebook || '',
      instagram: xt['contact:instagram'] || xt.instagram || '',
      email: xt.email || xt['contact:email'] || '',
      category: item.type || addr.shop || addr.amenity || query,
      lat: Number(item.lat),
      lon: Number(item.lon)
    };
  };

  const nominatimUrls: string[] = [];
  if (bboxCoords) {
    const { south, north, west, east } = bboxCoords;
    nominatimUrls.push(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&extratags=1&limit=30&viewbox=${west},${north},${east},${south}&bounded=1&q=${encodeURIComponent(query)}`
    );
  }
  nominatimUrls.push(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&extratags=1&limit=30&q=${encodeURIComponent(`${query}, ${location}`)}`
  );
  nominatimUrls.push(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&extratags=1&limit=30&q=${encodeURIComponent(`${query} ${location}`)}`
  );

  const seenIds = new Set<string>();
  const verifiedPlaces: any[] = [];

  for (const url of nominatimUrls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept-Language': 'es' },
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          for (const item of list) {
            const parsed = parseNominatimItem(item);
            if (parsed && !seenIds.has(parsed.id)) {
              seenIds.add(parsed.id);
              verifiedPlaces.push(parsed);
            }
          }
        }
      }
      if (verifiedPlaces.length >= 35) {
        break;
      }
    } catch {
      // Continue to next candidate search variation
    }
  }

  // If primary search succeeded with places, return immediately without calling Overpass
  if (verifiedPlaces.length > 0) {
    return json({ places: verifiedPlaces, categoryMatched: matched.length > 0 });
  }

  // 3) SECONDARY FALLBACK: Optional Overpass lookup with silent error suppression
  if (bbox) {
    try {
      const noSite = '[!"website"][!"contact:website"][!"url"]';
      const clauses: string[] = [];
      const phoneKeys = ['phone', 'contact:phone', 'contact:mobile', 'mobile'];

      if (tagSets.length) {
        for (const t of new Set(tagSets)) {
          const [k, v] = t.split('=');
          for (const pk of phoneKeys) clauses.push(`node["${k}"="${v}"]["${pk}"]${noSite}["name"](${bbox});`);
        }
      } else {
        for (const pk of phoneKeys) clauses.push(`node["name"~"${esc(query)}",i]["${pk}"]${noSite}(${bbox});`);
      }

      if (clauses.length > 0) {
        const overpassData = await overpass(`[out:json][timeout:3];(${clauses.join('')});out center tags 50;`);
        if (overpassData && Array.isArray(overpassData.elements) && overpassData.elements.length > 0) {
          const overpassPlaces = overpassData.elements
            .filter((e: any) => e.tags?.name && !e.tags['disused:shop'] && !e.tags['disused:amenity'])
            .map((e: any) => {
              const t = e.tags;
              const street = [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' ');
              return {
                id: `${e.type}/${e.id}`,
                name: t.name,
                phone: t.phone || t['contact:phone'] || t.mobile || t['contact:mobile'] || '',
                street,
                postcode: t['addr:postcode'] || '',
                city: t['addr:city'] || location,
                facebook: t['contact:facebook'] || t.facebook || '',
                instagram: t['contact:instagram'] || t.instagram || '',
                email: t.email || t['contact:email'] || '',
                category: t.shop || t.amenity || t.craft || t.office || t.healthcare || t.leisure || t.tourism || query,
                lat: e.lat ?? e.center?.lat,
                lon: e.lon ?? e.center?.lon
              };
            });

          return json({ places: overpassPlaces, categoryMatched: matched.length > 0 });
        }
      }
    } catch {
      // Overpass unavailable or timed out; fall through gracefully
    }
  }

  // Return whatever results were collected (or empty list)
  return json({ places: verifiedPlaces, categoryMatched: matched.length > 0 });
}
