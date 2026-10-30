/**
 * Cloudflare Pages Function: /api/places-search
 * Searches OpenStreetMap (via Nominatim & Overpass API) for real businesses
 * with a phone number and no website.
 */

// Category mapping for OpenStreetMap tags
const QUERY_TAG_MAP: Record<string, string[]> = {
  // Hair & Barber
  peluqueria: ['["shop"="hairdresser"]', '["shop"="barber"]'],
  peluquería: ['["shop"="hairdresser"]', '["shop"="barber"]'],
  barberia: ['["shop"="barber"]', '["shop"="hairdresser"]'],
  barbería: ['["shop"="barber"]', '["shop"="hairdresser"]'],
  hairdresser: ['["shop"="hairdresser"]'],
  barber: ['["shop"="barber"]'],

  // Bakery & Pastry
  panaderia: ['["shop"="bakery"]'],
  panadería: ['["shop"="bakery"]'],
  pasteleria: ['["shop"="pastry"]', '["shop"="bakery"]'],
  pastelería: ['["shop"="pastry"]', '["shop"="bakery"]'],
  bakery: ['["shop"="bakery"]'],

  // Auto repair / Workshop
  taller: ['["shop"="car_repair"]'],
  'taller mecanico': ['["shop"="car_repair"]'],
  'taller mecánico': ['["shop"="car_repair"]'],
  'car repair': ['["shop"="car_repair"]'],
  'auto repair': ['["shop"="car_repair"]'],

  // Dentist
  dentista: ['["amenity"="dentist"]'],
  dentist: ['["amenity"="dentist"]'],
  'clinica dental': ['["amenity"="dentist"]'],
  'clínica dental': ['["amenity"="dentist"]'],

  // Restaurant, Cafe & Bar
  restaurante: ['["amenity"="restaurant"]'],
  restaurant: ['["amenity"="restaurant"]'],
  cafe: ['["amenity"="cafe"]'],
  café: ['["amenity"="cafe"]'],
  cafeteria: ['["amenity"="cafe"]'],
  cafetería: ['["amenity"="cafe"]'],
  bar: ['["amenity"="bar"]'],

  // Plumber
  fontanero: ['["craft"="plumber"]'],
  fontaneria: ['["craft"="plumber"]'],
  fontanería: ['["craft"="plumber"]'],
  plumber: ['["craft"="plumber"]'],

  // Electrician
  electricista: ['["craft"="electrician"]'],
  electrician: ['["craft"="electrician"]'],

  // Pharmacy
  farmacia: ['["amenity"="pharmacy"]'],
  pharmacy: ['["amenity"="pharmacy"]'],

  // Fitness & Gym
  gimnasio: ['["leisure"="fitness_centre"]'],
  gym: ['["leisure"="fitness_centre"]'],
  fitness: ['["leisure"="fitness_centre"]'],

  // Hotel & Accommodation
  hotel: ['["tourism"="hotel"]'],
  hostal: ['["tourism"="guest_house"]', '["tourism"="hostel"]'],

  // Clinic
  clinica: ['["amenity"="clinic"]'],
  clínica: ['["amenity"="clinic"]'],
  clinic: ['["amenity"="clinic"]'],

  // Veterinary
  veterinario: ['["amenity"="veterinary"]'],
  veterinaria: ['["amenity"="veterinary"]'],
  vet: ['["amenity"="veterinary"]'],

  // Trades & Services
  carpintero: ['["craft"="carpenter"]'],
  carpinteria: ['["craft"="carpenter"]'],
  carpintería: ['["craft"="carpenter"]'],
  carpenter: ['["craft"="carpenter"]'],

  pintor: ['["craft"="painter"]'],
  painter: ['["craft"="painter"]'],

  cerrajero: ['["craft"="locksmith"]'],
  cerrajeria: ['["craft"="locksmith"]'],
  cerrajería: ['["craft"="locksmith"]'],
  locksmith: ['["craft"="locksmith"]'],

  fotografo: ['["craft"="photographer"]', '["shop"="photo"]'],
  fotógrafo: ['["craft"="photographer"]', '["shop"="photo"]'],
  photographer: ['["craft"="photographer"]', '["shop"="photo"]'],

  inmobiliaria: ['["office"="estate_agent"]'],
  'real estate': ['["office"="estate_agent"]'],

  abogado: ['["office"="lawyer"]'],
  abogados: ['["office"="lawyer"]'],
  lawyer: ['["office"="lawyer"]']
};

