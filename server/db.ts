import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import type {
  AppSettings,
  DailyJobRun,
  OutreachDraft,
  Prospect,
  WebsiteBrief,
  WebsiteVerificationRecord
} from '../src/types/index.ts';

const DATA_DIR = path.resolve('data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'leadhunter.db');
const db = new Database(DB_PATH);

// Enable WAL mode for high performance & safe concurrent writes
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    is_configured INTEGER DEFAULT 0,
    cities TEXT NOT NULL,
    region TEXT NOT NULL,
    country TEXT NOT NULL,
    search_radius_km REAL DEFAULT 15,
    categories TEXT NOT NULL,
    excluded_categories TEXT NOT NULL,
    languages TEXT NOT NULL,
    min_rating REAL DEFAULT 4.0,
    min_reviews INTEGER DEFAULT 5,
    max_leads_per_run INTEGER DEFAULT 10,
    daily_schedule_time TEXT DEFAULT '08:00',
    timezone TEXT DEFAULT 'Europe/Madrid',
    weight_website_opp INTEGER DEFAULT 30,
    weight_reputation INTEGER DEFAULT 20,
    weight_activity INTEGER DEFAULT 15,
    weight_category_value INTEGER DEFAULT 15,
    weight_contactability INTEGER DEFAULT 10,
    weight_evidence_quality INTEGER DEFAULT 10,
    base_website_price REAL DEFAULT 500,
    monthly_hosting_price REAL DEFAULT 40,
    daily_budget_eur REAL DEFAULT 5.0,
    cron_enabled INTEGER DEFAULT 1,
    provider_keys TEXT NOT NULL,
    ui_language TEXT DEFAULT 'en',
    ui_theme TEXT DEFAULT 'dark',
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS prospects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    region TEXT NOT NULL,
    country TEXT NOT NULL,
    postal_code TEXT,
    latitude REAL,
    longitude REAL,
    phone TEXT,
    email TEXT,
    website_candidate TEXT,
    website_status TEXT NOT NULL,
    status TEXT NOT NULL,
    lead_score REAL NOT NULL,
    subscores TEXT NOT NULL,
    score_reasons TEXT NOT NULL,
    strongest_signals TEXT NOT NULL,
    important_uncertainties TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    review_rating REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    last_review_date TEXT,
    review_sentiment_summary TEXT NOT NULL,
    positive_themes TEXT NOT NULL,
    negative_themes TEXT NOT NULL,
    customer_complaints TEXT NOT NULL,
    stable_operations_evidence TEXT NOT NULL,
    contact_channels TEXT NOT NULL,
    sources TEXT NOT NULL,
    notes TEXT DEFAULT '',
    is_starred INTEGER DEFAULT 0,
    excluded_reason TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_verified_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_prospects_city ON prospects(city);
  CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(status);
  CREATE INDEX IF NOT EXISTS idx_prospects_website_status ON prospects(website_status);
  CREATE INDEX IF NOT EXISTS idx_prospects_lead_score ON prospects(lead_score DESC);
  CREATE INDEX IF NOT EXISTS idx_prospects_norm_name ON prospects(normalized_name);

  CREATE TABLE IF NOT EXISTS website_verifications (
    id TEXT PRIMARY KEY,
    prospect_id TEXT NOT NULL,
    check_type TEXT NOT NULL,
    status TEXT NOT NULL,
    candidate_domain TEXT,
    http_status INTEGER,
    response_time_ms INTEGER,
    has_ssl INTEGER,
    is_social_profile INTEGER,
    is_directory INTEGER,
    is_parked INTEGER,
    evidence_urls TEXT NOT NULL,
    search_queries TEXT NOT NULL,
    explanation TEXT NOT NULL,
    counter_evidence TEXT NOT NULL,
    recommended_next_step TEXT NOT NULL,
    confidence_score REAL NOT NULL,
    checked_at TEXT NOT NULL,
    FOREIGN KEY(prospect_id) REFERENCES prospects(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_verifications_prospect ON website_verifications(prospect_id);

  CREATE TABLE IF NOT EXISTS website_briefs (
    id TEXT PRIMARY KEY,
    prospect_id TEXT UNIQUE NOT NULL,
    business_overview TEXT NOT NULL,
    target_audiences TEXT NOT NULL,
    verified_strengths TEXT NOT NULL,
    review_insights TEXT NOT NULL,
    missing_capabilities TEXT NOT NULL,
    website_opportunities TEXT NOT NULL,
    assumptions_to_confirm TEXT NOT NULL,
    direction_1 TEXT NOT NULL,
    direction_2 TEXT NOT NULL,
    direction_3 TEXT NOT NULL,
    suggested_pages TEXT NOT NULL,
    visual_direction TEXT NOT NULL,
    conversion_ux TEXT NOT NULL,
    ai_studio_prompt TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(prospect_id) REFERENCES prospects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS daily_jobs (
    id TEXT PRIMARY KEY,
    run_type TEXT NOT NULL,
    status TEXT NOT NULL,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    businesses_discovered INTEGER DEFAULT 0,
    websites_verified INTEGER DEFAULT 0,
    qualified_leads INTEGER DEFAULT 0,
    duplicates_removed INTEGER DEFAULT 0,
    errors TEXT NOT NULL,
    api_usage TEXT NOT NULL,
    summary_report TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS outreach_drafts (
    id TEXT PRIMARY KEY,
    prospect_id TEXT NOT NULL,
    channel TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    tone TEXT NOT NULL,
    compliance_notes TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(prospect_id) REFERENCES prospects(id) ON DELETE CASCADE
  );
`);

// Seed Default Settings if table is empty
const defaultSettings: AppSettings = {
  isConfigured: true,
  cities: ['Barcelona'],
  region: 'Catalonia',
  country: 'Spain',
  searchRadiusKm: 15,
  categories: [
    'Restaurants & Cafés',
    'Barbers & Hair Salons',
    'Beauty & Spa',
    'Independent Gyms & Fitness Studios',
    'Plumbers, Electricians & Trades',
    'Auto Repair Shops',
    'Local Hotels & Guesthouses',
    'Local Professional Practices & Clinics',
    'Photographers & Creative Studios',
    'Event Venues & Caterers'
  ],
  excludedCategories: ['Franchise Fast Food', 'Government Offices', 'Public Schools'],
  languages: ['Spanish', 'Catalan', 'English'],
  minRating: 4.0,
  minReviews: 5,
  maxLeadsPerRun: 8,
  dailyScheduleTime: '08:00',
  timezone: 'Europe/Madrid',
  weightWebsiteOpp: 30,
  weightReputation: 20,
  weightActivity: 15,
  weightCategoryValue: 15,
  weightContactability: 10,
  weightEvidenceQuality: 10,
  baseWebsitePrice: 500,
  monthlyHostingPrice: 40,
  dailyBudgetEur: 5.0,
  cronEnabled: true,
  providerKeys: {},
  uiLanguage: 'en',
  uiTheme: 'dark',
  updatedAt: new Date().toISOString()
};

const existingSettings = db.prepare('SELECT id FROM settings WHERE id = 1').get();
if (!existingSettings) {
  db.prepare(`
    INSERT INTO settings (
      id, is_configured, cities, region, country, search_radius_km, categories, excluded_categories,
      languages, min_rating, min_reviews, max_leads_per_run, daily_schedule_time, timezone,
      weight_website_opp, weight_reputation, weight_activity, weight_category_value,
      weight_contactability, weight_evidence_quality, base_website_price, monthly_hosting_price,
      daily_budget_eur, cron_enabled, provider_keys, ui_language, ui_theme, updated_at
    ) VALUES (
      1, @is_configured, @cities, @region, @country, @search_radius_km, @categories, @excluded_categories,
      @languages, @min_rating, @min_reviews, @max_leads_per_run, @daily_schedule_time, @timezone,
      @weight_website_opp, @weight_reputation, @weight_activity, @weight_category_value,
      @weight_contactability, @weight_evidence_quality, @base_website_price, @monthly_hosting_price,
      @daily_budget_eur, @cron_enabled, @provider_keys, @ui_language, @ui_theme, @updated_at
    )
  `).run({
    is_configured: defaultSettings.isConfigured ? 1 : 0,
    cities: JSON.stringify(defaultSettings.cities),
    region: defaultSettings.region,
    country: defaultSettings.country,
    search_radius_km: defaultSettings.searchRadiusKm,
    categories: JSON.stringify(defaultSettings.categories),
    excluded_categories: JSON.stringify(defaultSettings.excludedCategories),
    languages: JSON.stringify(defaultSettings.languages),
    min_rating: defaultSettings.minRating,
    min_reviews: defaultSettings.minReviews,
    max_leads_per_run: defaultSettings.maxLeadsPerRun,
    daily_schedule_time: defaultSettings.dailyScheduleTime,
    timezone: defaultSettings.timezone,
    weight_website_opp: defaultSettings.weightWebsiteOpp,
    weight_reputation: defaultSettings.weightReputation,
    weight_activity: defaultSettings.weightActivity,
    weight_category_value: defaultSettings.weightCategoryValue,
    weight_contactability: defaultSettings.weightContactability,
    weight_evidence_quality: defaultSettings.weightEvidenceQuality,
    base_website_price: defaultSettings.baseWebsitePrice,
    monthly_hosting_price: defaultSettings.monthlyHostingPrice,
    daily_budget_eur: defaultSettings.dailyBudgetEur,
    cron_enabled: defaultSettings.cronEnabled ? 1 : 0,
    provider_keys: JSON.stringify(defaultSettings.providerKeys),
    ui_language: defaultSettings.uiLanguage,
    ui_theme: defaultSettings.uiTheme,
    updated_at: defaultSettings.updatedAt
  });
}

// Data Access API
export const getSettings = (): AppSettings => {
  const row: any = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  if (!row) return defaultSettings;
  return {
    id: row.id,
    isConfigured: Boolean(row.is_configured),
    cities: JSON.parse(row.cities || '[]'),
    region: row.region,
    country: row.country,
    searchRadiusKm: row.search_radius_km,
    categories: JSON.parse(row.categories || '[]'),
    excludedCategories: JSON.parse(row.excluded_categories || '[]'),
    languages: JSON.parse(row.languages || '[]'),
    minRating: row.min_rating,
    minReviews: row.min_reviews,
    maxLeadsPerRun: row.max_leads_per_run,
    dailyScheduleTime: row.daily_schedule_time,
    timezone: row.timezone,
    weightWebsiteOpp: row.weight_website_opp,
    weightReputation: row.weight_reputation,
    weightActivity: row.weight_activity,
    weightCategoryValue: row.weight_category_value,
    weightContactability: row.weight_contactability,
    weightEvidenceQuality: row.weight_evidence_quality,
    baseWebsitePrice: row.base_website_price,
    monthlyHostingPrice: row.monthly_hosting_price,
    dailyBudgetEur: row.daily_budget_eur,
    cronEnabled: Boolean(row.cron_enabled),
    providerKeys: JSON.parse(row.provider_keys || '{}'),
    uiLanguage: row.ui_language || 'en',
    uiTheme: row.ui_theme || 'dark',
    updatedAt: row.updated_at
  };
};

export const updateSettings = (partial: Partial<AppSettings>): AppSettings => {
  const current = getSettings();
  const next: AppSettings = { ...current, ...partial, updatedAt: new Date().toISOString() };

  db.prepare(`
    UPDATE settings SET
      is_configured = @is_configured,
      cities = @cities,
      region = @region,
      country = @country,
      search_radius_km = @search_radius_km,
      categories = @categories,
      excluded_categories = @excluded_categories,
      languages = @languages,
      min_rating = @min_rating,
      min_reviews = @min_reviews,
      max_leads_per_run = @max_leads_per_run,
      daily_schedule_time = @daily_schedule_time,
      timezone = @timezone,
      weight_website_opp = @weight_website_opp,
      weight_reputation = @weight_reputation,
      weight_activity = @weight_activity,
      weight_category_value = @weight_category_value,
      weight_contactability = @weight_contactability,
      weight_evidence_quality = @weight_evidence_quality,
      base_website_price = @base_website_price,
      monthly_hosting_price = @monthly_hosting_price,
      daily_budget_eur = @daily_budget_eur,
      cron_enabled = @cron_enabled,
      provider_keys = @provider_keys,
      ui_language = @ui_language,
      ui_theme = @ui_theme,
      updated_at = @updated_at
    WHERE id = 1
  `).run({
    is_configured: next.isConfigured ? 1 : 0,
    cities: JSON.stringify(next.cities),
    region: next.region,
    country: next.country,
    search_radius_km: next.searchRadiusKm,
    categories: JSON.stringify(next.categories),
    excluded_categories: JSON.stringify(next.excludedCategories),
    languages: JSON.stringify(next.languages),
    min_rating: next.minRating,
    min_reviews: next.minReviews,
    max_leads_per_run: next.maxLeadsPerRun,
    daily_schedule_time: next.dailyScheduleTime,
    timezone: next.timezone,
    weight_website_opp: next.weightWebsiteOpp,
    weight_reputation: next.weightReputation,
    weight_activity: next.weightActivity,
    weight_category_value: next.weightCategoryValue,
    weight_contactability: next.weightContactability,
    weight_evidence_quality: next.weightEvidenceQuality,
    base_website_price: next.baseWebsitePrice,
    monthly_hosting_price: next.monthlyHostingPrice,
    daily_budget_eur: next.dailyBudgetEur,
    cron_enabled: next.cronEnabled ? 1 : 0,
    provider_keys: JSON.stringify(next.providerKeys),
    ui_language: next.uiLanguage,
    ui_theme: next.uiTheme,
    updated_at: next.updatedAt
  });

  return getSettings();
};

export const getProspects = (filter?: {
  status?: string;
  websiteStatus?: string;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): { items: Prospect[]; total: number } => {
  let query = 'SELECT * FROM prospects WHERE 1=1';
  const params: any = {};

  if (filter?.status && filter.status !== 'all') {
    query += ' AND status = @status';
    params.status = filter.status;
  }
  if (filter?.websiteStatus && filter.websiteStatus !== 'all') {
    query += ' AND website_status = @websiteStatus';
    params.websiteStatus = filter.websiteStatus;
  }
  if (filter?.category && filter.category !== 'all') {
    query += ' AND category = @category';
    params.category = filter.category;
  }
  if (filter?.search) {
    query += ' AND (name LIKE @search OR address LIKE @search OR category LIKE @search OR notes LIKE @search)';
    params.search = `%${filter.search}%`;
  }

  const countRow: any = db.prepare(query.replace('SELECT *', 'SELECT COUNT(*) as cnt')).get(params);
  const total = countRow ? countRow.cnt : 0;

  query += ' ORDER BY is_starred DESC, lead_score DESC, updated_at DESC';

  if (filter?.limit) {
    query += ` LIMIT ${Number(filter.limit)} OFFSET ${Number(filter.offset || 0)}`;
  }

  const rows: any[] = db.prepare(query).all(params);
  const items = rows.map(hydrateProspect);
  return { items, total };
};

export const getProspectById = (id: string): Prospect | null => {
  const row: any = db.prepare('SELECT * FROM prospects WHERE id = ?').get(id);
  if (!row) return null;
  const prospect = hydrateProspect(row);

  // Attach brief
  const briefRow: any = db.prepare('SELECT * FROM website_briefs WHERE prospect_id = ?').get(id);
  if (briefRow) {
    prospect.brief = hydrateBrief(briefRow);
  }

  // Attach verifications
  const verRows: any[] = db.prepare('SELECT * FROM website_verifications WHERE prospect_id = ? ORDER BY checked_at DESC').all(id);
  prospect.verifications = verRows.map(hydrateVerification);

  return prospect;
};

export const findExistingProspect = (normalizedName: string, city: string, phone?: string): Prospect | null => {
  let row: any = null;
  if (phone && phone.trim().length > 5) {
    row = db.prepare('SELECT * FROM prospects WHERE phone = ? LIMIT 1').get(phone.trim());
  }
  if (!row) {
    row = db.prepare('SELECT * FROM prospects WHERE normalized_name = ? AND city = ? LIMIT 1').get(normalizedName, city);
  }
  return row ? hydrateProspect(row) : null;
};

export const saveProspect = (p: Prospect): void => {
  const stmt = db.prepare(`
    INSERT INTO prospects (
      id, name, normalized_name, category, subcategory, address, city, region, country,
      postal_code, latitude, longitude, phone, email, website_candidate, website_status,
      status, lead_score, subscores, score_reasons, strongest_signals, important_uncertainties,
      recommended_action, review_rating, review_count, last_review_date,
      review_sentiment_summary, positive_themes, negative_themes, customer_complaints,
      stable_operations_evidence, contact_channels, sources, notes, is_starred,
      excluded_reason, created_at, updated_at, last_verified_at
    ) VALUES (
      @id, @name, @normalized_name, @category, @subcategory, @address, @city, @region, @country,
      @postal_code, @latitude, @longitude, @phone, @email, @website_candidate, @website_status,
      @status, @lead_score, @subscores, @score_reasons, @strongest_signals, @important_uncertainties,
      @recommended_action, @review_rating, @review_count, @last_review_date,
      @review_sentiment_summary, @positive_themes, @negative_themes, @customer_complaints,
      @stable_operations_evidence, @contact_channels, @sources, @notes, @is_starred,
      @excluded_reason, @created_at, @updated_at, @last_verified_at
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      normalized_name = excluded.normalized_name,
      category = excluded.category,
      subcategory = excluded.subcategory,
      address = excluded.address,
      city = excluded.city,
      region = excluded.region,
      country = excluded.country,
      postal_code = excluded.postal_code,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      phone = excluded.phone,
      email = excluded.email,
      website_candidate = excluded.website_candidate,
      website_status = excluded.website_status,
      status = excluded.status,
      lead_score = excluded.lead_score,
      subscores = excluded.subscores,
      score_reasons = excluded.score_reasons,
      strongest_signals = excluded.strongest_signals,
      important_uncertainties = excluded.important_uncertainties,
      recommended_action = excluded.recommended_action,
      review_rating = excluded.review_rating,
      review_count = excluded.review_count,
      last_review_date = excluded.last_review_date,
      review_sentiment_summary = excluded.review_sentiment_summary,
      positive_themes = excluded.positive_themes,
      negative_themes = excluded.negative_themes,
      customer_complaints = excluded.customer_complaints,
      stable_operations_evidence = excluded.stable_operations_evidence,
      contact_channels = excluded.contact_channels,
      sources = excluded.sources,
      notes = excluded.notes,
      is_starred = excluded.is_starred,
      excluded_reason = excluded.excluded_reason,
      updated_at = excluded.updated_at,
      last_verified_at = excluded.last_verified_at
  `);

  stmt.run({
    id: p.id,
    name: p.name,
    normalized_name: p.normalizedName,
    category: p.category,
    subcategory: p.subcategory || null,
    address: p.address,
    city: p.city,
    region: p.region,
    country: p.country,
    postal_code: p.postalCode || null,
    latitude: p.latitude || null,
    longitude: p.longitude || null,
    phone: p.phone || null,
    email: p.email || null,
    website_candidate: p.websiteCandidate || null,
    website_status: p.websiteStatus,
    status: p.status,
    lead_score: p.leadScore,
    subscores: JSON.stringify(p.subscores),
    score_reasons: JSON.stringify(p.scoreReasons),
    strongest_signals: JSON.stringify(p.strongestSignals),
    important_uncertainties: JSON.stringify(p.importantUncertainties),
    recommended_action: p.recommendedAction,
    review_rating: p.reviewRating,
    review_count: p.reviewCount,
    last_review_date: p.lastReviewDate || null,
    review_sentiment_summary: p.reviewSentimentSummary,
    positive_themes: JSON.stringify(p.positiveThemes),
    negative_themes: JSON.stringify(p.negativeThemes),
    customer_complaints: JSON.stringify(p.customerComplaints),
    stable_operations_evidence: p.stableOperationsEvidence,
    contact_channels: JSON.stringify(p.contactChannels),
    sources: JSON.stringify(p.sources),
    notes: p.notes || '',
    is_starred: p.isStarred ? 1 : 0,
    excluded_reason: p.excludedReason || null,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
    last_verified_at: p.lastVerifiedAt
  });
};

export const updateProspectStatus = (id: string, status: string, notes?: string): void => {
  let q = 'UPDATE prospects SET status = ?, updated_at = ?';
  const params: any[] = [status, new Date().toISOString()];
  if (notes !== undefined) {
    q += ', notes = ?';
    params.push(notes);
  }
  q += ' WHERE id = ?';
  params.push(id);
  db.prepare(q).run(...params);
};

export const toggleProspectStar = (id: string): boolean => {
  const current: any = db.prepare('SELECT is_starred FROM prospects WHERE id = ?').get(id);
  if (!current) return false;
  const next = current.is_starred ? 0 : 1;
  db.prepare('UPDATE prospects SET is_starred = ? WHERE id = ?').run(next, id);
  return Boolean(next);
};

export const deleteProspect = (id: string): void => {
  db.prepare('DELETE FROM prospects WHERE id = ?').run(id);
};

export const saveVerification = (v: WebsiteVerificationRecord): void => {
  db.prepare(`
    INSERT INTO website_verifications (
      id, prospect_id, check_type, status, candidate_domain, http_status,
      response_time_ms, has_ssl, is_social_profile, is_directory, is_parked,
      evidence_urls, search_queries, explanation, counter_evidence,
      recommended_next_step, confidence_score, checked_at
    ) VALUES (
      @id, @prospect_id, @check_type, @status, @candidate_domain, @http_status,
      @response_time_ms, @has_ssl, @is_social_profile, @is_directory, @is_parked,
      @evidence_urls, @search_queries, @explanation, @counter_evidence,
      @recommended_next_step, @confidence_score, @checked_at
    )
  `).run({
    id: v.id,
    prospect_id: v.prospectId,
    check_type: v.checkType,
    status: v.status,
    candidate_domain: v.candidateDomain || null,
    http_status: v.httpStatus || null,
    response_time_ms: v.responseTimeMs || null,
    has_ssl: v.hasSsl ? 1 : 0,
    is_social_profile: v.isSocialProfile ? 1 : 0,
    is_directory: v.isDirectory ? 1 : 0,
    is_parked: v.isParked ? 1 : 0,
    evidence_urls: JSON.stringify(v.evidenceUrls || []),
    search_queries: JSON.stringify(v.searchQueries || []),
    explanation: v.explanation,
    counter_evidence: v.counterEvidence,
    recommended_next_step: v.recommendedNextStep,
    confidence_score: v.confidenceScore,
    checked_at: v.checkedAt
  });
};

export const saveWebsiteBrief = (brief: WebsiteBrief): void => {
  db.prepare(`
    INSERT INTO website_briefs (
      id, prospect_id, business_overview, target_audiences, verified_strengths,
      review_insights, missing_capabilities, website_opportunities, assumptions_to_confirm,
      direction_1, direction_2, direction_3, suggested_pages, visual_direction, conversion_ux,
      ai_studio_prompt, created_at
    ) VALUES (
      @id, @prospect_id, @business_overview, @target_audiences, @verified_strengths,
      @review_insights, @missing_capabilities, @website_opportunities, @assumptions_to_confirm,
      @direction_1, @direction_2, @direction_3, @suggested_pages, @visual_direction, @conversion_ux,
      @ai_studio_prompt, @created_at
    )
    ON CONFLICT(prospect_id) DO UPDATE SET
      business_overview = excluded.business_overview,
      target_audiences = excluded.target_audiences,
      verified_strengths = excluded.verified_strengths,
      review_insights = excluded.review_insights,
      missing_capabilities = excluded.missing_capabilities,
      website_opportunities = excluded.website_opportunities,
      assumptions_to_confirm = excluded.assumptions_to_confirm,
      direction_1 = excluded.direction_1,
      direction_2 = excluded.direction_2,
      direction_3 = excluded.direction_3,
      suggested_pages = excluded.suggested_pages,
      visual_direction = excluded.visual_direction,
      conversion_ux = excluded.conversion_ux,
      ai_studio_prompt = excluded.ai_studio_prompt,
      created_at = excluded.created_at
  `).run({
    id: brief.id,
    prospect_id: brief.prospectId,
    business_overview: brief.businessOverview,
    target_audiences: JSON.stringify(brief.targetAudiences),
    verified_strengths: JSON.stringify(brief.verifiedStrengths),
    review_insights: JSON.stringify(brief.reviewInsights),
    missing_capabilities: JSON.stringify(brief.missingCapabilities),
    website_opportunities: JSON.stringify(brief.websiteOpportunities),
    assumptions_to_confirm: JSON.stringify(brief.assumptionsToConfirm),
    direction_1: JSON.stringify(brief.direction1),
    direction_2: JSON.stringify(brief.direction2),
    direction_3: JSON.stringify(brief.direction3),
    suggested_pages: JSON.stringify(brief.suggestedPages),
    visual_direction: JSON.stringify(brief.visualDirection),
    conversion_ux: JSON.stringify(brief.conversionUx),
    ai_studio_prompt: brief.aiStudioPrompt,
    created_at: brief.createdAt
  });
};

export const saveJobRun = (job: DailyJobRun): void => {
  db.prepare(`
    INSERT INTO daily_jobs (
      id, run_type, status, started_at, completed_at, businesses_discovered,
      websites_verified, qualified_leads, duplicates_removed, errors, api_usage, summary_report
    ) VALUES (
      @id, @run_type, @status, @started_at, @completed_at, @businesses_discovered,
      @websites_verified, @qualified_leads, @duplicates_removed, @errors, @api_usage, @summary_report
    )
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status,
      completed_at = excluded.completed_at,
      businesses_discovered = excluded.businesses_discovered,
      websites_verified = excluded.websites_verified,
      qualified_leads = excluded.qualified_leads,
      duplicates_removed = excluded.duplicates_removed,
      errors = excluded.errors,
      api_usage = excluded.api_usage,
      summary_report = excluded.summary_report
  `).run({
    id: job.id,
    run_type: job.runType,
    status: job.status,
    started_at: job.startedAt,
    completed_at: job.completedAt || null,
    businesses_discovered: job.businessesDiscovered,
    websites_verified: job.websitesVerified,
    qualified_leads: job.qualifiedLeads,
    duplicates_removed: job.duplicatesRemoved,
    errors: JSON.stringify(job.errors),
    api_usage: JSON.stringify(job.apiUsage),
    summary_report: job.summaryReport
  });
};

export const getRecentJobs = (limit: number = 10): DailyJobRun[] => {
  const rows: any[] = db.prepare('SELECT * FROM daily_jobs ORDER BY started_at DESC LIMIT ?').all(limit);
  return rows.map((r) => ({
    id: r.id,
    runType: r.run_type,
    status: r.status,
    startedAt: r.started_at,
    completedAt: r.completed_at,
    businessesDiscovered: r.businesses_discovered,
    websitesVerified: r.websites_verified,
    qualifiedLeads: r.qualified_leads,
    duplicatesRemoved: r.duplicates_removed,
    errors: JSON.parse(r.errors || '[]'),
    apiUsage: JSON.parse(r.api_usage || '{}'),
    summaryReport: r.summary_report
  }));
};

export const getLatestReport = (): DailyJobRun | null => {
  const row: any = db.prepare("SELECT * FROM daily_jobs WHERE status = 'completed' ORDER BY started_at DESC LIMIT 1").get();
  if (!row) return null;
  return {
    id: row.id,
    runType: row.run_type,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    businessesDiscovered: row.businesses_discovered,
    websitesVerified: row.websites_verified,
    qualifiedLeads: row.qualified_leads,
    duplicatesRemoved: row.duplicates_removed,
    errors: JSON.parse(row.errors || '[]'),
    apiUsage: JSON.parse(row.api_usage || '{}'),
    summaryReport: row.summary_report
  };
};

export const saveOutreachDraft = (draft: OutreachDraft): void => {
  db.prepare(`
    INSERT INTO outreach_drafts (id, prospect_id, channel, subject, body, tone, compliance_notes, created_at)
    VALUES (@id, @prospect_id, @channel, @subject, @body, @tone, @compliance_notes, @created_at)
  `).run({
    id: draft.id,
    prospect_id: draft.prospectId,
    channel: draft.channel,
    subject: draft.subject,
    body: draft.body,
    tone: draft.tone,
    compliance_notes: draft.complianceNotes,
    created_at: draft.createdAt
  });
};

export const getOutreachDrafts = (prospectId: string): OutreachDraft[] => {
  const rows: any[] = db.prepare('SELECT * FROM outreach_drafts WHERE prospect_id = ? ORDER BY created_at DESC').all(prospectId);
  return rows.map((r) => ({
    id: r.id,
    prospectId: r.prospect_id,
    channel: r.channel,
    subject: r.subject,
    body: r.body,
    tone: r.tone,
    complianceNotes: r.compliance_notes,
    createdAt: r.created_at
  }));
};

export const getStats = () => {
  const totalRow: any = db.prepare('SELECT COUNT(*) as cnt FROM prospects').get();
  const noWebsiteRow: any = db.prepare("SELECT COUNT(*) as cnt FROM prospects WHERE website_status IN ('no_website', 'possibly_no_website')").get();
  const highPriorityRow: any = db.prepare('SELECT COUNT(*) as cnt FROM prospects WHERE lead_score >= 70').get();
  const readyToContactRow: any = db.prepare("SELECT COUNT(*) as cnt FROM prospects WHERE status = 'ready_to_contact'").get();
  const contactedRow: any = db.prepare("SELECT COUNT(*) as cnt FROM prospects WHERE status = 'contacted'").get();
  const clientsWonRow: any = db.prepare("SELECT COUNT(*) as cnt FROM prospects WHERE status = 'client_signed'").get();
  const avgScoreRow: any = db.prepare('SELECT AVG(lead_score) as avg_score FROM prospects').get();

  return {
    totalLeads: totalRow?.cnt || 0,
    noWebsiteCount: noWebsiteRow?.cnt || 0,
    highPriorityCount: highPriorityRow?.cnt || 0,
    readyToContactCount: readyToContactRow?.cnt || 0,
    contactedCount: contactedRow?.cnt || 0,
    clientsWonCount: clientsWonRow?.cnt || 0,
    avgScore: Math.round((avgScoreRow?.avg_score || 0) * 10) / 10
  };
};

// Hydration Helpers
function hydrateProspect(row: any): Prospect {
  return {
    id: row.id,
    name: row.name,
    normalizedName: row.normalized_name,
    category: row.category,
    subcategory: row.subcategory,
    address: row.address,
    city: row.city,
    region: row.region,
    country: row.country,
    postalCode: row.postal_code,
    latitude: row.latitude,
    longitude: row.longitude,
    phone: row.phone,
    email: row.email,
    websiteCandidate: row.website_candidate,
    websiteStatus: row.website_status as any,
    status: row.status as any,
    leadScore: row.lead_score,
    subscores: JSON.parse(row.subscores || '{}'),
    scoreReasons: JSON.parse(row.score_reasons || '[]'),
    strongestSignals: JSON.parse(row.strongest_signals || '[]'),
    importantUncertainties: JSON.parse(row.important_uncertainties || '[]'),
    recommendedAction: row.recommended_action,
    reviewRating: row.review_rating,
    reviewCount: row.review_count,
    lastReviewDate: row.last_review_date,
    reviewSentimentSummary: row.review_sentiment_summary,
    positiveThemes: JSON.parse(row.positive_themes || '[]'),
    negativeThemes: JSON.parse(row.negative_themes || '[]'),
    customerComplaints: JSON.parse(row.customer_complaints || '[]'),
    stableOperationsEvidence: row.stable_operations_evidence,
    contactChannels: JSON.parse(row.contact_channels || '[]'),
    sources: JSON.parse(row.sources || '[]'),
    notes: row.notes || '',
    isStarred: Boolean(row.is_starred),
    excludedReason: row.excluded_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastVerifiedAt: row.last_verified_at
  };
}

function hydrateBrief(row: any): WebsiteBrief {
  return {
    id: row.id,
    prospectId: row.prospect_id,
    businessOverview: row.business_overview,
    targetAudiences: JSON.parse(row.target_audiences || '[]'),
    verifiedStrengths: JSON.parse(row.verified_strengths || '[]'),
    reviewInsights: JSON.parse(row.review_insights || '[]'),
    missingCapabilities: JSON.parse(row.missing_capabilities || '[]'),
    websiteOpportunities: JSON.parse(row.website_opportunities || '[]'),
    assumptionsToConfirm: JSON.parse(row.assumptions_to_confirm || '[]'),
    direction1: JSON.parse(row.direction_1 || '{}'),
    direction2: JSON.parse(row.direction_2 || '{}'),
    direction3: JSON.parse(row.direction_3 || '{}'),
    suggestedPages: JSON.parse(row.suggested_pages || '[]'),
    visualDirection: JSON.parse(row.visual_direction || '{}'),
    conversionUx: JSON.parse(row.conversion_ux || '{}'),
    aiStudioPrompt: row.ai_studio_prompt,
    createdAt: row.created_at
  };
}

function hydrateVerification(row: any): WebsiteVerificationRecord {
  return {
    id: row.id,
    prospectId: row.prospect_id,
    checkType: row.check_type,
    status: row.status,
    candidateDomain: row.candidate_domain,
    httpStatus: row.http_status,
    responseTimeMs: row.response_time_ms,
    hasSsl: Boolean(row.has_ssl),
    isSocialProfile: Boolean(row.is_social_profile),
    isDirectory: Boolean(row.is_directory),
    isParked: Boolean(row.is_parked),
    evidenceUrls: JSON.parse(row.evidence_urls || '[]'),
    searchQueries: JSON.parse(row.search_queries || '[]'),
    explanation: row.explanation,
    counterEvidence: row.counter_evidence,
    recommendedNextStep: row.recommended_next_step,
    confidenceScore: row.confidence_score,
    checkedAt: row.checked_at
  };
}
