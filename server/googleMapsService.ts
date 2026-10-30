/**
 * Google Maps Platform Service for Real Business Prospecting & Intelligence
 * Uses Google Maps Places API (New) with server-side proxy
 * Mandatory solution attribution: gmp_mcp_codeassist_v1_aistudio
 */

import type { Prospect, ContactChannel, WebsiteVerificationRecord } from '../src/types/index.ts';
import { normalizeBusinessName } from './researchEngine.ts';
import { getExcludedBusinessNamesAndPhones, getSettings } from './db.ts';

const GMP_SOLUTION_ID = 'gmp_mcp_codeassist_v1_aistudio';

export interface GooglePlaceResult {
  id: string;
  displayName?: { text: string; languageCode?: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  googleMapsUri?: string;
  businessStatus?: string;
  primaryTypeDisplayName?: { text: string; languageCode?: string };
  types?: string[];
  regularOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
  editorialSummary?: { text: string };
}

export function getGoogleMapsApiKey(): string {
  return (
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    ''
  ).trim();
}

/**
 * Searches real local businesses using Google Maps Places API (New) Text Search
 */
export async function searchGoogleMapsBusinesses(params: {
  query: string;
  location?: string;
  onlyNoWebsite?: boolean;
  minRating?: number;
  minReviews?: number;
  pageSize?: number;
}): Promise<{
  items: Prospect[];
  total: number;
  location: string;
  query: string;
  rawCount: number;
  source: 'google_maps_places_new';
}> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    throw new Error('Google Maps API key is not configured.');
  }

  const locationStr = (params.location || 'Madrid, Spain').trim();
  const queryStr = (params.query || 'barbershop').trim();
  const fullTextQuery = `${queryStr} in ${locationStr}`;

  const pageSize = Math.min(Math.max(Number(params.pageSize || 20), 1), 20);

  const requestBody: Record<string, any> = {
    textQuery: fullTextQuery,
    pageSize,
  };

  if (params.minRating && params.minRating > 0) {
    requestBody.minRating = Math.min(Math.max(params.minRating, 1.0), 5.0);
  }

  // Field mask for Places API (New) Text Search
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

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-Maps-Solution-ID': GMP_SOLUTION_ID,
      'X-Goog-FieldMask': fieldMask,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Google Places API error (${response.status}):`, errorBody);
    if (response.status === 429) {
      throw new Error('Google Maps Platform quota exceeded. Please check your account limits.');
    }
    throw new Error(`Google Maps search failed: ${response.status} ${response.statusText}`);
  }

  const data: { places?: GooglePlaceResult[] } = await response.json();
  const places: GooglePlaceResult[] = Array.isArray(data.places) ? data.places : [];

  const { names: excludedNames, phones: excludedPhones } = getExcludedBusinessNamesAndPhones();
  const settings = getSettings();
  const now = new Date().toISOString();

  const qualifiedList: Prospect[] = [];

  for (const place of places) {
    const name = place.displayName?.text;
    if (!name) continue;

    const normName = normalizeBusinessName(name);
    const rawPhone = place.nationalPhoneNumber || place.internationalPhoneNumber || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');

    // Skip businesses previously contacted or excluded
    if (cleanPhone.length >= 6 && excludedPhones.has(cleanPhone)) {
      continue;
    }
    if (excludedNames.has(normName)) {
      continue;
    }

    const rawWebsite = (place.websiteUri || '').trim();
    let isSocialOnly = false;
    let hasWebsite = false;
    let websiteStatus: Prospect['websiteStatus'] = 'no_website';

    if (rawWebsite) {
      const lowerWeb = rawWebsite.toLowerCase();
      const isSocial =
        lowerWeb.includes('instagram.com') ||
        lowerWeb.includes('facebook.com') ||
        lowerWeb.includes('linktr.ee') ||
        lowerWeb.includes('wa.me') ||
        lowerWeb.includes('tiktok.com') ||
        lowerWeb.includes('bio.link') ||
        lowerWeb.includes('taplink.cc');

      if (isSocial) {
        isSocialOnly = true;
        websiteStatus = 'possibly_no_website';
      } else {
        hasWebsite = true;
        websiteStatus = 'website_exists';
      }
    } else {
      websiteStatus = 'no_website';
    }

    // If caller specifically requested only businesses without website
    if (params.onlyNoWebsite && hasWebsite) {
      continue;
    }

    // Ratings & Reviews filter
    const rating = place.rating || 0;
    const reviewCount = place.userRatingCount || 0;
    if (params.minReviews && reviewCount < params.minReviews) {
      continue;
    }

    const fullAddress = place.formattedAddress || locationStr;
    const mapsUri = place.googleMapsUri || `https://maps.google.com/?q=${encodeURIComponent(`${name} ${fullAddress}`)}`;

    const prospectId = `gmp_${place.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    const contactChannels: ContactChannel[] = [
      {
        type: 'google_maps',
        value: mapsUri,
        confidence: 100,
        isBusinessContact: true,
        verifiedAt: now,
      },
    ];

    if (rawPhone) {
      contactChannels.push({
        type: 'phone',
        value: rawPhone,
        confidence: 98,
        isBusinessContact: true,
        verifiedAt: now,
      });
    }

    if (fullAddress) {
      contactChannels.push({
        type: 'address',
        value: fullAddress,
        confidence: 95,
        isBusinessContact: true,
        verifiedAt: now,
      });
    }

    if (isSocialOnly && rawWebsite) {
      const isInsta = rawWebsite.includes('instagram.com');
      contactChannels.push({
        type: isInsta ? 'instagram' : 'facebook',
        value: rawWebsite,
        confidence: 95,
        isBusinessContact: true,
        verifiedAt: now,
      });
    } else if (hasWebsite && rawWebsite) {
      contactChannels.push({
        type: 'website',
        value: rawWebsite,
        confidence: 95,
        isBusinessContact: true,
        verifiedAt: now,
      });
    }

    // Lead Scoring Engine (Calculates high scores for busy businesses with no web)
    let leadScore = 60;
    let websiteOpportunityScore = 10;
    let reputationScore = Math.min(Math.round(rating * 4), 20);
    let activityScore = Math.min(Math.round(Math.log10(Math.max(reviewCount, 1)) * 5), 15);
    let categoryValueScore = 14;
    let contactabilityScore = rawPhone ? 10 : 6;
    let evidenceQualityScore = 10; // 100% verified via Google Maps Platform Places API

    if (websiteStatus === 'no_website') {
      websiteOpportunityScore = 30;
      leadScore += 25;
      if (reviewCount >= 100) leadScore += 10;
      else if (reviewCount >= 20) leadScore += 5;
      if (rating >= 4.5) leadScore += 5;
    } else if (websiteStatus === 'possibly_no_website') {
      websiteOpportunityScore = 24;
      leadScore += 18;
      if (reviewCount >= 50) leadScore += 5;
    } else {
      websiteOpportunityScore = 5;
      leadScore = Math.max(leadScore - 15, 35);
    }

    leadScore = Math.min(Math.max(leadScore, 30), 99);

    const scoreReasons: string[] = [];
    if (websiteStatus === 'no_website') {
      scoreReasons.push(`No website detected on official Google Maps listing`);
    } else if (isSocialOnly) {
      scoreReasons.push(`Relies solely on social profile (${rawWebsite.includes('instagram') ? 'Instagram' : 'Social link'}) instead of a conversion website`);
    }
    if (reviewCount >= 50) {
      scoreReasons.push(`Strong active local clientele: ${reviewCount} Google reviews with ${rating}★ rating`);
    }
    if (rawPhone) {
      scoreReasons.push(`Direct phone line available for outreach: ${rawPhone}`);
    }

    const verification: WebsiteVerificationRecord = {
      id: `ver_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      prospectId,
      checkType: 'business_listing',
      status: websiteStatus,
      candidateDomain: rawWebsite || undefined,
      evidenceUrls: [mapsUri],
      searchQueries: [fullTextQuery],
      explanation: websiteStatus === 'no_website'
        ? `Verified via Google Maps Places API (New): Business is actively operational with ${reviewCount} reviews (${rating}★) but lists NO website.`
        : isSocialOnly
        ? `Google Maps lists social media link (${rawWebsite}) but no dedicated domain.`
        : `Google Maps lists existing website ${rawWebsite}.`,
      counterEvidence: hasWebsite ? 'Business has an active registered URL.' : 'No website URI provided in Google Maps metadata.',
      recommendedNextStep: websiteStatus === 'no_website'
        ? 'Call business or direct message offering modern responsive website.'
        : isSocialOnly
        ? 'Propose upgrading from social profile to custom branded booking website.'
        : 'Analyze existing website for redesign or modernization opportunities.',
      confidenceScore: 98,
      checkedAt: now,
    };

    const categoryName = place.primaryTypeDisplayName?.text || place.types?.[0] || queryStr;

    const prospect: Prospect = {
      id: prospectId,
      name,
      normalizedName: normName,
      category: categoryName,
      address: fullAddress,
      city: locationStr.split(',')[0].trim(),
      region: locationStr.split(',')[1]?.trim() || '',
      country: locationStr.split(',')[2]?.trim() || '',
      postalCode: '',
      latitude: place.location?.latitude,
      longitude: place.location?.longitude,
      phone: rawPhone,
      email: '',
      websiteCandidate: rawWebsite,
      websiteStatus,
      status: websiteStatus === 'no_website' && leadScore >= 75 ? 'ready_to_contact' : 'new',
      leadScore,
      subscores: {
        websiteOpportunity: websiteOpportunityScore,
        reputation: reputationScore,
        activity: activityScore,
        categoryValue: categoryValueScore,
        contactability: contactabilityScore,
        evidenceQuality: evidenceQualityScore,
      },
      scoreReasons,
      strongestSignals: [
        `Google Maps verified: ${rating}★ across ${reviewCount} customer reviews`,
        websiteStatus === 'no_website' ? 'Missing dedicated web presence' : 'Active commercial listing',
      ],
      importantUncertainties: [
        'Check if owner handles web inquiries directly via WhatsApp or Phone',
      ],
      recommendedAction: websiteStatus === 'no_website'
        ? `Pitch ${categoryName} custom website package (€${settings.baseWebsitePrice}) via direct phone call`
        : `Review existing website for speed and mobile responsiveness audit`,
      reviewRating: rating,
      reviewCount,
      reviewSentimentSummary: reviewCount > 0
        ? `Rated ${rating}★ by ${reviewCount} customers on Google Maps.`
        : 'New listing without reviews yet.',
      positiveThemes: ['Google Maps verified business', place.businessStatus || 'Operational'],
      negativeThemes: websiteStatus === 'no_website' ? ['No online booking / custom website'] : [],
      customerComplaints: [],
      stableOperationsEvidence: `Listed on Google Maps with operational status: ${place.businessStatus || 'OPERATIONAL'}`,
      contactChannels,
      sources: [
        {
          name: 'Google Maps Platform',
          url: mapsUri,
          checkedAt: now,
        },
      ],
      notes: `Discovered via Google Maps Platform (Places API New). Maps Place ID: ${place.id}. Operational: ${place.businessStatus || 'OPERATIONAL'}.`,
      isStarred: leadScore >= 85,
      isClicked: false,
      isContacted: false,
      searchQuery: fullTextQuery,
      createdAt: now,
      updatedAt: now,
      lastVerifiedAt: now,
      verifications: [verification],
    };

    qualifiedList.push(prospect);
  }

  // Sort: Businesses without website first, then by lead score descending
  qualifiedList.sort((a, b) => {
    if (a.websiteStatus === 'no_website' && b.websiteStatus !== 'no_website') return -1;
    if (b.websiteStatus === 'no_website' && a.websiteStatus !== 'no_website') return 1;
    return b.leadScore - a.leadScore;
  });

  return {
    items: qualifiedList,
    total: qualifiedList.length,
    location: locationStr,
    query: queryStr,
    rawCount: places.length,
    source: 'google_maps_places_new',
  };
}
