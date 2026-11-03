import type { AppSettings, LeadSubscores, Prospect, WebsiteStatus } from '../src/types/index.ts';

interface ScoringInput {
  websiteStatus: WebsiteStatus;
  confidenceScore: number;
  reviewRating: number;
  reviewCount: number;
  lastReviewDate?: string;
  category: string;
  phone?: string;
  email?: string;
  hasAddress: boolean;
  isSocialOnly: boolean;
  isClosed?: boolean;
}

interface ScoringOutput {
  leadScore: number;
  subscores: LeadSubscores;
  scoreReasons: string[];
  strongestSignals: string[];
  importantUncertainties: string[];
  recommendedAction: string;
  priorityLabel: 'Highest Priority' | 'Strong Prospect' | 'Investigate Further' | 'Low Priority';
}

const CATEGORY_VALUE_MAP: Record<string, number> = {
  'Restaurants & Cafés': 14,
  'Barbers & Hair Salons': 13,
  'Beauty & Spa': 14,
  'Independent Gyms & Fitness Studios': 15,
  'Plumbers, Electricians & Trades': 14,
  'Auto Repair Shops': 13,
  'Local Hotels & Guesthouses': 15,
  'Local Professional Practices & Clinics': 14,
  'Photographers & Creative Studios': 15,
  'Event Venues & Caterers': 15,
  'default': 12
};

