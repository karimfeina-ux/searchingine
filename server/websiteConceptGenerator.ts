import { getGeminiClient } from './ai.ts';
import type { AppSettings, Prospect, WebsiteBrief } from '../src/types/index.ts';

export const generatePersonalizedBrief = async (
  prospect: Prospect,
  settings: AppSettings
): Promise<WebsiteBrief> => {
  const ai = getGeminiClient();

  if (ai) {
    try {
      const prompt = `
You are a senior creative director, UX architect, and website strategist for an independent web creator who builds bespoke websites starting at €${settings.baseWebsitePrice} with optional €${settings.monthlyHostingPrice}/mo managed hosting.

Generate a comprehensive, tailored, and original Website Design Brief for this business:
Business Name: ${prospect.name}
Category: ${prospect.category}
Location: ${prospect.address}, ${prospect.city}, ${prospect.region}, ${prospect.country}
Website Status: ${prospect.websiteStatus}
Phone: ${prospect.phone || 'N/A'}
Review Standing: ${prospect.reviewRating}★ (${prospect.reviewCount} reviews)
Customer Sentiment / Positive Themes: ${prospect.positiveThemes.join(', ') || 'High craft, warm customer care, authentic local atmosphere'}
Operational Stability: ${prospect.stableOperationsEvidence}

Follow this exact JSON schema:
{
  "businessOverview": "Concise 2-3 sentence strategic summary of the business and local market context",
  "targetAudiences": ["Audience 1 description", "Audience 2 description", "Audience 3 description"],
  "verifiedStrengths": ["Strength 1", "Strength 2", "Strength 3"],
  "reviewInsights": ["Insight 1", "Insight 2"],
  "missingCapabilities": ["Missing capability 1", "Missing capability 2"],
  "websiteOpportunities": ["Opportunity 1", "Opportunity 2", "Opportunity 3"],
  "assumptionsToConfirm": ["Item needing confirmation 1", "Item needing confirmation 2"],
  "direction1": {
    "title": "Creative Direction 1 Name",
    "tagline": "Concept tagline",
    "designPhilosophy": "Philosophy description",
    "colorPalette": {
      "primary": "#hex",
      "secondary": "#hex",
      "accent": "#hex",
      "background": "#hex",
      "surface": "#hex",
      "text": "#hex"
    },
    "typography": {
      "headingFont": "Font Name",
      "bodyFont": "Font Name",
      "rationale": "Why this font pair matches the brand"
    },
    "layoutPhilosophy": "Layout description",
    "heroConcept": "Hero section concept and visual focal point",
    "imageTreatment": "Photography and visual style",
    "conversionStrategy": "How this converts visitors into clients",
    "keyComponents": ["Component 1", "Component 2", "Component 3"]
  },
  "direction2": {
    "title": "Creative Direction 2 Name",
    "tagline": "Concept tagline",
    "designPhilosophy": "Philosophy description",
    "colorPalette": {
      "primary": "#hex",
      "secondary": "#hex",
      "accent": "#hex",
      "background": "#hex",
      "surface": "#hex",
      "text": "#hex"
    },
    "typography": {
      "headingFont": "Font Name",
      "bodyFont": "Font Name",
      "rationale": "Why this font pair matches"
    },
    "layoutPhilosophy": "Layout description",
    "heroConcept": "Hero section concept",
    "imageTreatment": "Photography style",
    "conversionStrategy": "Conversion strategy",
    "keyComponents": ["Component 1", "Component 2", "Component 3"]
  },
  "direction3": {
    "title": "Creative Direction 3 Name",
    "tagline": "Concept tagline",
    "designPhilosophy": "Philosophy description",
    "colorPalette": {
      "primary": "#hex",
      "secondary": "#hex",
      "accent": "#hex",
      "background": "#hex",
      "surface": "#hex",
      "text": "#hex"
    },
    "typography": {
      "headingFont": "Font Name",
      "bodyFont": "Font Name",
      "rationale": "Why this font pair matches"
    },
    "layoutPhilosophy": "Layout description",
    "heroConcept": "Hero section concept",
    "imageTreatment": "Photography style",
    "conversionStrategy": "Conversion strategy",
    "keyComponents": ["Component 1", "Component 2", "Component 3"]
  },
  "suggestedPages": [
    { "name": "Page Name", "purpose": "Strategic purpose", "sections": ["Hero", "Feature", "CTA"], "callToAction": "Button label & destination" }
  ],
  "visualDirection": {
    "exactColorsHex": { "Brand": "#hex", "Accent": "#hex", "Dark": "#hex", "Light": "#hex" },
    "fontPairing": "Heading / Body Pairing details",
    "spacingSystem": "4/8/16/24/32/48/64px fluid padding scale",
    "componentDesign": "Card radii, micro-interactions, subtle borders",
    "mobileBehavior": "Sticky mobile CTA bar, bottom sheet navigation, touch-friendly tap targets",
    "animationIdeas": "Subtle entrance reveals, stagger fade-in cards",
    "accessibilityGuidelines": "WCAG AA contrast, semantic HTML5, keyboard navigable tabs",
    "seoConsiderations": "Local Business schema markup, city-specific keywords, OpenGraph meta tags",
    "performanceRequirements": "Sub-1.2s LCP, modern WebP/AVIF images, zero render-blocking CSS",
    "relevantIntegrations": ["WhatsApp Chat Direct", "Google Maps Embed", "Instant Quote / Reservation Form"]
  },
  "conversionUx": {
    "trustBuilders": ["Verified Google Reviews Badge", "Local Neighborhood Address & Opening Hours", "Clear upfront pricing / menu transparency"],
    "callToActions": ["Primary Call to Action", "Secondary Call to Action"],
    "inquiryFlow": "Step-by-step frictionless user inquiry journey",
    "bookingStrategy": "Direct booking or phone call click-to-dial flow"
  },
  "aiStudioPrompt": "A pristine, production-ready, complete copy-paste markdown prompt for Google AI Studio or AI site builders that includes the exact specifications, colors, pages, responsive guidelines, and interactive features to build this custom site from scratch."
}
Return ONLY valid JSON.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const text = response.text || '';
      const parsed = JSON.parse(text);

      return {
        id: `brief_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        prospectId: prospect.id,
        businessOverview: parsed.businessOverview || `${prospect.name} is a premier ${prospect.category} located in ${prospect.city}.`,
        targetAudiences: parsed.targetAudiences || ['Local neighborhood regulars', 'Urban professionals', 'Visitors and new residents searching nearby'],
        verifiedStrengths: parsed.verifiedStrengths || ['Strong word-of-mouth reputation', 'Prime central location', 'High customer satisfaction'],
        reviewInsights: parsed.reviewInsights || [`Customers praise the quality and personal service (${prospect.reviewRating}★)`],
        missingCapabilities: parsed.missingCapabilities || ['No independent web showcase', 'Lacks structured mobile reservation / quote request flow'],
        websiteOpportunities: parsed.websiteOpportunities || ['Capture organic Google local search queries', 'Convert Instagram followers into direct paying clients'],
        assumptionsToConfirm: parsed.assumptionsToConfirm || ['Current seasonal pricing and opening hours', 'Exact menu or service package catalog'],
        direction1: parsed.direction1 || getDefaultDirection1(prospect),
        direction2: parsed.direction2 || getDefaultDirection2(prospect),
        direction3: parsed.direction3 || getDefaultDirection3(prospect),
        suggestedPages: parsed.suggestedPages || getDefaultSuggestedPages(prospect),
        visualDirection: parsed.visualDirection || getDefaultVisualDirection(prospect),
        conversionUx: parsed.conversionUx || getDefaultConversionUx(prospect),
        aiStudioPrompt: parsed.aiStudioPrompt || buildAiStudioPrompt(prospect, settings),
        createdAt: new Date().toISOString()
      };
    } catch (err) {
      console.error('Gemini brief generation error, utilizing deterministic fallback brief:', err);
    }
  }

  // High-fidelity programmatic fallback tailored specifically to the business
  return buildProgrammaticBrief(prospect, settings);
};

