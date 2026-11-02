import type { AppSettings, LeadStatus, Prospect, WebsiteBrief, WebsiteStatus } from '../types/index.ts';

const STORAGE_KEY_PROSPECTS = 'leadhunter_prospects';
const STORAGE_KEY_EXCLUSIONS_NAMES = 'leadhunter_excluded_names';
const STORAGE_KEY_EXCLUSIONS_PHONES = 'leadhunter_excluded_phones';
const STORAGE_KEY_SETTINGS = 'leadhunter_settings';
const STORAGE_KEY_AUTH = 'leadhunter_admin_user';

export const normalizeBusinessName = (name: string): string => {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const defaultSettings: AppSettings = {
  id: 1,
  isConfigured: true,
  cities: ['Valencia, España', 'Madrid, España', 'Barcelona, España', 'Sevilla, España', 'Málaga, España'],
  region: 'España',
  country: 'España',
  searchRadiusKm: 25,
  categories: ['peluquería', 'barbería', 'panadería', 'cafetería', 'taller mecánico', 'clínica dental', 'fontanero', 'carpintero', 'gimnasio', 'restaurante'],
  excludedCategories: ['Fast food chains', 'Government offices', 'Corporations'],
  languages: ['en', 'es'],
  minRating: 4.2,
  minReviews: 15,
  maxLeadsPerRun: 15,
  dailyScheduleTime: '08:00',
  timezone: 'Europe/Madrid',
  cronEnabled: true,
  baseWebsitePrice: 500,
  monthlyHostingPrice: 40,
  dailyBudgetEur: 10,
  weightWebsiteOpp: 30,
  weightReputation: 20,
  weightActivity: 15,
  weightCategoryValue: 15,
  weightContactability: 10,
  weightEvidenceQuality: 10,
  providerKeys: {},
  uiTheme: 'dark',
  uiLanguage: 'en',
  updatedAt: new Date().toISOString()
};

export function getClientSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {}
  return defaultSettings;
}

export function saveClientSettings(updated: Partial<AppSettings>): AppSettings {
  const current = getClientSettings();
  const merged = { ...current, ...updated };
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(merged));
  } catch {}
  return merged;
}

export function getStoredProspects(): Prospect[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROSPECTS);
    if (raw) {
      let parsed = JSON.parse(raw);
      // One-time cleanup: remove the invented demo leads created by earlier versions.
      if (Array.isArray(parsed) && !localStorage.getItem('leadhunter_purged_fake_v1')) {
        parsed = parsed.filter((p: Prospect) => typeof p.id === 'string' && p.id.startsWith('gp_'));
        localStorage.setItem(STORAGE_KEY_PROSPECTS, JSON.stringify(parsed));
        localStorage.setItem('leadhunter_purged_fake_v1', '1');
      }
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
}

export function backupLocalData(): string | null {
  try {
    const prospects = localStorage.getItem(STORAGE_KEY_PROSPECTS);
    const settings = localStorage.getItem(STORAGE_KEY_SETTINGS);
    const exclusionsNames = localStorage.getItem(STORAGE_KEY_EXCLUSIONS_NAMES);
    const exclusionsPhones = localStorage.getItem(STORAGE_KEY_EXCLUSIONS_PHONES);

    if (!prospects && !settings && !exclusionsNames && !exclusionsPhones) return null;

    const backup = {
      timestamp: new Date().toISOString(),
      prospects: prospects ? JSON.parse(prospects) : [],
      settings: settings ? JSON.parse(settings) : null,
      exclusionsNames: exclusionsNames ? JSON.parse(exclusionsNames) : [],
      exclusionsPhones: exclusionsPhones ? JSON.parse(exclusionsPhones) : []
    };

    const key = `leadhunter_backup_${Date.now()}`;
    localStorage.setItem(key, JSON.stringify(backup));
    return key;
  } catch (err) {
    console.warn('Backup local data warning:', err);
    return null;
  }
}

