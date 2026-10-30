// Cloudflare Pages Function -> POST /api/search/deep-prospect
// Prioritizes Google Maps Platform Places API (New) with fallback to OpenStreetMap

interface Env {
  VITE_GOOGLE_MAPS_API_KEY?: string;
  GOOGLE_MAPS_API_KEY?: string;
  AUTH_SECRET?: string;
}

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
    const body: any = await request.json().catch(() => ({}));
    const location = (body.location || 'Madrid, Spain').trim();
    const query = (body.query || body.category || 'barbershop').trim();

    const apiKey = (
      env?.VITE_GOOGLE_MAPS_API_KEY ||
      env?.GOOGLE_MAPS_API_KEY ||
      (typeof process !== 'undefined' ? (process.env?.VITE_GOOGLE_MAPS_API_KEY || process.env?.GOOGLE_MAPS_API_KEY) : '') ||
      ''
    ).trim();

    // 1. Try Google Maps Platform first if key is present
    if (apiKey) {
      try {
        const fullTextQuery = `${query} in ${location}`;
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
          'places.regularOpeningHours',
          'places.editorialSummary'
        ].join(',');

        const gmpRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-Maps-Solution-ID': GMP_SOLUTION_ID,
            'X-Goog-FieldMask': fieldMask
          },
          body: JSON.stringify({
            textQuery: fullTextQuery,
            pageSize: 20
          })
        });

        if (gmpRes.ok) {
          const gmpData: any = await gmpRes.json();
          const places = Array.isArray(gmpData.places) ? gmpData.places : [];

          if (places.length > 0) {
            const now = new Date().toISOString();
            const items: any[] = [];

            for (const place of places) {
              const name = place.displayName?.text;
              if (!name) continue;

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

              const rating = place.rating || 0;
              const reviewCount = place.userRatingCount || 0;
              const phone = place.nationalPhoneNumber || place.internationalPhoneNumber || '';
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
                searchQuery: `${location} ${query}`,
                createdAt: now,
                updatedAt: now,
                lastVerifiedAt: now
              });
            }

            // Sort: No website first, then highest lead score
            items.sort((a, b) => {
              if (a.websiteStatus === 'no_website' && b.websiteStatus !== 'no_website') return -1;
              if (b.websiteStatus === 'no_website' && a.websiteStatus !== 'no_website') return 1;
              return b.leadScore - a.leadScore;
            });

            return json({
              items,
              total: items.length,
              location,
              category: query,
              query: `${location} ${query}`,
              source: 'google_maps_places_new',
              gmpAttribution: 'Google Maps'
            });
          }
        }
      } catch (gmpErr) {
        console.warn('Google Maps edge search error:', gmpErr);
      }
    }

    // 2. Fallback to OpenStreetMap if Google Maps returned 0 or no key
    const osmRequest = new Request('http://localhost/api/places-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location, query })
    });

    const { onRequestPost: handleOsm } = await import('../places-search.ts');
    const osmResponse = await handleOsm({ request: osmRequest, env });
    const osmData: any = await osmResponse.json();

    const places = Array.isArray(osmData.places) ? osmData.places : [];
    const now = new Date().toISOString();
    const items: any[] = [];

    for (const p of places) {
      if (!p || !p.name) continue;
      const address = [p.street, p.postcode, p.city || location].filter(Boolean).join(', ');
      const mapsUrl = p.lat && p.lon
        ? `https://maps.google.com/?q=${encodeURIComponent(`${p.name} ${address}`)}`
        : `https://www.openstreetmap.org/${p.id}`;

      items.push({
        id: `gp_${String(p.id).replace('/', '_')}`,
        name: p.name,
        normalizedName: p.name.toLowerCase().trim(),
        category: p.category || query,
        address,
        city: p.city || location,
        region: '',
        country: '',
        latitude: p.lat,
        longitude: p.lon,
        phone: p.phone || '',
        email: p.email || '',
        websiteCandidate: '',
        websiteStatus: 'possibly_no_website',
        status: 'new',
        leadScore: 78,
        subscores: {
          websiteOpportunity: 28,
          reputation: 10,
          activity: 10,
          categoryValue: 12,
          contactability: p.phone ? 10 : 8,
          evidenceQuality: 6
        },
        scoreReasons: ['Discovered via OpenStreetMap geo-cadastre directory'],
        strongestSignals: ['Physical storefront verified'],
        importantUncertainties: ['Verify on Google Maps that the business has no website'],
        recommendedAction: 'Verify details on Google Maps before outreach.',
        reviewRating: 0,
        reviewCount: 0,
        reviewSentimentSummary: 'Business listing retrieved from OpenStreetMap.',
        positiveThemes: [],
        negativeThemes: [],
        customerComplaints: [],
        stableOperationsEvidence: 'Registered on OpenStreetMap.',
        contactChannels: [
          ...(p.phone ? [{ type: 'phone', value: p.phone, confidence: 90, isBusinessContact: true, verifiedAt: now }] : []),
          ...(address ? [{ type: 'address', value: address, confidence: 85, isBusinessContact: true, verifiedAt: now }] : []),
          { type: 'google_maps', value: mapsUrl, confidence: 80, isBusinessContact: true, verifiedAt: now }
        ],
        sources: [{ name: 'OpenStreetMap', url: mapsUrl, checkedAt: now }],
        notes: 'Discovered via OpenStreetMap directory.',
        isStarred: false,
        isClicked: false,
        isContacted: false,
        searchQuery: `${location} ${query}`,
        createdAt: now,
        updatedAt: now,
        lastVerifiedAt: now
      });
    }

    return json({
      items,
      total: items.length,
      location,
      category: query,
      query: `${location} ${query}`,
      source: 'openstreetmap'
    });
  } catch (err: any) {
    return json({ error: err?.message || 'Deep search failed' }, 500);
  }
};
