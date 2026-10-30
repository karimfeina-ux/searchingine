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

const STORE_PATH = path.join(DATA_DIR, 'store.json');

const defaultSettings: AppSettings = {
  id: 1,
  isConfigured: true,
  cities: ['Miami', 'Barcelona', 'Madrid', 'Valencia', 'London', 'New York', 'Austin'],
  region: 'Global',
  country: 'Worldwide',
  searchRadiusKm: 25,
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
  languages: ['English', 'Spanish', 'Catalan'],
  minRating: 4.0,
  minReviews: 5,
  maxLeadsPerRun: 15,
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
  dailyBudgetEur: 10.0,
  cronEnabled: true,
  providerKeys: {},
  uiLanguage: 'en',
  uiTheme: 'dark',
  updatedAt: new Date().toISOString()
};

interface StoreData {
  settings: AppSettings;
  prospects: Record<string, Prospect>;
  verifications: Record<string, WebsiteVerificationRecord[]>;
  briefs: Record<string, WebsiteBrief>;
  jobs: DailyJobRun[];
  outreachDrafts: Record<string, OutreachDraft[]>;
}

let store: StoreData = {
  settings: defaultSettings,
  prospects: {},
  verifications: {},
  briefs: {},
  jobs: [],
  outreachDrafts: {}
};

// Load persistent data from JSON if present
try {
  if (fs.existsSync(STORE_PATH)) {
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    store = {
      settings: parsed.settings || defaultSettings,
      prospects: parsed.prospects || {},
      verifications: parsed.verifications || {},
      briefs: parsed.briefs || {},
      jobs: parsed.jobs || [],
      outreachDrafts: parsed.outreachDrafts || {}
    };
  }
} catch (err) {
  console.warn('Could not read existing store, initialized fresh in-memory data store:', err);
}

function persistStore() {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not persist data store to disk:', err);
  }
}

export const getSettings = (): AppSettings => {
  return { ...store.settings };
};

export const updateSettings = (partial: Partial<AppSettings>): AppSettings => {
  store.settings = {
    ...store.settings,
    ...partial,
    updatedAt: new Date().toISOString()
  };
  persistStore();
  return { ...store.settings };
};

export const getProspects = (filter?: {
  status?: string;
  websiteStatus?: string;
  category?: string;
  search?: string;
  isClicked?: boolean | string;
  isContacted?: boolean | string;
  hideContacted?: boolean;
  hideClicked?: boolean;
  limit?: number;
  offset?: number;
}): { items: Prospect[]; total: number } => {
  let list = Object.values(store.prospects);

  if (filter?.status && filter.status !== 'all') {
    list = list.filter((p) => p.status === filter.status);
  }
  if (filter?.websiteStatus && filter.websiteStatus !== 'all') {
    list = list.filter((p) => p.websiteStatus === filter.websiteStatus);
  }
  if (filter?.category && filter.category !== 'all') {
    list = list.filter((p) => p.category === filter.category);
  }
  if (filter?.isClicked !== undefined) {
    const expected = filter.isClicked === true || filter.isClicked === 'true';
    list = list.filter((p) => Boolean(p.isClicked) === expected);
  }
  if (filter?.isContacted !== undefined) {
    const expected = filter.isContacted === true || filter.isContacted === 'true';
    list = list.filter((p) => Boolean(p.isContacted) === expected);
  }
  if (filter?.hideContacted) {
    list = list.filter((p) => !p.isContacted && p.status !== 'contacted');
  }
  if (filter?.hideClicked) {
    list = list.filter((p) => !p.isClicked);
  }
  if (filter?.search) {
    const s = filter.search.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.address.toLowerCase().includes(s) ||
        p.category.toLowerCase().includes(s) ||
        (p.notes && p.notes.toLowerCase().includes(s))
    );
  }

  // Sort by starred, not contacted first, then lead score DESC
  list.sort((a, b) => {
    if (a.isStarred !== b.isStarred) return a.isStarred ? -1 : 1;
    if (a.isContacted !== b.isContacted) return a.isContacted ? 1 : -1;
    return b.leadScore - a.leadScore;
  });

  const total = list.length;
  const offset = Number(filter?.offset || 0);
  const limit = filter?.limit ? Number(filter.limit) : list.length;
  const items = list.slice(offset, offset + limit).map((p) => {
    const full = { ...p };
    if (store.briefs[p.id]) full.brief = store.briefs[p.id];
    if (store.verifications[p.id]) full.verifications = store.verifications[p.id];
    return full;
  });

  return { items, total };
};