export function saveStoredProspects(prospects: Prospect[]) {
  try {
    localStorage.setItem(STORAGE_KEY_PROSPECTS, JSON.stringify(prospects));
  } catch {}
}

export function getExcludedSets(): { names: Set<string>; phones: Set<string> } {
  const names = new Set<string>();
  const phones = new Set<string>();

  try {
    const rawNames = localStorage.getItem(STORAGE_KEY_EXCLUSIONS_NAMES);
    if (rawNames) {
      for (const n of JSON.parse(rawNames)) names.add(n);
    }
    const rawPhones = localStorage.getItem(STORAGE_KEY_EXCLUSIONS_PHONES);
    if (rawPhones) {
      for (const p of JSON.parse(rawPhones)) phones.add(p);
    }
  } catch {}

  // Also include clicked, contacted, waiting, signed, not_interested, or excluded prospects in exclusions
  const prospects = getStoredProspects();
  for (const p of prospects) {
    if (
      p.isClicked ||
      p.isContacted ||
      p.status === 'contacted' ||
      p.status === 'waiting' ||
      p.status === 'client_signed' ||
      p.status === 'not_interested' ||
      p.status === 'excluded'
    ) {
      if (p.name) names.add(normalizeBusinessName(p.name));
      if (p.phone) {
        const clean = p.phone.replace(/\D/g, '');
        if (clean.length >= 6) phones.add(clean);
      }
    }
  }

  return { names, phones };
}

export function saveExcludedSets(names: Set<string>, phones: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY_EXCLUSIONS_NAMES, JSON.stringify(Array.from(names)));
    localStorage.setItem(STORAGE_KEY_EXCLUSIONS_PHONES, JSON.stringify(Array.from(phones)));
  } catch {}
}

export function addExclusion(name: string, phone?: string) {
  const { names, phones } = getExcludedSets();
  if (name) names.add(normalizeBusinessName(name));
  if (phone) {
    const clean = phone.replace(/\D/g, '');
    if (clean.length >= 6) phones.add(clean);
  }
  saveExcludedSets(names, phones);
  if (typeof window !== 'undefined' && window.fetch) {
    window.fetch('/api/exclusions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone })
    }).catch(() => {});
  }
}

export function isExcluded(name: string, phone?: string): boolean {
  const { names, phones } = getExcludedSets();
  if (name && names.has(normalizeBusinessName(name))) return true;
  if (phone) {
    const clean = phone.replace(/\D/g, '');
    if (clean.length >= 6 && phones.has(clean)) return true;
  }
  return false;
}

export function deleteProspectClient(prospectId: string): { remaining: Prospect[]; deleted?: Prospect } {
  const current = getStoredProspects();
  const target = current.find((p) => p.id === prospectId);
  if (target) {
    addExclusion(target.name, target.phone);
  }
  const remaining = current.filter((p) => p.id !== prospectId);
  saveStoredProspects(remaining);
  return { remaining, deleted: target };
}

export function clearStoredProspects(options: { keepContacted?: boolean; keepStarred?: boolean; cleanAll?: boolean } = { cleanAll: true }): Prospect[] {
  if (options.cleanAll) {
    saveStoredProspects([]);
    return [];
  }
  const current = getStoredProspects();
  const kept = current.filter((p) => {
    const isContacted = Boolean(p.isContacted || p.status === 'contacted');
    const isStarred = Boolean(p.isStarred);
    if (options.keepContacted && isContacted) return true;
    if (options.keepStarred && isStarred) return true;
    return false;
  });
  saveStoredProspects(kept);
  return kept;
}

export function banProspectHasWebsiteClient(prospectId: string): { success: boolean; name?: string } {
  const current = getStoredProspects();
  const target = current.find((p) => p.id === prospectId);
  if (!target) return { success: false };

  // Add to permanent exclusions so they NEVER appear in any future searches
  addExclusion(target.name, target.phone);

  // Remove from active prospects list
  const next = current.filter((p) => p.id !== prospectId);
  saveStoredProspects(next);

  return { success: true, name: target.name };
}

