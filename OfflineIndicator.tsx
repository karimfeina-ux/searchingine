import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus.ts';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC<{ lang?: 'en' | 'es' }> = ({ lang = 'en' }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/90 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-xl border border-amber-300">
      <WifiOff className="w-4 h-4 animate-pulse" />
      <span>
        {lang === 'es'
          ? 'Modo sin conexión — Mostrando registros locales en caché'
          : 'Offline Mode — Displaying cached local database'}
      </span>
    </div>
  );
};
