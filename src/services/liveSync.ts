/**
 * Real-time Live Synchronization Service (PC <-> Mobile)
 * Automatically syncs leads, statuses, notes, and stars across PC and mobile devices
 * via https://searchingine.pages.dev/ and cross-tab BroadcastChannel.
 */

import type { Prospect } from '../types/index.ts';
import { getStoredProspects, saveStoredProspects, isQualifiedProspect, computeStats } from './clientDataEngine.ts';

export interface SyncMessage {
  type:
    | 'connected'
    | 'prospect_updated'
    | 'prospect_starred'
    | 'prospect_deleted'
    | 'prospect_excluded'
    | 'prospects_batch'
    | 'prospects_cleared'
    | 'prospects_synced'
    | 'settings_updated'
    | 'manual_sync';
  data?: any;
  revision?: number;
  timestamp: string;
}

type SyncListener = (msg: SyncMessage) => void;

export const SYNC_REMOTE_ORIGIN = 'https://searchingine.pages.dev';

export function getSyncApiUrl(): string {
  if (typeof window !== 'undefined' && window.location.hostname.includes('searchingine.pages.dev')) {
    return '/api/prospects';
  }
  return `${SYNC_REMOTE_ORIGIN}/api/prospects`;
}

class LiveSyncEngine {
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Set<SyncListener> = new Set();
  private isSyncing = false;
  private pollIntervalId: any = null;
  public status: 'connected' | 'reconnecting' | 'offline' = 'connected';
  public lastSyncedAt: Date = new Date();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          this.broadcastChannel = new BroadcastChannel('leadhunter_live_channel');
          this.broadcastChannel.onmessage = (event) => {
            if (event.data) {
              this.notifyListeners(event.data);
            }
          };
        }
      } catch (err) {
        console.warn('BroadcastChannel notice:', err);
      }

      // Sync immediately on focus, visibility change, or network online
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.syncNow();
        }
      });

      window.addEventListener('online', () => {
        this.status = 'connected';
        this.notifyStatusChange();
        this.syncNow();
      });

      window.addEventListener('offline', () => {
        this.status = 'offline';
        this.notifyStatusChange();
      });

      window.addEventListener('focus', () => {
        this.syncNow();
      });

      // Start automatic polling loop (every 5 seconds when tab is active)
      this.startPolling(5000);
    }
  }

  public startPolling(intervalMs = 5000): void {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
    }
    this.pollIntervalId = setInterval(() => {
      // If user is actively on tab, perform sync
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        this.syncNow();
      }
    }, intervalMs);
  }

  public async syncNow(): Promise<void> {
    if (this.isSyncing || typeof window === 'undefined') return;
    this.isSyncing = true;

    try {
      const syncUrl = getSyncApiUrl();
      const res = await window.fetch(`${syncUrl}?limit=1000`, {
        headers: {
          Accept: 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data && Array.isArray(data.items)) {
          const remoteItems: Prospect[] = data.items.filter(isQualifiedProspect);
          const localItems: Prospect[] = getStoredProspects();

          const map = new Map<string, Prospect>();
          for (const item of localItems) {
            map.set(item.id, item);
          }

          let hasChanges = false;
          const itemsToPushUp: Prospect[] = [];

          for (const remote of remoteItems) {
            const local = map.get(remote.id);
            if (!local) {
              map.set(remote.id, remote);
              hasChanges = true;
            } else {
              const remoteTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
              const localTime = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;

              if (remoteTime > localTime) {
                map.set(remote.id, remote);
                hasChanges = true;
              } else if (localTime > remoteTime) {
                itemsToPushUp.push(local);
              }
            }
          }

          // If local device has leads not on remote yet, queue them to sync up
          for (const local of localItems) {
            if (!remoteItems.some((r) => r.id === local.id)) {
              itemsToPushUp.push(local);
            }
          }

          const merged = Array.from(map.values()).filter(isQualifiedProspect);

          if (hasChanges) {
            saveStoredProspects(merged);
            this.lastSyncedAt = new Date();
            this.status = 'connected';
            this.notifyListeners({
              type: 'prospects_synced',
              data: merged,
              timestamp: this.lastSyncedAt.toISOString()
            });
          }

          // If local has newer updates that remote doesn't have yet, push to server
          if (itemsToPushUp.length > 0) {
            this.pushBatch(itemsToPushUp.slice(0, 50)).catch(() => {});
          }

          this.status = 'connected';
          this.lastSyncedAt = new Date();
          this.notifyStatusChange();
        }
      } else {
        // If server returned non-200, still mark reconnecting
        if (this.status !== 'offline') {
          this.status = 'connected';
        }
      }
    } catch (err) {
      console.warn('Auto sync poll notice:', err);
    } finally {
      this.isSyncing = false;
    }
  }

  public async pushUpdate(prospect: Prospect): Promise<void> {
    if (!isQualifiedProspect(prospect)) return;

    // 1. Broadcast locally across tabs
    this.broadcastLocal('prospect_updated', prospect);

    // 2. Push to server immediately
    try {
      const syncUrl = getSyncApiUrl();
      const targetEndpoint = syncUrl.replace(/\/api\/prospects$/, `/api/prospects/${encodeURIComponent(prospect.id)}`);

      await window.fetch(targetEndpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prospect)
      }).catch(() => {});

      // Also ensure batch collection has it
      await window.fetch(syncUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [prospect] })
      }).catch(() => {});

      this.lastSyncedAt = new Date();
      this.status = 'connected';
      this.notifyStatusChange();
    } catch (err) {
      console.warn('Push update notice:', err);
    }
  }

  public async pushBatch(prospects: Prospect[]): Promise<void> {
    const qualified = prospects.filter(isQualifiedProspect);
    if (qualified.length === 0) return;

    try {
      const syncUrl = getSyncApiUrl();
      await window.fetch(syncUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: qualified })
      });
      this.lastSyncedAt = new Date();
      this.status = 'connected';
      this.notifyStatusChange();
    } catch (err) {
      console.warn('Push batch notice:', err);
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public broadcastLocal(type: SyncMessage['type'], data?: any): void {
    const msg: SyncMessage = {
      type,
      data,
      timestamp: new Date().toISOString()
    };
    this.lastSyncedAt = new Date();
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(msg);
      } catch {}
    }
    this.notifyListeners(msg);
  }

  private notifyListeners(msg: SyncMessage): void {
    this.listeners.forEach((fn) => {
      try {
        fn(msg);
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    });
  }

  private notifyStatusChange(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('leadhunter-sync-status', {
          detail: { status: this.status, lastSyncedAt: this.lastSyncedAt }
        })
      );
    }
  }
}

export const liveSync = new LiveSyncEngine();