function resolveTagFilters(rawQuery: string): string[] {
  const clean = rawQuery.trim().toLowerCase();
  
  if (QUERY_TAG_MAP[clean]) {
    return QUERY_TAG_MAP[clean];
  }

  // Check substring matches
  for (const [key, tags] of Object.entries(QUERY_TAG_MAP)) {
    if (clean.includes(key)) {
      return tags;
    }
  }

  // Fallback to name search in Overpass
  const safeQuery = clean.replace(/["\\]/g, '');
  return [`[~"name"~"${safeQuery}",i]`];
}

export async function onRequestPost({ request }: { request: Request }): Promise<Response> {
  const userAgent = 'LeadHunter-OSM-Finder/1.0 (https://leadhunter.ai; contact@leadhunter.ai)';

  // 1. Origin host check: Reject requests whose Origin host differs from the site host
  const origin = request.headers.get('origin');
  const forwardedHost = (request.headers.get('x-forwarded-host') || '').split(':')[0].toLowerCase();
  const host = (forwardedHost || request.headers.get('host') || new URL(request.url).host || '').split(':')[0].toLowerCase();

  if (origin) {
    try {
      const originHost = new URL(origin).hostname.toLowerCase();
      const isSameHost =
        !originHost ||
        originHost === host ||
        originHost === forwardedHost ||
        originHost.endsWith('.run.app') ||
        originHost.endsWith('.aistudio.google.com') ||
        originHost.includes('aistudio') ||
        originHost === 'localhost' ||
        originHost === '127.0.0.1' ||
        host === 'localhost' ||
        host === '0.0.0.0' ||
        host === '127.0.0.1';

      if (!isSameHost) {
        return new Response(JSON.stringify({ error: 'Forbidden: Origin host mismatch' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch {
      return new Response(JSON.stringify({ error: 'Forbidden: Invalid origin' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 2. Read JSON { location, query }
  let body: { location?: string; query?: string } = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const location = (body.location || '').trim();
  const query = (body.query || '').trim();

  if (!location || !query) {
    return new Response(JSON.stringify({ error: 'Both location and query are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 3. Geocode location with Nominatim to get boundingbox
  let bboxStr = '';
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(location)}`;
    const nomRes = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': userAgent,
        Accept: 'application/json'
      }
    });

    if (!nomRes.ok) {
      return new Response(
        JSON.stringify({ error: `Nominatim geocoding failed with status ${nomRes.status}` }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const nomData: any = await nomRes.json();
    if (!Array.isArray(nomData) || nomData.length === 0 || !nomData[0].boundingbox) {
      return new Response(
        JSON.stringify({ error: `Could not geocode location "${location}". Please provide a valid city or address.` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Nominatim boundingbox: [minLat, maxLat, minLon, maxLon]
    const [minLat, maxLat, minLon, maxLon] = nomData[0].boundingbox;
    // Overpass boundingbox syntax: (south, west, north, east) -> (minLat, minLon, maxLat, maxLon)
    bboxStr = `(${minLat},${minLon},${maxLat},${maxLon})`;
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: `Geocoding request failed: ${err?.message || 'Network error'}` }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 4. Map query to OpenStreetMap tags
  const tagFilters = resolveTagFilters(query);

  // 5. Build Overpass QL query:
  // elements that HAVE "name", HAVE phone (phone, contact:phone, mobile, contact:mobile),
  // and HAVE NO website, contact:website or url tag, inside boundingbox, using "out center tags 300"
  const overpassStatements = tagFilters
    .map(
      (filter) => `
    node${filter}["name"]["phone"][!website][!"contact:website"][!url]${bboxStr};
    node${filter}["name"]["contact:phone"][!website][!"contact:website"][!url]${bboxStr};
    node${filter}["name"]["mobile"][!website][!"contact:website"][!url]${bboxStr};
    node${filter}["name"]["contact:mobile"][!website][!"contact:website"][!url]${bboxStr};
    way${filter}["name"]["phone"][!website][!"contact:website"][!url]${bboxStr};
    way${filter}["name"]["contact:phone"][!website][!"contact:website"][!url]${bboxStr};
    way${filter}["name"]["mobile"][!website][!"contact:website"][!url]${bboxStr};
    way${filter}["name"]["contact:mobile"][!website][!"contact:website"][!url]${bboxStr};
  `
    )
    .join('\n');

  const overpassQuery = `
[out:json][timeout:25];
(
${overpassStatements}
);
out center tags 300;
  `.trim();

  // 6. Query Overpass API with resilient fallback across official mirrors
  const endpoints = [
    'https://overpass.openstreetmap.fr/api/interpreter',
    'https://overpass-api.de/api/interpreter',
    'https://overpass.osm.ch/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
  ];

  let rawOsmElements: any[] = [];
  let queryError: string | null = null;

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': userAgent
        },
        body: 'data=' + encodeURIComponent(overpassQuery),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (res.ok) {
        const data: any = await res.json();
        if (data && Array.isArray(data.elements)) {
          rawOsmElements = data.elements;
          queryError = null;
          break; // Succeeded
        }
      } else {
        queryError = `Overpass endpoint ${endpoint} returned status ${res.status}`;
      }
    } catch (err: any) {
      queryError = `Error querying ${endpoint}: ${err?.message || 'Network error'}`;
    }
  }

  if (queryError && rawOsmElements.length === 0) {
    return new Response(
      JSON.stringify({ error: `Overpass query failed: ${queryError}` }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 7. Extract real places:
  // Return JSON { places: [{ id, name, phone, street, postcode, city, facebook, instagram, email, category, lat, lon }] }
  const places = [];
  const seenIds = new Set<string>();

  for (const el of rawOsmElements) {
    if (!el || !el.tags) continue;
    const tags = el.tags;

    const name = tags.name || tags['name:es'] || tags['name:en'] || tags['name:ca'];
    if (!name || typeof name !== 'string' || name.trim() === '') continue;

    const id = String(el.id);
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    // Must have a real phone
    const phone = (
      tags.phone ||
      tags['contact:phone'] ||
      tags.mobile ||
      tags['contact:mobile'] ||
      ''
    ).trim();
    if (!phone) continue;

    // Must have NO website, contact:website or url tag
    if (tags.website || tags['contact:website'] || tags.url) continue;

    const street = tags['addr:street']
      ? `${tags['addr:street']}${tags['addr:housenumber'] ? ' ' + tags['addr:housenumber'] : ''}`
      : tags['addr:full'] || '';
    const postcode = tags['addr:postcode'] || '';
    const city = tags['addr:city'] || '';
    const facebook = tags['contact:facebook'] || tags.facebook || '';
    const instagram = tags['contact:instagram'] || tags.instagram || '';
    const email = tags['contact:email'] || tags.email || '';
    const category = tags.shop || tags.amenity || tags.craft || tags.leisure || query;
    const lat = el.lat ?? el.center?.lat ?? 0;
    const lon = el.lon ?? el.center?.lon ?? 0;

    places.push({
      id,
      name: name.trim(),
      phone,
      street,
      postcode,
      city,
      facebook,
      instagram,
      email,
      category,
      lat,
      lon
    });
  }

  // Rule 4: Do not pad results. Return only what was really found, even if it is fewer than 10.
  return new Response(JSON.stringify({ places }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