function buildProgrammaticBrief(prospect: Prospect, settings: AppSettings): WebsiteBrief {
  const d1 = getDefaultDirection1(prospect);
  const d2 = getDefaultDirection2(prospect);
  const d3 = getDefaultDirection3(prospect);
  const suggestedPages = getDefaultSuggestedPages(prospect);
  const visualDirection = getDefaultVisualDirection(prospect);
  const conversionUx = getDefaultConversionUx(prospect);
  const aiStudioPrompt = buildAiStudioPrompt(prospect, settings);

  return {
    id: `brief_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    prospectId: prospect.id,
    businessOverview: `${prospect.name} is an established ${prospect.category.toLowerCase()} in ${prospect.city} (${prospect.region}, ${prospect.country}). Despite having a strong local reputation (${prospect.reviewRating > 0 ? prospect.reviewRating.toFixed(1) + '★ across ' + prospect.reviewCount + ' reviews' : 'proven local trade'}), the business currently has no independent digital presence, resulting in lost client bookings and zero local search visibility.`,
    targetAudiences: [
      `Local residents and neighbors in ${prospect.city} seeking reliable, top-rated ${prospect.category.toLowerCase()}`,
      'Mobile searchers looking for immediate opening hours, location map, and direct booking/quote options',
      'High-value clients who compare professional reputations before booking services'
    ],
    verifiedStrengths: [
      `Strong public feedback: ${prospect.reviewRating > 0 ? prospect.reviewRating.toFixed(1) + '★ rating' : 'Established physical storefront'}`,
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
    visualDirection,
    conversionUx,
    aiStudioPrompt,
    createdAt: new Date().toISOString()
  };
}

function getDefaultDirection1(p: Prospect) {
  return {
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
    heroConcept: `Atmospheric imagery of ${p.name}'s craft with an elegant headline: "The Art of ${p.category} in ${p.city}."`,
    imageTreatment: 'Rich, natural lighting, duotone micro-accents, deep blacks with subtle warm highlights.',
    conversionStrategy: 'Low-friction "Reserve an Experience" primary CTA paired with immediate WhatsApp quick-chat inquiry.',
    keyComponents: ['Signature Experience Grid', 'Curated Testimonial Showcase', 'Interactive Hours & Neighborhood Map', 'Direct WhatsApp Reservation Float']
  };
}

