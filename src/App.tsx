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
import { Loader2 } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [stats, setStats] = useState({
    totalLeads: 0,
    noWebsiteCount: 0,
    highPriorityCount: 0,
    readyToContactCount: 0,
    contactedCount: 0,
    clientsWonCount: 0,
    avgScore: 0
  });
  const [jobs, setJobs] = useState<DailyJobRun[]>([]);
  const [schedulerStatus, setSchedulerStatus] = useState<any>({
    isActive: true,
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
  const [isResearchRunning, setIsResearchRunning] = useState<boolean>(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);

  // Fetch initial data
  const loadData = useCallback(async () => {
    try {
      const [settingsRes, statsRes, prospectsRes, schedRes, jobsRes, provRes] = await Promise.all([
        fetch('/api/settings').then((r) => r.json()),
        fetch('/api/stats').then((r) => r.json()),
        fetch('/api/prospects?limit=100').then((r) => r.json()),
        fetch('/api/scheduler/status').then((r) => r.json()),
        fetch('/api/jobs').then((r) => r.json()),
        fetch('/api/providers/status').then((r) => r.json())
      ]);

      setSettings(settingsRes);
      setStats(statsRes);
      setProspects(prospectsRes.items || []);
      setSchedulerStatus(schedRes);
      setJobs(jobsRes || []);
      setProvidersData(provRes);

      if (settingsRes.uiLanguage) setLang(settingsRes.uiLanguage);
      if (settingsRes.uiTheme) setTheme(settingsRes.uiTheme);

      // Auto show setup wizard if not configured
      if (settingsRes && !settingsRes.isConfigured) {
        setShowWizard(true);
      }
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setIsLoadingInitial(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
  const handleTriggerResearch = async () => {
    setIsResearchRunning(true);
    try {
      const res = await fetch('/api/scheduler/run-now', { method: 'POST' });
      if (res.ok) {
        await loadData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to trigger discovery run');
      }
    } catch (err) {
      console.error('Error triggering research run:', err);
    } finally {
      setIsResearchRunning(false);
    }
  };

  const handleToggleScheduler = async (enabled: boolean) => {
    try {
      const res = await fetch('/api/scheduler/toggle', {
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
      const res = await fetch('/api/settings', {
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
      const res = await fetch(`/api/prospects/${prospect.id}`);
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

  const handleUpdateProspectStatus = async (id: string, status: LeadStatus, notes?: string) => {
    try {
      const res = await fetch(`/api/prospects/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes })
      });
      if (res.ok) {
        const updated = await res.json();
        setProspects((prev) => prev.map((p) => (p.id === id ? { ...p, status, notes: notes ?? p.notes } : p)));
        if (selectedProspect?.id === id) {
          setSelectedProspect((prev) => prev ? { ...prev, status, notes: notes ?? prev.notes } : null);
        }
        // Refresh stats
        fetch('/api/stats').then((r) => r.json()).then(setStats);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleToggleStar = async (id: string) => {
    try {
      const res = await fetch(`/api/prospects/${id}/star`, { method: 'POST' });
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
      const res = await fetch(`/api/prospects/${id}/verify-website`, { method: 'POST' });
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
      const res = await fetch(`/api/prospects/${id}/generate-brief`, { method: 'POST' });
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
      const res = await fetch(`/api/prospects/${id}/outreach`, {
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
    window.location.href = '/api/export/csv';
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

  if (isLoadingInitial || !settings) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#0b1120] text-slate-100">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-400 mb-4" />
        <h1 className="text-base font-extrabold tracking-tight">LEADHUNTER<span className="text-cyan-400">.AI</span></h1>
        <p className="text-xs text-slate-500 mt-1">Initializing Autonomous Prospecting Engine...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0b1120] text-slate-100' : 'bg-slate-100 text-slate-900'} antialiased flex flex-col font-sans transition-colors duration-200`}>
      {/* Top Navigation Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        lang={lang}
        onToggleLang={toggleLanguage}
        theme={theme}
        onToggleTheme={toggleTheme}
        isResearchRunning={isResearchRunning}
        onTriggerResearch={handleTriggerResearch}
        schedulerActive={schedulerStatus.isActive}
        nextRunTime={schedulerStatus.nextScheduledRun}
        onOpenQuickSearch={() => setIsQuickSearchOpen(true)}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-20">
        {currentTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            topProspects={prospects.filter((p) => p.leadScore >= 70).slice(0, 5)}
            latestReport={jobs[0] || null}
            settings={settings}
            lang={lang}
            onSelectProspect={handleSelectProspectById}
            onNavigateTab={setCurrentTab}
            onTriggerResearch={handleTriggerResearch}
            isResearchRunning={isResearchRunning}
          />
        )}

        {currentTab === 'prospects' && (
          <ProspectsView
            prospects={prospects}
            lang={lang}
            onSelectProspect={handleSelectProspectById}
            onToggleStar={handleToggleStar}
            onUpdateStatus={handleUpdateProspectStatus}
            onVerifyAgain={handleReverify}
            onExportCsv={handleExportCsv}
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
    </div>
  );
}
