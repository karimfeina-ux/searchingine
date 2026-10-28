import React, { useState } from 'react';
import type { Prospect, WebsiteStatus, LeadStatus } from '../types/index.ts';
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
  Check
} from 'lucide-react';

interface ProspectsViewProps {
  prospects: Prospect[];
  lang: 'en' | 'es';
  onSelectProspect: (prospect: Prospect) => void;
  onToggleStar: (id: string) => void;
  onUpdateStatus: (id: string, status: LeadStatus) => void;
  onVerifyAgain: (id: string) => void;
  onExportCsv: () => void;
  onMarkContacted?: (id: string) => void;
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
}) => {
  const [search, setSearch] = useState('');
  const [pipelineFilter, setPipelineFilter] = useState<'all' | 'uncontacted' | 'contacted' | 'clicked' | 'high_priority'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWebsiteStatus, setSelectedWebsiteStatus] = useState<string>('all');
  const [selectedLeadStatus, setSelectedLeadStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'rating' | 'reviews' | 'recent'>('score');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Extract unique categories for filter
  const categories = Array.from(new Set(prospects.map((p) => p.category)));

  // Filter & sort
  const filtered = prospects
    .filter((p) => {
      if (pipelineFilter === 'uncontacted' && (p.isContacted || p.status === 'contacted')) return false;
      if (pipelineFilter === 'contacted' && !p.isContacted && p.status !== 'contacted') return false;
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

  return (
    <div className="space-y-4">
      {/* Pipeline Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'All Leads', count: prospects.length },
          { id: 'uncontacted', label: 'Uncontacted', count: prospects.filter((p) => !p.isContacted && p.status !== 'contacted').length },
          { id: 'contacted', label: 'Contacted', count: prospects.filter((p) => p.isContacted || p.status === 'contacted').length },
          { id: 'clicked', label: 'Viewed', count: prospects.filter((p) => p.isClicked).length },
          { id: 'high_priority', label: 'High Score (80+)', count: prospects.filter((p) => p.leadScore >= 80).length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setPipelineFilter(tab.id as any)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer select-none ${
              pipelineFilter === tab.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-950'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>{tab.label}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800/80 text-slate-300 font-mono">
              {tab.count}
            </span>
          </button>
        ))}
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
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === 'table' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
                title="Table view"
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs transition ${
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
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
              title="Export filtered prospects to CSV"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>{lang === 'es' ? 'Exportar CSV' : 'Export CSV'}</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 text-slate-400 font-medium">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>{lang === 'es' ? 'Filtros:' : 'Filters:'}</span>
          </div>

          {/* Website Status Filter */}
          <select
            value={selectedWebsiteStatus}
            onChange={(e) => setSelectedWebsiteStatus(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">{lang === 'es' ? 'Estado Web: Todos' : 'Website Status: All'}</option>
            <option value="no_website">{lang === 'es' ? 'Sin Web (No Website)' : 'No Website Found'}</option>
            <option value="website_broken">{lang === 'es' ? 'Web Rota (Broken)' : 'Website Broken'}</option>
            <option value="website_outdated">{lang === 'es' ? 'Web Obsoleta' : 'Website Outdated'}</option>
            <option value="possibly_no_website">{lang === 'es' ? 'Posiblemente Sin Web' : 'Possibly No Website'}</option>
            <option value="website_exists">{lang === 'es' ? 'Web Existe' : 'Website Exists'}</option>
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
            <option value="all">{lang === 'es' ? 'Pipeline: Todos' : 'Pipeline Status: All'}</option>
            <option value="high_priority">{lang === 'es' ? 'Alta Prioridad' : 'High Priority'}</option>
            <option value="ready_to_contact">{lang === 'es' ? 'Listo Para Contactar' : 'Ready to Contact'}</option>
            <option value="contacted">{lang === 'es' ? 'Contactado' : 'Contacted'}</option>
            <option value="client_signed">{lang === 'es' ? 'Cliente Firmado' : 'Client Signed'}</option>
            <option value="new">{lang === 'es' ? 'Nuevo' : 'New'}</option>
            <option value="excluded">{lang === 'es' ? 'Excluido' : 'Excluded'}</option>
          </select>

          {/* Sort By Filter */}
          <div className="ml-auto flex items-center gap-1">
            <span className="text-[11px] text-slate-500">{lang === 'es' ? 'Ordenar por:' : 'Sort by:'}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="score">{lang === 'es' ? 'Puntuación Lead' : 'Lead Score'}</option>
              <option value="rating">{lang === 'es' ? 'Valoración (★)' : 'Star Rating'}</option>
              <option value="reviews">{lang === 'es' ? 'Nº Reseñas' : 'Review Count'}</option>
              <option value="recent">{lang === 'es' ? 'Más Reciente' : 'Most Recent'}</option>
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
        <span className="text-[11px] text-slate-500">
          {lang === 'es' ? 'Haz clic en un registro para abrir el Brief de Diseño y el Prompt de AI Studio' : 'Click any lead to view its Full Brief and copy-ready AI Studio Prompt'}
        </span>
      </div>

      {/* Render View (Table or Cards) */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-400 bg-slate-900/30">
          <p className="text-sm font-semibold text-slate-300">
            {lang === 'es' ? 'No se encontraron prospectos con los filtros actuales' : 'No prospects match the selected filters'}
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('all');
              setSelectedWebsiteStatus('all');
              setSelectedLeadStatus('all');
            }}
            className="mt-3 text-xs text-cyan-400 hover:underline"
          >
            {lang === 'es' ? 'Restablecer todos los filtros' : 'Reset all filters'}
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Data Table View */
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-md">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 pl-4 pr-2 w-8">★</th>
                <th className="py-3.5 px-4">{lang === 'es' ? 'Puntuación' : 'Score'}</th>
                <th className="py-3.5 px-4">{lang === 'es' ? 'Negocio' : 'Business'}</th>
                <th className="py-3.5 px-4">{lang === 'es' ? 'Ubicación' : 'Location'}</th>
                <th className="py-3.5 px-4">{lang === 'es' ? 'Estado Web' : 'Website Status'}</th>
                <th className="py-3.5 px-4">{lang === 'es' ? 'Reputación' : 'Reviews'}</th>
                <th className="py-3.5 px-4">{lang === 'es' ? 'Contacto' : 'Contact'}</th>
                <th className="py-3.5 px-4">{lang === 'es' ? 'Estado Pipeline' : 'Pipeline'}</th>
                <th className="py-3.5 pr-4 pl-2 text-right">{lang === 'es' ? 'Acciones' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((prospect) => (
                <tr
                  key={prospect.id}
                  onClick={() => onSelectProspect(prospect)}
                  className="cursor-pointer transition hover:bg-slate-800/40 group"
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
                  <td className="py-3 px-4">
                    <div
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 font-extrabold text-xs shadow-sm ${
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
                    <div className="font-bold text-white group-hover:text-cyan-300 transition truncate max-w-[220px]">
                      {prospect.name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{prospect.category}</div>
                  </td>

                  {/* Location */}
                  <td className="py-3 px-4 text-slate-400">
                    <div className="truncate max-w-[180px]">{prospect.address}</div>
                    <div className="text-[11px] text-slate-500">{prospect.city}</div>
                  </td>

                  {/* Website Verification Badge */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${
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
                  <td className="py-3 px-4">
                    <span className="font-medium text-amber-400">★ {prospect.reviewRating.toFixed(1)}</span>
                    <span className="text-[11px] text-slate-500 ml-1">({prospect.reviewCount})</span>
                  </td>

                  {/* Contact */}
                  <td className="py-3 px-4 text-slate-400">
                    {prospect.phone ? (
                      <span className="flex items-center gap-1 font-mono text-[11px] text-slate-300">
                        <Phone className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span>{prospect.phone}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">In-person / Social</span>
                    )}
                  </td>

                  {/* Pipeline Status Dropdown */}
                  <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={prospect.status}
                      onChange={(e) => onUpdateStatus(prospect.id, e.target.value as LeadStatus)}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-0.5 text-[11px] font-medium text-slate-300 focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="new">New</option>
                      <option value="high_priority">High Priority</option>
                      <option value="ready_to_contact">Ready to Contact</option>
                      <option value="contacted">Contacted</option>
                      <option value="interested">Interested</option>
                      <option value="client_signed">Client Signed</option>
                      <option value="excluded">Excluded</option>
                    </select>
                  </td>

                  {/* Actions */}
                  <td className="py-3 pr-4 pl-2 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {onMarkContacted && (
                        <button
                          onClick={() => onMarkContacted(prospect.id)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition ${
                            prospect.isContacted || prospect.status === 'contacted'
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                              : 'bg-slate-800/80 hover:bg-emerald-950/40 hover:text-emerald-300 text-slate-300 border-slate-700'
                          }`}
                          title={prospect.isContacted ? 'Contacted' : 'Mark as Contacted'}
                        >
                          {prospect.isContacted || prospect.status === 'contacted' ? '✓ Contacted' : 'Mark Contacted'}
                        </button>
                      )}
                      {prospect.brief && (
                        <button
                          onClick={(e) => handleCopyPrompt(e, prospect)}
                          className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-cyan-400 hover:bg-slate-700 transition"
                          title="Copy Google AI Studio Website Prompt"
                        >
                          {copiedId === prospect.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      <button
                        onClick={() => onSelectProspect(prospect)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-[11px] font-semibold border border-cyan-500/30 transition"
                      >
                        {lang === 'es' ? 'Ver Perfil' : 'Profile'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((prospect) => (
            <div
              key={prospect.id}
              onClick={() => onSelectProspect(prospect)}
              className="cursor-pointer overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition-all hover:border-cyan-500/50 hover:bg-slate-900/90 hover:shadow-xl group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                      {prospect.category}
                    </span>
                    <h3 className="font-bold text-white group-hover:text-cyan-300 transition text-sm">
                      {prospect.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleStar(prospect.id); }}
                      className="p-1 text-slate-600 hover:text-amber-400 transition"
                    >
                      <Star className={`w-4 h-4 ${prospect.isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                    <div
                      className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold ${
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
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{prospect.address}, {prospect.city}</span>
                  </div>
                  {prospect.phone && (
                    <div className="flex items-center gap-1 text-slate-300">
                      <Phone className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="font-mono text-[11px]">{prospect.phone}</span>
                    </div>
                  )}
                  <div className="text-amber-400 font-medium">
                    ★ {prospect.reviewRating.toFixed(1)} ({prospect.reviewCount} {lang === 'es' ? 'reseñas' : 'reviews'})
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/60">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      prospect.websiteStatus === 'no_website'
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                        : prospect.websiteStatus === 'website_broken'
                        ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {prospect.websiteStatus.replace(/_/g, ' ')}
                  </span>
                  <p className="mt-1 text-[11px] text-slate-400 italic line-clamp-2">
                    "{prospect.reviewSentimentSummary}"
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <span className="text-cyan-400 font-semibold text-[11px]">
                  {prospect.brief ? '3 Conceptos Listos' : 'Analizado'}
                </span>
                <span className="text-slate-400 group-hover:text-cyan-300 transition text-[11px] font-medium">
                  {lang === 'es' ? 'Abrir Perfil' : 'View Profile'} &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