function getDefaultDirection2(p: Prospect) {
  return {
    title: 'Dynamic, High-Conversion Urban',
    tagline: 'Energetic, direct, and mobile-optimized for swift client acquisition and fast booking.',
    designPhilosophy: 'Bold high-contrast accents, electric blue and emerald trust indicators, quick-glance pricing chips, and instant touch-first interactions.',
    colorPalette: {
      primary: '#0284c7',
      secondary: '#0f766e',
      accent: '#38bdf8',
      background: '#030712',
      surface: '#0f172a',
      text: '#ffffff'
    },
    typography: {
      headingFont: 'Syne / Space Grotesk',
      bodyFont: 'Inter',
      rationale: 'Geometric, contemporary sans-serif with strong horizontal rhythm that drives immediate visual confidence.'
    },
    layoutPhilosophy: 'Single-page fluid landing page with modular cards, prominent pricing pill badges, and sticky bottom booking drawer on mobile.',
    heroConcept: `"Top-Rated ${p.category} in ${p.city} — Book in 30 Seconds." Instant calendar and call buttons.`,
    imageTreatment: 'Crisp action photography, vibrant saturation, subtle radial glow accents behind hero cards.',
    conversionStrategy: 'Instant mobile click-to-call, tap-to-WhatsApp, and automated availability inquiry form.',
    keyComponents: ['3-Step Simple Booking Flow', 'Live Rating & Google Review Strip', 'Package Comparison Pricing Table', 'FAQ Accordion']
  };
}

