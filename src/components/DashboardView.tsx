import React from 'react';
import type { AppSettings, DailyJobRun, Prospect } from '../types/index.ts';
import {
  Compass,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Sparkles,
  MapPin,
  Phone,
  ShieldCheck,
  Zap,
  Globe,
  Radio,
  Clock,
  Play
} from 'lucide-react';

interface DashboardViewProps {
  stats: {
    totalLeads: number;
    noWebsiteCount: number;
    highPriorityCount: number;
    readyToContactCount: number;
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
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  topProspects,
  latestReport,
  settings,
  lang,
  onSelectProspect,
  onNavigateTab,
  onTriggerResearch,
  isResearchRunning
}) => {
  const potentialOneTimeRevenue = stats.noWebsiteCount * settings.baseWebsitePrice;
  const potentialMonthlyRecurring = stats.noWebsiteCount * settings.monthlyHostingPrice;

  return (
    <div className="space-y-6">
      {/* Top Banner / Territorial Status */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#0f172a] via-[#0b1120] to-[#1e1b4b] p-6 shadow-2xl">
        <div className="absolute top-0 right-0 h-96 w-96 translate-x-32 -translate-y-32 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-48 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>{lang === 'es' ? 'Radar Territorial Activo' : 'Territory Intelligence Active'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {lang === 'es'
                ? `Prospección en ${settings.cities.join(', ')} (${settings.region})`
                : `Prospecting in ${settings.cities.join(', ')} (${settings.region})`}
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              {lang === 'es'
                ? `Localizando negocios consolidados con valoraciones positivas (> ${settings.minRating}★) que carecen de sitio web oficial independiente o tienen webs rotas. Precios de referencia: €${settings.baseWebsitePrice} web + €${settings.monthlyHostingPrice}/mes alojamiento gestionado.`
                : `Identifying established local businesses with high customer satisfaction (> ${settings.minRating}★) that lack an official website or have broken sites. Target service: €${settings.baseWebsitePrice} bespoke site + €${settings.monthlyHostingPrice}/mo managed hosting.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onTriggerResearch}
              disabled={isResearchRunning}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition active:scale-95 disabled:opacity-60"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{lang === 'es' ? 'Ejecutar Búsqueda Diaria' : 'Run Daily Discovery'}</span>
            </button>
            <button
              onClick={() => onNavigateTab('prospects')}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
            >
              <span>{lang === 'es' ? 'Ver Todos los Prospectos' : 'View All Prospects'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Leads */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{lang === 'es' ? 'Total Negocios Investigados' : 'Total Investigated'}</span>
            <Compass className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{stats.totalLeads}</span>
            <span className="text-[11px] text-slate-400">{lang === 'es' ? 'en base de datos' : 'in database'}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {lang === 'es' ? 'Deduplicados y persistentes' : 'Deduplicated & persistent'}
          </div>
        </div>

        {/* No Website Opportunities */}
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-cyan-300">
            <span className="text-xs font-medium">{lang === 'es' ? 'Oportunidades Sin Web' : 'No-Website Leads'}</span>
            <AlertCircle className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-cyan-200">{stats.noWebsiteCount}</span>
            <span className="text-[11px] text-cyan-400 font-semibold">{lang === 'es' ? 'verificados' : 'verified'}</span>
          </div>
          <div className="mt-2 text-[11px] text-cyan-300/80">
            {lang === 'es' ? 'Mayor probabilidad de venta' : 'Highest conversion target'}
          </div>
        </div>

        {/* High Priority Leads */}
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-indigo-300">
            <span className="text-xs font-medium">{lang === 'es' ? 'Alta Prioridad (Score ≥ 70)' : 'High Priority (≥ 70)'}</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-200">{stats.highPriorityCount}</span>
            <span className="text-[11px] text-indigo-400 font-semibold">{lang === 'es' ? 'prospectos clave' : 'key prospects'}</span>
          </div>
          <div className="mt-2 text-[11px] text-indigo-300/80">
            {lang === 'es' ? 'Brief y prompt listos' : 'Briefs & prompts ready'}
          </div>
        </div>

        {/* Avg Lead Score */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{lang === 'es' ? 'Puntuación Media' : 'Average Lead Score'}</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-300">{stats.avgScore}</span>
            <span className="text-[11px] text-slate-400">/ 100</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {lang === 'es' ? 'Algoritmo de 6 factores' : '6-factor explainable model'}
          </div>
        </div>

        {/* Revenue Pipeline Potential */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-amber-300">
            <span className="text-xs font-medium">{lang === 'es' ? 'Pipeline de Ingresos' : 'Revenue Pipeline'}</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-200">€{potentialOneTimeRevenue.toLocaleString()}</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-300/80">
            +€{potentialMonthlyRecurring.toLocaleString()}/mo {lang === 'es' ? 'en hosting recurrente' : 'recurring hosting'}
          </div>
        </div>
      </div>

      {/* Main Grid: Top 5 Prospects & Radar Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Top Qualified Prospects */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="text-base font-bold text-white">
                {lang === 'es' ? 'Principales Clientes Potenciales Detectados' : 'Top High-Potential Leads Today'}
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('prospects')}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1"
            >
              <span>{lang === 'es' ? 'Ver todos' : 'View all'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {topProspects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-400">
                <Compass className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-300">
                  {lang === 'es' ? 'No hay clientes registrados todavía' : 'No prospects discovered yet'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'es'
                    ? 'Haz clic en "Buscar Ahora" para lanzar la primera investigación autónoma en tu ciudad.'
                    : 'Click "Run Daily Discovery" to start prospecting businesses in your target city.'}
                </p>
              </div>
            ) : (
              topProspects.map((prospect) => (
                <div
                  key={prospect.id}
                  onClick={() => onSelectProspect(prospect)}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 transition-all hover:border-cyan-500/50 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-cyan-950/20"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white group-hover:text-cyan-300 transition truncate">
                          {prospect.name}
                        </span>
                        <span className="shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                          {prospect.category}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span className="truncate">{prospect.address}, {prospect.city}</span>
                        </span>
                        {prospect.phone && (
                          <span className="flex items-center gap-1 text-slate-300">
                            <Phone className="w-3 h-3 text-cyan-400" />
                            <span>{prospect.phone}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-amber-400 font-medium">
                          ★ {prospect.reviewRating.toFixed(1)} ({prospect.reviewCount})
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-1 italic">
                        "{prospect.reviewSentimentSummary}"
                      </p>
                    </div>

                    {/* Lead Score Indicator */}
                    <div className="flex flex-col items-end shrink-0 gap-1.5">
                      <div
                        className={`flex items-center gap-1 rounded-xl px-3 py-1 font-extrabold text-sm shadow-md ${
                          prospect.leadScore >= 85
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : prospect.leadScore >= 70
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>{prospect.leadScore}</span>
                        <span className="text-[10px] opacity-70">/100</span>
                      </div>

                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider ${
                          prospect.websiteStatus === 'no_website'
                            ? 'text-cyan-400'
                            : prospect.websiteStatus === 'website_broken'
                            ? 'text-red-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {prospect.websiteStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                    <span className="text-[11px] text-cyan-400 font-medium truncate max-w-[80%]">
                      {prospect.recommendedAction}
                    </span>
                    <span className="text-[11px] text-slate-500 group-hover:text-slate-300 transition flex items-center gap-1">
                      {lang === 'es' ? 'Ver Brief' : 'View Brief'} &rarr;
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Latest Autonomous Job & Territory Info */}
        <div className="space-y-6">
          {/* Latest Daily Job Report Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  {lang === 'es' ? 'Último Informe Autónomo' : 'Latest Daily Report'}
                </h3>
              </div>
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                {latestReport?.status?.toUpperCase() || 'IDLE'}
              </span>
            </div>

            {latestReport ? (
              <div className="space-y-3 text-xs text-slate-300">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-xl bg-slate-950/60 p-2.5 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">{lang === 'es' ? 'Descubiertos' : 'Discovered'}</span>
                    <span className="text-base font-bold text-white">{latestReport.businessesDiscovered}</span>
                  </div>
                  <div className="rounded-xl bg-slate-950/60 p-2.5 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">{lang === 'es' ? 'Calificados' : 'Qualified Leads'}</span>
                    <span className="text-base font-bold text-cyan-400">{latestReport.qualifiedLeads}</span>
                  </div>
                </div>

                <div className="space-y-1 text-slate-400">
                  <p className="flex justify-between">
                    <span>{lang === 'es' ? 'Webs Verificadas:' : 'Websites Verified:'}</span>
                    <span className="text-white font-medium">{latestReport.websitesVerified}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>{lang === 'es' ? 'Duplicados Suprimidos:' : 'Duplicates Filtered:'}</span>
                    <span className="text-white font-medium">{latestReport.duplicatesRemoved}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>{lang === 'es' ? 'Coste de Investigación:' : 'Research Cost:'}</span>
                    <span className="text-emerald-400 font-medium">€{latestReport.apiUsage.estimatedCostEur.toFixed(2)}</span>
                  </p>
                </div>

                <button
                  onClick={() => onNavigateTab('reports')}
                  className="w-full mt-2 rounded-xl border border-slate-700 bg-slate-800/80 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                >
                  {lang === 'es' ? 'Leer Informe Completo' : 'Read Full Executive Report'}
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">
                {lang === 'es' ? 'Aún no se ha completado ninguna ejecución programada.' : 'No scheduled execution completed yet.'}
              </p>
            )}
          </div>

          {/* Autonomous Server Guarantee Box */}
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-5 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                {lang === 'es' ? 'Ejecución Autónoma en Servidor' : 'Server-Authoritative Execution'}
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {lang === 'es'
                ? 'El motor de prospección LeadHunter AI se ejecuta en el backend mediante un cron job programado. Tus búsquedas e investigaciones diarias continúan incluso si cierras esta ventana de escritorio.'
                : 'LeadHunter AI executes scheduled daily jobs directly on the backend server. Your prospecting pipeline continues autonomously even when your desktop window is closed.'}
            </p>
            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-indigo-900/40">
              <span>{lang === 'es' ? 'Próxima búsqueda:' : 'Next run:'}</span>
              <span className="text-indigo-300 font-mono font-medium">
                {settings.dailyScheduleTime} ({settings.timezone})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
