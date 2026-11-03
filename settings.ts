// Cloudflare Pages Function -> /api/settings
import { D1Env, d1GetSettings, d1SaveSettings, handleOptions, json } from '../_lib/d1';

export const onRequestOptions = async () => handleOptions();

const defaultSettings = {
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
  updatedAt: '1970-01-01T00:00:00.000Z'
};

export const onRequestGet = async ({ env }: { env: D1Env }) => {
  if (!env.DB) {
    return json(defaultSettings);
  }

  try {
    const settings = await d1GetSettings(env.DB);
    return json(settings ? { ...defaultSettings, ...settings } : defaultSettings);
  } catch (err: any) {
    return json(defaultSettings);
  }
};

export const onRequestPut = async ({ request, env }: { request: Request; env: D1Env }) => {
  if (!env.DB) {
    return json({ error: 'Cloudflare D1 database binding DB is not configured' }, 503);
  }

  try {
    const updates = await request.json().catch(() => ({}));
    const saved = await d1SaveSettings(env.DB, updates);
    return json(saved);
  } catch (err: any) {
    return json({ error: err?.message || 'Error saving settings to D1' }, 500);
  }
};