export const calculateLeadScore = (input: ScoringInput, settings: AppSettings): ScoringOutput => {
  const reasons: string[] = [];
  const strongestSignals: string[] = [];
  const uncertainties: string[] = [];

  // Disqualification check
  if (input.isClosed) {
    return {
      leadScore: 0,
      subscores: {
        websiteOpportunity: 0,
        reputation: 0,
        activity: 0,
        categoryValue: 0,
        contactability: 0,
        evidenceQuality: 0,
      },
      scoreReasons: ['Disqualified: Business is reported as permanently closed.'],
      strongestSignals: [],
      importantUncertainties: ['Verify with local directory if premises relocated.'],
      recommendedAction: 'Exclude from active pipeline.',
      priorityLabel: 'Low Priority'
    };
  }

  // Factor 1: Website Opportunity (default weight 30)
  const maxWebOpp = settings.weightWebsiteOpp || 30;
  let webOpp = 0;
  if (input.websiteStatus === 'no_website') {
    webOpp = maxWebOpp;
    strongestSignals.push('No independent website identified across independent checks');
    reasons.push(`Maximum website opportunity: Verified absence of an official domain (+${webOpp} pts).`);
  } else if (input.websiteStatus === 'website_broken') {
    webOpp = Math.round(maxWebOpp * 0.9);
    strongestSignals.push('Candidate domain is broken / malfunctioning — urgent rescue opportunity');
    reasons.push(`High website opportunity: Domain is inaccessible or crashing (+${webOpp} pts).`);
  } else if (input.websiteStatus === 'website_outdated') {
    webOpp = Math.round(maxWebOpp * 0.7);
    reasons.push(`Moderate website opportunity: Existing site is legacy or outdated (+${webOpp} pts).`);
  } else if (input.websiteStatus === 'possibly_no_website') {
    webOpp = Math.round(maxWebOpp * 0.6);
    uncertainties.push('Domain existence status is unconfirmed; manual telephone check recommended');
    reasons.push(`Potential website opportunity: Incomplete evidence of website (+${webOpp} pts).`);
  } else if (input.websiteStatus === 'insufficient_evidence') {
    webOpp = Math.round(maxWebOpp * 0.3);
    uncertainties.push('Insufficient data to confirm web presence');
    reasons.push(`Uncertain website opportunity (+${webOpp} pts).`);
  } else {
    // website_exists
    webOpp = Math.round(maxWebOpp * 0.1);
    reasons.push(`Low website opportunity: Working official website already found (+${webOpp} pts).`);
  }

  if (input.isSocialOnly) {
    strongestSignals.push('Active social profile presence without an independent conversion website');
    reasons.push('Business relies on social media; ideal candidate for dedicated branding and direct booking.');
  }

  // Factor 2: Reputation & Customer Satisfaction (default weight 20)
  const maxReputation = settings.weightReputation || 20;
  let repScore = 0;
  if (input.reviewCount > 0) {
    const ratingRatio = Math.max(0, (input.reviewRating - 2.5) / 2.5); // 5.0 -> 1.0, 2.5 -> 0
    const volumeFactor = Math.min(1.0, input.reviewCount / 25); // 25+ reviews is strong
    repScore = Math.round(maxReputation * (0.6 * ratingRatio + 0.4 * volumeFactor));

    if (input.reviewRating >= 4.4 && input.reviewCount >= 10) {
      strongestSignals.push(`Established local reputation: ${input.reviewRating.toFixed(1)}★ across ${input.reviewCount} customer reviews`);
      reasons.push(`Strong reputation: High customer satisfaction proves business viability and customer love (+${repScore} pts).`);
    } else if (input.reviewRating >= 3.8) {
      reasons.push(`Positive local standing: ${input.reviewRating.toFixed(1)}★ rating (+${repScore} pts).`);
    } else {
      uncertainties.push(`Below-average review rating (${input.reviewRating.toFixed(1)}★); inspect customer feedback before pitching.`);
      reasons.push(`Modest customer satisfaction (+${repScore} pts).`);
    }
  } else {
    repScore = Math.round(maxReputation * 0.3);
    uncertainties.push('Zero public review count found; new establishment or low review density.');
    reasons.push(`No public reviews available (+${repScore} pts).`);
  }

  // Factor 3: Business Activity & Recency (default weight 15)
  const maxActivity = settings.weightActivity || 15;
  let activityScore = Math.round(maxActivity * 0.7);
  if (input.reviewCount >= 15) {
    activityScore = maxActivity;
    reasons.push(`Active operations: Frequent review velocity demonstrates steady footfall (+${activityScore} pts).`);
  } else if (input.reviewCount >= 5) {
    activityScore = Math.round(maxActivity * 0.8);
    reasons.push(`Demonstrated business activity (+${activityScore} pts).`);
  } else {
    activityScore = Math.round(maxActivity * 0.4);
    uncertainties.push('Limited recent public transaction activity.');
    reasons.push(`Low public activity signals (+${activityScore} pts).`);
  }

  // Factor 4: Category Commercial Value for Websites (default weight 15)
  const maxCategory = settings.weightCategoryValue || 15;
  const baseCategoryVal = CATEGORY_VALUE_MAP[input.category] || CATEGORY_VALUE_MAP['default'];
  const categoryRatio = baseCategoryVal / 15;
  const catScore = Math.round(maxCategory * categoryRatio);
  reasons.push(`High ROI category: ${input.category} gains significant client acquisition from web search (+${catScore} pts).`);

  // Factor 5: Public Contactability (default weight 10)
  const maxContact = settings.weightContactability || 10;
  let contactScore = 0;
  if (input.phone) contactScore += Math.round(maxContact * 0.5);
  if (input.email) contactScore += Math.round(maxContact * 0.3);
  if (input.hasAddress) contactScore += Math.round(maxContact * 0.2);
  contactScore = Math.min(maxContact, contactScore);
  if (input.phone) {
    reasons.push(`Direct telephone contact available for personalized outreach (+${contactScore} pts).`);
  } else {
    uncertainties.push('No direct telephone listed; in-person or direct social message required.');
  }

  // Factor 6: Evidence Quality & Confidence (default weight 10)
  const maxEvidence = settings.weightEvidenceQuality || 10;
  const evRatio = Math.min(1.0, (input.confidenceScore || 70) / 100);
  const evScore = Math.round(maxEvidence * evRatio);
  reasons.push(`High verification confidence: Multi-source validation score ${input.confidenceScore}% (+${evScore} pts).`);

  // Total Score (Normalized to 0-100)
  const rawTotal = webOpp + repScore + activityScore + catScore + contactScore + evScore;
  const maxPossible = maxWebOpp + maxReputation + maxActivity + maxCategory + maxContact + maxEvidence;
  const leadScore = Math.min(100, Math.max(0, Math.round((rawTotal / maxPossible) * 100)));

  // Recommended Action
  let recommendedAction = '';
  let priorityLabel: 'Highest Priority' | 'Strong Prospect' | 'Investigate Further' | 'Low Priority' = 'Low Priority';

  if (leadScore >= 85) {
    priorityLabel = 'Highest Priority';
    recommendedAction = `Immediate Outreach: Review generated AI Studio prompt, call ${input.phone || 'business in-person'}, and present tailored concept starting at €${settings.baseWebsitePrice}.`;
  } else if (leadScore >= 70) {
    priorityLabel = 'Strong Prospect';
    recommendedAction = `High Opportunity: Review brief directions, verify owner name or social links, and draft introductory pitch with €${settings.baseWebsitePrice} pricing and €${settings.monthlyHostingPrice}/mo managed hosting.`;
  } else if (leadScore >= 50) {
    priorityLabel = 'Investigate Further';
    recommendedAction = 'Secondary Prospect: Perform manual phone verification to confirm if an unindexed website exists before drafting custom outreach.';
  } else {
    priorityLabel = 'Low Priority';
    recommendedAction = 'Archive or monitor: Low probability of immediate conversion due to existing site or weak signals.';
  }

  return {
    leadScore,
    subscores: {
      websiteOpportunity: webOpp,
      reputation: repScore,
      activity: activityScore,
      categoryValue: catScore,
      contactability: contactScore,
      evidenceQuality: evScore,
    },
    scoreReasons: reasons,
    strongestSignals,
    importantUncertainties: uncertainties,
    recommendedAction,
    priorityLabel
  };
};
