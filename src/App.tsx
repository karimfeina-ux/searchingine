/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import type { AppSettings, DailyJobRun, LeadStatus, OutreachDraft, Prospect } from './types/index.ts';
import { Header } from './components/Header.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { ProspectsView } from './components/ProspectsView.tsx';
import { DailyReportsView } from './components/DailyReportsView.tsx';
import { SchedulerView } from './components/SchedulerView.tsx';
import { ProvidersView } from './components/ProvidersView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { ProspectModal } from './components/ProspectModal.tsx';
import { SetupWizard } from './components/SetupWizard.tsx';
import { QuickSearchModal } from './components/QuickSearchModal.tsx';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';
import { AdminLogin } from './components/AdminLogin.tsx';
import { CloudflareDeployModal } from './components/CloudflareDeployModal.tsx';
import { apiFetch } from './services/apiBridge.ts';
import { defaultSettings, getStoredProspects, computeStats, saveStoredProspects } from './services/clientDataEngine.ts';
import { Loader2, AlertCircle, X, Compass, Database, CheckCircle2, Settings } from 'lucide-react';

export default function App() {
  // Authentication state
  const [adminUser, setAdminUser] = useState<{ email: string; name: string } | null>(() => {
    try {
      if (localStorage.getItem('leadhunter_logged_out') === 'true') return null;
      const savedUser = localStorage.getItem('leadhunter_admin_user');
      const token = localStorage.getItem('leadhunter_admin_token');
      if (savedUser && token) return JSON.parse(savedUser);
    } catch {}
    return null;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem('leadhunter_settings');
      if (stored) return JSON.parse(stored);
    } catch {}
    return defaultSettings;
  });

  const [prospects, setProspects] = useState<Prospect[]>(() => {
    try {
      const stored = getStoredProspects();
      if (stored && stored.length > 0) return stored;
    } catch {}
    return [];
  });

  const [stats, setStats] = useState(() => {
    try {
      const stored = getStoredProspects();
      if (stored && stored.length > 0) return computeStats(stored);
    } catch {}
    return {
      totalLeads: 0,
      noWebsiteCount: 0,
      highPriorityCount: 0,
      readyToContactCount: 0,
      clickedCount: 0,
      contactedCount: 0,
      clientsWonCount: 0,
      avgScore: 0
    };
  });

  const [jobs, setJobs] = useState<DailyJobRun[]>([]);
  const [schedulerStatus, setSchedulerStatus] = useState<any>({
    isActive: false,
    isCurrentlyRunning: false,
    scheduleTime: '08:00',
    timezone: 'Europe/Madrid',
    nextScheduledRun: null,
    lastRun: null,
    recentJobs: []
  });
  const [providersData, setProvidersData] = useState<any>(null);

  // UI state
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [showWizard, setShowWizard] = useState<boolean>(false);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState<boolean>(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState<boolean>(false);
  const [isResearchRunning, setIsResearchRunning] = useState<boolean>(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Resilient data loading: individual safe fetches ensure no single error stops the site from loading
  const loadData = useCallback(async () => {
    const fetchEndpoint = async (url: string) => {
      try {
        const res = await apiFetch(url);
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn(`Safe fetch for ${url} notice:`, err);
      }
      return null;
    };

    try {
      const [settingsRes, statsRes, prospectsRes, schedRes, jobsRes, provRes] = await Promise.all([
        fetchEndpoint('/api/settings'),
        fetchEndpoint('/api/stats'),
        fetchEndpoint('/api/prospects?limit=100'),
        fetchEndpoint('/api/scheduler/status'),
        fetchEndpoint('/api/jobs'),
        fetchEndpoint('/api/providers/status')
      ]);

      if (settingsRes) {
        setSettings(settingsRes);
        if (settingsRes.uiLanguage) setLang(settingsRes.uiLanguage);
        if (settingsRes.uiTheme) setTheme(settingsRes.uiTheme);
      }
      if (statsRes) {
        setStats(statsRes);
      }
      if (prospectsRes?.items && prospectsRes.items.length > 0) {
        setProspects(prospectsRes.items);
        saveStoredProspects(prospectsRes.items);
      }
      if (schedRes) setSchedulerStatus(schedRes);
      if (jobsRes) setJobs(jobsRes);
      if (provRes) setProvidersData(provRes);
    } catch (err) {
      console.warn('Background sync notice:', err);
    } finally {
      setIsLoadingInitial(false);
    }
  }, []);

  useEffect(() => {
    if (adminUser) {
      loadData();
    } else {
      setIsLoadingInitial(false);
    }
  }, [adminUser, loadData]);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsQuickSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers
  const handlePerformSearch = async ({ location, query }: { location: string; query: string }) => {
    setIsResearchRunning(true);
    setActionError(null);
    try {
      const res = await apiFetch('/api/search/deep-prospect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, query })
      });
      if (res.ok) {
        await loadData();
        setCurrentTab('dashboard');
      } else {
        const data = await res.json();
        setActionError(data.error || 'Failed to complete deep search');
      }
    } catch (err) {
      console.error('Error during deep search:', err);
      setActionError('Network error while running deep search');
    } finally {
      setIsResearchRunning(false);
    }
  };

  const handleTriggerResearch = async () => {
    setIsResearchRunning(true);
    setActionError(null);
    try {
      const res = await apiFetch('/api/scheduler/run-now', { method: 'POST' });
      if (res.ok) {
        await loadData();
      } else {
        const data = await res.json();
        setActionError(data.error || 'Failed to trigger discovery run');
      }
    } catch (err) {
      console.error('Error triggering research run:', err);
      setActionError('Network error while triggering discovery run');
    } finally {
      setIsResearchRunning(false);
    }
  };

  const handleToggleScheduler = async (enabled: boolean) => {
    try {
      const res = await apiFetch('/api/scheduler/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      if (res.ok) {
        const data = await res.json();
        setSchedulerStatus((prev: any) => ({ ...prev, isActive: data.enabled }));
        if (settings) setSettings({ ...settings, cronEnabled: data.enabled });
      }
    } catch (err) {
      console.error('Failed to toggle scheduler:', err);
    }
  };

  const handleSaveSettings = async (updated: Partial<AppSettings>) => {
    try {
      const res = await apiFetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const saved = await res.json();
        setSettings(saved);
        setShowWizard(false);
        loadData();
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const handleSelectProspectById = async (prospect: Prospect) => {
    try {
      // Mark as clicked in the background
      apiFetch(`/api/prospects/${prospect.id}/click`, { method: 'POST' }).catch(() => {});
      setProspects((prev) =>
        prev.map((p) => (p.id === prospect.id ? { ...p, isClicked: true, clickedAt: new Date().toISOString() } : p))
      );

      const res = await apiFetch(`/api/prospects/${prospect.id}`);
      if (res.ok) {
        const full = await res.json();
        setSelectedProspect(full);
      } else {
        setSelectedProspect(prospect);
      }
    } catch {
      setSelectedProspect(prospect);
    }
  };

  const handleMarkContacted = async (id: string, notes?: string) => {
    try {
      const res = await apiFetch(`/api/prospects/${id}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      if (res.ok) {
        const updated = await res.json();
        setProspects((prev) => {
          const next = prev.map((p) => (p.id === id ? updated : p));
          saveStoredProspects(next);
          return next;
        });
        if (selectedProspect?.id === id) {
          setSelectedProspect(updated);
        }
        apiFetch('/api/stats').then((r) => r.json()).then(setStats).catch(() => {});
      }
    } catch (err) {
      console.error('Failed to mark contacted:', err);
    }
  };

  const handleUpdateProspectStatus = async (id: string, status: LeadStatus, notes?: string) => {
    try {
      const res = await apiFetch(`/api/prospects/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes })
      });
      if (res.ok) {
        const updated = await res.json();
        setProspects((prev) => {
          const next = prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status,
                  notes: notes ?? p.notes,
                  isContacted: status === 'contacted' ? true : p.isContacted
                }
              : p
          );
          saveStoredProspects(next);
          return next;
        });
        if (selectedProspect?.id === id) {
          setSelectedProspect((prev) => (prev ? { ...prev, status, notes: notes ?? prev.notes, isContacted: status === 'contacted' ? true : prev.isContacted } : null));
        }
        // Refresh stats
        apiFetch('/api/stats').then((r) => r.json()).then(setStats).catch(() => {});
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleClearResearch = async (options: { keepContacted?: boolean; keepStarred?: boolean; cleanAll?: boolean } = { keepContacted: true, keepStarred: true }) => {
    try {
      const res = await apiFetch('/api/prospects/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });
      if (res.ok) {
        if (options.cleanAll || (!options.keepContacted && !options.keepStarred)) {
          setProspects([]);
          saveStoredProspects([]);
          setStats((prev) => ({
            ...prev,
            totalLeads: 0,
            noWebsiteCount: 0,
            highPriorityCount: 0,
            readyToContactCount: 0,
            clickedCount: 0,
            contactedCount: 0,
            clientsWonCount: 0,
            avgScore: 0
          }));
        } else {
          setProspects((prev) => {
            const next = prev.filter((p) => {
              const isContacted = Boolean(p.isContacted || p.status === 'contacted');
              const isStarred = Boolean(p.isStarred);
              if (options.keepContacted && isContacted) return true;
              if (options.keepStarred && isStarred) return true;
              return false;
            });
            saveStoredProspects(next);
            return next;
          });
        }
        apiFetch('/api/stats').then((r) => r.json()).then(setStats).catch(() => {});
      }
    } catch (err) {
      console.error('Failed to clear research:', err);
    }
  };

  const handleToggleStar = async (id: string) => {
    try {
      const res = await apiFetch(`/api/prospects/${id}/star`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setProspects((prev) => prev.map((p) => (p.id === id ? { ...p, isStarred: data.isStarred } : p)));
        if (selectedProspect?.id === id) {
          setSelectedProspect((prev) => prev ? { ...prev, isStarred: data.isStarred } : null);
        }
      }
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  };

  const handleReverify = async (id: string) => {
    try {
      const res = await apiFetch(`/api/prospects/${id}/verify-website`, { method: 'POST' });
      if (res.ok) {
        const updated = await res.json();
        setProspects((prev) => prev.map((p) => (p.id === id ? updated : p)));
        setSelectedProspect(updated);
      }
    } catch (err) {
      console.error('Failed to reverify website:', err);
    }
  };

  const handleRegenerateBrief = async (id: string) => {
    try {
      const res = await apiFetch(`/api/prospects/${id}/generate-brief`, { method: 'POST' });
      if (res.ok) {
        const brief = await res.json();
        setProspects((prev) => prev.map((p) => (p.id === id ? { ...p, brief } : p)));
        setSelectedProspect((prev) => prev ? { ...prev, brief } : null);
      }
    } catch (err) {
      console.error('Failed to regenerate brief:', err);
    }
  };

  const handleGenerateOutreach = async (id: string, channel: OutreachDraft['channel'], tone: OutreachDraft['tone']) => {
    try {
      const res = await apiFetch(`/api/prospects/${id}/outreach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, tone })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error('Failed to generate outreach:', err);
    }
    return null;
  };

  const handleExportCsv = () => {
    if (prospects.length === 0) return;
    const headers = ['ID', 'Name', 'Category', 'Address', 'City', 'Phone', 'WebsiteStatus', 'Rating', 'Reviews', 'LeadScore', 'Status', 'Contacted', 'Clicked'];
    const rows = prospects.map((p) => [
      `"${p.id}"`,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.category || '').replace(/"/g, '""')}"`,
      `"${(p.address || '').replace(/"/g, '""')}"`,
      `"${(p.city || '').replace(/"/g, '""')}"`,
      `"${p.phone || ''}"`,
      `"${p.websiteStatus || ''}"`,
      p.reviewRating || 0,
      p.reviewCount || 0,
      p.leadScore || 0,
      `"${p.status || ''}"`,
      p.isContacted ? 'Yes' : 'No',
      p.isClicked ? 'Yes' : 'No'
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leadhunter_prospects_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = () => {
    localStorage.removeItem('leadhunter_admin_token');
    localStorage.removeItem('leadhunter_admin_user');
    localStorage.setItem('leadhunter_logged_out', 'true');
    setAdminUser(null);
  };

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'es' : 'en';
    setLang(nextLang);
    if (settings) {
      handleSaveSettings({ uiLanguage: nextLang });
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (settings) {
      handleSaveSettings({ uiTheme: nextTheme });
    }
  };

  // Admin gatekeeper: If user is not authenticated, show strictly the login screen
  if (!adminUser) {
    return <AdminLogin onLoginSuccess={(user) => setAdminUser(user)} />;
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#070b14] text-slate-100' : 'bg-slate-100 text-slate-900'} antialiased flex flex-col font-sans transition-colors duration-200`}>
      {/* Top Navigation Header with Centered Search Bar */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        lang={lang}
        onToggleLang={toggleLanguage}
        theme={theme}
        onToggleTheme={toggleTheme}
        onPerformSearch={handlePerformSearch}
        isSearching={isResearchRunning}
        userEmail={adminUser.email}
        onLogout={handleLogout}
        totalLeadsCount={stats.totalLeads}
        contactedCount={stats.contactedCount}
        onOpenDeployModal={() => setIsDeployModalOpen(true)}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-20">
        {actionError && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-red-200 shadow-lg animate-in fade-in">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
              <span className="text-sm font-medium">{actionError}</span>
            </div>
            <button
              onClick={() => setActionError(null)}
              className="text-red-400 hover:text-red-200 transition-colors p-1 cursor-pointer"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {currentTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            topProspects={prospects}
            latestReport={jobs[0] || null}
            settings={settings}
            lang={lang}
            onSelectProspect={handleSelectProspectById}
            onNavigateTab={setCurrentTab}
            onTriggerResearch={handleTriggerResearch}
            isResearchRunning={isResearchRunning}
            onPerformSearch={handlePerformSearch}
            onMarkContacted={handleMarkContacted}
            onToggleStar={handleToggleStar}
            onOpenDeployModal={() => setIsDeployModalOpen(true)}
            onClearResearch={handleClearResearch}
          />
        )}

        {(currentTab === 'prospects' || currentTab === 'contacted') && (
          <ProspectsView
            prospects={currentTab === 'contacted' ? prospects.filter((p) => p.isContacted || p.status === 'contacted') : prospects}
            lang={lang}
            initialFilter={currentTab === 'contacted' ? 'contacted' : 'uncontacted'}
            onSelectProspect={handleSelectProspectById}
            onToggleStar={handleToggleStar}
            onUpdateStatus={handleUpdateProspectStatus}
            onVerifyAgain={handleReverify}
            onExportCsv={handleExportCsv}
            onMarkContacted={handleMarkContacted}
            onClearResearch={handleClearResearch}
          />
        )}

        {currentTab === 'reports' && (
          <DailyReportsView
            jobs={jobs}
            settings={settings}
            lang={lang}
            onTriggerResearch={handleTriggerResearch}
            isResearchRunning={isResearchRunning}
            onExportCsv={handleExportCsv}
          />
        )}

        {currentTab === 'scheduler' && (
          <SchedulerView
            settings={settings}
            schedulerStatus={schedulerStatus}
            lang={lang}
            onUpdateSettings={handleSaveSettings}
            onToggleScheduler={handleToggleScheduler}
            onTriggerResearch={handleTriggerResearch}
          />
        )}

        {currentTab === 'providers' && (
          <ProvidersView
            settings={settings}
            providersData={providersData}
            lang={lang}
            onUpdateSettings={handleSaveSettings}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            settings={settings}
            lang={lang}
            onSave={handleSaveSettings}
            onOpenWizard={() => setShowWizard(true)}
          />
        )}
      </main>

      {/* Full Business Profile Modal */}
      {selectedProspect && (
        <ProspectModal
          prospect={selectedProspect}
          settings={settings}
          lang={lang}
          onClose={() => setSelectedProspect(null)}
          onUpdateStatus={handleUpdateProspectStatus}
          onToggleStar={handleToggleStar}
          onReverify={handleReverify}
          onRegenerateBrief={handleRegenerateBrief}
          onGenerateOutreach={handleGenerateOutreach}
        />
      )}

      {/* First-Run Setup Wizard */}
      {showWizard && (
        <SetupWizard
          initialSettings={settings}
          lang={lang}
          onComplete={handleSaveSettings}
          onClose={() => setShowWizard(false)}
        />
      )}

      {/* Quick Search Shortcut Modal */}
      <QuickSearchModal
        prospects={prospects}
        lang={lang}
        isOpen={isQuickSearchOpen}
        onClose={() => setIsQuickSearchOpen(false)}
        onSelectProspect={handleSelectProspectById}
      />

      {/* Offline Status Toast Indicator */}
      <OfflineIndicator lang={lang} />

      {/* Cloudflare & GitHub Deploy Hub Modal */}
      <CloudflareDeployModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
        lang={lang}
      />

      {/* Mobile Sticky Bottom Navigation Bar for Home Screen / PWA */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090d18]/95 border-t border-slate-800/80 backdrop-blur-2xl px-3 py-2 flex items-center justify-around text-[10px] shadow-2xl safe-area-pb">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center gap-1 transition cursor-pointer ${
            currentTab === 'dashboard' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Compass className="h-4 w-4" />
          <span>{lang === 'es' ? 'Descubrir' : 'Discover'}</span>
        </button>

        <button
          onClick={() => setCurrentTab('prospects')}
          className={`flex flex-col items-center gap-1 relative transition cursor-pointer ${
            currentTab === 'prospects' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className="relative">
            <Database className="h-4 w-4" />
            {stats.totalLeads > 0 && (
              <span className="absolute -top-1 -right-2 px-1 rounded-full text-[9px] bg-slate-800 text-slate-300 font-mono">
                {stats.totalLeads}
              </span>
            )}
          </div>
          <span>{lang === 'es' ? 'Leads' : 'Leads'}</span>
        </button>

        <button
          onClick={() => setCurrentTab('contacted')}
          className={`flex flex-col items-center gap-1 relative transition cursor-pointer ${
            currentTab === 'contacted' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className="relative">
            <CheckCircle2 className="h-4 w-4" />
            {stats.contactedCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 rounded-full text-[9px] bg-emerald-500/30 text-emerald-300 font-mono">
                {stats.contactedCount}
              </span>
            )}
          </div>
          <span>{lang === 'es' ? 'Contactados' : 'Contacted'}</span>
        </button>

        <button
          onClick={() => setCurrentTab('settings')}
          className={`flex flex-col items-center gap-1 transition cursor-pointer ${
            currentTab === 'settings' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>{lang === 'es' ? 'Ajustes' : 'Settings'}</span>
        </button>
      </nav>
    </div>
  );
}
