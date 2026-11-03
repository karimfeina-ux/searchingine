// Cloudflare Pages Function -> POST /api/search/google-maps
// Serverless edge search using Google Maps Platform Places API (New)

interface Env {
  VITE_GOOGLE_MAPS_API_KEY?: string;
  GOOGLE_MAPS_API_KEY?: string;
  AUTH_SECRET?: string;
}

import { onRequestPost as deepSearch } from './deep-prospect';

const GMP_SOLUTION_ID = 'gmp_mcp_codeassist_v1_aistudio';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*'
    }
  });

async function osmFallback(env: Env, location: string, query: string, warning: string) {
  const req = new Request('https://internal.local/api/search/deep-prospect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location, query, skipGoogle: true })
  });
  const res = await deepSearch({ request: req, env });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) {
    return json({ error: data?.error || 'Search failed', googleWarning: warning }, 502);
  }
  return json({ ...data, source: 'openstreetmap', googleWarning: warning });
}

export const onRequestOptions = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
};

export const onRequestPost = async ({ request, env = {} }: { request: Request; env?: Env }) => {
  try {
    const apiKey = (
      env?.VITE_GOOGLE_MAPS_API_KEY ||
      env?.GOOGLE_MAPS_API_KEY ||
      (typeof process !== 'undefined' ? (process.env?.VITE_GOOGLE_MAPS_API_KEY || process.env?.GOOGLE_MAPS_API_KEY) : '') ||
      ''
    ).trim();

    const body: any = await request.json().catch(() => ({}));
    const location = (body.location || 'Madrid, Spain').trim();
    const query = (body.query || 'barbershop').trim();

    if (!apiKey) {
      return await osmFallback(env, location, query, 'Google Maps API key is not set in Cloudflare, so free OpenStreetMap data was used.');
    }
    let googleWarning = '';
    const onlyNoWebsite = Boolean(body.onlyNoWebsite);
    const minRating = body.minRating ? Number(body.minRating) : 0;
    const minReviews = body.minReviews ? Number(body.minReviews) : 0;
    const pageSize = Math.min(Math.max(Number(body.pageSize || 20), 1), 20);

    // Generate search variations for deep discovery
    const qClean = query.trim();
    const qLower = qClean.toLowerCase();
    const queriesToRun: string[] = [`${qClean} in ${location}`];
    if (qLower.includes('café') || qLower.includes('cafe') || qLower.includes('coffee') || qLower.includes('roaster')) {
      queriesToRun.push(`cafeteria in ${location}`, `café in ${location}`, `coffee shop in ${location}`);
    } else if (qLower.includes('barber') || qLower.includes('hair') || qLower.includes('peluquer')) {
      queriesToRun.push(`barbería in ${location}`, `peluquería in ${location}`, `barbershop in ${location}`);
    } else if (qLower.includes('restauran') || qLower.includes('tapa') || qLower.includes('dining')) {
      queriesToRun.push(`restaurante in ${location}`, `bar de tapas in ${location}`, `restaurant in ${location}`);
    }

    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.formattedAddress',
      'places.location',
      'places.rating',
      'places.userRatingCount',
      'places.websiteUri',
      'places.nationalPhoneNumber',
      'places.internationalPhoneNumber',
      'places.googleMapsUri',
      'places.businessStatus',
      'places.primaryTypeDisplayName',
      'places.types',
      'places.photos',
      'places.regularOpeningHours',
      'places.editorialSummary',
      'nextPageToken'
    ].join(',');

    const placeMap = new Map<string, any>();
    let quotaExceeded = false;

    for (let qIdx = 0; qIdx < queriesToRun.length; qIdx++) {
      const textQuery = queriesToRun[qIdx];
      if (placeMap.size >= 30 && qIdx > 0) break;

      let nextPageToken: string | undefined = undefined;
      let pageCount = 0;
      const maxPages = qIdx === 0 ? 2 : 1;

      do {
        const reqPayload: Record<string, any> = {
          textQuery,
          pageSize: 20
        };
        if (nextPageToken) {
          reqPayload.pageToken = nextPageToken;
          await new Promise((r) => setTimeout(r, 400));
        }
        if (minRating > 0 && !nextPageToken) {
          reqPayload.minRating = Math.min(Math.max(minRating, 1.0), 5.0);
        }

        let gmpRes: Response;
        try {
          gmpRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': apiKey,
              'X-Goog-Maps-Solution-ID': GMP_SOLUTION_ID,
              'X-Goog-FieldMask': fieldMask
            },
            body: JSON.stringify(reqPayload)
          });
        } catch {
          break;
        }

        if (gmpRes.status === 429) {
          quotaExceeded = true;
          await new Promise((r) => setTimeout(r, 1000));
          try {
            const retryRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-Maps-Solution-ID': GMP_SOLUTION_ID,
                'X-Goog-FieldMask': fieldMask
              },
              body: JSON.stringify(reqPayload)
            });
            if (retryRes.ok) {
              gmpRes = retryRes;
              quotaExceeded = false;
            }
          } catch {}
        }

        if (!gmpRes.ok) {
          if (gmpRes.status === 429) {
            quotaExceeded = true;
          }
          try {
            const errBody: any = await gmpRes.clone().json();
            googleWarning = `Google Maps error ${gmpRes.status}: ${errBody?.error?.message || 'request failed'}`;
          } catch {
            googleWarning = `Google Maps error ${gmpRes.status}`;
          }
          break;
        }

        try {
          const gmpData: any = await gmpRes.json();
          if (Array.isArray(gmpData.places)) {
            for (const p of gmpData.places) {
              if (p.id && !placeMap.has(p.id)) {
                placeMap.set(p.id, p);
              }
            }
          }
          nextPageToken = gmpData.nextPageToken;
          pageCount++;
        } catch {
          break;
        }
      } while (nextPageToken && pageCount < maxPages && placeMap.size < 60);

      if (quotaExceeded) break;
    }

    const places = Array.from(placeMap.values());
    const now = new Date().toISOString();

    const items: any[] = [];

    for (const place of places) {
      const name = place.displayName?.text;
      if (!name) continue;

      const phone = place.nationalPhoneNumber || place.internationalPhoneNumber || '';
      const cleanPhone = phone.replace(/\D/g, '');
      if (!phone || cleanPhone.length < 6) continue;

      const rawWebsite = (place.websiteUri || '').trim();
      let isSocialOnly = false;
      let hasWebsite = false;
      let websiteStatus = 'no_website';

      if (rawWebsite) {
        const lowerWeb = rawWebsite.toLowerCase();
        const isSocial =
          lowerWeb.includes('instagram.com') ||
          lowerWeb.includes('facebook.com') ||
          lowerWeb.includes('linktr.ee') ||
          lowerWeb.includes('wa.me') ||
          lowerWeb.includes('tiktok.com');

        if (isSocial) {
          isSocialOnly = true;
          websiteStatus = 'possibly_no_website';
        } else {
          hasWebsite = true;
          websiteStatus = 'website_exists';
        }
      }

      // STRICT USER REQUIREMENT: Never show businesses that have websites
      if (hasWebsite) continue;

      const photoCount = Array.isArray(place.photos) ? place.photos.length : 0;
      const rating = place.rating || 0;
      const reviewCount = place.userRatingCount || 0;
      if (minReviews > 0 && reviewCount < minReviews) continue;

      const address = place.formattedAddress || location;
      const mapsUri = place.googleMapsUri || `https://maps.google.com/?q=${encodeURIComponent(`${name} ${address}`)}`;
      const prospectId = `gmp_${place.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

      let leadScore = 60;
      if (websiteStatus === 'no_website') {
        leadScore += 25;
        if (reviewCount >= 100) leadScore += 10;
        else if (reviewCount >= 20) leadScore += 5;
        if (rating >= 4.5) leadScore += 5;
      } else if (websiteStatus === 'possibly_no_website') {
        leadScore += 18;
      } else {
        leadScore = Math.max(leadScore - 15, 35);
      }
      leadScore = Math.min(Math.max(leadScore, 30), 99);

      const categoryName = place.primaryTypeDisplayName?.text || place.types?.[0] || query;

      items.push({
        id: prospectId,
        name,
        normalizedName: name.toLowerCase().trim(),
        category: categoryName,
        address,
        city: location.split(',')[0].trim(),
        region: location.split(',')[1]?.trim() || '',
        country: location.split(',')[2]?.trim() || '',
        latitude: place.location?.latitude,
        longitude: place.location?.longitude,
        phone,
        email: '',
        websiteCandidate: rawWebsite,
        websiteStatus,
        status: websiteStatus === 'no_website' && leadScore >= 75 ? 'ready_to_contact' : 'new',
        leadScore,
        photoCount,
        photos: place.photos || [],
        subscores: {
          websiteOpportunity: websiteStatus === 'no_website' ? 30 : 10,
          reputation: Math.min(Math.round(rating * 4), 20),
          activity: Math.min(Math.round(Math.log10(Math.max(reviewCount, 1)) * 5), 15),
          categoryValue: 14,
          contactability: phone ? 10 : 6,
          evidenceQuality: 10
        },
        scoreReasons: [
          websiteStatus === 'no_website' ? 'No website on official Google Maps listing' : 'Verified Google Maps business listing',
          reviewCount > 0 ? `${rating}★ with ${reviewCount} Google reviews` : 'Active commercial presence'
        ],
        strongestSignals: [`Google Maps verified: ${rating}★ (${reviewCount} reviews)`],
        importantUncertainties: ['Verify preferred inquiry method'],
        recommendedAction: `Pitch custom website package via ${phone ? 'direct phone call' : 'Google Maps profile'}`,
        reviewRating: rating,
        reviewCount,
        reviewSentimentSummary: `Rated ${rating}★ across ${reviewCount} customer reviews on Google Maps.`,
        positiveThemes: ['Google Maps verified business', place.businessStatus || 'Operational'],
        negativeThemes: websiteStatus === 'no_website' ? ['No custom website'] : [],
        customerComplaints: [],
        stableOperationsEvidence: `Listed on Google Maps with status: ${place.businessStatus || 'OPERATIONAL'}`,
        contactChannels: [
          { type: 'google_maps', value: mapsUri, confidence: 100, isBusinessContact: true, verifiedAt: now },
          ...(phone ? [{ type: 'phone', value: phone, confidence: 98, isBusinessContact: true, verifiedAt: now }] : []),
          ...(address ? [{ type: 'address', value: address, confidence: 95, isBusinessContact: true, verifiedAt: now }] : []),
          ...(rawWebsite ? [{ type: isSocialOnly ? 'instagram' : 'website', value: rawWebsite, confidence: 95, isBusinessContact: true, verifiedAt: now }] : [])
        ],
        sources: [{ name: 'Google Maps Platform', url: mapsUri, checkedAt: now }],
        notes: `Discovered via Google Maps Platform (Places API New). Place ID: ${place.id}`,
        isStarred: leadScore >= 85,
        isClicked: false,
        isContacted: false,
        searchQuery: `${query} in ${location}`,
        createdAt: now,
        updatedAt: now,
        lastVerifiedAt: now
      });
    }

    if (items.length === 0) {
      const why = googleWarning || (quotaExceeded
        ? 'Google Maps quota exceeded.'
        : 'Google Maps found no businesses without a website and with a phone number.');
      return await osmFallback(env, location, query, why + ' Free OpenStreetMap data was used instead.');
    }

    items.sort((a, b) => {
      if (a.websiteStatus === 'no_website' && b.websiteStatus !== 'no_website') return -1;
      if (b.websiteStatus === 'no_website' && a.websiteStatus !== 'no_website') return 1;
      return b.leadScore - a.leadScore;
    });

    return json({
      items,
      total: items.length,
      location,
      query,
      gmpAttribution: 'Google Maps',
      quotaExceeded,
      googleWarning
    });
  } catch (err: any) {
    return json({ error: err?.message || 'Internal Edge Worker Error' }, 500);
  }
};