export const getProspectById = (id: string): Prospect | null => {
  const p = store.prospects[id];
  if (!p) return null;
  const full = { ...p };
  if (store.briefs[id]) full.brief = store.briefs[id];
  if (store.verifications[id]) full.verifications = store.verifications[id];
  return full;
};

export const findExistingProspect = (normalizedName: string, city: string, phone?: string): Prospect | null => {
  const norm = normalizedName.toLowerCase().trim();
  const cleanCity = city.toLowerCase().trim();
  const cleanPhone = phone ? phone.replace(/\D/g, '') : null;

  for (const p of Object.values(store.prospects)) {
    if (cleanPhone && cleanPhone.length >= 6 && p.phone) {
      if (p.phone.replace(/\D/g, '') === cleanPhone) return p;
    }
    if (p.normalizedName.toLowerCase().trim() === norm && p.city.toLowerCase().trim() === cleanCity) {
      return p;
    }
  }
  return null;
};

export const saveProspect = (p: Prospect): void => {
  const existing = store.prospects[p.id];
  store.prospects[p.id] = {
    ...existing,
    ...p,
    isClicked: p.isClicked ?? existing?.isClicked ?? false,
    clickedAt: p.clickedAt ?? existing?.clickedAt,
    isContacted: p.isContacted ?? existing?.isContacted ?? false,
    contactedAt: p.contactedAt ?? existing?.contactedAt,
    updatedAt: new Date().toISOString()
  };
  persistStore();
};

export const updateProspectStatus = (id: string, status: string, notes?: string): void => {
  const p = store.prospects[id];
  if (!p) return;
  p.status = status as any;
  if (notes !== undefined) p.notes = notes;
  p.updatedAt = new Date().toISOString();
  persistStore();
};

export const markProspectClicked = (id: string): Prospect | null => {
  const p = store.prospects[id];
  if (!p) return null;
  p.isClicked = true;
  p.clickedAt = new Date().toISOString();
  p.updatedAt = p.clickedAt;
  persistStore();
  return getProspectById(id);
};

export const markProspectContacted = (id: string, notes?: string): Prospect | null => {
  const p = store.prospects[id];
  if (!p) return null;
  p.isContacted = true;
  p.contactedAt = new Date().toISOString();
  p.status = 'contacted';
  if (notes !== undefined) p.notes = notes;
  p.updatedAt = p.contactedAt;
  persistStore();
  return getProspectById(id);
};

export const banProspectHasWebsite = (id: string): { success: boolean; name?: string } => {
  const p = store.prospects[id];
  if (!p) return { success: false };
  const name = p.name;
  p.status = 'excluded';
  p.websiteStatus = 'website_exists';
  p.excludedReason = 'User marked as already having a website (Banned from future searches)';
  p.updatedAt = new Date().toISOString();
  persistStore();
  return { success: true, name };
};

export const getExcludedBusinessNamesAndPhones = (): { names: Set<string>; phones: Set<string> } => {
  const names = new Set<string>();
  const phones = new Set<string>();
  for (const p of Object.values(store.prospects)) {
    if (p.normalizedName) names.add(p.normalizedName.toLowerCase().trim());
    if (p.phone) {
      const cleanPhone = p.phone.replace(/\D/g, '');
      if (cleanPhone.length >= 6) phones.add(cleanPhone);
    }
  }
  return { names, phones };
};

