// Cloudflare Pages Function -> POST /api/search/google-maps
// Serverless edge search using Google Maps Platform Places API (New)

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
    const apiKey = (
      env?.VITE_GOOGLE_MAPS_API_KEY ||
      env?.GOOGLE_MAPS_API_KEY ||
      (typeof process !== 'undefined' ? (process.env?.VITE_GOOGLE_MAPS_API_KEY || process.env?.GOOGLE_MAPS_API_KEY) : '') ||
      ''
    ).trim();

    if (!apiKey) {
      return json({ error: 'Google Maps API key not configured in Cloudflare environment variables.' }, 400);
    }

    const body: any = await request.json().catch(() => ({}));
    const location = (body.location || 'Madrid, Spain').trim();
    const query = (body.query || 'barbershop').trim();
    const onlyNoWebsite = Boolean(body.onlyNoWebsite);
    const minRating = body.minRating ? Number(body.minRating) : 0;
    const minReviews = body.minReviews ? Number(body.minReviews) : 0;
    const pageSize = Math.min(Math.max(Number(body.pageSize || 20), 1), 20);

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
      'places.photos',
      'places.regularOpeningHours',
      'places.editorialSummary',
      'nextPageToken'
    ].join(',');

    let places: any[] = [];
    let nextPageToken: string | undefined = undefined;
    let pageCount = 0;
    const maxPages = 3;

    do {
      const reqPayload: Record<string, any> = {
        textQuery: fullTextQuery,
        pageSize: 20
      };
      if (nextPageToken) {
        reqPayload.pageToken = nextPageToken;
      }
      if (minRating > 0 && !nextPageToken) {
        reqPayload.minRating = Math.min(Math.max(minRating, 1.0), 5.0);
      }

      const gmpRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-Maps-Solution-ID': GMP_SOLUTION_ID,
          'X-Goog-FieldMask': fieldMask
        },
        body: JSON.stringify(reqPayload)
      });

      if (!gmpRes.ok) {
        if (places.length === 0) {
          const errText = await gmpRes.text();
          return json({ error: `Google Maps API error (${gmpRes.status}): ${errText}` }, gmpRes.status);
        }
        break;
      }

      const gmpData: any = await gmpRes.json();
      if (Array.isArray(gmpData.places)) {
        places = places.concat(gmpData.places);
      }
      nextPageToken = gmpData.nextPageToken;
      pageCount++;
    } while (nextPageToken && pageCount < maxPages && places.length < 60);

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

      // STRICT USER REQUIREMENT: Never show businesses that have websites
      if (hasWebsite) continue;

      // STRICT USER REQUIREMENT: Never show businesses with less than 2 pictures in their Google Maps profile
      const photoCount = Array.isArray(place.photos) ? place.photos.length : 0;
      if (photoCount < 2) continue;

      const rating = place.rating || 0;
      const reviewCount = place.userRatingCount || 0;
      if (minReviews > 0 && reviewCount < minReviews) continue;

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
        searchQuery: fullTextQuery,
        createdAt: now,
        updatedAt: now,
        lastVerifiedAt: now
      });
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
      gmpAttribution: 'Google Maps'
    });
  } catch (err: any) {
    return json({ error: err?.message || 'Internal Edge Worker Error' }, 500);
  }
};