function getDefaultDirection3(p: Prospect) {
  return {
    title: 'Warm Community & Local Heritage',
    tagline: 'Approachable, warm, authentic local business storytelling that builds instant trust.',
    designPhilosophy: 'Warm terracotta, sage, and deep espresso tones. Rounded friendly card borders, handwritten badge accents, and warm welcoming customer photography.',
    colorPalette: {
      primary: '#b45309',
      secondary: '#15803d',
      accent: '#f59e0b',
      background: '#0c0a09',
      surface: '#1c1917',
      text: '#fafaf9'
    },
    typography: {
      headingFont: 'Outfit / Fraunces',
      bodyFont: 'DM Sans',
      rationale: 'Friendly, organic geometric curves that feel human, welcoming, and deeply rooted in the local neighborhood.'
    },
    layoutPhilosophy: 'Warm storytelling narrative layout guiding the visitor from the founders story to the services, testimonials, and neighborhood map.',
    heroConcept: `"Your Neighborhood ${p.category} in ${p.city}." Welcoming photography of the storefront and team.`,
    imageTreatment: 'Warm golden hour tones, candid smiles, authentic unposed moments of service.',
    conversionStrategy: 'Personalized "Stop by or Say Hello" invitation with instant directions and 1-tap WhatsApp consultation.',
    keyComponents: ['Neighborhood Story & Team Banner', 'Photo Gallery of Real Work', 'Google Reviews Carousel', 'Interactive Directions & Transit Guide']
  };
}

function getDefaultSuggestedPages(p: Prospect) {
  return [
    {
      name: 'Home',
      purpose: 'Establish immediate brand authority, showcase customer reviews, and provide frictionless booking CTAs.',
      sections: ['Hero Value Proposition', 'Signature Services Highlight', 'Social Proof & Rating Strip', 'Interactive Location Map & Opening Hours'],
      callToAction: 'Book Appointment / Request Quotation'
    },
    {
      name: 'Services & Pricing',
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
      name: 'Location & Contact',
      purpose: 'Eliminate friction for visits: directions, parking advice, exact opening hours, phone, and direct WhatsApp chat.',
      sections: ['Interactive Map with Transit Tips', 'Direct Dial Button', 'Contact & Booking Request Form'],
      callToAction: 'Get Directions / Call Now'
    }
  ];
}

function getDefaultVisualDirection(p: Prospect) {
  return {
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
    spacingSystem: '8px modular grid: 8px (xs), 16px (sm), 24px (md), 32px (lg), 48px (xl), 64px (2xl), 96px (section padding)',
    componentDesign: 'Subtle 1px border highlights (border-white/10), 16px rounded corners (rounded-2xl), soft backdrop blur (backdrop-blur-md), micro-elevation on hover.',
    mobileBehavior: 'Sticky bottom CTA bar with "Call Business" and "WhatsApp Chat" buttons. Collapsible hamburger navigation, thumb-zone optimized interactive cards.',
    animationIdeas: 'Smooth stagger fade-in on scroll (IntersectionObserver), gentle pill pulse on CTA buttons, smooth accordion transitions for FAQs.',
    accessibilityGuidelines: 'Compliant with WCAG 2.1 AA standards: minimum 4.5:1 text contrast ratio, keyboard focus rings, alt descriptions for all imagery, ARIA expanded states.',
    seoConsiderations: `LocalBusiness Schema.org JSON-LD markup with exact coordinates (${p.latitude || 41.38}, ${p.longitude || 2.17}), addressLocality: "${p.city}", addressCountry: "${p.country}", openingHoursSpecification, telephone, and aggregateRating.`,
    performanceRequirements: 'Sub-1.2s Largest Contentful Paint (LCP), 100% WebP optimized images with native loading="lazy", zero cumulative layout shift (CLS).',
    relevantIntegrations: ['WhatsApp Click-to-Chat API', 'Google Maps Embed API', 'Direct Email / SMS Booking Notification Webhook', 'Cal.com / Google Calendar or Calendly Appointment Embed']
  };
}

function getDefaultConversionUx(p: Prospect) {
  return {
    trustBuilders: [
      `Prominent Google Review verification badge (${p.reviewRating > 0 ? p.reviewRating.toFixed(1) + '★ rating' : 'Verified Local Business'})`,
      `Exact physical address (${p.address}) and guaranteed response time within 2 business hours`,
      'Transparent service guarantee with no hidden extras'
    ],
    callToActions: [
      'Primary CTA: "Book an Appointment / Request Quotation"',
      'Secondary CTA: "Chat on WhatsApp with Us Today"'
    ],
    inquiryFlow: 'Frictionless 3-step form: 1. Select Service -> 2. Choose Preferred Date/Time -> 3. Enter Name & Mobile Number. Instant confirmation sent via WhatsApp/SMS.',
    bookingStrategy: 'Dual path: Direct phone dial for traditional customers + WhatsApp / interactive modal for digital mobile clients.'
  };
}

