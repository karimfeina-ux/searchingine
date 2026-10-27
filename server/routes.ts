import { Router } from 'express';
import {
  deleteProspect,
  getOutreachDrafts,
  getProspectById,
  getProspects,
  getRecentJobs,
  getSettings,
  getStats,
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

const router = Router();

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
    const { status, websiteStatus, category, search, limit = '50', offset = '0' } = req.query;
    const result = getProspects({
      status: status as string,
      websiteStatus: websiteStatus as string,
      category: category as string,
      search: search as string,
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
router.get('/providers/status', (req, res) => {
  try {
    const settings = getSettings();
    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
    const hasGooglePlacesKey = Boolean(settings.providerKeys?.googlePlacesKey);
    const hasSerperKey = Boolean(settings.providerKeys?.serperApiKey);

    res.json({
      providers: [
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
          name: 'Google Places API (Optional)',
          type: 'Commercial Listings & Review Extraction',
          status: hasGooglePlacesKey ? 'connected' : 'not_configured',
          pricing: 'Google Cloud Platform (User Key)',
          rateLimits: 'Configured in GCP console',
          notes: 'Optional provider. Configure in Settings to supplement OpenStreetMap data.'
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

export default router;
