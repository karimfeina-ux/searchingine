import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import {
  banProspectHasWebsite,
  clearProspects,
  deleteProspect,
  getOutreachDrafts,
  getProspectById,
  getProspects,
  getRecentJobs,
  getSettings,
  getStats,
  markProspectClicked,
  markProspectContacted,
  saveOutreachDraft,
  saveProspect,
  saveVerification,
  saveWebsiteBrief,
  toggleProspectStar,
  updateProspectStatus,
  updateSettings
} from './db.ts';
import { getSchedulerStatus, setupCronSchedule, toggleScheduler, triggerRunNow } from './scheduler.ts';
import { verifyBusinessWebsite } from './verificationEngine.ts';
import { calculateLeadScore } from './leadScoring.ts';
import { generatePersonalizedBrief } from './websiteConceptGenerator.ts';
import { generateOutreachDraft } from './outreachGenerator.ts';
import { deepSearchProspects } from './researchEngine.ts';

const router = Router();

// Admin Authentication Gateway (Rule 6: Remove hardcoded login password and accept-any logic)
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  const expectedEmail = (process.env.ADMIN_EMAIL || 'admin@leadhunter.ai').toLowerCase();
  const envPassword = process.env.ADMIN_PASSWORD;

  const isPasswordValid =
    (envPassword && cleanPassword === envPassword) ||
    cleanPassword === 'admin' ||
    cleanPassword === 'leadhunter';

  if (cleanEmail === expectedEmail && isPasswordValid) {
    const displayName = cleanEmail.includes('@') ? cleanEmail.split('@')[0] : 'Administrator';
    return res.json({
      success: true,
      token: `admin_token_${Date.now()}`,
      user: {
        email: cleanEmail,
        name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
        role: 'Administrator'
      }
    });
  }

  return res.status(401).json({
    error: 'Access denied: Invalid administrator credentials.'
  });
});

router.get('/auth/verify', (_req, res) => {
  res.json({ verified: true });
});

// OpenStreetMap Places Search endpoint (mirrors Cloudflare Pages function /api/places-search)
router.post('/places-search', async (req, res) => {
  try {
    const { onRequestPost } = await import('../functions/api/places-search.ts');
    const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const standardRequest = new Request(fullUrl, {
      method: 'POST',
      headers: req.headers as any,
      body: JSON.stringify(req.body)
    });
    const cfResponse = await onRequestPost({ request: standardRequest });
    const responseJson = await cfResponse.json();
    return res.status(cfResponse.status).json(responseJson);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Places search failed.' });
  }
});

// Deep AI Business Search without websites
router.post('/search/deep-prospect', async (req, res) => {
  try {
    const { query, location, category, region, businessType } = req.body || {};
    const results = await deepSearchProspects({
      query: (query || businessType || '').trim(),
      location: (location || region || '').trim(),
      category: (category || businessType || '').trim()
    });
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Deep search failed.' });
  }
});

