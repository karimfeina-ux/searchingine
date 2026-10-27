import React from 'react';
import { PWAInstallButton } from './PWAInstallButton.tsx';
import {
  Compass,
  Database,
  FileText,
  Clock,
  Cpu,
  Settings,
  Play,
  Loader2,
  Search,
  Moon,
  Sun,
  Globe,
  Radio
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  lang: 'en' | 'es';
  onToggleLang: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  isResearchRunning: boolean;
  onTriggerResearch: () => void;
  schedulerActive: boolean;
  nextRunTime?: string | null;
  onOpenQuickSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  lang,
  onToggleLang,
  theme,
  onToggleTheme,
  isResearchRunning,
  onTriggerResearch,
  schedulerActive,
  nextRunTime,
  onOpenQuickSearch
}) => {
  const tabs = [
    { id: 'dashboard', label: lang === 'es' ? 'Radar y Métricas' : 'Dashboard & Radar', icon: Compass },
    { id: 'prospects', label: lang === 'es' ? 'Pipeline de Clientes' : 'Leads Pipeline', icon: Database },
    { id: 'reports', label: lang === 'es' ? 'Informes Diarios' : 'Daily Reports', icon: FileText },
    { id: 'scheduler', label: lang === 'es' ? 'Programador Autónomo' : 'Server Scheduler', icon: Clock },
    { id: 'providers', label: lang === 'es' ? 'Proveedores y Costes' : 'Providers & Costs', icon: Cpu },
    { id: 'settings', label: lang === 'es' ? 'Configuración' : 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0b1120]/90 backdrop-blur-xl transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand identity */}
        <div className="flex items-center gap-6">
          <div
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                <Radio className="h-5 w-5 text-cyan-400 group-hover:rotate-12 transition duration-300" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-white group-hover:text-cyan-400 transition">
                  LEADHUNTER<span className="text-cyan-400">.AI</span>
                </span>
                <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-cyan-400 border border-cyan-500/20">
                  DESKTOP
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {lang === 'es' ? 'Prospección Autónoma para Creadores Web' : 'Autonomous Prospecting for Web Creators'}
              </p>
            </div>
          </div>

          {/* Scheduler status badge */}
          <div className="hidden lg:flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-[11px]">
            <span
              className={`h-2 w-2 rounded-full ${
                isResearchRunning
                  ? 'bg-amber-400 animate-ping'
                  : schedulerActive
                  ? 'bg-emerald-400'
                  : 'bg-slate-500'
              }`}
            />
            <span className="text-slate-300 font-medium">
              {isResearchRunning
                ? lang === 'es' ? 'Investigando...' : 'Researching now...'
                : schedulerActive
                ? `${lang === 'es' ? 'Servidor activo' : 'Autonomous active'}`
                : lang === 'es' ? 'Pausado' : 'Scheduler paused'}
            </span>
            {nextRunTime && !isResearchRunning && (
              <span className="text-slate-500 text-[10px]">
                ({new Date(nextRunTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
              </span>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick search shortcut button */}
          <button
            onClick={onOpenQuickSearch}
            className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-xs text-slate-400 hover:border-slate-700 hover:text-slate-200 transition"
            title="Search (Ctrl+K / Cmd+K)"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">{lang === 'es' ? 'Buscar...' : 'Quick search...'}</span>
            <kbd className="hidden sm:inline rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
              ⌘K
            </kbd>
          </button>

          {/* Run Now Trigger Button */}
          <button
            onClick={onTriggerResearch}
            disabled={isResearchRunning}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition active:scale-95 ${
              isResearchRunning
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-950/40'
            }`}
            title="Run autonomous research pipeline now"
          >
            {isResearchRunning ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                <span className="hidden sm:inline">{lang === 'es' ? 'Buscando...' : 'Searching...'}</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{lang === 'es' ? 'Buscar Ahora' : 'Run Now'}</span>
              </>
            )}
          </button>

          {/* Desktop PWA Install Button */}
          <PWAInstallButton lang={lang} />

          {/* Language Toggle */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            title="Switch Language (English / Español)"
          >
            <Globe className="h-3.5 w-3.5 text-cyan-400" />
            <span>{lang.toUpperCase()}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-slate-300 hover:bg-slate-800 transition"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Mobile subnav */}
      <div className="flex md:hidden overflow-x-auto border-t border-slate-800/60 px-4 py-2 gap-2 bg-slate-950/40">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
