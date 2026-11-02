import React, { useState, useEffect } from 'react';
import type { Prospect, WebsiteStatus, LeadStatus } from '../types/index.ts';
import { getGoogleMapsUrl } from '../utils/maps.ts';
import { t } from '../utils/translations.ts';
import {
  Search,
  Filter,
  Download,
  Star,
  ExternalLink,
  Phone,
  MapPin,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  LayoutGrid,
  Table as TableIcon,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  Compass
} from 'lucide-react';

import { ContactOutcomeMenu } from './ContactOutcomeMenu.tsx';
import { getLeadStatusTheme } from '../utils/statusTheme.ts';
import { isQualifiedProspect } from '../services/clientDataEngine.ts';

interface ProspectsViewProps {
  prospects: Prospect[];
  lang: 'en' | 'es';
  onSelectProspect: (prospect: Prospect) => void;
  onToggleStar: (id: string) => void;
  onUpdateStatus: (id: string, status: LeadStatus, notes?: string) => void;
  onVerifyAgain: (id: string) => void;
  onExportCsv: () => void;
  onMarkContacted?: (id: string) => void;
  onDeleteNotInterested?: (id: string) => void;
  onClearResearch?: (options: { keepContacted: boolean; keepStarred: boolean; cleanAll?: boolean }) => void;
  initialFilter?: 'all' | 'uncontacted' | 'contacted';
}