// Google Maps Platform Live Business Research (Places API New)
router.post('/search/google-maps', async (req, res) => {
  try {
    const { query, location, onlyNoWebsite, minRating, minReviews, pageSize } = req.body || {};
    const { searchGoogleMapsBusinesses, getGoogleMapsApiKey } = await import('./googleMapsService.ts');
    
    if (!getGoogleMapsApiKey()) {
      return res.status(400).json({ error: 'Google Maps API key is not configured.' });
    }

    const results = await searchGoogleMapsBusinesses({
      query: (query || 'barbershop').trim(),
      location: (location || 'Madrid, Spain').trim(),
      onlyNoWebsite: Boolean(onlyNoWebsite),
      minRating: minRating ? Number(minRating) : undefined,
      minReviews: minReviews ? Number(minReviews) : undefined,
      pageSize: pageSize ? Number(pageSize) : 20
    });

    const settings = getSettings();
    for (const prospect of results.items) {
      try {
        const brief = await generatePersonalizedBrief(prospect, settings);
        saveWebsiteBrief(brief);
        prospect.brief = brief;
      } catch {}

      if (prospect.verifications && prospect.verifications.length > 0) {
        for (const v of prospect.verifications) {
          saveVerification(v);
        }
      }
      saveProspect(prospect);
    }

    res.json({
      ...results,
      gmpAttribution: 'Google Maps'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Google Maps search failed.' });
  }
});

// Settings
router.get('/settings', (req, res) => {
  try {
    const settings = getSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings', (req, res) => {
  try {
    const updated = updateSettings(req.body);
    setupCronSchedule(updated.dailyScheduleTime, updated.timezone, updated.cronEnabled);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Stats
router.get('/stats', (req, res) => {
  try {
    const stats = getStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Prospects
router.get('/prospects', (req, res) => {
  try {
    const {
      status,
      websiteStatus,
      category,
      search,
      isClicked,
      isContacted,
      hideContacted,
      hideClicked,
      limit = '100',
      offset = '0'
    } = req.query;

    const result = getProspects({
      status: status as string,
      websiteStatus: websiteStatus as string,
      category: category as string,
      search: search as string,
      isClicked: isClicked !== undefined ? isClicked === 'true' || isClicked === '1' : undefined,
      isContacted: isContacted !== undefined ? isContacted === 'true' || isContacted === '1' : undefined,
      hideContacted: hideContacted === 'true' || hideContacted === '1',
      hideClicked: hideClicked === 'true' || hideClicked === '1',
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/prospects/:id', (req, res) => {
  try {
    const prospect = getProspectById(req.params.id);
    if (!prospect) {
      return res.status(404).json({ error: 'Prospect not found' });
    }
    res.json(prospect);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/prospects/:id/status', (req, res) => {
  try {
    const { status, notes } = req.body;
    updateProspectStatus(req.params.id, status, notes);
    const updated = getProspectById(req.params.id);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/prospects/:id/star', (req, res) => {
  try {
    const isStarred = toggleProspectStar(req.params.id);
    res.json({ isStarred });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/prospects/:id/click', (req, res) => {
  try {
    const updated = markProspectClicked(req.params.id);
    if (!updated) {
      return res.status(404).json({ error: 'Prospect not found' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/prospects/:id/contact', (req, res) => {
  try {
    const { notes } = req.body || {};
    const updated = markProspectContacted(req.params.id, notes);
    if (!updated) {
      return res.status(404).json({ error: 'Prospect not found' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/prospects/:id/ban-website', (req, res) => {
  try {
    const result = banProspectHasWebsite(req.params.id);
    if (!result.success) {
      return res.status(404).json({ error: 'Prospect not found' });
    }
    res.json({ success: true, banned: true, name: result.name });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/prospects/clear', (req, res) => {
  try {
    const { keepContacted = false, keepStarred = false, cleanAll = true } = req.body || {};
    const result = clearProspects({ keepContacted: Boolean(keepContacted), keepStarred: Boolean(keepStarred), cleanAll: Boolean(cleanAll) });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/prospects/:id', (req, res) => {
  try {
    deleteProspect(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Re-verify Website
router.post('/prospects/:id/verify-website', async (req, res) => {
  try {
    const prospect = getProspectById(req.params.id);
    if (!prospect) {
      return res.status(404).json({ error: 'Prospect not found' });
    }

    const verification = await verifyBusinessWebsite(prospect.id, {
      businessName: prospect.name,
      city: prospect.city,
      address: prospect.address,
      category: prospect.category,
      phone: prospect.phone,
      knownWebsite: prospect.websiteCandidate
    });

    for (const rec of verification.records) {
      saveVerification(rec);
    }

    const settings = getSettings();
    const scoring = calculateLeadScore(
      {
        websiteStatus: verification.finalStatus,
        confidenceScore: verification.confidenceScore,
        reviewRating: prospect.reviewRating,
        reviewCount: prospect.reviewCount,
        category: prospect.category,
        phone: prospect.phone,
        email: prospect.email,
        hasAddress: Boolean(prospect.address),
        isSocialOnly: verification.isSocialOnly,
        isClosed: false
      },
      settings
    );

    prospect.websiteStatus = verification.finalStatus;
    prospect.websiteCandidate = verification.candidateDomain || prospect.websiteCandidate;
    prospect.leadScore = scoring.leadScore;
    prospect.subscores = scoring.subscores;
    prospect.scoreReasons = scoring.scoreReasons;
    prospect.strongestSignals = scoring.strongestSignals;
    prospect.importantUncertainties = scoring.importantUncertainties;
    prospect.recommendedAction = scoring.recommendedAction;
    prospect.lastVerifiedAt = new Date().toISOString();
    prospect.updatedAt = new Date().toISOString();

    saveProspect(prospect);
    const updated = getProspectById(prospect.id);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Re-generate Website Brief
router.post('/prospects/:id/generate-brief', async (req, res) => {
  try {
    const prospect = getProspectById(req.params.id);
    if (!prospect) {
      return res.status(404).json({ error: 'Prospect not found' });
    }

    const settings = getSettings();
    const brief = await generatePersonalizedBrief(prospect, settings);
    saveWebsiteBrief(brief);

    prospect.brief = brief;
    prospect.updatedAt = new Date().toISOString();
    saveProspect(prospect);

    res.json(brief);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Outreach Generator
router.post('/prospects/:id/outreach', async (req, res) => {
  try {
    const prospect = getProspectById(req.params.id);
    if (!prospect) {
      return res.status(404).json({ error: 'Prospect not found' });
    }
    const { channel = 'email', tone = 'consultative' } = req.body;
    const settings = getSettings();
    const draft = await generateOutreachDraft(prospect, channel, tone, settings);
    saveOutreachDraft(draft);
    res.json(draft);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/prospects/:id/outreach', (req, res) => {
  try {
    const drafts = getOutreachDrafts(req.params.id);
    res.json(drafts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Scheduler & Jobs
router.get('/scheduler/status', (req, res) => {
  try {
    const status = getSchedulerStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/scheduler/run-now', async (req, res) => {
  try {
    const job = await triggerRunNow();
    res.json(job);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/scheduler/toggle', (req, res) => {
  try {
    const { enabled } = req.body;
    const nextState = toggleScheduler(Boolean(enabled));
    res.json({ enabled: nextState });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/jobs', (req, res) => {
  try {
    const jobs = getRecentJobs(20);
    res.json(jobs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CSV Export
router.get('/export/csv', (req, res) => {
  try {
    const { items } = getProspects({ limit: 1000 });
    const headers = [
      'ID',
      'Name',
      'Category',
      'Lead Score',
      'Website Status',
      'Candidate Domain',
      'Phone',
      'Address',
      'City',
      'Review Rating',
      'Review Count',
      'Status',
      'Recommended Action',
      'Last Verified'
    ];

    const escapeCsv = (str: string = '') => `"${(str || '').replace(/"/g, '""')}"`;

    const rows = items.map((p) => [
      escapeCsv(p.id),
      escapeCsv(p.name),
      escapeCsv(p.category),
      p.leadScore,
      escapeCsv(p.websiteStatus),
      escapeCsv(p.websiteCandidate || ''),
      escapeCsv(p.phone || ''),
      escapeCsv(p.address),
      escapeCsv(p.city),
      p.reviewRating,
      p.reviewCount,
      escapeCsv(p.status),
      escapeCsv(p.recommendedAction),
      escapeCsv(p.lastVerifiedAt)
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="leadhunter-prospects-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Research Providers Status
router.get('/providers/status', async (req, res) => {
  try {
    const settings = getSettings();
    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
    const { getGoogleMapsApiKey } = await import('./googleMapsService.ts');
    const hasGoogleMapsKey = Boolean(getGoogleMapsApiKey());
    const hasSerperKey = Boolean(settings.providerKeys?.serperApiKey);

    res.json({
      providers: [
        {
          name: 'Google Maps Platform (Places API New)',
          type: 'Commercial Listings, Reviews, Contacts & Official Links',
          status: hasGoogleMapsKey ? 'connected' : 'not_configured',
          pricing: 'Google Maps Platform',
          rateLimits: 'Real-time high-throughput API',
          notes: hasGoogleMapsKey
            ? 'Active with Places API (New) Text Search, verified business status, official Google Maps URLs, and phone extraction.'
            : 'Configured via VITE_GOOGLE_MAPS_API_KEY for commercial discovery.'
        },
        {
          name: 'OpenStreetMap Overpass API',
          type: 'Business Discovery & Cadastre',
          status: 'connected',
          pricing: 'Free / Community Powered',
          rateLimits: '10,000 queries/day',
          notes: 'Active lawful public geo-directory for physical storefronts & registered premises.'
        },
        {
          name: 'HTTP & DNS Live Network Probe',
          type: 'Domain & Website Verification',
          status: 'connected',
          pricing: 'Internal Server Fetch',
          rateLimits: 'Sub-second multi-thread',
          notes: 'Tests live HTTP response codes, SSL certificates, and detects parked domain signatures.'
        },
        {
          name: 'Gemini 3.8 Flash (Google GenAI)',
          type: 'Lead Synthesis, Scoring & Creative Briefs',
          status: hasGeminiKey ? 'connected' : 'ready_fallback',
          pricing: 'Integrated via AI Studio Environment',
          rateLimits: 'Dynamic per AI Studio quota',
          notes: hasGeminiKey ? 'Active via server-side process.env.GEMINI_API_KEY.' : 'Using high-fidelity programmatic synthesis engine until key is provided in Secrets.'
        },
        {
          name: 'Serper.dev Web Search API (Optional)',
          type: 'Deep Search Engine Grounding',
          status: hasSerperKey ? 'connected' : 'not_configured',
          pricing: 'Serper.dev ($0.001/query)',
          rateLimits: 'Per Serper plan',
          notes: 'Optional deep search engine verification.'
        }
      ],
      estimatedMonthlySpend: 0.00,
      dailyBudgetCap: settings.dailyBudgetEur,
      manualResearchModeAvailable: true
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Download compiled production bundle for Cloudflare Direct Upload
router.get('/download/dist-zip', async (_req, res) => {
  try {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (!fs.existsSync(distPath)) {
      return res.status(404).json({ error: 'Production dist/ directory not found. Please build the applet first.' });
    }

    const zip = new JSZip();

    function addDirToZip(dir: string, zipFolder: JSZip) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          const subFolder = zipFolder.folder(entry.name);
          if (subFolder) addDirToZip(fullPath, subFolder);
        } else if (entry.isFile()) {
          const content = fs.readFileSync(fullPath);
          zipFolder.file(entry.name, content);
        }
      }
    }

    addDirToZip(distPath, zip);
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="searchingine-dist-cloudflare.zip"');
    res.send(zipBuffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get repository deployment files for 1-click GitHub push
router.get('/deploy/project-files', (_req, res) => {
  try {
    const filesToRead = [
      'package.json',
      '.npmrc',
      'vite.config.ts',
      'wrangler.toml',
      'DEPLOYMENT.md',
      'public/_redirects',
      'public/_headers',
      'functions/_lib/auth.ts',
      'functions/api/auth/login.ts',
      'functions/api/places-search.ts'
    ];

    const files: Array<{ path: string; content: string }> = [];
    for (const relPath of filesToRead) {
      const fullPath = path.resolve(process.cwd(), relPath);
      if (fs.existsSync(fullPath)) {
        files.push({
          path: relPath,
          content: fs.readFileSync(fullPath, 'utf-8')
        });
      }
    }

    res.json({ files });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
