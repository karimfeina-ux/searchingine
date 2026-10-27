export type WebsiteStatus =
  | 'no_website'
  | 'possibly_no_website'
  | 'website_exists'
  | 'website_broken'
  | 'website_outdated'
  | 'insufficient_evidence';

export type LeadStatus =
  | 'new'
  | 'high_priority'
  | 'research_required'
  | 'ready_to_contact'
  | 'contacted'
  | 'interested'
  | 'not_interested'
  | 'client_signed'
  | 'excluded';

export interface LeadSubscores {
  websiteOpportunity: number; // max 30
  reputation: number;         // max 20
  activity: number;           // max 15
  categoryValue: number;      // max 15
  contactability: number;     // max 10
  evidenceQuality: number;    // max 10
}

export interface ContactChannel {
  type: 'phone' | 'email' | 'address' | 'instagram' | 'facebook' | 'google_maps' | 'website';
  value: string;
  sourceUrl?: string;
  confidence: number; // 0 - 100
  isBusinessContact: boolean;
  verifiedAt: string;
}

export interface WebsiteVerificationRecord {
  id: string;
  prospectId: string;
  checkType: 'search_engine' | 'business_listing' | 'domain_http_check' | 'social_marketplace' | 'final_assessment';
  status: WebsiteStatus;
  candidateDomain?: string;
  httpStatus?: number;
  responseTimeMs?: number;
  hasSsl?: boolean;
  isSocialProfile?: boolean;
  isDirectory?: boolean;
  isParked?: boolean;
  evidenceUrls: string[];
  searchQueries: string[];
  explanation: string;
  counterEvidence: string;
  recommendedNextStep: string;
  confidenceScore: number;
  checkedAt: string;
}

export interface CreativeDirection {
  title: string;
  tagline: string;
  designPhilosophy: string;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    accentFont?: string;
    rationale: string;
  };
  layoutPhilosophy: string;
  heroConcept: string;
  imageTreatment: string;
  conversionStrategy: string;
  keyComponents: string[];
}

export interface SuggestedPage {
  name: string;
  purpose: string;
  sections: string[];
  callToAction: string;
}

export interface WebsiteBrief {
  id: string;
  prospectId: string;
  businessOverview: string;
  targetAudiences: string[];
  verifiedStrengths: string[];
  reviewInsights: string[];
  missingCapabilities: string[];
  websiteOpportunities: string[];
  assumptionsToConfirm: string[];
  direction1: CreativeDirection;
  direction2: CreativeDirection;
  direction3: CreativeDirection;
  suggestedPages: SuggestedPage[];
  visualDirection: {
    exactColorsHex: { [key: string]: string };
    fontPairing: string;
    spacingSystem: string;
    componentDesign: string;
    mobileBehavior: string;
    animationIdeas: string;
    accessibilityGuidelines: string;
    seoConsiderations: string;
    performanceRequirements: string;
    relevantIntegrations: string[];
  };
  conversionUx: {
    trustBuilders: string[];
    callToActions: string[];
    inquiryFlow: string;
    bookingStrategy: string;
  };
  aiStudioPrompt: string; // Copy-ready comprehensive prompt for Google AI Studio
  createdAt: string;
}

export interface Prospect {
  id: string;
  name: string;
  normalizedName: string;
  category: string;
  subcategory?: string;
  address: string;
  city: string;
  region: string;
  country: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  websiteCandidate?: string;
  websiteStatus: WebsiteStatus;
  status: LeadStatus;
  leadScore: number;
  subscores: LeadSubscores;
  scoreReasons: string[];
  strongestSignals: string[];
  importantUncertainties: string[];
  recommendedAction: string;
  reviewRating: number;
  reviewCount: number;
  lastReviewDate?: string;
  reviewSentimentSummary: string;
  positiveThemes: string[];
  negativeThemes: string[];
  customerComplaints: string[];
  stableOperationsEvidence: string;
  contactChannels: ContactChannel[];
  sources: { name: string; url: string; checkedAt: string }[];
  notes: string;
  isStarred: boolean;
  excludedReason?: string;
  createdAt: string;
  updatedAt: string;
  lastVerifiedAt: string;
  brief?: WebsiteBrief;
  verifications?: WebsiteVerificationRecord[];
}

export interface AppSettings {
  id?: number;
  isConfigured: boolean;
  cities: string[];
  region: string;
  country: string;
  searchRadiusKm: number;
  categories: string[];
  excludedCategories: string[];
  languages: string[];
  minRating: number;
  minReviews: number;
  maxLeadsPerRun: number;
  dailyScheduleTime: string; // e.g. "08:00"
  timezone: string;
  weightWebsiteOpp: number;
  weightReputation: number;
  weightActivity: number;
  weightCategoryValue: number;
  weightContactability: number;
  weightEvidenceQuality: number;
  baseWebsitePrice: number;
  monthlyHostingPrice: number;
  dailyBudgetEur: number;
  cronEnabled: boolean;
  providerKeys: {
    googlePlacesKey?: string;
    serperApiKey?: string;
    serpApiKey?: string;
  };
  uiLanguage: 'en' | 'es';
  uiTheme: 'dark' | 'light';
  updatedAt: string;
}

export interface DailyJobRun {
  id: string;
  runType: 'daily_cron' | 'manual' | 'run_now';
  status: 'running' | 'completed' | 'failed' | 'paused';
  startedAt: string;
  completedAt?: string;
  businessesDiscovered: number;
  websitesVerified: number;
  qualifiedLeads: number;
  duplicatesRemoved: number;
  errors: string[];
  apiUsage: {
    osmQueries: number;
    geminiCalls: number;
    httpChecks: number;
    estimatedCostEur: number;
  };
  summaryReport: string;
}

export interface OutreachDraft {
  id: string;
  prospectId: string;
  channel: 'email' | 'phone_script' | 'in_person_script' | 'instagram_dm' | 'whatsapp';
  subject: string;
  body: string;
  tone: 'professional' | 'consultative' | 'friendly' | 'value_first';
  complianceNotes: string;
  createdAt: string;
}
