import React, { useState } from 'react';
import type { Prospect, LeadStatus } from '../types/index.ts';
import { getGoogleMapsUrl } from '../utils/maps.ts';
import { getLeadStatusTheme } from '../utils/statusTheme.ts';
import { ContactOutcomeMenu } from './ContactOutcomeMenu.tsx';
import { isQualifiedProspect } from '../services/clientDataEngine.ts';
import {
  CheckCircle2,
  Clock,
  Award,
  Trash2,
  Search,
  Filter,
  Phone,
  MapPin,
  ExternalLink,
  Star,
  Copy,
  Check,
  Zap,
  LayoutGrid,
  Table as TableIcon,
  Compass,
  ArrowRight,
  TrendingUp,
  DollarSign,
  AlertCircle,
  FileText,
  UserCheck
} from 'lucide-react';

interface ContactedListViewProps {
  prospects: Prospect[];
  lang: 'en' | 'es';
  onSelectProspect: (prospect: Prospect) => void;
  onUpdateStatus: (id: string, status: LeadStatus, notes?: string) => void;
  onDeleteNotInterested: (id: string) => void;
  onToggleStar: (id: string) => void;
  onNavigateToDiscovery?: () => void;
}

export const ContactedListView: React.FC<ContactedListViewProps> = ({
  prospects,
  lang,
  onSelectProspect,
  onUpdateStatus,
  onDeleteNotInterested,
  onToggleStar,
  onNavigateToDiscovery
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'waiting' | 'signed' | 'contacted' | 'refused'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter only prospects that have been contacted or progressed AND strictly have NO website and have phone
  const contactedPool = prospects.filter((p) => {
    if (!isQualifiedProspect(p)) return false;
    return Boolean(
      p.isContacted ||
      p.status === 'contacted' ||
      p.status === 'waiting' ||
      p.status === 'client_signed' ||
      p.status === 'not_interested'
    );
  });

  // Calculate status metric breakdown
  const waitingLeads = contactedPool.filter((p) => p.status === 'waiting');
  const signedLeads = contactedPool.filter((p) => p.status === 'client_signed');
  const outreachLeads = contactedPool.filter((p) => p.status === 'contacted' || (!p.status && p.isContacted));
  const refusedLeads = contactedPool.filter((p) => p.status === 'not_interested');

  const estimatedRevenue = signedLeads.length * 500;

  // Filter based on active subtab & search
  const filtered = contactedPool.filter((p) => {
    if (filterType === 'waiting' && p.status !== 'waiting') return false;
    if (filterType === 'signed' && p.status !== 'client_signed') return false;
    if (filterType === 'contacted' && p.status !== 'contacted' && p.status !== 'ready_to_contact' && p.status !== 'high_priority') {
      if (p.status === 'waiting' || p.status === 'client_signed' || p.status === 'not_interested') return false;
    }
    if (filterType === 'refused' && p.status !== 'not_interested') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchAddress = (p.address || '').toLowerCase().includes(q);
      const matchCity = (p.city || '').toLowerCase().includes(q);
      const matchCategory = (p.category || '').toLowerCase().includes(q);
      const matchPhone = (p.phone || '').includes(q);
      const matchNotes = (p.notes || '').toLowerCase().includes(q);
      return matchName || matchAddress || matchCity || matchCategory || matchPhone || matchNotes;
    }
    return true;
  });

  const handleCopyPrompt = (e: React.MouseEvent, p: Prospect) => {
    e.stopPropagation();
    if (p.brief?.aiStudioPrompt) {
      navigator.clipboard.writeText(p.brief.aiStudioPrompt);
      setCopiedId(p.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Landing Page Header */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-[#0b1924] via-[#09131e] to-[#080d16] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none animate-float-slow animate-glow-pulse" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none animate-float-reverse animate-glow-pulse" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-300 shadow-sm">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>{lang === 'es' ? 'Gestor de Negociaciones y Clientes' : 'Contacted Deals & Client Pipeline'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {lang === 'es' ? 'Lista de Negocios Contactados' : 'Contacted Pipeline Hub'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {lang === 'es'
                ? 'Todos los negocios que has contactado se almacenan aquí de forma permanente. Controla qué clientes están esperando respuesta o pago, cuáles ya han firmado contrato y cuáles han sido descartados.'
                : 'Every business you reach out to is pushed and tracked here. Manage active negotiations, pending responses or payments, and celebrate closed client contracts.'}
            </p>
          </div>

          {/* Quick Action to return to discovery if needed */}
          {onNavigateToDiscovery && (
            <button
              onClick={onNavigateToDiscovery}
              className="inline-flex items-center gap-2 self-start lg:self-center px-4 py-2.5 rounded-2xl bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold shadow-lg transition cursor-pointer"
            >
              <Compass className="h-4 w-4 text-cyan-400" />
              <span>{lang === 'es' ? 'Buscar Más Prospectos Sin Web' : 'Discover More Uncontacted Leads'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Live Pipeline Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800/80">
          {/* Card 1: Total Contacted */}
          <div
            onClick={() => setFilterType('all')}
            className={`p-4 rounded-2xl border transition-all duration-300 hover-lift cursor-pointer ${
              filterType === 'all'
                ? 'bg-cyan-950/40 border-cyan-500/60 ring-1 ring-cyan-500/30'
                : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>{lang === 'es' ? 'Total Contactados' : 'Total In Pipeline'}</span>
              <CheckCircle2 className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">{contactedPool.length}</div>
            <div className="text-[10px] text-cyan-400 mt-1">{lang === 'es' ? 'Prospectos procesados' : 'Active deals'}</div>
          </div>

          {/* Card 2: Waiting for Response / Payment (Amber) */}
          <div
            onClick={() => setFilterType('waiting')}
            className={`p-4 rounded-2xl border transition-all duration-300 hover-lift cursor-pointer ${
              filterType === 'waiting'
                ? 'bg-amber-950/40 border-amber-500/60 ring-2 ring-amber-500/40'
                : 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-amber-300 font-semibold mb-1">
              <span>{lang === 'es' ? '⏳ Esperando Pago / Resp.' : '⏳ Waiting Response/Pay'}</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-300">{waitingLeads.length}</div>
            <div className="text-[10px] text-amber-400/80 mt-1">
              {lang === 'es' ? 'Respuesta o factura pendiente' : 'Pending response or invoice'}
            </div>
          </div>

          {/* Card 3: Signed Clients / Won (Purple/Emerald) */}
          <div
            onClick={() => setFilterType('signed')}
            className={`p-4 rounded-2xl border transition-all duration-300 hover-lift cursor-pointer ${
              filterType === 'signed'
                ? 'bg-purple-950/40 border-purple-400/80 ring-2 ring-purple-500/50'
                : 'bg-gradient-to-br from-purple-950/25 to-emerald-950/25 border-purple-500/40 hover:border-purple-400/60'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-purple-200 font-bold mb-1">
              <span>{lang === 'es' ? '🤝 Clientes Ganados' : '🤝 Clients Won / Signed'}</span>
              <Award className="h-4 w-4 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-purple-200">{signedLeads.length}</span>
              {estimatedRevenue > 0 && (
                <span className="text-xs font-mono font-bold text-emerald-400">~{estimatedRevenue}€</span>
              )}
            </div>
            <div className="text-[10px] text-purple-300/80 mt-1">
              {lang === 'es' ? 'Contrato cerrado con éxito' : 'Deals won & signed'}
            </div>
          </div>

          {/* Card 4: Refused / Not Interested (Rose) */}
          <div
            onClick={() => setFilterType('refused')}
            className={`p-4 rounded-2xl border transition-all duration-300 hover-lift cursor-pointer ${
              filterType === 'refused'
                ? 'bg-rose-950/40 border-rose-500/60 ring-2 ring-rose-500/40'
                : 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-rose-300 font-medium mb-1">
              <span>{lang === 'es' ? '❌ No Interesados' : '❌ Refused / Inactive'}</span>
              <Trash2 className="h-4 w-4 text-rose-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-300">{refusedLeads.length}</div>
            <div className="text-[10px] text-rose-400/80 mt-1">
              {lang === 'es' ? 'Descartados de prospección' : 'Excluded from search'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Filter Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: lang === 'es' ? 'Todos los Contactados' : 'All Contacted', count: contactedPool.length },
            { id: 'waiting', label: lang === 'es' ? '⏳ Esperando Respuesta / Pago' : '⏳ Waiting Response/Pay', count: waitingLeads.length, isAmber: true },
            { id: 'signed', label: lang === 'es' ? '🤝 Clientes Firmados' : '🤝 Signed Clients', count: signedLeads.length, isPurple: true },
            { id: 'contacted', label: lang === 'es' ? '📩 Propuesta Enviada' : '📩 Outreach Sent', count: outreachLeads.length, isCyan: true },
            { id: 'refused', label: lang === 'es' ? '❌ No Interesados' : '❌ Refused', count: refusedLeads.length, isRose: true },
          ].map((tab) => {
            const isActive = filterType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer select-none ${
                  isActive
                    ? tab.isPurple
                      ? 'bg-purple-600/30 text-purple-200 border border-purple-400/60 shadow-md font-bold'
                      : tab.isAmber
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-500/60 shadow-md font-bold'
                      : tab.isRose
                      ? 'bg-rose-500/25 text-rose-300 border border-rose-500/60 shadow-md font-bold'
                      : 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/60 shadow-md font-bold'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive
                      ? tab.isPurple
                        ? 'bg-purple-500/40 text-purple-100 font-bold'
                        : tab.isAmber
                        ? 'bg-amber-500/40 text-amber-100 font-bold'
                        : tab.isRose
                        ? 'bg-rose-500/40 text-rose-100 font-bold'
                        : 'bg-cyan-500/40 text-cyan-100 font-bold'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Mode & Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'es' ? 'Buscar en contactados...' : 'Search contacted...'}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="flex rounded-xl border border-slate-800 bg-slate-950/60 p-0.5">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                viewMode === 'cards' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid cards"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                viewMode === 'table' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
              title="Table view"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main List Rendering */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-800 p-12 text-center text-slate-400 bg-slate-900/20 space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto text-slate-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">
              {lang === 'es' ? 'No hay negocios en esta categoría' : 'No businesses in this view'}
            </h3>
            <p className="text-xs text-slate-400">
              {contactedPool.length === 0
                ? lang === 'es'
                  ? 'Aún no has contactado ningún negocio. Cuando pulses "Marcar Contactado" en cualquier negocio de la búsqueda, se trasladará automáticamente a esta lista.'
                  : 'You have not marked any prospects as contacted yet. When you click "Mark Contacted" in AI Discover or Google Maps, businesses are automatically pushed into this pipeline!'
                : lang === 'es'
                ? 'No hay registros que coincidan con los filtros seleccionados.'
                : 'No leads match the current search or status filter.'}
            </p>
          </div>
          {onNavigateToDiscovery && (
            <button
              onClick={onNavigateToDiscovery}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-bold shadow-lg transition cursor-pointer"
            >
              <Compass className="h-4 w-4" />
              <span>{lang === 'es' ? 'Ir a Búsqueda y Encontrar Negocios' : 'Go to AI Search & Discover Leads'}</span>
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        /* Cards View with Clear, Distinct Visual Themes per Status */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((prospect) => {
            const theme = getLeadStatusTheme(prospect.status, prospect.isContacted);
            const mapsUrl = getGoogleMapsUrl(prospect);

            return (
              <div
                key={prospect.id}
                onClick={() => onSelectProspect(prospect)}
                className={`group relative rounded-2xl border p-5 transition-all duration-300 hover-lift cursor-pointer flex flex-col justify-between space-y-3.5 ${theme.cardBg} ${theme.border} ${theme.ring}`}
              >
                <div>
                  {/* Top Header: Distinct Status Badge & Lead Score */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Prominent Colored Status Badge */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold ${theme.badgeBg}`}>
                        <span className={`h-2 w-2 rounded-full ${theme.dotColor} animate-pulse`} />
                        <span>{lang === 'es' ? theme.labelEs : theme.labelEn}</span>
                      </span>

                      <span className="px-2 py-0.5 rounded-lg bg-slate-900/80 border border-slate-700/60 text-[10px] text-slate-300">
                        {prospect.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStar(prospect.id);
                        }}
                        className="p-1 text-slate-500 hover:text-amber-400 transition"
                      >
                        <Star className={`w-4 h-4 ${prospect.isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>

                      <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono font-bold text-cyan-400">
                        <Zap className="w-3 h-3 text-cyan-400" />
                        <span>{prospect.leadScore}</span>
                      </div>
                    </div>
                  </div>

                  {/* Business Name */}
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {prospect.name}
                  </h3>

                  {/* Location & Google Maps direct link */}
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                    <div className="flex items-center gap-1 truncate max-w-[220px]">
                      <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{prospect.address}, {prospect.city}</span>
                    </div>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-[11px] font-semibold transition shrink-0"
                      title="Verify on Google Maps"
                    >
                      <span>Maps</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>

                  {/* Rating & Phone */}
                  <div className="flex items-center justify-between text-xs mt-3 pt-2.5 border-t border-slate-800/60">
                    <div className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span>{prospect.reviewRating}</span>
                      <span className="text-slate-400 font-normal">({prospect.reviewCount})</span>
                    </div>

                    {prospect.phone ? (
                      <a
                        href={`tel:${prospect.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 font-mono text-[11px] text-slate-300 hover:text-cyan-300 transition"
                      >
                        <Phone className="h-3 w-3 text-cyan-400" />
                        <span>{prospect.phone}</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">In-person outreach</span>
                    )}
                  </div>

                  {/* Private Notes or Sentiment Snippet */}
                  {prospect.notes ? (
                    <div className="mt-3 p-2 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300">
                      <span className="text-slate-500 font-bold uppercase text-[9px] block">
                        {lang === 'es' ? 'Notas Privadas:' : 'Creator Notes:'}
                      </span>
                      <p className="line-clamp-2 italic">{prospect.notes}</p>
                    </div>
                  ) : (
                    <p className="mt-2.5 text-[11px] text-slate-400 italic line-clamp-2 bg-slate-950/50 p-2 rounded-xl border border-slate-800/60">
                      "{prospect.reviewSentimentSummary || 'Verified local business with high rating and zero custom web presence.'}"
                    </p>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                  {/* Status Outcome Updater Dropdown */}
                  <ContactOutcomeMenu
                    prospect={prospect}
                    lang={lang}
                    onUpdateStatus={onUpdateStatus}
                    onDeleteNotInterested={onDeleteNotInterested}
                  />

                  <div className="flex items-center gap-1.5">
                    {prospect.brief && (
                      <button
                        onClick={(e) => handleCopyPrompt(e, prospect)}
                        className="p-1.5 rounded-xl border border-slate-700 bg-slate-800/80 text-cyan-400 hover:bg-slate-700 transition cursor-pointer"
                        title="Copy AI Studio Website Prompt"
                      >
                        {copiedId === prospect.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    <button
                      onClick={() => onSelectProspect(prospect)}
                      className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-semibold border border-cyan-500/30 transition cursor-pointer"
                    >
                      {lang === 'es' ? 'Ver Brief' : 'Details'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Detailed Table View with Distinct Color-Coded Rows */
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-md">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 pl-4 pr-2 w-8">★</th>
                <th className="py-3.5 px-3">Estado / Pipeline</th>
                <th className="py-3.5 px-4">Negocio</th>
                <th className="py-3.5 px-3">Ubicación</th>
                <th className="py-3.5 px-3">Google Maps</th>
                <th className="py-3.5 px-3">Teléfono</th>
                <th className="py-3.5 px-3">Opiniones</th>
                <th className="py-3.5 pr-4 pl-2 text-right">Actualizar Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((prospect) => {
                const theme = getLeadStatusTheme(prospect.status, prospect.isContacted);
                const mapsUrl = getGoogleMapsUrl(prospect);

                return (
                  <tr
                    key={prospect.id}
                    onClick={() => onSelectProspect(prospect)}
                    className={`cursor-pointer transition hover:bg-slate-800/40 group ${
                      prospect.status === 'client_signed'
                        ? 'bg-purple-950/15'
                        : prospect.status === 'waiting'
                        ? 'bg-amber-950/15'
                        : prospect.status === 'not_interested'
                        ? 'bg-rose-950/15'
                        : 'bg-cyan-950/10'
                    }`}
                  >
                    {/* Star */}
                    <td className="py-3 pl-4 pr-2" onClick={(e) => { e.stopPropagation(); onToggleStar(prospect.id); }}>
                      <Star className={`w-4 h-4 ${prospect.isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                    </td>

                    {/* Prominently Highlighted Status Pill */}
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold ${theme.badgeBg}`}>
                        <span className={`h-2 w-2 rounded-full ${theme.dotColor}`} />
                        <span>{lang === 'es' ? theme.shortLabelEs : theme.shortLabelEn}</span>
                      </span>
                    </td>

                    {/* Name & Category */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-white group-hover:text-cyan-300 transition truncate max-w-[200px]">
                        {prospect.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{prospect.category}</div>
                    </td>

                    {/* Address & City */}
                    <td className="py-3 px-3 text-slate-400">
                      <div className="truncate max-w-[160px]">{prospect.address}</div>
                      <div className="text-[11px] text-slate-500">{prospect.city}</div>
                    </td>

                    {/* Google Maps link */}
                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-semibold transition"
                      >
                        <MapPin className="w-3 h-3 text-blue-400" />
                        <span>Maps ↗</span>
                      </a>
                    </td>

                    {/* Phone */}
                    <td className="py-3 px-3 text-slate-400">
                      {prospect.phone ? (
                        <a
                          href={`tel:${prospect.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-mono text-[11px] text-slate-300 hover:text-cyan-300 transition"
                        >
                          {prospect.phone}
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">In-person</span>
                      )}
                    </td>

                    {/* Reviews */}
                    <td className="py-3 px-3">
                      <span className="font-medium text-amber-400">★ {prospect.reviewRating.toFixed(1)}</span>
                      <span className="text-[11px] text-slate-500 ml-1">({prospect.reviewCount})</span>
                    </td>

                    {/* Update Status Dropdown */}
                    <td className="py-3 pr-4 pl-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <ContactOutcomeMenu
                          prospect={prospect}
                          lang={lang}
                          onUpdateStatus={onUpdateStatus}
                          onDeleteNotInterested={onDeleteNotInterested}
                          compact={true}
                        />

                        <button
                          onClick={() => onSelectProspect(prospect)}
                          className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-[11px] font-medium transition cursor-pointer"
                        >
                          {lang === 'es' ? 'Abrir' : 'Open'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
