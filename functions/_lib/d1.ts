// Cloudflare D1 Database Helper for LeadHunter AI
// Serverless SQLite database client running at the Cloudflare edge
// With automatic edge-memory fallback if D1 database binding is absent or unconfigured.

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<{ success: boolean; meta: any; results?: T[] }>;
  all<T = unknown>(): Promise<{ success: boolean; results: T[]; meta: any }>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<Array<{ success: boolean; results?: T[]; meta: any }>>;
  exec(query: string): Promise<{ count: number; duration: number }>;
}

export interface D1Env {
  DB?: D1Database;
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
  AUTH_SECRET?: string;
  VITE_GOOGLE_MAPS_API_KEY?: string;
  GOOGLE_MAPS_API_KEY?: string;
}

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*'
    }
  });

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export const handleOptions = () => new Response(null, { headers: corsHeaders });

// Global edge-memory storage in case D1 is not bound to Cloudflare Pages
const edgeMemoryProspects = new Map<string, any>();
const edgeMemorySettings = new Map<string, any>();
const edgeMemoryExclusions = {
  names: new Set<string>(),
  phones: new Set<string>()
};

export function isQualifiedProspect(p: any): boolean {
  if (!p) return false;
  // Strictly NEVER show businesses with websites
  if (p.websiteStatus === 'website_exists' || p.hasWebsite) return false;
  if (p.websiteCandidate) {
    const lower = String(p.websiteCandidate).toLowerCase();
    const isSocialOnly =
      lower.includes('instagram.com') ||
      lower.includes('facebook.com') ||
      lower.includes('linktr.ee') ||
      lower.includes('wa.me') ||
      lower.includes('tiktok.com') ||
      lower.includes('bio.link') ||
      lower.includes('taplink.cc');
    if (!isSocialOnly) return false;
  }
  // Strictly NEVER show businesses with less than 2 pictures in their Google Maps profile
  if (typeof p.photoCount === 'number' && p.photoCount < 2) return false;
  return true;
}

let tablesInitialized = false;

