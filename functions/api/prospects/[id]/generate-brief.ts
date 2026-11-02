// Cloudflare Pages Function -> POST /api/prospects/[id]/generate-brief
import { D1Env, d1GetProspectById, d1GetSettings, d1UpsertProspect, handleOptions, json } from '../../../_lib/d1';

export const onRequestOptions = async () => handleOptions();

export const onRequestPost = async ({ params, env }: { params: { id: string }; env: D1Env }) => {
  if (!env.DB) {
    return json({ error: 'Cloudflare D1 database binding DB is not configured' }, 503);
  }

  try {
    const prospect = await d1GetProspectById(env.DB, params.id);
    if (!prospect) {
      return json({ error: 'Prospect not found' }, 404);
    }

    const settings = (await d1GetSettings(env.DB)) || {};
    const price = settings.baseWebsitePrice || 500;
    const hosting = settings.monthlyHostingPrice || 40;

    const brief = {
      id: `brief_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      prospectId: prospect.id,
      businessOverview: `${prospect.name} is an established ${prospect.category || 'business'} in ${prospect.city || 'the area'}. Despite having a strong local reputation (${(prospect.reviewRating || 4.5).toFixed(1)}★ across ${prospect.reviewCount || 10} reviews), the business currently operates with ZERO independent website.`,
      targetAudiences: [
        `Local residents in ${prospect.city || 'the neighborhood'} looking for top-rated ${prospect.category || 'services'}`,
        'Mobile visitors searching on Google Maps seeking direct booking/contact options'
      ],
      verifiedStrengths: [
        prospect.reviewRating > 0 ? `Strong public rating: ${prospect.reviewRating.toFixed(1)}★ on Google Maps` : 'Established local business',
        `Physical presence at ${prospect.address || prospect.city}`
      ],
      reviewInsights: ['Proven service quality and trusted by neighborhood clients'],
      missingCapabilities: [
        'No independent web domain to capture direct search leads and display transparent pricing',
        'No direct WhatsApp or mobile click-to-book inquiry pipeline'
      ],
      websiteOpportunities: [
        `Capture local search traffic in ${prospect.city}`,
        'Provide a 24/7 mobile booking gateway'
      ],
      assumptionsToConfirm: ['Confirm exact opening hours, package offerings, and contact preferences.'],
      direction1: {
        title: 'Modern Craft & Quiet Luxury',
        tagline: 'Refined, timeless aesthetic emphasizing artisanal mastery.',
        designPhilosophy: 'Clean generous whitespace, subtle warm slate tones, editorial typography.',
        colorPalette: { primary: '#0f172a', secondary: '#334155', accent: '#0284c7', background: '#090d16', surface: '#111827', text: '#f8fafc' },
        typography: { headingFont: 'Playfair Display / Serif', bodyFont: 'Plus Jakarta Sans', rationale: 'Elegance and trust.' },
        layoutPhilosophy: 'Asymmetric editorial grid with prominent visual banner.',
        heroConcept: `Atmospheric imagery with headline: "The Art of ${prospect.category} in ${prospect.city}."`,
        imageTreatment: 'Rich natural lighting, deep blacks with subtle warm highlights.',
        conversionStrategy: 'Low-friction primary CTA paired with WhatsApp quick inquiry.',
        keyComponents: ['Signature Experience Grid', 'Curated Testimonial Showcase', 'Interactive Hours & Neighborhood Map']
      },
      direction2: {
        title: 'Dynamic, High-Conversion Urban',
        tagline: 'Energetic, direct, and mobile-optimized for swift client acquisition.',
        designPhilosophy: 'High contrast dark canvas with electric cyan accents.',
        colorPalette: { primary: '#0369a1', secondary: '#0284c7', accent: '#06b6d4', background: '#0b1120', surface: '#0f172a', text: '#f1f5f9' },
        typography: { headingFont: 'Space Grotesk', bodyFont: 'Inter', rationale: 'Geometric punch communicating speed.' },
        layoutPhilosophy: 'Modular card layout with sticky top action bar.',
        heroConcept: `Action-driven hero: "Premier ${prospect.category} in ${prospect.city} — Book in 30 Seconds."`,
        imageTreatment: 'Vibrant, high-saturation situational photography.',
        conversionStrategy: 'Direct click-to-call + WhatsApp quick inquiry.',
        keyComponents: ['Instant Call Bar', 'Google Badges (4.8★)', 'Transparent Price List']
      },
      direction3: {
        title: 'Neighborhood Warmth & Community Heart',
        tagline: 'Approachable, friendly, and community-centric aesthetic.',
        designPhilosophy: 'Warm organic tones, soft rounded cards, candid local customer stories.',
        colorPalette: { primary: '#1e293b', secondary: '#475569', accent: '#f59e0b', background: '#0a0f1d', surface: '#131b2e', text: '#f8fafc' },
        typography: { headingFont: 'Outfit', bodyFont: 'Plus Jakarta Sans', rationale: 'Friendly, warm geometric forms.' },
        layoutPhilosophy: 'Single-page fluid narrative transitioning seamlessly from story to services.',
        heroConcept: `Warm welcoming portrait: "${prospect.city}'s Favorite Local ${prospect.category}."`,
        imageTreatment: 'Warm color grading and natural authentic workshop photos.',
        conversionStrategy: 'Low-pressure "Visit Us Today / Get in Touch" CTA.',
        keyComponents: ['Neighborhood Story Section', 'Client Review Carousel', 'Live Hours Tracker']
      },
      suggestedPages: [
        { name: 'Home / Hero Showcase', purpose: 'Establish immediate trust and present core services.', sections: ['Hero Section', 'Verified Google Reviews Badge', 'Signature Services Highlight', 'Location & Hours'], callToAction: 'Book Appointment' },
        { name: 'Services & Transparent Pricing', purpose: 'Full price transparency starting at €' + price, sections: ['Package Cards', 'Add-on Options'], callToAction: 'Select Package' },
        { name: 'Location & Direct Contact', purpose: 'Direct directions, parking advice, and phone/WhatsApp.', sections: ['Interactive Map', 'Direct Dial Button'], callToAction: 'Call Now' }
      ],
      createdAt: new Date().toISOString()
    };

    prospect.brief = brief;
    prospect.updatedAt = new Date().toISOString();
    await d1UpsertProspect(env.DB, prospect);
    return json(brief);
  } catch (err: any) {
    return json({ error: err?.message || 'Error generating brief' }, 500);
  }
};