// Generate complete Website Design Brief programmatically
export function createClientBrief(prospect: Prospect, settings: AppSettings): WebsiteBrief {
  const price = settings.baseWebsitePrice || 500;
  const hosting = settings.monthlyHostingPrice || 40;

  const d1 = {
    title: 'Modern Craft & Quiet Luxury',
    tagline: 'Refined, timeless aesthetic emphasizing artisanal mastery and premium customer care.',
    designPhilosophy: 'Clean generous whitespace, subtle warm stone and slate tones, editorial typography, and high-contrast hero photography highlighting meticulous attention to detail.',
    colorPalette: {
      primary: '#0f172a',
      secondary: '#334155',
      accent: '#0284c7',
      background: '#090d16',
      surface: '#111827',
      text: '#f8fafc'
    },
    typography: {
      headingFont: 'Playfair Display / Serif',
      bodyFont: 'Plus Jakarta Sans / Inter',
      rationale: 'The serif headline evokes established prestige and artisanal heritage, balanced with a hyper-legible modern sans-serif body.'
    },
    layoutPhilosophy: 'Asymmetric editorial grid with prominent full-width visual banner, floating quote cards, and clear sticky navigation.',
    heroConcept: `Atmospheric imagery of ${prospect.name}'s craft with an elegant headline: "The Art of ${prospect.category} in ${prospect.city}."`,
    imageTreatment: 'Rich, natural lighting, duotone micro-accents, deep blacks with subtle warm highlights.',
    conversionStrategy: 'Low-friction "Reserve an Experience" primary CTA paired with immediate WhatsApp quick-chat inquiry.',
    keyComponents: ['Signature Experience Grid', 'Curated Testimonial Showcase', 'Interactive Hours & Neighborhood Map', 'Direct WhatsApp Reservation Float']
  };

  const d2 = {
    title: 'Dynamic, High-Conversion Urban',
    tagline: 'Energetic, direct, and mobile-optimized for swift client acquisition and fast booking.',
    designPhilosophy: 'High contrast dark canvas with electric cyan/indigo accents, bold modern typography, and immediate conversion prompts above the fold.',
    colorPalette: {
      primary: '#0369a1',
      secondary: '#0284c7',
      accent: '#06b6d4',
      background: '#0b1120',
      surface: '#0f172a',
      text: '#f1f5f9'
    },
    typography: {
      headingFont: 'Space Grotesk',
      bodyFont: 'Inter',
      rationale: 'Geometric punch for titles communicating confidence and efficiency, paired with utilitarian body copy.'
    },
    layoutPhilosophy: 'Modular card layout with sticky top action bar, fast 2-step booking modal, and verified review trust counters.',
    heroConcept: `Action-driven hero with direct call button: "Premier ${prospect.category} in ${prospect.city} — Book Your Appointment in 30 Seconds."`,
    imageTreatment: 'Vibrant, high-saturation situational photography with subtle cyan glow borders.',
    conversionStrategy: 'Dual CTA strategy: instant telephone call + interactive booking calendar.',
    keyComponents: ['Instant Call & WhatsApp Bar', 'Top Rated Google Badges (4.8★)', 'Transparent Price List', 'One-Click Directions']
  };

  const d3 = {
    title: 'Neighborhood Warmth & Community Heart',
    tagline: 'Approachable, friendly, and community-centric aesthetic highlighting local roots.',
    designPhilosophy: 'Warm organic tones, soft rounded cards, candid local customer stories, and prominent founder story.',
    colorPalette: {
      primary: '#1e293b',
      secondary: '#475569',
      accent: '#f59e0b',
      background: '#0a0f1d',
      surface: '#131b2e',
      text: '#f8fafc'
    },
    typography: {
      headingFont: 'Outfit',
      bodyFont: 'Plus Jakarta Sans',
      rationale: 'Friendly, modern geometric forms that feel welcoming and community-oriented.'
    },
    layoutPhilosophy: 'Single-page fluid narrative transitioning seamlessly from brand story to service menu and contact form.',
    heroConcept: `Warm welcoming portrait with the headline: "${prospect.city}'s Favorite Neighborhood ${prospect.category}."`,
    imageTreatment: 'Warm color grading, natural candid customer interactions, authentic workshop photos.',
    conversionStrategy: 'Low-pressure "Visit Us Today / Get in Touch" CTA with direct map pin and opening hours.',
    keyComponents: ['Neighborhood Story Section', 'Client Review Carousel', 'Live Opening Hours Tracker', 'Quick Inquiry Form']
  };

  const suggestedPages = [
    {
      name: 'Home / Hero Showcase',
      purpose: `Establish immediate trust, highlight the 4+ star reputation in ${prospect.city}, and present primary service options.`,
      sections: ['Hero Section with Value Proposition', 'Verified Google Reviews Badge', 'Signature Services Highlight', 'Location & Hours Bar'],
      callToAction: 'Book Appointment / Request Quotation'
    },
    {
      name: 'Services & Transparent Pricing',
      purpose: 'Complete transparency on service packages, what is included, and realistic timeframes to qualify inbound leads.',
      sections: ['Package Cards with Clear Pricing', 'Add-on Options', 'Preparation & Consultation Guide'],
      callToAction: 'Select Package & Inquire'
    },
    {
      name: 'About & Our Craft',
      purpose: 'Build personal connection, highlight professional experience and local roots in the city.',
      sections: ['Founder Story', 'Our Values & Standards', 'Behind the Scenes Photography'],
      callToAction: 'Meet the Team'
    },
    {
      name: 'Location & Direct Contact',
      purpose: 'Eliminate friction for visits: directions, parking advice, exact opening hours, phone, and direct WhatsApp chat.',
      sections: ['Interactive Map with Transit Tips', 'Direct Dial Button', 'Contact & Booking Request Form'],
      callToAction: 'Get Directions / Call Now'
    }
  ];

  const aiStudioPrompt = `# COMPLETE WEBSITE BUILD SPECIFICATION: ${prospect.name.toUpperCase()}

## 1. PROJECT OVERVIEW
- **Business Name**: ${prospect.name}
- **Industry / Category**: ${prospect.category}
- **Location**: ${prospect.address}, ${prospect.city}, ${prospect.region}, ${prospect.country}
- **Target Audience**: Local residents, discerning neighborhood clients, and mobile searchers in ${prospect.city}.
- **Reputation Status**: ${prospect.reviewRating} Stars across ${prospect.reviewCount} customer reviews.
- **Core Value Proposition**: Premier artisanal craftsmanship, personal customer care, transparent service packages, and effortless mobile booking.
- **Service Package Tier**: Starting at €${price} with optional €${hosting}/mo managed hosting and high-speed local CDN.

---

## 2. DESIGN PHILOSOPHY & VISUAL SYSTEM
- **Aesthetic**: Premium dark navy and charcoal interface with subtle electric-cyan accents and warm gold trust badges.
- **Palette**:
  - Primary Background: \`#0b1120\`
  - Card & Surface: \`#111827\`
  - Accent / Primary CTA: \`#0284c7\` (Electric Sky Blue)
  - Secondary Accent: \`#06b6d4\` (Cyan Glow)
  - Text Primary: \`#f8fafc\`
  - Text Muted: \`#94a3b8\`
  - Border Highlights: \`rgba(255, 255, 255, 0.08)\`
- **Typography**:
  - Headings: Modern geometric sans-serif or refined modern serif (\`Plus Jakarta Sans\`, \`Space Grotesk\`, or \`Playfair Display\`).
  - Body: Crisp, highly legible sans-serif (\`Inter\`, 16px base, 1.6 line-height).

---

## 3. PAGE STRUCTURE & SECTIONS
### Page 1: Home (Hero & Conversion Hub)
1. **Sticky Header**: Brand logo, Nav links, Action Button ("Book Now" + Direct Call icon: ${prospect.phone || 'Call Now'}).
2. **Hero Section**: Dual CTAs [Book Appointment / Request Quote] & [Chat on WhatsApp], Trust Badge ("Rated ${prospect.reviewRating}/5 Stars by local clients in ${prospect.city}").
3. **Featured Services Grid**: 3 to 4 core service cards with icons, realistic pricing indications, time duration, and a "Select" button.
4. **Why Choose Us**: 3 value pillars: Artisanal expertise, transparent pricing, guaranteed customer satisfaction.
5. **Interactive Reviews Carousel**: Authentic customer quotes highlighting craft, punctuality, and friendly atmosphere.
6. **Location, Map & Opening Hours**: Address: ${prospect.address}, ${prospect.city}. Interactive Map embed & weekly opening hours table.
7. **Lead Capture & Booking Modal / Form**: Frictionless 3-step booking inquiry: Select Service -> Choose Date/Time -> Contact Details.

---

## 4. FUNCTIONAL REQUIREMENTS & INTEGRATIONS
- **Click-to-Call**: Immediate \`tel:${prospect.phone || ''}\` trigger for mobile visitors.
- **Direct WhatsApp Chat**: \`https://wa.me/...\` pre-filled message.
- **LocalBusiness Schema (JSON-LD)** embedded for Google Rich Results.
- **Mobile Sticky CTA Bar**: On mobile viewports (\`<768px\`), fixed bottom bar with [Call Now] and [Book Appointment] buttons.
`;

  return {
    id: `brief_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    prospectId: prospect.id,
    businessOverview: `${prospect.name} is an established ${prospect.category.toLowerCase()} in ${prospect.city} (${prospect.region}, ${prospect.country}). Despite having a strong local reputation (${prospect.reviewRating.toFixed(1)}★ across ${prospect.reviewCount} reviews), the business currently operates with ZERO independent website, losing potential client bookings to digital competitors every week.`,
    targetAudiences: [
      `Local residents and neighbors in ${prospect.city} seeking reliable, top-rated ${prospect.category.toLowerCase()}`,
      'Mobile searchers looking for immediate opening hours, location map, and direct booking/quote options',
      'High-value clients who compare professional reputations before booking services'
    ],
    verifiedStrengths: [
      prospect.reviewRating > 0 ? `Strong public feedback: ${prospect.reviewRating.toFixed(1)}★ rating on Google Maps` : 'Established local business listed in OpenStreetMap',
      `Convenient physical location: ${prospect.address}, ${prospect.city}`,
      'Proven hands-on craftmanship and established customer loyalty'
    ],
    reviewInsights: [
      prospect.positiveThemes.length > 0 ? `Recurring customer praise: ${prospect.positiveThemes.join(', ')}` : 'Recognized for warm service and personal attention',
      'Customers frequently recommend the business via word-of-mouth'
    ],
    missingCapabilities: [
      'No independent domain to showcase full services, pricing transparency, and verified customer testimonials',
      'No direct WhatsApp or mobile click-to-book inquiry pipeline, losing leads to competitors with modern websites',
      'Absence of Google Local Search Schema markup to capture "near me" inquiries'
    ],
    websiteOpportunities: [
      `Capture high-intent "${prospect.category} in ${prospect.city}" Google search traffic`,
      'Establish a 24/7 digital storefront that accepts booking inquiries and answers FAQs automatically',
      'Provide clear, upfront service packages and pricing, increasing average client order value'
    ],
    assumptionsToConfirm: [
      'Confirm current official list of services, prices, and special packages',
      'Confirm preferred contact method for booking confirmations (WhatsApp, Phone, or Email)'
    ],
    direction1: d1,
    direction2: d2,
    direction3: d3,
    suggestedPages,
    visualDirection: {
      exactColorsHex: {
        'Dark Canvas': '#0b1120',
        'Surface Card': '#111827',
        'Electric Accent': '#06b6d4',
        'Primary Accent': '#3b82f6',
        'Warm Gold': '#f59e0b',
        'Text Crisp': '#f8fafc',
        'Text Muted': '#94a3b8'
      },
      fontPairing: 'Primary Heading: "Space Grotesk" or "Playfair Display" | Body: "Plus Jakarta Sans" | Monospace Accents: "JetBrains Mono"',
      spacingSystem: '8px modular grid: 8px, 16px, 24px, 32px, 48px, 64px, 96px',
      componentDesign: 'Subtle 1px border highlights (border-white/10), 16px rounded corners, soft backdrop blur, micro-elevation on hover.',
      mobileBehavior: 'Sticky bottom CTA bar with "Call Business" and "WhatsApp Chat" buttons.',
      animationIdeas: 'Smooth stagger fade-in on scroll, gentle pill pulse on CTA buttons.',
      accessibilityGuidelines: 'WCAG 2.1 AA compliant, minimum 4.5:1 text contrast ratio, alt descriptions for all imagery.',
      seoConsiderations: `LocalBusiness Schema.org JSON-LD markup with exact coordinates, addressLocality: "${prospect.city}", addressCountry: "${prospect.country}".`,
      performanceRequirements: 'Sub-1.2s Largest Contentful Paint (LCP), WebP optimized images with loading="lazy".',
      relevantIntegrations: [
        'WhatsApp Click-to-Chat API',
        'Google Maps Embed API',
        'Direct Phone Dialing'
      ]
    },
    conversionUx: {
      trustBuilders: [
        prospect.reviewRating > 0 ? `Prominent Google Review verification badge (${prospect.reviewRating}★ rating)` : 'Customer testimonials section (collect reviews from happy clients)',
        `Exact physical address (${prospect.address}) and guaranteed fast response time`,
        'Transparent service guarantee with no hidden extras'
      ],
      callToActions: [
        'Primary CTA: "Book an Appointment / Request Quotation"',
        'Secondary CTA: "Chat on WhatsApp with Us Today"'
      ],
      inquiryFlow: 'Frictionless 3-step form: 1. Select Service -> 2. Choose Preferred Date/Time -> 3. Enter Name & Mobile Number.',
      bookingStrategy: 'Dual path: Direct phone dial for traditional customers + WhatsApp / interactive modal for digital mobile clients.'
    },
    aiStudioPrompt,
    createdAt: new Date().toISOString()
  };
}

export function computeStats(prospects: Prospect[]) {
  const totalLeads = prospects.length;
  const noWebsiteCount = prospects.filter((p) => p.websiteStatus === 'no_website' || p.websiteStatus === 'possibly_no_website').length;
  const highPriorityCount = prospects.filter((p) => p.status === 'high_priority' || p.leadScore >= 80).length;
  const readyToContactCount = prospects.filter((p) => p.status === 'ready_to_contact').length;
  const clickedCount = prospects.filter((p) => p.isClicked).length;
  const contactedCount = prospects.filter((p) => p.isContacted || p.status === 'contacted' || p.status === 'waiting' || p.status === 'client_signed').length;
  const clientsWonCount = prospects.filter((p) => p.status === 'client_signed').length;
  const avgScore = totalLeads > 0 ? Math.round((prospects.reduce((acc, p) => acc + p.leadScore, 0) / totalLeads) * 10) / 10 : 0;

  return {
    totalLeads,
    noWebsiteCount,
    highPriorityCount,
    readyToContactCount,
    clickedCount,
    contactedCount,
    clientsWonCount,
    avgScore
  };
}
