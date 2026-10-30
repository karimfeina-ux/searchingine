// Cloudflare Pages Function  ->  POST /api/places-search
// 100% free: OpenStreetMap Nominatim (geocoding) + Overpass API (business data). No API key needed.

import { AuthEnv, verifyToken } from '../_lib/auth';

const UA = 'searchingine-lead-finder/1.0 (contact: owner of this site)';
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];

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
        signal: AbortSignal.timeout(20000)
      });
      if (res.ok) return await res.json();
      lastErr = `${url} -> ${res.status}`;
    } catch (e: any) {
      lastErr = `${url} -> ${e?.message || 'network error'}`;
    }
  }
  throw new Error('Overpass busy, try again in a minute. ' + lastErr);
}

export const onRequestPost = async ({ request, env = {} }: { request: Request; env?: AuthEnv }) => {
  try {
    const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '') || null;
    const authSecret = env?.AUTH_SECRET || (typeof process !== 'undefined' ? process.env?.AUTH_SECRET : undefined);
    if (!(await verifyToken(authSecret, token))) {
      return json({ error: 'Session expired or not logged in. Please log in again.' }, 401);
    }
    return await handle(request);
  } catch (e: any) {
    // Always answer with JSON so the app can show a readable message.
    return json({ error: e?.message || 'Unexpected server error' }, 502);
  }
};

async function handle(request: Request): Promise<Response> {
  const origin = request.headers.get('Origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return json({ error: 'Forbidden origin' }, 403);
  }

  let body: { location?: string; query?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  const location = String(body.location || '').trim().slice(0, 120);
  const query = String(body.query || '').trim().slice(0, 120);
  if (!location || !query) return json({ error: 'Both location and query are required.' }, 400);

  // 1) geocode the place -> bounding box
  const geoRes = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(location)}`,
    { headers: { 'User-Agent': UA, 'Accept-Language': 'es' }, signal: AbortSignal.timeout(10000) }
  );
  if (!geoRes.ok) return json({ error: `Could not look up "${location}" (${geoRes.status}).` }, 502);
  const geo: any[] = await geoRes.json();
  if (!geo.length) return json({ error: `Location "${location}" not found.` }, 404);
  const [south, north, west, east] = geo[0].boundingbox.map(Number);
  const bbox = `${south},${west},${north},${east}`;

  // 2) build the Overpass query: operating businesses WITH a phone and WITHOUT a website tag
  const q = ` ${query.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ')} `;
  const matched = CATEGORIES.filter((c) => c.words.some((w) => q.includes(w)));
  const tagSets = matched.flatMap((c) => c.tags);
  const noSite = '[!"website"][!"contact:website"][!"url"]';
  const clauses: string[] = [];
  const phoneKeys = ['phone', 'contact:phone', 'contact:mobile', 'mobile'];

  if (tagSets.length) {
    for (const t of new Set(tagSets)) {
      const [k, v] = t.split('=');
      for (const pk of phoneKeys) clauses.push(`nwr["${k}"="${v}"]["${pk}"]${noSite}["name"](${bbox});`);
    }
  } else {
    // unknown category: match on the business name
    for (const pk of phoneKeys) clauses.push(`nwr["name"~"${esc(query)}",i]["${pk}"]${noSite}(${bbox});`);
  }

  const data = await overpass(`[out:json][timeout:25];(${clauses.join('')});out center tags 300;`);

  const places = (data.elements || [])
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
        city: t['addr:city'] || '',
        facebook: t['contact:facebook'] || t.facebook || '',
        instagram: t['contact:instagram'] || t.instagram || '',
        email: t.email || t['contact:email'] || '',
        category: t.shop || t.amenity || t.craft || t.office || t.healthcare || t.leisure || t.tourism || query,
        lat: e.lat ?? e.center?.lat,
        lon: e.lon ?? e.center?.lon
      };
    });

  return json({ places, categoryMatched: matched.length > 0 });
}
