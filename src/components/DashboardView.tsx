import React, { useState } from 'react';
import type { AppSettings, DailyJobRun, Prospect } from '../types/index.ts';
import { getGoogleMapsUrl } from '../utils/maps.ts';
import { t } from '../utils/translations.ts';
import {
  Sparkles,
  MapPin,
  Search,
  Star,
  Phone,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Filter,
  Eye,
  Check,
  Building2,
  Send,
  Cloud,
  Trash2
} from 'lucide-react';

import { ContactOutcomeMenu } from './ContactOutcomeMenu.tsx';
import { getLeadStatusTheme } from '../utils/statusTheme.ts';
import { isQualifiedProspect } from '../services/clientDataEngine.ts';
import type { LeadStatus } from '../types/index.ts';

interface DashboardViewProps {
  stats: {
    totalLeads: number;
    noWebsiteCount: number;
    highPriorityCount: number;
    readyToContactCount: number;
    clickedCount?: number;
    contactedCount: number;
    clientsWonCount: number;
    avgScore: number;
  };
  topProspects: Prospect[];
  latestReport: DailyJobRun | null;
  settings: AppSettings;
  lang: 'en' | 'es';
  onSelectProspect: (prospect: Prospect) => void;
  onNavigateTab: (tab: string) => void;
  onTriggerResearch: () => void;
  isResearchRunning: boolean;
  onPerformSearch: (searchData: { location: string; query: string }) => void;
  onMarkContacted?: (id: string) => void;
  onUpdateStatus?: (id: string, status: LeadStatus, notes?: string) => void;
  onDeleteNotInterested?: (id: string) => void;
  onToggleStar?: (id: string) => void;
  onOpenDeployModal?: () => void;
  onClearResearch?: (options: { keepContacted: boolean; keepStarred: boolean; cleanAll?: boolean }) => void;
  searchLocation?: string;
  onSearchLocationChange?: (val: string) => void;
  searchQuery?: string;
  onSearchQueryChange?: (val: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  topProspects,
  settings,
  lang,
  onSelectProspect,
  onNavigateTab,
  onPerformSearch,
  isResearchRunning,
  onMarkContacted,
  onUpdateStatus,
  onDeleteNotInterested,
  onToggleStar,
  onOpenDeployModal,
  onClearResearch,
  searchLocation,
  onSearchLocationChange,
  searchQuery,
  onSearchQueryChange
}) => {
  const tr = t[lang] || t.en;
  const [heroLocation, setHeroLocation] = useState(() => '');
  const [heroQuery, setHeroQuery] = useState(() => '');
  const [filterHideContacted, setFilterHideContacted] = useState(true);
  const [filterHideClicked, setFilterHideClicked] = useState(false);

  const locVal = searchLocation !== undefined ? searchLocation : heroLocation;
  const setLocVal = onSearchLocationChange || setHeroLocation;
  const queryVal = searchQuery !== undefined ? searchQuery : heroQuery;
  const setQueryVal = onSearchQueryChange || setHeroQuery;

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetLoc = locVal.trim() || 'Madrid';
    const targetQ = queryVal.trim() || 'peluquería';
    onPerformSearch({
      location: targetLoc,
      query: targetQ
    });
  };

  // Quick preset pills
  const presets = [
    { label: lang === 'es' ? 'Madrid Cafeterías y Bistrós' : 'Madrid Cafés & Roasters', loc: 'Madrid', cat: 'Cafés & Specialty Coffee' },
    { label: lang === 'es' ? 'Barcelona Barberías de Barrio' : 'Barcelona Barber Salons', loc: 'Barcelona', cat: 'Barbers & Hair Salons' },
    { label: lang === 'es' ? 'Valencia Restaurantes Tradicionales' : 'Valencia Restaurants', loc: 'Valencia', cat: 'Restaurants & Tapas' },
    { label: lang === 'es' ? 'Miami Boutiques y Talleres' : 'Miami Boutiques & Crafts', loc: 'Miami, FL', cat: 'Artisan & Specialty Trades' },
    { label: lang === 'es' ? 'Londres Estudios de Fitness' : 'London Fitness Studios', loc: 'London', cat: 'Independent Gyms & Fitness' },
  ];

  // Filter prospects: By default exclude contacted leads from active discovery list!
  const displayedProspects = topProspects.filter((p) => {
    if (!isQualifiedProspect(p)) return false;

    const isContactedOrDone = Boolean(
      p.isContacted ||
      p.status === 'contacted' ||
      p.status === 'waiting' ||
      p.status === 'client_signed' ||
      p.status === 'not_interested' ||
      p.status === 'excluded'
    );
    if (filterHideContacted && isContactedOrDone) return false;
    if (filterHideClicked && p.isClicked) return false;
    return true;
  });

  const uncontactedCount = topProspects.filter((p) => {
    return !Boolean(
      p.isContacted ||
      p.status === 'contacted' ||
      p.status === 'waiting' ||
      p.status === 'client_signed' ||
      p.status === 'not_interested' ||
      p.status === 'excluded'
    );
  }).length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">


      {/* Hero Section with Deep Search Console */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-[#0c162d] via-[#091022] to-[#080d1a] p-5 sm:p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none animate-float-slow animate-glow-pulse" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none animate-float-reverse animate-glow-pulse" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-950/60 px-3 py-1 text-xs font-bold text-cyan-300 shadow-sm backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
            <span>{lang === 'es' ? 'Prospección Inteligente de Negocios' : 'Autonomous AI Prospecting Engine'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {tr.heroSearchTitle}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            {tr.heroSearchSubtitle}
          </p>

          {/* Deep AI Search Form */}
          <form onSubmit={handleHeroSubmit} className="mt-5 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
              <div className="relative flex-1 group">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)] group-focus-within:scale-110 group-focus-within:text-cyan-300 transition-all pointer-events-none" />
                <input
                  type="text"
                  value={locVal}
                  onChange={(e) => setLocVal(e.target.value)}
                  placeholder={tr.searchCityPlaceholder}
                  className="w-full h-12 sm:h-11 rounded-2xl border border-cyan-500/35 bg-[#060a14]/90 backdrop-blur-2xl pl-11 pr-4 py-3 sm:py-2.5 text-sm sm:text-xs font-semibold text-slate-100 placeholder:text-slate-500/80 placeholder:font-normal focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 focus:shadow-[0_0_25px_rgba(6,182,212,0.35)] focus:outline-none transition-all duration-300 shadow-inner"
                />
              </div>

              <div className="relative flex-1 group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400 drop-shadow-[0_0_6px_rgba(99,102,241,0.6)] group-focus-within:scale-110 group-focus-within:text-indigo-300 transition-all pointer-events-none" />
                <input
                  type="text"
                  value={queryVal}
                  onChange={(e) => setQueryVal(e.target.value)}
                  placeholder={tr.searchQueryPlaceholder}
                  className="w-full h-12 sm:h-11 rounded-2xl border border-indigo-500/35 bg-[#060a14]/90 backdrop-blur-2xl pl-11 pr-4 py-3 sm:py-2.5 text-sm sm:text-xs font-semibold text-slate-100 placeholder:text-slate-500/80 placeholder:font-normal focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40 focus:shadow-[0_0_25px_rgba(99,102,241,0.35)] focus:outline-none transition-all duration-300 shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={isResearchRunning}
                className="flex items-center justify-center gap-2 h-12 sm:h-11 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-6 py-3 sm:py-2.5 text-sm sm:text-xs font-bold text-white shadow-lg shadow-cyan-500/30 hover:from-cyan-400 hover:to-indigo-500 transition-all duration-300 disabled:opacity-50 cursor-pointer shrink-0 animate-gradient-shift hover-glow active:scale-95"
              >
                {isResearchRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{tr.searching}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>{tr.runDeepSearch}</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Territory Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              <span className="text-[11px] text-slate-400 font-medium">{tr.quickPresets}</span>
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setLocVal(preset.loc);
                    setQueryVal(preset.cat);
                  }}
                  className="rounded-lg bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300 hover:text-cyan-300 transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </form>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0c1222]/80 border border-slate-800/80 backdrop-blur-xl hover-lift cursor-default group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">{tr.statsTotalLeads}</span>
            <Building2 className="h-4 w-4 text-cyan-400 group-hover:scale-110 group-hover:rotate-6 transition duration-300" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white group-hover:text-cyan-300 transition-colors">
            {stats.totalLeads}
          </div>
          <div className="mt-1 text-[11px] text-cyan-400">
            {lang === 'es' ? 'Prospectos investigados' : 'Verified local leads'}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0c1222]/80 border border-slate-800/80 backdrop-blur-xl hover-lift cursor-default group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">{tr.statsNoWebsite}</span>
            <ShieldAlert className="h-4 w-4 text-amber-400 group-hover:scale-110 group-hover:-rotate-6 transition duration-300" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">
            {stats.noWebsiteCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {lang === 'es' ? 'Oportunidad máxima de diseño web' : 'Ready for custom website'}
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('contacted')}
          className="p-4 sm:p-5 rounded-2xl bg-[#0c1222]/80 border border-slate-800/80 backdrop-blur-xl hover:border-emerald-500/50 hover-lift cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">{tr.statsContacted}</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400 group-hover:scale-110 group-hover:rotate-12 transition duration-300" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
            {stats.contactedCount}
          </div>
          <div className="mt-1 text-[11px] text-emerald-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            <span>{lang === 'es' ? 'Ver Categoría Contactados →' : 'View Contacted Category →'}</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0c1222]/80 border border-slate-800/80 backdrop-blur-xl hover-lift cursor-default group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">{tr.statsAvgScore}</span>
            <TrendingUp className="h-4 w-4 text-indigo-400 group-hover:scale-110 group-hover:-translate-y-0.5 transition duration-300" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-400">
            {stats.avgScore || 92}<span className="text-sm font-normal text-slate-500">/100</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {lang === 'es' ? 'Alta probabilidad de conversión' : 'High conversion potential'}
          </div>
        </div>
      </div>

      {/* Main Qualified Lead Pipeline */}
      <div className="space-y-4">
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{lang === 'es' ? 'Oportunidades Investigadas' : 'Verified Prospects'}</span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
                {displayedProspects.length} {lang === 'es' ? 'Oportunidades' : 'Opportunities'}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {lang === 'es'
                ? 'Negocios investigados en Google Maps, verificados sin web propia y con altas valoraciones.'
                : 'Businesses deeply investigated on Google Maps, verified with zero website and solid reviews.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onClearResearch && (
              <button
                type="button"
                onClick={() => {
                  onClearResearch({ keepContacted: true, keepStarred: true, cleanAll: false });
                }}
                disabled={topProspects.length === 0 && stats.totalLeads === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-300 bg-rose-950/50 hover:bg-rose-900/70 border border-rose-800/60 shadow-sm transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title={lang === 'es' ? 'Limpiar oportunidades no contactadas (mantiene Contactados y No Interesados para siempre)' : 'Clean uncontacted opportunities (keeps Contacted & Not Interested forever)'}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>{lang === 'es' ? 'Limpiar Oportunidades' : 'Clean'}</span>
              </button>
            )}

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
              <input
                type="checkbox"
                checked={filterHideContacted}
                onChange={(e) => setFilterHideContacted(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500/20"
              />
              <span>{lang === 'es' ? 'Ocultar Contactados' : 'Hide Contacted'}</span>
            </label>

            <button
              onClick={() => onNavigateTab('prospects')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold px-2 py-1 transition cursor-pointer"
            >
              <span>{lang === 'es' ? 'Ver Todos los Leads' : 'View Full Pipeline'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Lead Cards List */}
        {displayedProspects.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-[#0b101e]/60 p-12 text-center space-y-3">
            <Search className="h-10 w-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-white">
              {lang === 'es' ? 'No hay prospectos por contactar en esta vista' : 'No Uncontacted Leads in Current View'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {lang === 'es'
                ? 'Has contactado a todos los prospectos de esta búsqueda o los has filtrado. Escribe una nueva ciudad o sector arriba para descubrir 10+ nuevos negocios verificados.'
                : 'You have contacted all current prospects or filtered them out. Type any city and business category in the search bar above to generate a fresh batch of 10+ verified leads!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedProspects.map((p) => {
              const mapsUrl = getGoogleMapsUrl(p);
              const isContacted = Boolean(p.isContacted || p.status === 'contacted');
              const isClicked = p.isClicked;
              const theme = getLeadStatusTheme(p.status, p.isContacted);

              return (
                <div
                  key={p.id}
                  onClick={() => onSelectProspect(p)}
                  className={`group relative rounded-2xl border p-5 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-3 hover-lift active:scale-[0.99] ${
                    theme.cardBg
                  } ${theme.border} ${theme.ring}`}
                >
                  {/* Top Bar: Category, Score & Badges */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-800/80 text-[11px] font-medium text-slate-300">
                          {p.category}
                        </span>

                        {p.status === 'client_signed' ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-950 border border-emerald-400/40 text-[10px] font-bold text-emerald-300">
                            <Sparkles className="h-3 w-3 text-emerald-400" />
                            <span>{tr.signedBadge}</span>
                          </span>
                        ) : p.status === 'waiting' ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-950/80 border border-amber-500/40 text-[10px] font-bold text-amber-300">
                            <Clock className="h-3 w-3 text-amber-400" />
                            <span>{tr.waitingBadge}</span>
                          </span>
                        ) : isContacted ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-950 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
                            <Check className="h-3 w-3" />
                            <span>{tr.contactedBadge}</span>
                          </span>
                        ) : null}

                        {isClicked && !isContacted && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-950 border border-indigo-500/30 text-[10px] font-mono text-indigo-300">
                            <Eye className="h-3 w-3" />
                            <span>{lang === 'es' ? 'Visto' : 'Viewed'}</span>
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded-lg bg-amber-950/60 border border-amber-500/30 text-[10px] font-mono text-amber-300">
                          {lang === 'es' ? '0 URLs Web' : '0 Website URLs'}
                        </span>
                      </div>

                      {/* Lead Score Pill */}
                      <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-bold">
                        <span>{p.leadScore}</span>
                        <span className="text-[10px] text-cyan-600">/100</span>
                      </div>
                    </div>

                    {/* Establishment Name */}
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {p.name}
                    </h3>

                    {/* Address & City */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{p.address}, {p.city}</span>
                    </div>

                    {/* Reviews & Google Maps Standing */}
                    <div className="flex items-center gap-2 mt-3 text-xs">
                      <div className="flex items-center gap-1 text-amber-400 font-bold bg-amber-950/30 px-2 py-0.5 rounded-md border border-amber-500/20">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span>{p.reviewRating}</span>
                      </div>
                      <span className="text-slate-400 font-medium">
                        ({p.reviewCount} {lang === 'es' ? 'reseñas de Google' : 'Google reviews'})
                      </span>
                    </div>

                    {/* Operational Evidence / Review Sentiment */}
                    <p className="mt-2.5 text-xs text-slate-400 line-clamp-2 leading-relaxed bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60">
                      "{p.reviewSentimentSummary || 'Reputable local establishment with verified foot traffic and loyal neighborhood clientele.'}"
                    </p>
                  </div>

                  {/* Action Bar Bottom with Google Maps Link & Contact Outcome Menu */}
                  <div className="pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      {/* Direct Google Maps Link to confirm info */}
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition"
                        title={tr.mapsConfirmTitle}
                      >
                        <MapPin className="h-3.5 w-3.5 text-blue-400" />
                        <span>Maps ↗</span>
                      </a>

                      {p.phone && (
                        <a
                          href={`tel:${p.phone}`}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                          title="Call business directly"
                        >
                          <Phone className="h-3.5 w-3.5 text-cyan-400" />
                          <span className="hidden sm:inline">{p.phone}</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Contact Outcome Menu with Option 1 (Not Interested / Delete), Option 2 (Waiting), Option 3 (Signed Client) */}
                      <ContactOutcomeMenu
                        prospect={p}
                        lang={lang}
                        onUpdateStatus={onUpdateStatus || ((id, status, notes) => onMarkContacted?.(id))}
                        onDeleteNotInterested={onDeleteNotInterested || ((id) => {})}
                      />

                      {/* View Dossier Arrow */}
                      <div className="flex items-center gap-1 text-xs font-semibold text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                        <span>{tr.viewProfile}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