export async function ensureTables(db?: D1Database): Promise<boolean> {
  if (!db || typeof db.prepare !== 'function') return false;
  if (tablesInitialized) return true;

  try {
    await db.batch([
      db.prepare(`
        CREATE TABLE IF NOT EXISTS prospects (
          id TEXT PRIMARY KEY,
          name TEXT,
          normalized_name TEXT,
          city TEXT,
          category TEXT,
          phone TEXT,
          status TEXT DEFAULT 'new',
          website_status TEXT,
          lead_score REAL DEFAULT 0,
          is_contacted INTEGER DEFAULT 0,
          is_clicked INTEGER DEFAULT 0,
          is_starred INTEGER DEFAULT 0,
          contacted_at TEXT,
          notes TEXT,
          data TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects (status)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_prospects_contacted ON prospects (is_contacted)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_prospects_updated ON prospects (updated_at)`),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS exclusions (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          value TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
      `),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_exclusions_type_val ON exclusions (type, value)`),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `)
    ]);
    tablesInitialized = true;
    return true;
  } catch (err) {
    console.error('D1 table initialization notice:', err);
    return false;
  }
}

export function normalizeBusinessName(name: string): string {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function d1GetProspects(
  db?: D1Database,
  filters: {
    status?: string | null;
    websiteStatus?: string | null;
    search?: string | null;
    hideContacted?: boolean;
    isContacted?: boolean;
    limit?: number;
  } = {}
) {
  let items: any[] = [];

  if (db && typeof db.prepare === 'function') {
    await ensureTables(db);
    const rows = await db
      .prepare('SELECT data FROM prospects ORDER BY is_contacted DESC, updated_at DESC LIMIT ?')
      .bind(filters.limit || 1000)
      .all<{ data: string }>();

    items = (rows.results || []).map((r) => {
      try {
        return JSON.parse(r.data);
      } catch {
        return null;
      }
    }).filter(Boolean);
  } else {
    items = Array.from(edgeMemoryProspects.values());
  }

  // Filter out businesses with websites or with less than 2 pics
  items = items.filter(isQualifiedProspect);

  if (filters.hideContacted) {
    items = items.filter((p: any) => !p.isContacted && p.status !== 'contacted' && p.status !== 'waiting' && p.status !== 'client_signed');
  }
  if (filters.isContacted) {
    items = items.filter((p: any) => p.isContacted || ['contacted', 'waiting', 'client_signed'].includes(p.status));
  }
  if (filters.status) {
    items = items.filter((p: any) => p.status === filters.status);
  }
  if (filters.websiteStatus) {
    items = items.filter((p: any) => p.websiteStatus === filters.websiteStatus);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (p: any) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.city && p.city.toLowerCase().includes(q))
    );
  }

  return { items, total: items.length };
}

export async function d1GetProspectById(db?: D1Database, id?: string) {
  if (!id) return null;
  if (!db || typeof db.prepare !== 'function') {
    return edgeMemoryProspects.get(id) || null;
  }

  await ensureTables(db);
  const row = await db
    .prepare('SELECT data FROM prospects WHERE id = ?')
    .bind(id)
    .first<{ data: string }>();

  if (!row) return null;
  try {
    return JSON.parse(row.data);
  } catch {
    return null;
  }
}

export async function d1UpsertProspect(db: D1Database | undefined, prospect: any) {
  if (!prospect || !prospect.id) return prospect;
  const now = new Date().toISOString();
  const id = prospect.id;
  const name = prospect.name || '';
  const normName = prospect.normalizedName || normalizeBusinessName(name);
  const city = prospect.city || '';
  const category = prospect.category || '';
  const phone = prospect.phone || '';
  const status = prospect.status || 'new';
  const websiteStatus = prospect.websiteStatus || 'no_website';
  const leadScore = Number(prospect.leadScore || 0);
  const isContactedLead = Boolean(prospect.isContacted || ['contacted', 'waiting', 'client_signed'].includes(status));
  const isContacted = isContactedLead ? 1 : 0;
  const isClicked = prospect.isClicked ? 1 : 0;
  const isStarred = prospect.isStarred ? 1 : 0;
  const contactedAt = isContactedLead ? (prospect.contactedAt || now) : null;
  const notes = prospect.notes || null;
  const updatedAt = prospect.updatedAt || now;

  prospect.isContacted = isContactedLead;
  if (isContactedLead) {
    prospect.contactedAt = contactedAt;
  }
  prospect.updatedAt = updatedAt;

  if (!db || typeof db.prepare !== 'function') {
    edgeMemoryProspects.set(id, prospect);
    return prospect;
  }

  await ensureTables(db);
  const data = JSON.stringify(prospect);

  await db
    .prepare(`
      INSERT INTO prospects (
        id, name, normalized_name, city, category, phone, status, website_status,
        lead_score, is_contacted, is_clicked, is_starred, contacted_at, notes, data, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        normalized_name = excluded.normalized_name,
        city = excluded.city,
        category = excluded.category,
        phone = excluded.phone,
        status = CASE WHEN prospects.is_contacted = 1 AND excluded.status = 'new' THEN prospects.status ELSE excluded.status END,
        website_status = excluded.website_status,
        lead_score = excluded.lead_score,
        is_contacted = CASE WHEN prospects.is_contacted = 1 THEN 1 ELSE excluded.is_contacted END,
        is_clicked = CASE WHEN prospects.is_clicked = 1 THEN 1 ELSE excluded.is_clicked END,
        is_starred = excluded.is_starred,
        contacted_at = COALESCE(prospects.contacted_at, excluded.contacted_at),
        notes = COALESCE(excluded.notes, prospects.notes),
        data = excluded.data,
        updated_at = excluded.updated_at
    `)
    .bind(
      id, name, normName, city, category, phone, status, websiteStatus,
      leadScore, isContacted, isClicked, isStarred, contactedAt, notes, data, updatedAt
    )
    .run();

  return prospect;
}

export async function d1UpsertBatch(db: D1Database | undefined, prospects: any[]) {
  if (!prospects || prospects.length === 0) return { count: 0 };

  if (!db || typeof db.prepare !== 'function') {
    for (const p of prospects) {
      if (p && p.id) {
        edgeMemoryProspects.set(p.id, { ...p, updatedAt: p.updatedAt || new Date().toISOString() });
      }
    }
    return { count: prospects.length };
  }

  await ensureTables(db);
  const now = new Date().toISOString();
  const chunkSize = 80;
  let totalSaved = 0;

  for (let i = 0; i < prospects.length; i += chunkSize) {
    const chunk = prospects.slice(i, i + chunkSize);
    const stmts = chunk.map((p) => {
      const id = p.id;
      const name = p.name || '';
      const normName = p.normalizedName || normalizeBusinessName(name);
      const city = p.city || '';
      const category = p.category || '';
      const phone = p.phone || '';
      const status = p.status || 'new';
      const websiteStatus = p.websiteStatus || 'no_website';
      const leadScore = Number(p.leadScore || 0);
      const isContactedLead = Boolean(p.isContacted || ['contacted', 'waiting', 'client_signed'].includes(status));
      const isContacted = isContactedLead ? 1 : 0;
      const isClicked = p.isClicked ? 1 : 0;
      const isStarred = p.isStarred ? 1 : 0;
      const contactedAt = isContactedLead ? (p.contactedAt || now) : null;
      const notes = p.notes || null;
      const updatedAt = p.updatedAt || now;

      p.isContacted = isContactedLead;
      if (isContactedLead) {
        p.contactedAt = contactedAt;
      }
      p.updatedAt = updatedAt;
      const data = JSON.stringify(p);

      return db
        .prepare(`
          INSERT INTO prospects (
            id, name, normalized_name, city, category, phone, status, website_status,
            lead_score, is_contacted, is_clicked, is_starred, contacted_at, notes, data, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            normalized_name = excluded.normalized_name,
            city = excluded.city,
            category = excluded.category,
            phone = excluded.phone,
            status = CASE WHEN prospects.is_contacted = 1 AND excluded.status = 'new' THEN prospects.status ELSE excluded.status END,
            website_status = excluded.website_status,
            lead_score = excluded.lead_score,
            is_contacted = CASE WHEN prospects.is_contacted = 1 THEN 1 ELSE excluded.is_contacted END,
            is_clicked = CASE WHEN prospects.is_clicked = 1 THEN 1 ELSE excluded.is_clicked END,
            is_starred = excluded.is_starred,
            contacted_at = COALESCE(prospects.contacted_at, excluded.contacted_at),
            notes = COALESCE(excluded.notes, prospects.notes),
            data = excluded.data,
            updated_at = excluded.updated_at
        `)
        .bind(
          id, name, normName, city, category, phone, status, websiteStatus,
          leadScore, isContacted, isClicked, isStarred, contactedAt, notes, data, updatedAt
        );
    });

    await db.batch(stmts);
    totalSaved += chunk.length;
  }

  return { count: totalSaved };
}

export async function d1DeleteProspect(db: D1Database | undefined, id: string) {
  if (!db || typeof db.prepare !== 'function') {
    const target = edgeMemoryProspects.get(id);
    edgeMemoryProspects.delete(id);
    if (target) {
      await d1AddExclusion(db, target.name, target.phone);
    }
    return { success: true, deletedId: id, target };
  }

  await ensureTables(db);
  const target = await d1GetProspectById(db, id);
  if (target) {
    await d1AddExclusion(db, target.name, target.phone);
  }
  await db.prepare('DELETE FROM prospects WHERE id = ?').bind(id).run();
  return { success: true, deletedId: id, target };
}

export async function d1ClearProspects(db: D1Database | undefined, options: { keepContacted?: boolean; keepStarred?: boolean; cleanAll?: boolean } = { keepContacted: true }) {
  if (!db || typeof db.prepare !== 'function') {
    let deleted = 0;
    for (const [id, p] of Array.from(edgeMemoryProspects.entries())) {
      const isContactedLead = p.isContacted || ['contacted', 'waiting', 'client_signed'].includes(p.status);
      if (isContactedLead) continue;
      if (options.keepStarred && p.isStarred) continue;
      edgeMemoryProspects.delete(id);
      deleted++;
    }
    return { success: true, remainingCount: edgeMemoryProspects.size, deletedCount: deleted };
  }

  await ensureTables(db);
  let deleteQuery = "DELETE FROM prospects WHERE is_contacted = 0 AND status NOT IN ('contacted', 'waiting', 'client_signed')";
  if (options.keepStarred) {
    deleteQuery += ' AND is_starred = 0';
  }

  const res = await db.prepare(deleteQuery).run();
  const remaining = await db.prepare('SELECT COUNT(*) as count FROM prospects').first<{ count: number }>();
  return { success: true, remainingCount: remaining?.count || 0, deletedCount: (res.meta as any)?.changes || 0 };
}

export async function d1AddExclusion(db: D1Database | undefined, name?: string, phone?: string) {
  const now = new Date().toISOString();
  if (name) {
    const norm = normalizeBusinessName(name);
    if (norm) edgeMemoryExclusions.names.add(norm);
  }
  if (phone) {
    const clean = phone.replace(/\D/g, '');
    if (clean.length >= 6) edgeMemoryExclusions.phones.add(clean);
  }

  if (!db || typeof db.prepare !== 'function') return;

  await ensureTables(db);
  const stmts: D1PreparedStatement[] = [];

  if (name) {
    const norm = normalizeBusinessName(name);
    if (norm) {
      const id = `ex_name_${norm.slice(0, 40).replace(/\s+/g, '_')}`;
      stmts.push(
        db.prepare('INSERT OR IGNORE INTO exclusions (id, type, value, created_at) VALUES (?, ?, ?, ?)').bind(id, 'name', norm, now)
      );
    }
  }

  if (phone) {
    const clean = phone.replace(/\D/g, '');
    if (clean.length >= 6) {
      const id = `ex_phone_${clean}`;
      stmts.push(
        db.prepare('INSERT OR IGNORE INTO exclusions (id, type, value, created_at) VALUES (?, ?, ?, ?)').bind(id, 'phone', clean, now)
      );
    }
  }

  if (stmts.length > 0) {
    await db.batch(stmts);
  }
}

export async function d1GetExclusions(db: D1Database | undefined): Promise<{ names: string[]; phones: string[] }> {
  if (!db || typeof db.prepare !== 'function') {
    return {
      names: Array.from(edgeMemoryExclusions.names),
      phones: Array.from(edgeMemoryExclusions.phones)
    };
  }

  await ensureTables(db);
  const rows = await db.prepare('SELECT type, value FROM exclusions').all<{ type: string; value: string }>();
  const names: string[] = [];
  const phones: string[] = [];
  for (const r of rows.results || []) {
    if (r.type === 'name') names.push(r.value);
    if (r.type === 'phone') phones.push(r.value);
  }
  return { names, phones };
}

export async function d1GetSettings(db: D1Database | undefined) {
  if (!db || typeof db.prepare !== 'function') {
    return edgeMemorySettings.get('default') || null;
  }

  await ensureTables(db);
  const row = await db.prepare("SELECT data FROM settings WHERE key = 'default'").first<{ data: string }>();
  if (!row) return null;
  try {
    return JSON.parse(row.data);
  } catch {
    return null;
  }
}

export async function d1SaveSettings(db: D1Database | undefined, updated: any) {
  const current = (await d1GetSettings(db)) || {};
  const merged = { ...current, ...updated, updatedAt: new Date().toISOString() };

  if (!db || typeof db.prepare !== 'function') {
    edgeMemorySettings.set('default', merged);
    return merged;
  }

  await ensureTables(db);
  await db
    .prepare("INSERT INTO settings (key, data, updated_at) VALUES ('default', ?, ?) ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at")
    .bind(JSON.stringify(merged), merged.updatedAt)
    .run();
  return merged;
}

export async function d1ComputeStats(db: D1Database | undefined) {
  let prospects: any[] = [];
  if (!db || typeof db.prepare !== 'function') {
    prospects = Array.from(edgeMemoryProspects.values());
  } else {
    await ensureTables(db);
    const rows = await db.prepare('SELECT data FROM prospects').all<{ data: string }>();
    prospects = (rows.results || []).map((r) => {
      try {
        return JSON.parse(r.data);
      } catch {
        return null;
      }
    }).filter(Boolean);
  }

  const totalLeads = prospects.length;
  const noWebsiteCount = prospects.filter((p: any) => p.websiteStatus === 'no_website' || p.websiteStatus === 'possibly_no_website').length;
  const highPriorityCount = prospects.filter((p: any) => p.status === 'high_priority' || (p.leadScore || 0) >= 80).length;
  const readyToContactCount = prospects.filter((p: any) => p.status === 'ready_to_contact').length;
  const clickedCount = prospects.filter((p: any) => p.isClicked).length;
  const contactedCount = prospects.filter((p: any) => p.isContacted || p.status === 'contacted' || p.status === 'waiting' || p.status === 'client_signed').length;
  const clientsWonCount = prospects.filter((p: any) => p.status === 'client_signed').length;
  const avgScore = totalLeads > 0 ? Math.round((prospects.reduce((acc: number, p: any) => acc + (p.leadScore || 0), 0) / totalLeads) * 10) / 10 : 0;

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
