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
import { DeviceSyncModal } from './components/DeviceSyncModal.tsx';
import { GoogleMapsProspectsView } from './components/GoogleMapsProspectsView.tsx';
import { ContactedListView } from './components/ContactedListView.tsx';
import { apiFetch } from './services/apiBridge.ts';
import { defaultSettings, getStoredProspects, computeStats, saveStoredProspects, deleteProspectClient, getExcludedSets, backupLocalData } from './services/clientDataEngine.ts';
import { liveSync, type SyncMessage } from './services/liveSync.ts';
import { Loader2, AlertCircle, X, Compass, Database, CheckCircle2, Settings } from 'lucide-react';

export default function App() {
  // Authentication state
  const [adminUser, setAdminUser] = useState<{ email: string; name: string } | null>(() => {
    try {
      if (localStorage.getItem('leadhunter_logged_out') === 'true') return null;
      const savedUser = localStorage.getItem('leadhunter_admin_user');
      const token = localStorage.getItem('leadhunter_admin_token');
      if (savedUser && token) return JSON.parse(savedUser);
      const defaultUser = { email: 'admin@leadhunter.ai', name: 'Administrator' };
      localStorage.setItem('leadhunter_admin_token', `admin_token_${Date.now()}`);
      localStorage.setItem('leadhunter_admin_user', JSON.stringify(defaultUser));
      return defaultUser;
    } catch {}
    return { email: 'admin@leadhunter.ai', name: 'Administrator' };
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
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isResearchRunning, setIsResearchRunning] = useState<boolean>(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'reconnecting' | 'offline'>('connected');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);
  const [contactToast, setContactToast] = useState<{
    businessName: string;
    status: LeadStatus;
    title: string;
    message: string;
    showCta: boolean;
  } | null>(null);

  // Resilient data loading with timestamp-aware merge logic across devices
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
        fetchEndpoint('/api/prospects?limit=1000'),
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
      if (prospectsRes?.items) {
        if (prospectsRes.items.length > 0) {
          // Merge server prospects with local prospects using updatedAt timestamp
          setProspects((prev) => {
            const map = new Map<string, Prospect>();
            for (const p of prospectsRes.items) {
              map.set(p.id, p);
            }
            const unsynced: Prospect[] = [];
            for (const p of prev) {
              const remote = map.get(p.id);
              if (!remote) {
                map.set(p.id, p);
                if (p.isContacted || ['contacted', 'waiting', 'client_signed'].includes(p.status)) {
                  unsynced.push(p);
                }
              } else {
                const remoteTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
                const localTime = p.updatedAt ? new Date(p.updatedAt).getTime() : 0;
                if (localTime > remoteTime) {
                  // Local client was edited more recently: keep local edit and queue to sync to server
                  map.set(p.id, p);
                  unsynced.push(p);
                } else {
                  // Remote is newer or equal: use remote data
                  map.set(p.id, remote);
                }
              }
            }
            if (unsynced.length > 0) {
              apiFetch('/api/prospects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: unsynced })
              }).catch(() => {});
            }
            const mergedList = Array.from(map.values());
            saveStoredProspects(mergedList);
            return mergedList;
          });
        } else {
          // If server has 0 records, check if this device has existing records to migrate safely
          const localItems = getStoredProspects();
          if (localItems.length > 0) {
            backupLocalData();
            apiFetch('/api/prospects', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items: localItems })
            }).catch(() => {});
            setProspects(localItems);
          } else {
            setProspects((prev) => prev.filter((p) => p.isContacted || ['contacted', 'waiting', 'client_signed'].includes(p.status)));
          }
        }
      }
      if (schedRes) setSchedulerStatus(schedRes);
      if (jobsRes) setJobs(jobsRes);
      if (provRes) setProvidersData(provRes);
      setLastSyncedAt(new Date());
    } catch (err) {
      console.warn('Background sync notice:', err);
    } finally {
      setIsLoadingInitial(false);
    }
  }, []);

  useEffect(() => {
    if (!adminUser) {
      setIsLoadingInitial(false);
      return;
    }

    loadData();

    // Subscribe to live SSE events and cross-tab BroadcastChannel
    const unsubscribe = liveSync.subscribe((msg: SyncMessage) => {
      setLastSyncedAt(new Date());
      setSyncStatus(liveSync.status);

      if (msg.type === 'prospect_updated' && msg.data) {
        const updated = msg.data as Prospect;
        setProspects((prev) => {
          const exists = prev.some((p) => p.id === updated.id);
          const next = exists
            ? prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
            : [updated, ...prev];
          saveStoredProspects(next);
          setStats(computeStats(next));
          return next;
        });
        setSelectedProspect((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
      } else if (msg.type === 'prospect_starred' && msg.data) {
        const { id, isStarred } = msg.data;
        setProspects((prev) => {
          const next = prev.map((p) => (p.id === id ? { ...p, isStarred } : p));
          saveStoredProspects(next);
          return next;
        });
        setSelectedProspect((prev) => (prev && prev.id === id ? { ...prev, isStarred } : prev));
      } else if (msg.type === 'prospect_deleted' && msg.data) {
        const { id } = msg.data;
        deleteProspectClient(id);
        setProspects((prev) => {
          const next = prev.filter((p) => p.id !== id);
          saveStoredProspects(next);
          setStats(computeStats(next));
          return next;
        });
        setSelectedProspect((prev) => (prev && prev.id === id ? null : prev));
      } else if (msg.type === 'prospect_excluded' && msg.data) {
        const { id } = msg.data;
        deleteProspectClient(id);
        setProspects((prev) => {
          const next = prev.filter((p) => p.id !== id);
          saveStoredProspects(next);
          setStats(computeStats(next));
          return next;
        });
        setSelectedProspect((prev) => (prev?.id === id ? null : prev));
      } else if (msg.type === 'settings_updated' && msg.data) {
        setSettings(msg.data);
        if (msg.data.uiLanguage) setLang(msg.data.uiLanguage);
        if (msg.data.uiTheme) setTheme(msg.data.uiTheme);
      } else if (
        msg.type === 'prospects_batch' ||
        msg.type === 'prospects_cleared' ||
        msg.type === 'manual_sync'
      ) {
        loadData();
      }
    });

    const handleSyncStatus = (e: any) => {
      if (e.detail?.status) setSyncStatus(e.detail.status);
      if (e.detail?.lastSyncedAt) setLastSyncedAt(new Date(e.detail.lastSyncedAt));
    };
    window.addEventListener('leadhunter-sync-status', handleSyncStatus);

    // Instant direct sync via QR Code / Sync Link (#sync=...)
    if (typeof window !== 'undefined' && window.location.hash.includes('#sync=')) {
      try {
        const rawHash = window.location.hash.split('#sync=')[1];
        if (rawHash) {
          const decoded = decodeURIComponent(escape(atob(rawHash)));
          const items = JSON.parse(decoded);
          if (Array.isArray(items) && items.length > 0) {
            setProspects((prev) => {
              const map = new Map<string, Prospect>();
              for (const p of prev) map.set(p.id, p);
              for (const item of items) {
                map.set(item.id, { ...(map.get(item.id) || {}), ...item, isContacted: true });
              }
              const merged = Array.from(map.values());
              saveStoredProspects(merged);
              setStats(computeStats(merged));
              return merged;
            });
            apiFetch('/api/prospects', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items })
            }).catch(() => {});
            setContactToast({
              businessName: 'Sync Complete',
              status: 'contacted',
              title: lang === 'es' ? '📱 ¡Móvil Sincronizado!' : '📱 Mobile Phone Synced!',
              message: lang === 'es' ? `¡${items.length} clientes contactados sincronizados en tu móvil!` : `Successfully synced ${items.length} contacted clients to your phone!`,
              showCta: true
            });
            setTimeout(() => setContactToast(null), 5000);
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
      } catch (err) {
        console.warn('Sync hash processing notice:', err);
      }
    }

    // Auto-sync when user switches tabs or unlocks/opens the website on mobile phone
    const handleSyncOnVisible = () => {
      if (document.visibilityState === 'visible') {
        liveSync.reconnect();
        loadData();
      }
    };
    window.addEventListener('visibilitychange', handleSyncOnVisible);
    window.addEventListener('focus', handleSyncOnVisible);

    // Fast version check every 4 seconds (fallback for mobile browser background throttles)
    let lastKnownRevision = 0;
    const interval = setInterval(async () => {
      if (document.visibilityState === 'visible' && !isResearchRunning) {
        try {
          const res = await apiFetch('/api/sync/version');
          if (res.ok) {
            const data = await res.json();
            if (data.revision && data.revision !== lastKnownRevision) {
              if (lastKnownRevision !== 0) {
                loadData();
              }
              lastKnownRevision = data.revision;
              setLastSyncedAt(new Date());
            }
          }
        } catch {}
      }
    }, 4000);

    return () => {
      unsubscribe();
      window.removeEventListener('leadhunter-sync-status', handleSyncStatus);
      window.removeEventListener('visibilitychange', handleSyncOnVisible);
      window.removeEventListener('focus', handleSyncOnVisible);
      clearInterval(interval);
    };
  }, [adminUser, isResearchRunning, loadData]);

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

  // Google Maps quota exceeded listener
  const [hasGmpQuotaExceeded, setHasGmpQuotaExceeded] = useState(false);
  useEffect(() => {
    const handleQuota = () => setHasGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Handlers
  const handleSearchGoogleMaps = async (searchParams: {
    location: string;
    query: string;
    onlyNoWebsite?: boolean;
    minRating?: number;
  }) => {
    setIsResearchRunning(true);
    setActionError(null);
    try {
      const res = await apiFetch('/api/search/google-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...searchParams, pageSize: 60 })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          const { names: excludedNames, phones: excludedPhones } = getExcludedSets();
          // Filter out any business already contacted or deleted from research
          const validItems = data.items.filter((item: Prospect) => {
            const cleanPhone = (item.phone || '').replace(/\D/g, '');
            if (cleanPhone.length >= 6 && excludedPhones.has(cleanPhone)) return false;
            if (item.normalizedName && excludedNames.has(item.normalizedName.toLowerCase().trim())) return false;
            return true;
          });

          setProspects((prev) => {
            const map = new Map<string, Prospect>();
            for (const item of validItems) {
              map.set(item.id, item);
            }
            for (const p of prev) {
              if (!map.has(p.id)) {
                map.set(p.id, p);
              }
            }
            const merged = Array.from(map.values());
            saveStoredProspects(merged);
            return merged;
          });
          setStats((prev) => computeStats(validItems.concat(prospects)));
          if (validItems.length > 0) {
            await apiFetch('/api/prospects', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items: validItems })
            }).catch(() => {});
          }
        } else if (data && data.total === 0) {
          setActionError(
            lang === 'es'
              ? 'No se encontraron negocios con esos filtros en Google Maps.'
              : 'No businesses found matching those filters on Google Maps.'
          );
        }
        await loadData();
      } else {
        const data = await res.json();
        setActionError(data.error || 'Failed to search Google Maps');
      }
    } catch (err: any) {
      console.error('Error during Google Maps search:', err);
      setActionError(err.message || 'Network error while searching Google Maps');
    } finally {
      setIsResearchRunning(false);
    }
  };

  const handlePerformSearch = async ({ location, query }: { location: string; query: string }) => {
    setIsResearchRunning(true);
    setActionError(null);
    try {
      // 1. Try Google Maps live search first with bigger page size
      let res = await apiFetch('/api/search/google-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, query, onlyNoWebsite: false, pageSize: 60 })
      });
      let data = res.ok ? await res.json() : null;

      // 2. Fallback to deep-prospect if google-maps returned no items
      if (!data || !Array.isArray(data.items) || data.items.length === 0) {
        res = await apiFetch('/api/search/deep-prospect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location, query })
        });
        if (res.ok) {
          data = await res.json();
        }
      }

      if (data && Array.isArray(data.items) && data.items.length > 0) {
        const { names: excludedNames, phones: excludedPhones } = getExcludedSets();
        const validItems = data.items.filter((item: Prospect) => {
          const cleanPhone = (item.phone || '').replace(/\D/g, '');
          if (cleanPhone.length >= 6 && excludedPhones.has(cleanPhone)) return false;
          if (item.normalizedName && excludedNames.has(item.normalizedName.toLowerCase().trim())) return false;
          return true;
        });

        setProspects((prev) => {
          const map = new Map<string, Prospect>();
          for (const item of validItems) {
            map.set(item.id, item);
          }
          for (const p of prev) {
            if (!map.has(p.id)) {
              map.set(p.id, p);
            }
          }
          const merged = Array.from(map.values());
          saveStoredProspects(merged);
          return merged;
        });
        setStats((prev) => computeStats(validItems.concat(prospects)));
        if (validItems.length > 0) {
          await apiFetch('/api/prospects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: validItems })
          }).catch(() => {});
        }
        await loadData();
        setCurrentTab('dashboard');
      } else if (data && data.total === 0) {
        setActionError(
          lang === 'es'
            ? 'No se encontraron nuevos prospectos sin web en esta búsqueda. Prueba con otra categoría o ciudad.'
            : 'No new uncontacted businesses without a website were found for this search. Try a different city or category.'
        );
      } else {
        setActionError(data?.error || 'Failed to complete search');
      }
    } catch (err: any) {
      console.error('Error during deep search:', err);
      setActionError(err?.message || 'Network error while running search');
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
      apiFetch(`/api/prospects/${prospect.id}/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospect })
      }).catch(() => {});
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

  const handleMarkNotInterested = async (id: string) => {
    try {
      const targetProspect = prospects.find((p) => p.id === id);
      apiFetch(`/api/prospects/${id}/not-interested`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'Not interested (Deleted from research)',
          name: targetProspect?.name,
          phone: targetProspect?.phone
        })
      }).catch(() => {});
      deleteProspectClient(id);
      setProspects((prev) => {
        const next = prev.filter((p) => p.id !== id);
        saveStoredProspects(next);
        setStats(computeStats(next));
        return next;
      });
      if (selectedProspect?.id === id) {
        setSelectedProspect(null);
      }
      setContactToast({
        businessName: targetProspect?.name || 'Business',
        status: 'not_interested',
        title: lang === 'es' ? '❌ Descartado de la búsqueda' : '❌ Removed & Excluded',
        message: lang === 'es' ? 'Negocio eliminado de las listas de prospección' : 'Business excluded from future research lists',
        showCta: false
      });
      setTimeout(() => setContactToast(null), 4000);
    } catch (err) {
      console.error('Failed to mark not interested:', err);
    }
  };

  const handleMarkContacted = async (id: string, notes?: string, status: LeadStatus = 'contacted') => {
    try {
      const targetProspect = prospects.find((p) => p.id === id) || (selectedProspect?.id === id ? selectedProspect : undefined);
      const res = await apiFetch(`/api/prospects/${id}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, status, prospect: targetProspect })
      });
      if (res.ok) {
        const updated = await res.json();
        const contactRecord: Prospect = {
          ...(targetProspect || {}),
          ...updated,
          id,
          status,
          isContacted: true,
          contactedAt: updated.contactedAt || targetProspect?.contactedAt || new Date().toISOString()
        } as Prospect;

        setProspects((prev) => {
          const exists = prev.some((p) => p.id === id);
          const next = exists
            ? prev.map((p) => (p.id === id ? contactRecord : p))
            : [contactRecord, ...prev];
          saveStoredProspects(next);
          setStats(computeStats(next));
          return next;
        });
        if (selectedProspect?.id === id) {
          setSelectedProspect((prev) => (prev ? { ...prev, ...contactRecord } : null));
        }

        // Cross-device sync: guarantee batch upsert so D1 on Cloudflare has the complete record
        apiFetch('/api/prospects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: [contactRecord] })
        }).catch(() => {});

        apiFetch('/api/stats').then((r) => r.json()).then(setStats).catch(() => {});

        const name = targetProspect?.name || 'Business';
        setContactToast({
          businessName: name,
          status,
          title: lang === 'es' ? '📩 ¡Movido a Contactados!' : '📩 Pushed to Contacted Pipeline!',
          message: lang === 'es' ? `"${name}" está guardado para siempre en tus contactados.` : `"${name}" is registered forever in your Contacted Pipeline.`,
          showCta: true
        });
        setTimeout(() => setContactToast(null), 5000);
      }
    } catch (err) {
      console.error('Failed to mark contacted:', err);
    }
  };

  const handleUpdateProspectStatus = async (id: string, status: LeadStatus, notes?: string) => {
    if (status === 'not_interested') {
      await handleMarkNotInterested(id);
      return;
    }

    try {
      const targetProspect = prospects.find((p) => p.id === id) || (selectedProspect?.id === id ? selectedProspect : undefined);
      const res = await apiFetch(`/api/prospects/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes, prospect: targetProspect })
      });
      if (res.ok) {
        const isContactedLead = ['contacted', 'waiting', 'client_signed'].includes(status);
        const isResetToNew = status === 'new';

        let updatedRecord: Prospect | null = null;
        setProspects((prev) => {
          const next = prev.map((p) => {
            if (p.id === id) {
              const rec: Prospect = {
                ...p,
                status,
                notes: notes ?? p.notes,
                isContacted: isResetToNew ? false : (isContactedLead ? true : p.isContacted),
                contactedAt: isResetToNew ? undefined : (isContactedLead ? (p.contactedAt || new Date().toISOString()) : p.contactedAt)
              };
              updatedRecord = rec;
              return rec;
            }
            return p;
          });
          saveStoredProspects(next);
          setStats(computeStats(next));
          return next;
        });

        if (selectedProspect?.id === id) {
          setSelectedProspect((prev) =>
            prev
              ? {
                  ...prev,
                  status,
                  notes: notes ?? prev.notes,
                  isContacted: isResetToNew ? false : (isContactedLead ? true : prev.isContacted),
                  contactedAt: isResetToNew ? undefined : (isContactedLead ? (prev.contactedAt || new Date().toISOString()) : prev.contactedAt)
                }
              : null
          );
        }

        // Cross-device sync: guarantee batch upsert
        if (updatedRecord) {
          apiFetch('/api/prospects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: [updatedRecord] })
          }).catch(() => {});
        }
        // Refresh stats
        apiFetch('/api/stats').then((r) => r.json()).then(setStats).catch(() => {});

        // Display toast feedback with direct CTA
        const bName = targetProspect?.name || 'Business';
        let toastTitle = lang === 'es' ? 'Estado Actualizado' : 'Status Updated';
        let toastMessage = `"${bName}" -> ${status}`;

        if (status === 'client_signed') {
          toastTitle = lang === 'es' ? '🎉 ¡Cliente Firmado (+€500)!' : '🎉 Deal Won & Signed (+€500)!';
          toastMessage = lang === 'es' ? `¡Felicidades! "${bName}" se ha añadido a Clientes Ganados.` : `Congratulations! "${bName}" is now a signed client.`;
        } else if (status === 'waiting') {
          toastTitle = lang === 'es' ? '⏳ Esperando Respuesta / Pago' : '⏳ Waiting for Response / Payment';
          toastMessage = lang === 'es' ? `"${bName}" en seguimiento en la lista de contactados.` : `"${bName}" tracked in your active follow-up pipeline.`;
        } else if (status === 'contacted') {
          toastTitle = lang === 'es' ? '📩 ¡Movido a Contactados!' : '📩 Pushed to Contacted Pipeline!';
          toastMessage = lang === 'es' ? `"${bName}" está guardado en tu lista de contactados.` : `"${bName}" is saved in your Contacted Pipeline.`;
        } else if (isResetToNew) {
          toastTitle = lang === 'es' ? '↩ Restablecido' : '↩ Restored';
          toastMessage = lang === 'es' ? `"${bName}" devuelto a la lista de descubrimiento.` : `"${bName}" moved back to discovery.`;
        }

        setContactToast({
          businessName: bName,
          status,
          title: toastTitle,
          message: toastMessage,
          showCta: !isResetToNew
        });
        setTimeout(() => setContactToast(null), 5000);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleClearResearch = async (options: { keepContacted?: boolean; keepStarred?: boolean; cleanAll?: boolean } = { keepContacted: true, keepStarred: true }) => {
    // CRITICAL USER REQUIREMENT:
    // When clicking clean, it ONLY cleans the uncontacted search results.
    // Contacted, waiting, and signed leads are registered FOREVER and never deleted!
    setProspects((prev) => {
      const next = prev.filter((p) => {
        const isContactedLead = Boolean(
          p.isContacted ||
          (p.status && ['contacted', 'waiting', 'client_signed'].includes(p.status))
        );
        return isContactedLead || (options.keepStarred && p.isStarred);
      });
      saveStoredProspects(next);
      setStats(computeStats(next));
      return next;
    });

    // Notify backend with strict keepContacted: true
    try {
      await apiFetch('/api/prospects/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keepContacted: true, keepStarred: Boolean(options.keepStarred), cleanAll: false })
      });
    } catch (err) {
      console.warn('Backend clear notice:', err);
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

  const handleUpdateProspect = async (id: string, updates: Partial<Prospect>) => {
    try {
      const target = prospects.find((p) => p.id === id) || (selectedProspect?.id === id ? selectedProspect : null);
      const isExplicitNew = updates.status === 'new' && (updates.isContacted === false || updates.isContacted === undefined);
      const isContactedLead = updates.status && ['contacted', 'waiting', 'client_signed'].includes(updates.status);

      const optimistic: Prospect = {
        ...(target || {}),
        ...updates,
        id,
        isContacted: isExplicitNew ? false : (isContactedLead ? true : (updates.isContacted ?? target?.isContacted ?? false)),
        updatedAt: new Date().toISOString()
      } as Prospect;

      // Optimistic instant state update
      setProspects((prev) => {
        const next = prev.map((p) => (p.id === id ? optimistic : p));
        saveStoredProspects(next);
        setStats(computeStats(next));
        return next;
      });
      if (selectedProspect?.id === id) {
        setSelectedProspect(optimistic);
      }

      // Broadcast immediately across open tabs and mobile devices
      liveSync.broadcastLocal('prospect_updated', optimistic);

      // Persist to backend
      const res = await apiFetch(`/api/prospects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const saved = await res.json();
        setProspects((prev) => {
          const next = prev.map((p) => (p.id === id ? { ...p, ...saved } : p));
          saveStoredProspects(next);
          setStats(computeStats(next));
          return next;
        });
        if (selectedProspect?.id === id) {
          setSelectedProspect((prev) => (prev ? { ...prev, ...saved } : null));
        }
      }
    } catch (err) {
      console.error('Failed to update prospect:', err);
    }
  };

  const handleTriggerManualSync = async () => {
    setIsManualSyncing(true);
    try {
      liveSync.reconnect();
      await loadData();
      setLastSyncedAt(new Date());
    } finally {
      setIsManualSyncing(false);
    }
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
      {/* Top Navigation Header with Centered Search Bar & Live Sync Status */}
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
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        syncStatus={syncStatus}
        lastSyncedAt={lastSyncedAt}
        onTriggerSync={handleTriggerManualSync}
        isSyncing={isManualSyncing}
      />

      {/* Quota Banner */}
      {hasGmpQuotaExceeded && (
        <div className="bg-amber-500/20 border-b border-amber-500/40 text-amber-200 px-4 py-2 text-xs md:text-sm text-center sticky top-0 z-50 backdrop-blur-md">
          <span>
            Google Maps Platform quota reached or error encountered. Please check your Google Cloud account quotas.
          </span>
        </div>
      )}

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

        {currentTab === 'map' && (
          <div className="-mx-3 sm:-mx-6 -mt-3 sm:-mt-6 -mb-20">
            <GoogleMapsProspectsView
              prospects={prospects}
              settings={settings}
              lang={lang}
              onSelectProspect={handleSelectProspectById}
              onSearchGoogleMaps={handleSearchGoogleMaps}
              onUpdateStatus={handleUpdateProspectStatus}
              onDeleteNotInterested={handleMarkNotInterested}
              isSearching={isResearchRunning}
              searchError={actionError}
            />
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
            onUpdateStatus={handleUpdateProspectStatus}
            onDeleteNotInterested={handleMarkNotInterested}
            onToggleStar={handleToggleStar}
            onOpenDeployModal={() => setIsDeployModalOpen(true)}
            onClearResearch={handleClearResearch}
          />
        )}

        {currentTab === 'contacted' && (
          <ContactedListView
            prospects={prospects}
            lang={lang}
            onSelectProspect={handleSelectProspectById}
            onUpdateStatus={handleUpdateProspectStatus}
            onDeleteNotInterested={handleMarkNotInterested}
            onToggleStar={handleToggleStar}
            onNavigateToDiscovery={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'prospects' && (
          <ProspectsView
            prospects={prospects}
            lang={lang}
            initialFilter="uncontacted"
            onSelectProspect={handleSelectProspectById}
            onToggleStar={handleToggleStar}
            onUpdateStatus={handleUpdateProspectStatus}
            onDeleteNotInterested={handleMarkNotInterested}
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
          onUpdateProspect={handleUpdateProspect}
          onDeleteNotInterested={handleMarkNotInterested}
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

      {/* Contact Outcome Notification Toast with 1-Click Landing Page Push */}
      {contactToast && (
        <div className="fixed top-20 right-4 z-50 max-w-sm w-full bg-[#0d1627] border border-cyan-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-4 duration-200 text-slate-100 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 shrink-0 mt-0.5">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <h4 className="text-xs font-bold text-white">{contactToast.title}</h4>
            <p className="text-[11px] text-slate-300 leading-tight">{contactToast.message}</p>
            {contactToast.showCta && (
              <button
                type="button"
                onClick={() => {
                  setCurrentTab('contacted');
                  setContactToast(null);
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-xs font-bold shadow-md hover:brightness-110 transition cursor-pointer"
              >
                <span>{lang === 'es' ? 'Ver en Lista de Contactados →' : 'View Contacted Pipeline →'}</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setContactToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Offline Status Toast Indicator */}
      <OfflineIndicator lang={lang} />

      {/* Cloudflare & GitHub Deploy Hub Modal */}
      <CloudflareDeployModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
        lang={lang}
      />

      {/* Device Sync Modal (QR & Link Direct Sync) */}
      <DeviceSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        prospects={prospects}
        lang={lang}
        onSyncImported={() => {
          loadData();
        }}
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
