import type { Prospect, WebsiteStatus } from '../types/index.ts';
import {
  createClientBrief,
  getClientSettings,
  getExcludedSets,
  getStoredProspects,
  normalizeBusinessName,
  saveStoredProspects
} from './clientDataEngine.ts';

interface OsmPlace {
  id: string;
  name: string;
  phone: string;
  street: string;
  postcode: string;
  city: string;
  facebook: string;
  instagram: string;
  email: string;
  category: string;
  lat?: number;
  lon?: number;
}

export async function runRealSearch(params: { location?: string; query?: string }) {
  const location = (params.location || '').trim();
  const query = (params.query || '').trim();
  if (!location || !query) throw new Error('Enter both a location and a business type.');

  const res = await window.fetch('/api/places-search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('leadhunter_admin_token') || ''}`
    },
    body: JSON.stringify({ location, query })
  });

  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    throw new Error('Search service not found. Make sure the /functions folder is deployed to Cloudflare Pages.');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Search failed');

  const settings = getClientSettings();
  const { names: excludedNames, phones: excludedPhones } = getExcludedSets();
  const existing = getStoredProspects();
  const knownIds = new Set(existing.map((p) => p.id));
  const now = new Date().toISOString();

  const found: OsmPlace[] = data.places || [];
  const items: Prospect[] = [];
  let skippedDuplicates = 0;

  for (const p of found) {
    const id = `gp_${p.id.replace('/', '_')}`;
    const normName = normalizeBusinessName(p.name);
    const cleanPhone = p.phone.replace(/\D/g, '');
    if (knownIds.has(id) || excludedNames.has(normName) || (cleanPhone && excludedPhones.has(cleanPhone))) {
      skippedDuplicates++;
      continue;
    }

    const social = p.facebook || p.instagram;
    const mapsUrl = p.lat != null && p.lon != null
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + ' ' + p.city)}`
      : `https://www.openstreetmap.org/${p.id}`;
    const osmUrl = `https://www.openstreetmap.org/${p.id}`;
    const address = [p.street, p.postcode, p.city || location].filter(Boolean).join(', ');
    const websiteStatus: WebsiteStatus = 'possibly_no_website';

    const sub = {
      websiteOpportunity: 28,
      reputation: 8,
      activity: social ? 8 : 4,
      categoryValue: 10,
      contactability: p.email ? 10 : 8,
      evidenceQuality: 5
    };
    const leadScore = Object.values(sub).reduce((a, b) => a + b, 0);

    const contactChannels: Prospect['contactChannels'] = [
      { type: 'phone', value: p.phone, confidence: 80, isBusinessContact: true, sourceUrl: osmUrl, verifiedAt: now },
      { type: 'address', value: address, confidence: 70, isBusinessContact: true, sourceUrl: osmUrl, verifiedAt: now },
      { type: 'google_maps', value: mapsUrl, confidence: 60, isBusinessContact: true, sourceUrl: mapsUrl, verifiedAt: now }
    ];
    if (p.email) contactChannels.push({ type: 'email', value: p.email, confidence: 80, isBusinessContact: true, sourceUrl: osmUrl, verifiedAt: now });
    if (p.facebook) contactChannels.push({ type: 'facebook', value: p.facebook, confidence: 70, isBusinessContact: true, sourceUrl: osmUrl, verifiedAt: now });
    if (p.instagram) contactChannels.push({ type: 'instagram', value: p.instagram, confidence: 70, isBusinessContact: true, sourceUrl: osmUrl, verifiedAt: now });

    const prospect: Prospect = {
      id,
      name: p.name,
      normalizedName: normName,
      category: p.category,
      address,
      city: p.city || location,
      region: '',
      country: 'España',
      postalCode: p.postcode || undefined,
      latitude: p.lat,
      longitude: p.lon,
      phone: p.phone,
      email: p.email || undefined,
      websiteCandidate: '',
      websiteStatus,
      status: leadScore >= 80 ? 'high_priority' : 'new',
      leadScore,
      subscores: sub,
      scoreReasons: [
        'OpenStreetMap lists this business with a phone number but no website.',
        social ? 'Has a Facebook/Instagram page listed, so it is active online but has no website.' : 'No website or social page listed.'
      ],
      strongestSignals: ['Real business listing from OpenStreetMap', 'Published phone number'],
      importantUncertainties: [
        'OpenStreetMap is volunteer-edited: the business may have closed, changed number or already have a website. Search it on Google Maps and check the phone before contacting.',
        'No rating or review data is available from this free source.'
      ],
      recommendedAction: 'Check the business on Google Maps first, then call and offer a simple website with WhatsApp contact.',
      reviewRating: 0,
      reviewCount: 0,
      reviewSentimentSummary: 'No review data (free OpenStreetMap source).',
      positiveThemes: [],
      negativeThemes: [],
      customerComplaints: [],
      stableOperationsEvidence: 'Listed in OpenStreetMap; verify it is still open.',
      contactChannels,
      sources: [
        { name: 'OpenStreetMap', url: osmUrl, checkedAt: now },
        { name: 'Check on Google Maps', url: mapsUrl, checkedAt: now }
      ],
      notes: `Found via OpenStreetMap for "${query}" in ${location}.`,
      isStarred: false,
      isClicked: false,
      isContacted: false,
      searchQuery: `${location} ${query}`,
      createdAt: now,
      updatedAt: now,
      lastVerifiedAt: now
    };
    prospect.brief = createClientBrief(prospect, settings);

    knownIds.add(id);
    items.push(prospect);
  }

  saveStoredProspects([...items, ...existing]);

  return { items, total: items.length, scanned: found.length, skippedDuplicates, location, query };
}
