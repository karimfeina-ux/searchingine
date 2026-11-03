import React, { useState } from 'react';
import {
  Compass,
  Database,
  CheckCircle2,
  Star,
  FileText,
  Settings,
  Search,
  MapPin,
  Sparkles,
  Loader2,
  Globe,
  LogOut,
  SlidersHorizontal,
  ChevronRight,
  Cloud,
  RefreshCw
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  lang: 'en' | 'es';
  onToggleLang: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onPerformSearch: (searchData: { location: string; query: string }) => void;
  isSearching: boolean;
  userEmail?: string;
  onLogout: () => void;
  totalLeadsCount?: number;
  contactedCount?: number;
  onOpenDeployModal?: () => void;
  syncStatus?: 'connected' | 'reconnecting' | 'offline';
  lastSyncedAt?: Date;
  onTriggerSync?: () => void;
  isSyncing?: boolean;
  searchLocation?: string;
  onSearchLocationChange?: (val: string) => void;
  searchQuery?: string;
  onSearchQueryChange?: (val: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  lang,
  onToggleLang,
  theme,
  onToggleTheme,
  onPerformSearch,
  isSearching,
  userEmail = 'karimmazo33@gmail.com',
  onLogout,
  totalLeadsCount = 0,
  contactedCount = 0,
  onOpenDeployModal,
  syncStatus = 'connected',
  lastSyncedAt,
  onTriggerSync,
  isSyncing = false,
  searchLocation,
  onSearchLocationChange,
  searchQuery,
  onSearchQueryChange
}) => {
  const [locationInput, setLocationInput] = useState(() => '');
  const [keywordInput, setKeywordInput] = useState(() => '');
  const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(false);

  const locVal = searchLocation !== undefined ? searchLocation : locationInput;
  const setLocVal = onSearchLocationChange || setLocationInput;
  const queryVal = searchQuery !== undefined ? searchQuery : keywordInput;
  const setQueryVal = onSearchQueryChange || setKeywordInput;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const loc = locVal.trim() || 'Madrid';
    const q = queryVal.trim() || 'peluquería';
    onPerformSearch({
      location: loc,
      query: q
    });
    setIsMobileSearchExpanded(false);
  };

  const tabs = [
    { id: 'dashboard', label: lang === 'es' ? 'Descubrimiento AI' : 'AI Discover', icon: Compass },
    { id: 'map', label: lang === 'es' ? 'Mapa Google' : 'Google Map', icon: MapPin },
    { id: 'prospects', label: lang === 'es' ? 'Todos los Clientes' : 'All Leads', icon: Database, badge: totalLeadsCount },
    { id: 'contacted', label: lang === 'es' ? 'Contactados' : 'Contacted', icon: CheckCircle2, badge: contactedCount },
    { id: 'reports', label: lang === 'es' ? 'Informes' : 'Reports', icon: FileText },
    { id: 'settings', label: lang === 'es' ? 'Configuración' : 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090d18]/95 backdrop-blur-2xl transition-all">
      {/* Primary Top Bar */}
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <div className="flex h-16 sm:h-20 items-center justify-between gap-2 sm:gap-6">
          
          {/* Brand - Left */}
          <div
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer shrink-0 select-none group"
          >
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-cyan-400 p-0.5 shadow-md shadow-cyan-500/30 group-hover:shadow-cyan-400/50 transition animate-float">
              <div className="h-full w-full rounded-[10px] bg-[#090d18] flex items-center justify-center">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400 group-hover:scale-125 group-hover:rotate-12 transition duration-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                  LEADHUNTER<span className="text-cyan-400">.AI</span>
                </span>
                <span className="hidden sm:inline-block rounded-md bg-cyan-950/80 border border-cyan-500/30 px-1.5 py-0.5 text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
                  PRO
                </span>
              </div>
              <p className="hidden md:block text-[10px] text-slate-400 font-medium">
                Deep Maps & Web Prospecting
              </p>
            </div>
          </div>

          {/* Centered Clean Futuristic Search Bar - Desktop & Tablet */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-auto justify-center px-2">
            <form
              onSubmit={handleSearchSubmit}
              className="w-full flex items-center rounded-2xl bg-[#080d19]/90 border border-cyan-500/30 p-1.5 shadow-[0_0_20px_rgba(6,182,212,0.12)] backdrop-blur-2xl focus-within:border-cyan-400/80 focus-within:shadow-[0_0_25px_rgba(6,182,212,0.25)] transition-all duration-300"
            >
              {/* Location Input */}
              <div className="flex-1 flex items-center min-w-0 px-3 py-1.5 rounded-xl bg-slate-900/40 border border-transparent hover:border-cyan-500/30 focus-within:border-cyan-400/70 focus-within:bg-cyan-950/20 focus-within:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all duration-300 group">
                <MapPin className="h-4 w-4 text-cyan-400 shrink-0 mr-2 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)] group-focus-within:scale-110 transition-transform" />
                <input
                  type="text"
                  value={locVal}
                  onChange={(e) => setLocVal(e.target.value)}
                  placeholder={lang === 'es' ? 'Región / Ciudad (ej. Miami, Valencia...)' : 'Region / City (e.g. Miami, London, Austin...)'}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder:text-slate-500/90 outline-none truncate font-medium tracking-wide"
                />
              </div>

              {/* Minimal Divider */}
              <div className="h-6 w-px bg-cyan-500/20 mx-1 shrink-0 shadow-[0_0_8px_rgba(6,182,212,0.2)]" />

              {/* Business Type / Keyword Input */}
              <div className="flex-[1.2] flex items-center min-w-0 px-3 py-1.5 rounded-xl bg-slate-900/40 border border-transparent hover:border-indigo-500/30 focus-within:border-indigo-400/70 focus-within:bg-indigo-950/20 focus-within:shadow-[0_0_15px_rgba(99,102,241,0.25)] transition-all duration-300 group">
                <Search className="h-4 w-4 text-indigo-400 shrink-0 mr-2 drop-shadow-[0_0_6px_rgba(99,102,241,0.6)] group-focus-within:scale-110 transition-transform" />
                <input
                  type="text"
                  value={queryVal}
                  onChange={(e) => setQueryVal(e.target.value)}
                  placeholder={lang === 'es' ? 'Tipo de negocio (ej. Barbería, Café, Dentista...)' : 'Niche / Keyword (e.g. Barber, Coffee, Trades, Clinic...)'}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder:text-slate-500/90 outline-none truncate font-medium tracking-wide"
                />
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isSearching}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 active:scale-95 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer hover-glow animate-gradient-shift"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                    <span className="hidden lg:inline">{lang === 'es' ? 'Buscando...' : 'Deep Scanning...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-cyan-200" />
                    <span>{lang === 'es' ? 'Buscar 10+' : 'AI Deep Hunt'}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Controls: User Profile & Minimal Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Mobile search toggle button */}
            <button
              onClick={() => setIsMobileSearchExpanded(!isMobileSearchExpanded)}
              className="md:hidden flex items-center justify-center h-9 w-9 rounded-xl border border-slate-800 bg-[#0e1526] text-cyan-400"
              aria-label="Toggle search bar"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Cloudflare & GitHub Deploy Button */}
            {onOpenDeployModal && (
              <button
                onClick={onOpenDeployModal}
                className="flex items-center gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/60 to-indigo-950/60 hover:from-cyan-900/60 hover:to-indigo-900/60 text-cyan-300 text-xs font-semibold shadow-sm shadow-cyan-500/20 active:scale-95 transition cursor-pointer"
                title="GitHub & Cloudflare Pages Deploy Hub"
              >
                <Cloud className="h-3.5 w-3.5 text-cyan-400" />
                <span className="hidden sm:inline">{lang === 'es' ? 'Desplegar Cloudflare' : 'Deploy Cloudflare'}</span>
              </button>
            )}

            {/* Automatic Cloud Sync Status Indicator */}
            <div
              className={`flex items-center gap-1.5 h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl border text-xs select-none ${
                syncStatus === 'connected'
                  ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300'
                  : syncStatus === 'reconnecting'
                  ? 'border-amber-500/30 bg-amber-950/40 text-amber-300'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400'
              }`}
              title="Automatically synced with https://searchingine.pages.dev/"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  syncStatus === 'connected'
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse'
                    : syncStatus === 'reconnecting'
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-slate-500'
                }`}
              />
              <span className="hidden sm:inline text-[11px] font-semibold">
                searchingine.pages.dev
              </span>
            </div>

            {/* Admin User Chip */}
            <div className="hidden lg:flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-slate-300 truncate max-w-[140px] text-[11px]" title={userEmail}>
                {userEmail}
              </span>
            </div>

            {/* Language switch */}
            <button
              onClick={onToggleLang}
              className="flex items-center gap-1 h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl border border-slate-800 bg-slate-900/50 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
              title="Toggle Language"
            >
              <Globe className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-[11px] font-mono">{lang.toUpperCase()}</span>
            </button>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl border border-red-500/20 bg-red-950/20 hover:bg-red-950/40 text-red-300 text-xs font-medium transition cursor-pointer"
              title="Lock Session / Exit"
            >
              <LogOut className="h-3.5 w-3.5 text-red-400" />
              <span className="hidden sm:inline">{lang === 'es' ? 'Salir' : 'Lock'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Search Expandable Bar */}
        {isMobileSearchExpanded && (
          <form
            onSubmit={handleSearchSubmit}
            className="md:hidden pt-2 pb-3.5 flex flex-col gap-2.5 animate-in slide-in-from-top-2 duration-200"
          >
            <div className="flex items-center rounded-2xl bg-[#080d19]/95 border border-cyan-500/40 px-3.5 py-3 shadow-[0_0_15px_rgba(6,182,212,0.15)] focus-within:border-cyan-400 focus-within:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all">
              <MapPin className="h-4 w-4 text-cyan-400 shrink-0 mr-2.5 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
              <input
                type="text"
                value={locVal}
                onChange={(e) => setLocVal(e.target.value)}
                placeholder={lang === 'es' ? 'Región / Ciudad (ej. Miami, Valencia...)' : 'Region / City (e.g. Miami, London, Austin...)'}
                className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500/80 outline-none font-medium"
              />
            </div>
            <div className="flex items-center rounded-2xl bg-[#080d19]/95 border border-indigo-500/40 px-3.5 py-3 shadow-[0_0_15px_rgba(99,102,241,0.15)] focus-within:border-indigo-400 focus-within:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all">
              <Search className="h-4 w-4 text-indigo-400 shrink-0 mr-2.5 drop-shadow-[0_0_6px_rgba(99,102,241,0.6)]" />
              <input
                type="text"
                value={queryVal}
                onChange={(e) => setQueryVal(e.target.value)}
                placeholder={lang === 'es' ? 'Tipo de negocio (ej. Barbería, Café...)' : 'Niche / Keyword (e.g. Barber, Coffee...)'}
                className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500/80 outline-none font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="w-full h-11 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 shadow-[0_0_20px_rgba(6,182,212,0.35)] active:scale-95 transition-all cursor-pointer"
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-cyan-200" />}
              <span>{lang === 'es' ? 'Escanear 10+ Negocios Sin Web' : 'Deep Hunt 10+ Verified Leads'}</span>
            </button>
          </form>
        )}
      </div>

      {/* Clean Secondary Navigation Tabs */}
      <div className="border-t border-slate-800/60 bg-slate-950/40">
        <div className="mx-auto max-w-7xl px-3 sm:px-6">
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              const isContactedTab = tab.id === 'contacted';
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-xl px-3 py-1.5 text-xs font-medium transition cursor-pointer select-none ${
                    isActive
                      ? isContactedTab
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-950/60 ring-1 ring-emerald-500/20'
                        : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-950'
                      : isContactedTab
                      ? 'text-emerald-300/90 hover:text-emerald-200 hover:bg-emerald-950/30 border border-emerald-500/20 bg-emerald-950/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isContactedTab ? 'text-emerald-400' : ''}`} />
                  <span>{tab.label}</span>
                  {typeof tab.badge === 'number' && tab.badge > 0 && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        isContactedTab
                          ? 'bg-emerald-400 text-slate-950 font-bold shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                          : isActive
                          ? 'bg-cyan-400 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