export function buildAiStudioPrompt(prospect: Prospect, settings: AppSettings): string {
  return `# COMPLETE WEBSITE BUILD SPECIFICATION: ${prospect.name.toUpperCase()}

## 1. PROJECT OVERVIEW
- **Business Name**: ${prospect.name}
- **Industry / Category**: ${prospect.category}
- **Location**: ${prospect.address}, ${prospect.city}, ${prospect.region}, ${prospect.country}
- **Target Audience**: Local residents, discerning neighborhood clients, and mobile searchers in ${prospect.city}.
- **Reputation Status**: ${prospect.reviewRating > 0 ? `${prospect.reviewRating.toFixed(1)} Stars across ${prospect.reviewCount} customer reviews` : 'Established local business with strong community presence'}.
- **Core Value Proposition**: Premier artisanal craftsmanship, personal customer care, transparent service packages, and effortless mobile booking.
- **Service Package Tier**: Starting at €${settings.baseWebsitePrice} with optional €${settings.monthlyHostingPrice}/mo managed hosting and high-speed local CDN.

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
- **Component Styling**:
  - Border radius: \`rounded-2xl\` (16px) for cards, \`rounded-xl\` for inputs and buttons.
  - Micro-interactions: Subtle scale-up on hover (\`hover:scale-[1.02]\`), gentle glowing border transitions.
  - Backdrop blur: Glassmorphism (\`backdrop-blur-md bg-slate-900/80\`) for sticky navbar and modals.

---

## 3. PAGE STRUCTURE & SECTIONS

### Page 1: Home (Hero & Conversion Hub)
1. **Sticky Header**:
   - ${prospect.name} logo / brand mark
   - Nav links: Services, About, Reviews, Location, FAQ
   - Action Button: "Book Now" + Direct Call icon (${prospect.phone || 'Phone'})
2. **Hero Section**:
   - Headline: "Experience ${prospect.category} at its Finest in ${prospect.city}"
   - Subheadline: "Dedicated service, uncompromising quality, and warm neighborhood hospitality tailored to you."
   - Dual CTA Buttons: [Book Appointment / Request Quote] & [Chat on WhatsApp]
   - Trust Badge: "${prospect.reviewRating > 0 ? `Rated ${prospect.reviewRating.toFixed(1)}/5 Stars by local clients in ${prospect.city}` : 'Verified Local Business'}"
3. **Featured Services Grid**:
   - 3 to 4 core service cards with icons, realistic pricing indications, time duration, and a "Select" button.
4. **Why Choose ${prospect.name}**:
   - 3 value pillars: Artisanal expertise, transparent pricing, guaranteed customer satisfaction.
5. **Interactive Reviews Carousel**:
   - Authentic customer quotes highlighting craft, punctuality, and friendly atmosphere.
6. **Location, Map & Opening Hours**:
   - Address: ${prospect.address}, ${prospect.city}
   - Interactive OpenStreetMap/Google Maps embed
   - Weekly opening hours table with live "Open Now / Closed" indicator
   - Transit and parking tips
7. **Lead Capture & Booking Modal / Form**:
   - Frictionless 3-step booking inquiry: Select Service -> Choose Date/Time -> Contact Details.

---

## 4. FUNCTIONAL REQUIREMENTS & INTEGRATIONS
- **Click-to-Call**: Immediate \`tel:${prospect.phone || '+34...'}\` trigger for mobile visitors.
- **Direct WhatsApp Chat**: \`https://wa.me/...\` pre-filled message ("Hi ${prospect.name}, I would like to inquire about...").
- **LocalBusiness Schema (JSON-LD)**:
\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "${prospect.name}",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "${prospect.address}",
    "addressLocality": "${prospect.city}",
    "addressRegion": "${prospect.region}",
    "addressCountry": "${prospect.country}"
  },
  "telephone": "${prospect.phone || ''}",
  "priceRange": "€€"
}
\`\`\`
- **Mobile Sticky CTA Bar**: On mobile viewports (\`<768px\`), fixed bottom bar with [Call Now] and [Book Appointment] buttons.
- **Fast Load Performance**: 0 render-blocking assets, responsive \`srcset\` images, accessible ARIA attributes.
`;
}
