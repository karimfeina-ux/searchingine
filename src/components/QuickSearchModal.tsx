import React, { useState, useEffect } from 'react';
import type { Prospect } from '../types/index.ts';
import { Search, X, Zap, MapPin, ArrowRight } from 'lucide-react';

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // toggle or open
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const results = prospects.filter((p) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q)
    );
  }).slice(0, 8);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 pt-20">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-[#0f172a] shadow-2xl overflow-hidden flex flex-col text-slate-100">
        <div className="relative border-b border-slate-800 p-3">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === 'es' ? 'Buscar prospecto por nombre, categoría o calle...' : 'Search prospect by name, category, street...'}
            className="w-full rounded-xl bg-transparent pl-8 pr-10 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-800/40">
          {results.length === 0 ? (
            <p className="p-4 text-center text-xs text-slate-500">
              {lang === 'es' ? 'No se encontraron resultados' : 'No prospects found'}
            </p>
          ) : (
            results.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  onSelectProspect(p);
                  onClose();
                }}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/60 cursor-pointer transition"
              >
                <div className="space-y-0.5 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs truncate">{p.name}</span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">{p.category}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span className="truncate">{p.address}, {p.city}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-xs font-bold text-cyan-300">
                    <Zap className="w-3 h-3 fill-current" />
                    <span>{p.leadScore}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </div>
            ))
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
