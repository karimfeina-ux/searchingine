import React, { useState, useEffect } from 'react';
import type { Prospect } from '../types/index.ts';
import { getGoogleMapsUrl } from '../utils/maps.ts';
import { Search, X, Zap, MapPin, ArrowRight, ExternalLink, CheckCircle2 } from 'lucide-react';

interface QuickSearchModalProps {
  prospects: Prospect[];
  lang: 'en' | 'es';
  isOpen: boolean;
  onClose: () => void;
  onSelectProspect: (prospect: Prospect) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  prospects,
  lang,
  isOpen,
  onClose,
  onSelectProspect
}) => {
  const [query, setQuery] = useState('');
  const [hideContacted, setHideContacted] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const results = prospects
    .filter((p) => {
      const isContacted = Boolean(p.isContacted || p.status === 'contacted');
      if (hideContacted && isContacted) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
      );
    })
    .slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 pt-20 animate-in fade-in">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-[#0f172a] shadow-2xl overflow-hidden flex flex-col text-slate-100">
        <div className="relative border-b border-slate-800 p-3">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === 'es' ? 'Buscar prospecto por nombre, categoría, calle o ciudad...' : 'Search prospect by name, category, street or city...'}
            className="w-full rounded-xl bg-transparent pl-8 pr-24 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-3 py-1.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>{lang === 'es' ? 'Resultados rápidos' : 'Quick matching results'}</span>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideContacted}
              onChange={(e) => setHideContacted(e.target.checked)}
              className="rounded border-slate-700 text-cyan-500 focus:ring-0 text-[10px]"
            />
            <span>{lang === 'es' ? 'Ocultar contactados' : 'Hide contacted'}</span>
          </label>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-800/40">
          {results.length === 0 ? (
            <p className="p-4 text-center text-xs text-slate-500">
              {lang === 'es' ? 'No se encontraron prospectos' : 'No prospects found'}
            </p>
          ) : (
            results.map((p) => {
              const mapsUrl = getGoogleMapsUrl(p);
              const isContacted = Boolean(p.isContacted || p.status === 'contacted');

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectProspect(p);
                    onClose();
                  }}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/60 cursor-pointer transition group"
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs truncate group-hover:text-cyan-300 transition">
                        {p.name}
                      </span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 truncate">
                        {p.category}
                      </span>
                      {isContacted && (
                        <span className="rounded bg-emerald-950 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-mono text-emerald-300">
                          {lang === 'es' ? 'Contactado' : 'Contacted'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{p.address}, {p.city}</span>
                      </span>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-0.5 text-[10px]"
                        title="Open on Google Maps"
                      >
                        <span>Maps</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-xs font-bold text-cyan-300">
                      <Zap className="w-3 h-3 fill-current" />
                      <span>{p.leadScore}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-slate-800 bg-slate-950/80 px-4 py-2 flex items-center justify-between text-[11px] text-slate-500">
          <span>{lang === 'es' ? 'Usa ESC para salir' : 'Press ESC to close'}</span>
          <span>{prospects.length} {lang === 'es' ? 'leads en base de datos' : 'leads in database'}</span>
        </div>
      </div>
    </div>
  );
};
