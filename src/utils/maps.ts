import type { Prospect } from '../types/index.ts';

/**
 * Returns a direct, valid Google Maps URL for any prospect.
 * If the prospect already has an explicit google_maps contact channel, it uses that.
 * Otherwise, it formats a reliable Google Maps Search query with business name, address, and city.
 */
export function getGoogleMapsUrl(prospect: Partial<Prospect>): string {
  if (!prospect) return 'https://www.google.com/maps';

  // 1. Check existing contact channels
  if (Array.isArray(prospect.contactChannels)) {
    const mapsChannel = prospect.contactChannels.find((c) => c.type === 'google_maps');
    if (mapsChannel?.value && mapsChannel.value.startsWith('http')) {
      return mapsChannel.value;
    }
  }

  // 2. Check sources
  if (Array.isArray(prospect.sources)) {
    const mapsSource = prospect.sources.find((s) => s.url && s.url.includes('maps.google.com'));
    if (mapsSource?.url) {
      return mapsSource.url;
    }
  }

  // 3. Fallback to Google Maps Search API URL
  const queryParts = [prospect.name, prospect.address, prospect.city, prospect.country]
    .filter(Boolean)
    .map((s) => String(s).trim())
    .filter(Boolean);

  const query = queryParts.join(' ') || prospect.name || 'local business';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
