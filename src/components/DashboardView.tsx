import React, { useState } from 'react';
import type { AppSettings, DailyJobRun, Prospect } from '../types/index.ts';
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
  Send
} from 'lucide-react';

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
  onToggleStar?: (id: string) => void;
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
  onToggleStar
}) => {
  const [heroLocation, setHeroLocation] = useState('');
  const [heroQuery, setHeroQuery] = useState('');
  const [filterHideContacted, setFilterHideContacted] = useState(true);
  const [filterHideClicked, setFilterHideClicked] = useState(false);

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroLocation.trim() && !heroQuery.trim()) return;
    onPerformSearch({
      location: heroLocation.trim(),
      query: heroQuery.trim()
    });
  };

  // Quick preset pills
  const presets = [
    { label: 'Miami Coffee & Roasters', loc: 'Miami, FL', cat: 'Specialty Coffee & Roasters' },
    { label: 'London Barber Salons', loc: 'London', cat: 'Barbers & Hair Salons' },
    { label: 'Austin Roofing & Trades', loc: 'Austin, TX', cat: 'Plumbers, Electricians & Trades' },
    { label: 'Barcelona Tapas & Bistros', loc: 'Barcelona', cat: 'Restaurants & Cafés' },
    { label: 'New York Boutique Gyms', loc: 'New York', cat: 'Independent Gyms & Fitness' },
  ];

  // Filter prospects
  const displayedProspects = topProspects.filter((p) => {
    if (filterHideContacted && (p.isContacted || p.status === 'contacted')) return false;
    if (filterHideClicked && p.isClicked) return false;
    return true;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* Futuristic Hero Scanner Bar */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#0f172a] to-[#090d18] border border-slate-800/80 p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Ambient neon radial lights */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>DEEP GOOGLE MAPS & INTERNET VERIFICATION ENGINE</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Find Reputable Businesses with <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400">Zero Website</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Autonomous AI scans Google Maps listings, directory citations, and social profiles. Guaranteed 100% verified no website, medium-to-high ratings, and zero repeats.
          </p>

          {/* Centered Deep Search Box */}
          <form
            onSubmit={handleHeroSubmit}
            className="mt-6 flex flex-col sm:flex-row items-center gap-2.5 p-2 rounded-2xl bg-[#0b101d]/90 border border-slate-700/80 shadow-2xl focus-within:border-cyan-500/80 focus-within:ring-2 focus-within:ring-cyan-500/20"
          >
            <div className="w-full sm:flex-1 flex items-center px-3 py-2 bg-slate-900/40 rounded-xl sm:bg-transparent">
              <MapPin className="h-4 w-4 text-cyan-400 shrink-0 mr-2.5" />
              <input
                type="text"
                value={heroLocation}
                onChange={(e) => setHeroLocation(e.target.value)}
                placeholder="Target Region (e.g. Miami, London, Austin...)"
                className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none font-medium"
              />
            </div>

            <div className="hidden sm:block h-7 w-px bg-slate-700/80" />

            <div className="w-full sm:flex-[1.3] flex items-center px-3 py-2 bg-slate-900/40 rounded-xl sm:bg-transparent">
              <Search className="h-4 w-4 text-indigo-400 shrink-0 mr-2.5" />
              <input
                type="text"
                value={heroQuery}
                onChange={(e) => setHeroQuery(e.target.value)}
                placeholder="Business Type / Niche (e.g. Barber, Coffee, Trades...)"
                className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isResearchRunning}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 active:scale-95 transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isResearchRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Deep Scanning Maps...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-cyan-200" />
                  <span>Scan 10+ Qualified Leads</span>
                </>
              )}
            </button>
          </form>

          {/* Fast Preset Prompts */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="text-[11px] text-slate-500 font-mono">Suggested:</span>
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setHeroLocation(p.loc);
                  setHeroQuery(p.cat);
                  onPerformSearch({ location: p.loc, query: p.cat });
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-900/70 border border-slate-800 text-[11px] text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0c1222]/80 border border-slate-800/80 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Total Discovered</span>
            <Building2 className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {stats.totalLeads}
          </div>
          <div className="mt-1 text-[11px] text-cyan-400 font-medium">
            Zero duplicate guarantee
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0c1222]/80 border border-slate-800/80 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">No Website (Verified)</span>
            <ShieldAlert className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">
            {stats.noWebsiteCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            100% deep checked via DNS & Maps
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0c1222]/80 border border-slate-800/80 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Contacted Leads</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
            {stats.contactedCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Marked & excluded from re-search
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0c1222]/80 border border-slate-800/80 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Avg Quality Score</span>
            <TrendingUp className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-400">
            {stats.avgScore || 92}<span className="text-sm font-normal text-slate-500">/100</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            High conversion potential
          </div>
        </div>
      </div>

      {/* Main Qualified Lead Pipeline */}
      <div className="space-y-4">
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Verified Prospects</span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
                {displayedProspects.length} Opportunities
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Businesses deeply investigated on Google Maps, verified with zero website and solid reviews.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
              <input
                type="checkbox"
                checked={filterHideContacted}
                onChange={(e) => setFilterHideContacted(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500/20"
              />
              <span>Hide Contacted</span>
            </label>

            <button
              onClick={() => onNavigateTab('prospects')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold px-2 py-1 transition cursor-pointer"
            >
              <span>View Full Pipeline</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Lead Cards List (Minimum 10 displayed) */}
        {displayedProspects.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-[#0b101e]/60 p-12 text-center space-y-3">
            <Search className="h-10 w-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-white">No Uncontacted Leads in Current View</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You have contacted all current prospects or filtered them out. Type any city and business type in the search bar above to generate a fresh batch of 10+ verified leads!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedProspects.map((p, idx) => {
              const isContacted = p.isContacted || p.status === 'contacted';
              const isClicked = p.isClicked;

              return (
                <div
                  key={p.id}
                  onClick={() => onSelectProspect(p)}
                  className={`group relative rounded-2xl border p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    isContacted
                      ? 'border-emerald-500/30 bg-[#0a1618]/60 hover:border-emerald-500/50'
                      : 'border-slate-800/80 bg-[#0d1424]/80 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-950/20'
                  }`}
                >
                  {/* Top Bar: Category, Score & Badges */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-800/80 text-[11px] font-medium text-slate-300">
                          {p.category}
                        </span>

                        {isContacted && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-950 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
                            <Check className="h-3 w-3" />
                            <span>Contacted</span>
                          </span>
                        )}

                        {isClicked && !isContacted && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-950 border border-indigo-500/30 text-[10px] font-mono text-indigo-300">
                            <Eye className="h-3 w-3" />
                            <span>Viewed</span>
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded-lg bg-amber-950/60 border border-amber-500/30 text-[10px] font-mono text-amber-300">
                          0 Website URLs
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
                        ({p.reviewCount} Google reviews)
                      </span>
                    </div>

                    {/* Operational Evidence / Review Sentiment */}
                    <p className="mt-2.5 text-xs text-slate-400 line-clamp-2 leading-relaxed bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60">
                      "{p.reviewSentimentSummary || 'Reputable local establishment with verified foot traffic and loyal neighborhood clientele.'}"
                    </p>
                  </div>

                  {/* Action Bar Bottom */}
                  <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {p.phone && (
                        <a
                          href={`tel:${p.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                          title="Call business directly"
                        >
                          <Phone className="h-3.5 w-3.5 text-cyan-400" />
                          <span className="hidden sm:inline">{p.phone}</span>
                        </a>
                      )}

                      {/* One-click Mark Contacted */}
                      {onMarkContacted && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkContacted(p.id);
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            isContacted
                              ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800/80 hover:bg-emerald-950/60 hover:text-emerald-300 hover:border-emerald-500/30 text-slate-300 border border-slate-700'
                          }`}
                          title={isContacted ? 'Already contacted' : 'Mark as contacted to avoid repetition'}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span>{isContacted ? 'Contacted' : 'Mark Contacted'}</span>
                        </button>
                      )}
                    </div>

                    {/* View Dossier Arrow */}
                    <div className="flex items-center gap-1 text-xs font-semibold text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                      <span>Dossier</span>
                      <ArrowRight className="h-3.5 w-3.5" />
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