export const toggleProspectStar = (id: string): boolean => {
  const p = store.prospects[id];
  if (!p) return false;
  p.isStarred = !p.isStarred;
  p.updatedAt = new Date().toISOString();
  persistStore();
  return Boolean(p.isStarred);
};

export const deleteProspect = (id: string): void => {
  delete store.prospects[id];
  delete store.briefs[id];
  delete store.verifications[id];
  delete store.outreachDrafts[id];
  persistStore();
};

export const clearProspects = (options: { keepContacted?: boolean; keepStarred?: boolean; cleanAll?: boolean } = { cleanAll: true }): { deletedCount: number; remainingCount: number } => {
  let deletedCount = 0;
  for (const [id, p] of Object.entries(store.prospects)) {
    if (!options.cleanAll) {
      const isContacted = Boolean(p.isContacted || p.status === 'contacted');
      const isStarred = Boolean(p.isStarred);
      if ((options.keepContacted && isContacted) || (options.keepStarred && isStarred)) {
        continue;
      }
    }
    delete store.prospects[id];
    delete store.briefs[id];
    delete store.verifications[id];
    delete store.outreachDrafts[id];
    deletedCount++;
  }
  persistStore();
  return { deletedCount, remainingCount: Object.keys(store.prospects).length };
};

export const saveVerification = (v: WebsiteVerificationRecord): void => {
  if (!store.verifications[v.prospectId]) {
    store.verifications[v.prospectId] = [];
  }
  store.verifications[v.prospectId].unshift(v);
  persistStore();
};

export const saveWebsiteBrief = (brief: WebsiteBrief): void => {
  store.briefs[brief.prospectId] = brief;
  persistStore();
};

export const saveJobRun = (job: DailyJobRun): void => {
  const idx = store.jobs.findIndex((j) => j.id === job.id);
  if (idx !== -1) {
    store.jobs[idx] = job;
  } else {
    store.jobs.unshift(job);
  }
  if (store.jobs.length > 50) store.jobs = store.jobs.slice(0, 50);
  persistStore();
};

export const getRecentJobs = (limit: number = 10): DailyJobRun[] => {
  return store.jobs.slice(0, limit);
};

export const getLatestReport = (): DailyJobRun | null => {
  return store.jobs.find((j) => j.status === 'completed') || null;
};

export const saveOutreachDraft = (draft: OutreachDraft): void => {
  if (!store.outreachDrafts[draft.prospectId]) {
    store.outreachDrafts[draft.prospectId] = [];
  }
  store.outreachDrafts[draft.prospectId].unshift(draft);
  persistStore();
};

export const getOutreachDrafts = (prospectId: string): OutreachDraft[] => {
  return store.outreachDrafts[prospectId] || [];
};

export const getStats = () => {
  const list = Object.values(store.prospects);
  const total = list.length;
  const noWebsite = list.filter((p) => p.websiteStatus === 'no_website' || p.websiteStatus === 'possibly_no_website').length;
  const highPriority = list.filter((p) => p.leadScore >= 70).length;
  const readyToContact = list.filter((p) => p.status === 'ready_to_contact').length;
  const clicked = list.filter((p) => p.isClicked).length;
  const contacted = list.filter((p) => p.isContacted || p.status === 'contacted').length;
  const clientsWon = list.filter((p) => p.status === 'client_signed').length;
  const avg = total > 0 ? list.reduce((acc, p) => acc + p.leadScore, 0) / total : 0;

  return {
    totalLeads: total,
    noWebsiteCount: noWebsite,
    highPriorityCount: highPriority,
    readyToContactCount: readyToContact,
    clickedCount: clicked,
    contactedCount: contacted,
    clientsWonCount: clientsWon,
    avgScore: Math.round(avg * 10) / 10
  };
};