export const ProspectsView: React.FC<ProspectsViewProps> = ({
  prospects,
  lang,
  onSelectProspect,
  onToggleStar,
  onUpdateStatus,
  onVerifyAgain,
  onExportCsv,
  onMarkContacted,
  onDeleteNotInterested,
  onClearResearch,
  initialFilter = 'uncontacted'
}) => {
  const tr = t[lang] || t.en;
  const [search, setSearch] = useState('');
  // Default to uncontacted so users don't see contacted businesses in their new search list
  const [pipelineFilter, setPipelineFilter] = useState<'all' | 'uncontacted' | 'contacted' | 'waiting' | 'client_signed' | 'clicked' | 'high_priority'>(initialFilter);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWebsiteStatus, setSelectedWebsiteStatus] = useState<string>('all');
  const [selectedLeadStatus, setSelectedLeadStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'rating' | 'reviews' | 'recent'>('score');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  useEffect(() => {
    if (initialFilter) {
      setPipelineFilter(initialFilter);
    }
  }, [initialFilter]);

  // Extract unique categories for filter
  const categories = Array.from(new Set(prospects.map((p) => p.category)));

  // Filter & sort
  const filtered = prospects
    .filter((p) => {
      if (!isQualifiedProspect(p)) return false;

      const isLeadContactedOrDone = Boolean(
        p.isContacted ||
        p.status === 'contacted' ||
        p.status === 'waiting' ||
        p.status === 'client_signed' ||
        p.status === 'not_interested' ||
        p.status === 'excluded'
      );

      if (pipelineFilter === 'uncontacted' && isLeadContactedOrDone) return false;
      if (pipelineFilter === 'contacted' && !isLeadContactedOrDone) return false;
      if (pipelineFilter === 'waiting' && p.status !== 'waiting') return false;
      if (pipelineFilter === 'client_signed' && p.status !== 'client_signed') return false;
      if (pipelineFilter === 'clicked' && !p.isClicked) return false;
      if (pipelineFilter === 'high_priority' && p.leadScore < 80) return false;

      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (selectedWebsiteStatus !== 'all' && p.websiteStatus !== selectedWebsiteStatus) return false;
      if (selectedLeadStatus !== 'all' && p.status !== selectedLeadStatus) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesAddress = p.address.toLowerCase().includes(q);
        const matchesCity = p.city.toLowerCase().includes(q);
        const matchesCategory = p.category.toLowerCase().includes(q);
        const matchesNotes = p.notes?.toLowerCase().includes(q);
        return matchesName || matchesAddress || matchesCity || matchesCategory || matchesNotes;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.leadScore - a.leadScore;
      if (sortBy === 'rating') return b.reviewRating - a.reviewRating;
      if (sortBy === 'reviews') return b.reviewCount - a.reviewCount;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const handleCopyPrompt = (e: React.MouseEvent, p: Prospect) => {
    e.stopPropagation();
    if (p.brief?.aiStudioPrompt) {
      navigator.clipboard.writeText(p.brief.aiStudioPrompt);
      setCopiedId(p.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleContactAction = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (onMarkContacted) {
      onMarkContacted(id);
      setFeedbackToast(tr.markContactedSuccess);
      setTimeout(() => setFeedbackToast(null), 3000);
    }
  };

  const handleExecuteClear = () => {
    if (onClearResearch) {
      onClearResearch({ keepContacted: true, keepStarred: true, cleanAll: false });
      setShowClearConfirmModal(false);
      setFeedbackToast(tr.cleanedSuccess);
      setTimeout(() => setFeedbackToast(null), 3000);
    }
  };

  const uncontactedCount = prospects.filter((p) => !p.isContacted && p.status !== 'contacted' && p.status !== 'waiting' && p.status !== 'client_signed').length;
  const contactedCount = prospects.filter((p) => p.isContacted || p.status === 'contacted').length;
  const waitingCount = prospects.filter((p) => p.status === 'waiting').length;
  const signedCount = prospects.filter((p) => p.status === 'client_signed').length;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 rounded-xl bg-emerald-500/90 text-slate-950 font-bold px-4 py-2.5 shadow-2xl backdrop-blur-md animate-in slide-in-from-top duration-200 border border-emerald-300 text-xs">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Confirmation Modal to Clean Research List */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0f172a] p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-cyan-400">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                <Trash2 className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-base font-bold text-white">{tr.cleanResearchTitle}</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {tr.cleanResearchDesc}
            </p>
            <div className="rounded-xl bg-slate-900/90 p-3 border border-slate-800 text-[11px] text-slate-400 space-y-2">
              <div className="flex justify-between">
                <span>{lang === 'es' ? 'Prospectos no contactados a limpiar:' : 'Uncontacted search leads to clean:'}</span>
                <span className="font-bold text-amber-400">{uncontactedCount}</span>
              </div>
              <div className="flex justify-between">
                <span>{lang === 'es' ? 'Clientes contactados protegidos:' : 'Contacted clients protected:'}</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
                  {contactedCount} {lang === 'es' ? '(Se conservan siempre)' : '(Preserved forever)'}
                </span>
              </div>
            </div>
            <div className="rounded-xl bg-emerald-950/40 border border-emerald-500/30 p-2.5 text-[11px] text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{lang === 'es' ? 'Tus clientes contactados nunca se borrarán al limpiar búsquedas.' : 'Your contacted pipeline will never be deleted when cleaning search lists.'}</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
              >
                {tr.cleanResearchCancel}
              </button>
              <button
                type="button"
                onClick={handleExecuteClear}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-cyan-950/40 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5 text-cyan-200" />
                <span>{tr.cleanUncontactedConfirm}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'uncontacted', label: tr.filterUncontacted, count: uncontactedCount },
            { id: 'contacted', label: tr.filterContactedOnly, count: contactedCount },
            { id: 'waiting', label: tr.filterWaiting, count: waitingCount, isAmber: true },
            { id: 'client_signed', label: tr.filterSignedClients, count: signedCount, isHighlight: true },
            { id: 'all', label: tr.filterAll, count: prospects.length },
            { id: 'high_priority', label: tr.filterHighScore, count: prospects.filter((p) => p.leadScore >= 80).length },
            { id: 'clicked', label: tr.filterViewed, count: prospects.filter((p) => p.isClicked).length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPipelineFilter(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer select-none ${
                pipelineFilter === tab.id
                  ? (tab as any).isHighlight
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-950 font-bold'
                    : (tab as any).isAmber
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-950 font-bold'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-950 font-bold'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                pipelineFilter === tab.id && (tab as any).isHighlight
                  ? 'bg-emerald-500/30 text-emerald-200'
                  : pipelineFilter === tab.id && (tab as any).isAmber
                  ? 'bg-amber-500/30 text-amber-200'
                  : 'bg-slate-800/80 text-slate-300'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Clean Research List Button */}
        {onClearResearch && prospects.length > 0 && (
          <button
            type="button"
            onClick={() => setShowClearConfirmModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 transition cursor-pointer shrink-0 shadow-sm"
            title={tr.cleanResearchDesc}
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>{tr.cleanToZero}</span>
          </button>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'es' ? 'Buscar por negocio, calle, barrio o categoría...' : 'Search by business name, address, or category...'}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex rounded-xl border border-slate-800 bg-slate-950/60 p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  viewMode === 'table' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
                title="Table view"
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  viewMode === 'cards' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid card view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Export CSV Button */}
            <button
              onClick={onExportCsv}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer"
              title="Export filtered prospects to CSV"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>{tr.exportCsv}</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 text-slate-400 font-medium">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>{tr.filters}</span>
          </div>

          {/* Website Status Filter */}
          <select
            value={selectedWebsiteStatus}
            onChange={(e) => setSelectedWebsiteStatus(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">{tr.websiteStatusAll}</option>
            <option value="no_website">{tr.noWebsiteFound}</option>
            <option value="website_broken">{tr.websiteBroken}</option>
            <option value="website_outdated">{tr.websiteOutdated}</option>
            <option value="possibly_no_website">{tr.possiblyNoWebsite}</option>
            <option value="website_exists">{tr.websiteExists}</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">{lang === 'es' ? 'Categoría: Todas' : 'Category: All'}</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Pipeline Lead Status Filter */}
          <select
            value={selectedLeadStatus}
            onChange={(e) => setSelectedLeadStatus(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">{tr.pipelineStatusAll}</option>
            <option value="high_priority">{tr.highPriority}</option>
            <option value="ready_to_contact">{tr.readyToContact}</option>
            <option value="contacted">{tr.contactedStatus}</option>
            <option value="client_signed">{tr.clientSigned}</option>
            <option value="new">{tr.newLead}</option>
            <option value="excluded">{tr.excluded}</option>
          </select>

          {/* Sort By Filter */}
          <div className="ml-auto flex items-center gap-1">
            <span className="text-[11px] text-slate-500">{tr.sortBy}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="score">{tr.score}</option>
              <option value="rating">{tr.starRating}</option>
              <option value="reviews">{tr.reviewCount}</option>
              <option value="recent">{tr.mostRecent}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count Banner */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          {lang === 'es'
            ? `Mostrando ${filtered.length} negocios investigados`
            : `Showing ${filtered.length} investigated prospects`}
        </span>
        <span className="text-[11px] text-slate-500 hidden sm:inline">
          {tr.clickToViewBrief}
        </span>
      </div>

      {/* Render View (Table or Cards) */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-400 bg-slate-900/30 space-y-3">
          <p className="text-sm font-semibold text-slate-300">
            {tr.noResultsFound}
          </p>
          {pipelineFilter === 'contacted' && (
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {lang === 'es'
                ? 'Aún no has contactado ningún negocio. Cuando pulses "Marcar Contactado" en cualquier prospecto, aparecerá guardado permanentemente aquí.'
                : 'You have not contacted any business yet. Click "Mark Contacted" on any prospect to permanently save it in this category.'}
            </p>
          )}
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('all');
              setSelectedWebsiteStatus('all');
              setSelectedLeadStatus('all');
              setPipelineFilter('all');
            }}
            className="text-xs text-cyan-400 hover:underline cursor-pointer block mx-auto"
          >
            {tr.resetFilters}
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Data Table View */
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-md">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 pl-4 pr-2 w-8">★</th>
                <th className="py-3.5 px-3">{tr.colScore}</th>
                <th className="py-3.5 px-4">{tr.colBusiness}</th>
                <th className="py-3.5 px-3">{tr.colLocation}</th>
                <th className="py-3.5 px-3">Google Maps</th>
                <th className="py-3.5 px-3">{tr.colWebsite}</th>
                <th className="py-3.5 px-3">{tr.colReviews}</th>
                <th className="py-3.5 px-3">{tr.colContact}</th>
                <th className="py-3.5 px-3">{tr.colPipeline}</th>
                <th className="py-3.5 pr-4 pl-2 text-right">{tr.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((prospect) => {
                const mapsUrl = getGoogleMapsUrl(prospect);
                const isLeadContacted = Boolean(prospect.isContacted || prospect.status === 'contacted');
                const theme = getLeadStatusTheme(prospect.status, prospect.isContacted);

                return (
                  <tr
                    key={prospect.id}
                    onClick={() => onSelectProspect(prospect)}
                    className={`cursor-pointer transition hover:bg-slate-800/40 group ${
                      prospect.status === 'client_signed'
                        ? 'bg-purple-950/20 hover:bg-purple-950/30'
                        : prospect.status === 'waiting'
                        ? 'bg-amber-950/20 hover:bg-amber-950/30'
                        : prospect.status === 'not_interested'
                        ? 'bg-rose-950/20 hover:bg-rose-950/30'
                        : isLeadContacted
                        ? 'bg-cyan-950/15 hover:bg-cyan-950/25'
                        : ''
                    }`}
                  >
                    {/* Star */}
                    <td className="py-3 pl-4 pr-2" onClick={(e) => { e.stopPropagation(); onToggleStar(prospect.id); }}>
                      <Star
                        className={`w-4 h-4 transition ${
                          prospect.isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-600 hover:text-amber-400'
                        }`}
                      />
                    </td>

                    {/* Lead Score */}
                    <td className="py-3 px-3">
                      <div
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 font-extrabold text-xs shadow-sm ${
                          prospect.leadScore >= 85
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : prospect.leadScore >= 70
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        }`}
                      >
                        <Zap className="w-3 h-3 fill-current" />
                        <span>{prospect.leadScore}</span>
                      </div>
                    </td>

                    {/* Business Name & Category */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-white group-hover:text-cyan-300 transition truncate max-w-[200px]">
                        {prospect.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{prospect.category}</div>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-3 text-slate-400">
                      <div className="truncate max-w-[150px]">{prospect.address}</div>
                      <div className="text-[11px] text-slate-500">{prospect.city}</div>
                    </td>

                    {/* Direct Google Maps Link to confirm info */}
                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-semibold transition"
                        title={tr.mapsConfirmTitle}
                      >
                        <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                        <span>Maps ↗</span>
                      </a>
                    </td>

                    {/* Website Verification Badge */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${
                          prospect.websiteStatus === 'no_website'
                            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                            : prospect.websiteStatus === 'website_broken'
                            ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                            : prospect.websiteStatus === 'website_outdated'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {prospect.websiteStatus.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Reviews */}
                    <td className="py-3 px-3">
                      <span className="font-medium text-amber-400">★ {prospect.reviewRating.toFixed(1)}</span>
                      <span className="text-[11px] text-slate-500 ml-1">({prospect.reviewCount})</span>
                    </td>

                    {/* Contact Phone */}
                    <td className="py-3 px-3 text-slate-400">
                      {prospect.phone ? (
                        <a
                          href={`tel:${prospect.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 font-mono text-[11px] text-slate-300 hover:text-cyan-300 transition"
                        >
                          <Phone className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>{prospect.phone}</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">In-person</span>
                      )}
                    </td>

                    {/* Pipeline Status Dropdown & Badge */}
                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        {(isLeadContacted || prospect.status === 'not_interested' || prospect.status === 'waiting' || prospect.status === 'client_signed') && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 ${theme.badgeBg}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${theme.dotColor}`} />
                            <span>{lang === 'es' ? theme.shortLabelEs : theme.shortLabelEn}</span>
                          </span>
                        )}
                        <select
                          value={prospect.status}
                          onChange={(e) => onUpdateStatus(prospect.id, e.target.value as LeadStatus)}
                          className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-0.5 text-[11px] font-medium text-slate-300 focus:border-cyan-500 focus:outline-none"
                        >
                          <option value="new">{tr.newLead}</option>
                          <option value="high_priority">{tr.highPriority}</option>
                          <option value="ready_to_contact">{tr.readyToContact}</option>
                          <option value="contacted">{tr.contactedStatus}</option>
                          <option value="waiting">⏳ {tr.optionWaiting}</option>
                          <option value="client_signed">🤝 {tr.optionClientWon}</option>
                          <option value="not_interested">❌ {tr.optionNotInterested}</option>
                          <option value="excluded">{tr.excluded}</option>
                        </select>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 pr-4 pl-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <ContactOutcomeMenu
                          prospect={prospect}
                          lang={lang}
                          onUpdateStatus={onUpdateStatus}
                          onDeleteNotInterested={onDeleteNotInterested || ((id) => onUpdateStatus(id, 'not_interested'))}
                          compact={true}
                        />
                        {prospect.brief && (
                          <button
                            onClick={(e) => handleCopyPrompt(e, prospect)}
                            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-cyan-400 hover:bg-slate-700 transition cursor-pointer"
                            title="Copy Google AI Studio Website Prompt"
                          >
                            {copiedId === prospect.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <button
                          onClick={() => onSelectProspect(prospect)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-[11px] font-semibold border border-cyan-500/30 transition cursor-pointer"
                        >
                          {tr.viewProfile}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((prospect) => {
            const mapsUrl = getGoogleMapsUrl(prospect);
            const isLeadContacted = Boolean(prospect.isContacted || prospect.status === 'contacted');
            const theme = getLeadStatusTheme(prospect.status, prospect.isContacted);

            return (
              <div
                key={prospect.id}
                onClick={() => onSelectProspect(prospect)}
                className={`cursor-pointer overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover-lift group flex flex-col justify-between space-y-3 ${
                  theme.cardBg
                } ${theme.border} ${theme.ring}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white group-hover:text-cyan-300 transition text-sm truncate">
                          {prospect.name}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="inline-block rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                          {prospect.category}
                        </span>
                        {(isLeadContacted || prospect.status === 'not_interested' || prospect.status === 'waiting' || prospect.status === 'client_signed') && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${theme.badgeBg}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${theme.dotColor}`} />
                            <span>{lang === 'es' ? theme.shortLabelEs : theme.shortLabelEn}</span>
                          </span>
                        )}
                      </div>
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
                      <div
                        className={`flex items-center gap-1 rounded-lg px-2 py-0.5 font-bold text-xs ${
                          prospect.leadScore >= 85
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        <Zap className="w-3 h-3 fill-current" />
                        <span>{prospect.leadScore}</span>
                      </div>
                    </div>
                  </div>

                  {/* Address & Google Maps Direct Link */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1 text-[11px] truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{prospect.address}, {prospect.city}</span>
                      </div>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 text-[10px] font-semibold shrink-0 transition"
                        title={tr.mapsConfirmTitle}
                      >
                        <span>Maps</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-amber-400 font-medium">
                        ★ {prospect.reviewRating.toFixed(1)} ({prospect.reviewCount} {lang === 'es' ? 'reseñas' : 'reviews'})
                      </span>
                      {prospect.phone && (
                        <a
                          href={`tel:${prospect.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-mono text-slate-300 hover:text-cyan-300 transition"
                        >
                          {prospect.phone}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Sentiment snippet */}
                  <p className="mt-2.5 text-[11px] text-slate-300 italic line-clamp-2 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                    "{prospect.reviewSentimentSummary}"
                  </p>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                  <ContactOutcomeMenu
                    prospect={prospect}
                    lang={lang}
                    onUpdateStatus={onUpdateStatus}
                    onDeleteNotInterested={onDeleteNotInterested || ((id) => onUpdateStatus(id, 'not_interested'))}
                  />

                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-xl border border-slate-700 bg-slate-800/80 text-blue-300 hover:bg-blue-900/30 transition cursor-pointer"
                    title={tr.viewOnGoogleMaps}
                  >
                    <MapPin className="w-4 h-4 text-blue-400" />
                  </a>

                  {prospect.brief && (
                    <button
                      onClick={(e) => handleCopyPrompt(e, prospect)}
                      className="p-1.5 rounded-xl border border-slate-700 bg-slate-800/80 text-cyan-400 hover:bg-slate-700 transition cursor-pointer"
                      title={tr.copyPrompt}
                    >
                      {copiedId === prospect.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
