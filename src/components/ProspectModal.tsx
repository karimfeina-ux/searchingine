import React, { useState } from 'react';
import type { AppSettings, LeadStatus, OutreachDraft, Prospect } from '../types/index.ts';
import {
  X,
  Star,
  MapPin,
  Phone,
  Globe,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Sparkles,
  Palette,
  FileCode2,
  Copy,
  Check,
  RefreshCw,
  MessageSquare,
  ChevronRight,
  Info,
  Calendar,
  Send,
  Loader2
} from 'lucide-react';

interface ProspectModalProps {
  prospect: Prospect;
  settings: AppSettings;
  lang: 'en' | 'es';
  onClose: () => void;
  onUpdateStatus: (id: string, status: LeadStatus, notes?: string) => void;
  onToggleStar: (id: string) => void;
  onReverify: (id: string) => Promise<void>;
  onRegenerateBrief: (id: string) => Promise<void>;
  onGenerateOutreach: (id: string, channel: OutreachDraft['channel'], tone: OutreachDraft['tone']) => Promise<OutreachDraft | null>;
}

export const ProspectModal: React.FC<ProspectModalProps> = ({
  prospect,
  settings,
  lang,
  onClose,
  onUpdateStatus,
  onToggleStar,
  onReverify,
  onRegenerateBrief,
  onGenerateOutreach
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'verification' | 'concepts' | 'prompt' | 'outreach'>('overview');
  const [selectedDirection, setSelectedDirection] = useState<1 | 2 | 3>(1);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedOutreach, setCopiedOutreach] = useState(false);
  const [notes, setNotes] = useState(prospect.notes || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false);

  // Outreach state
  const [outreachChannel, setOutreachChannel] = useState<OutreachDraft['channel']>('email');
  const [outreachTone, setOutreachTone] = useState<OutreachDraft['tone']>('consultative');
  const [currentOutreachDraft, setCurrentOutreachDraft] = useState<OutreachDraft | null>(null);

  const brief = prospect.brief;

  const handleCopyPrompt = () => {
    if (brief?.aiStudioPrompt) {
      navigator.clipboard.writeText(brief.aiStudioPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  const handleCopySummary = () => {
    const summary = `
BUSINESS SUMMARY:
Name: ${prospect.name}
Category: ${prospect.category}
Location: ${prospect.address}, ${prospect.city} (${prospect.region})
Phone: ${prospect.phone || 'N/A'}
Website Status: ${prospect.websiteStatus}
Lead Score: ${prospect.leadScore}/100
Reviews: ${prospect.reviewRating}★ (${prospect.reviewCount} reviews)
Sentiment: ${prospect.reviewSentimentSummary}
Recommended Action: ${prospect.recommendedAction}
Base Web Price: €${settings.baseWebsitePrice} | Hosting: €${settings.monthlyHostingPrice}/mo
    `.trim();
    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleTriggerReverify = async () => {
    setIsVerifying(true);
    try {
      await onReverify(prospect.id);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTriggerRegenerateBrief = async () => {
    setIsGeneratingBrief(true);
    try {
      await onRegenerateBrief(prospect.id);
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const handleTriggerOutreach = async () => {
    setIsGeneratingOutreach(true);
    try {
      const draft = await onGenerateOutreach(prospect.id, outreachChannel, outreachTone);
      if (draft) setCurrentOutreachDraft(draft);
    } finally {
      setIsGeneratingOutreach(false);
    }
  };

  const currentDirection =
    selectedDirection === 1 ? brief?.direction1 : selectedDirection === 2 ? brief?.direction2 : brief?.direction3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl border border-slate-800 bg-[#0f172a] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-start gap-3">
            <button
              onClick={() => onToggleStar(prospect.id)}
              className="mt-1 p-1 text-slate-500 hover:text-amber-400 transition"
            >
              <Star className={`w-5 h-5 ${prospect.isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight">{prospect.name}</h2>
                <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                  {prospect.category}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                    prospect.websiteStatus === 'no_website'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : prospect.websiteStatus === 'website_broken'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {prospect.websiteStatus.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{prospect.address}, {prospect.city}</span>
                </span>
                {prospect.phone && (
                  <span className="flex items-center gap-1 text-slate-300 font-mono">
                    <Phone className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{prospect.phone}</span>
                  </span>
                )}
                <span className="text-amber-400 font-medium">
                  ★ {prospect.reviewRating.toFixed(1)} ({prospect.reviewCount} {lang === 'es' ? 'reseñas' : 'reviews'})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
            {/* Lead Score Pill */}
            <div
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 font-extrabold text-sm border shadow-lg ${
                prospect.leadScore >= 85
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : prospect.leadScore >= 70
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
              }`}
            >
              <Zap className="w-4 h-4 fill-current" />
              <div>
                <span className="text-base">{prospect.leadScore}</span>
                <span className="text-[10px] opacity-70"> /100</span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-800 bg-slate-900/60 px-6 gap-2 shrink-0">
          {[
            { id: 'overview', label: lang === 'es' ? 'Visión General y Puntuación' : 'Overview & Score Breakdown' },
            { id: 'verification', label: lang === 'es' ? 'Evidencias de Verificación' : 'Website Verification Evidence' },
            { id: 'concepts', label: lang === 'es' ? '3 Conceptos de Diseño' : '3 Creative Website Directions' },
            { id: 'prompt', label: lang === 'es' ? 'Prompt para Google AI Studio' : 'Google AI Studio Prompt' },
            { id: 'outreach', label: lang === 'es' ? 'Borrador de Contacto Legal' : 'Outreach Draft & Legal' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW & SCORING */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Score Subscores Breakdown */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span>{lang === 'es' ? 'Desglose Explicable de la Puntuación (0-100)' : 'Explainable Scoring Breakdown (0-100)'}</span>
                  </h3>
                  <span className="text-xs text-cyan-400 font-semibold">{prospect.recommendedAction}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
                  <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">{lang === 'es' ? 'Oportunidad Web' : 'Website Opp.'}</span>
                    <span className="text-base font-extrabold text-cyan-300">{prospect.subscores.websiteOpportunity}</span>
                    <span className="text-[10px] text-slate-500 block">/ 30 pts</span>
                  </div>

                  <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">{lang === 'es' ? 'Reputación' : 'Reputation'}</span>
                    <span className="text-base font-extrabold text-indigo-300">{prospect.subscores.reputation}</span>
                    <span className="text-[10px] text-slate-500 block">/ 20 pts</span>
                  </div>

                  <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">{lang === 'es' ? 'Actividad' : 'Activity'}</span>
                    <span className="text-base font-extrabold text-emerald-300">{prospect.subscores.activity}</span>
                    <span className="text-[10px] text-slate-500 block">/ 15 pts</span>
                  </div>

                  <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">{lang === 'es' ? 'Valor Sector' : 'Category Val.'}</span>
                    <span className="text-base font-extrabold text-amber-300">{prospect.subscores.categoryValue}</span>
                    <span className="text-[10px] text-slate-500 block">/ 15 pts</span>
                  </div>

                  <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">{lang === 'es' ? 'Contactabilidad' : 'Contactability'}</span>
                    <span className="text-base font-extrabold text-purple-300">{prospect.subscores.contactability}</span>
                    <span className="text-[10px] text-slate-500 block">/ 10 pts</span>
                  </div>

                  <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">{lang === 'es' ? 'Confianza' : 'Confidence'}</span>
                    <span className="text-base font-extrabold text-rose-300">{prospect.subscores.evidenceQuality}</span>
                    <span className="text-[10px] text-slate-500 block">/ 10 pts</span>
                  </div>
                </div>

                {/* Score Reasons & Strongest Signals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {lang === 'es' ? 'Señales Positivas Clave' : 'Strongest Positive Signals'}
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {prospect.strongestSignals.map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {lang === 'es' ? 'Incertidumbres y Precauciones' : 'Important Uncertainties'}
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {prospect.importantUncertainties.map((u, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span>{u}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Review & Reputation Insights */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span>{lang === 'es' ? 'Análisis de Opiniones y Reputación' : 'Customer Review & Reputation Analysis'}</span>
                </h3>
                <p className="text-xs text-slate-300 italic bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  "{prospect.reviewSentimentSummary}"
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <h4 className="text-xs font-semibold text-emerald-400 mb-1.5">
                      {lang === 'es' ? 'Temas Positivos Recurrentes' : 'Recurring Positive Themes'}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {prospect.positiveThemes.map((theme, i) => (
                        <span key={i} className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300 border border-emerald-500/20">
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 mb-1.5">
                      {lang === 'es' ? 'Evidencia de Operaciones Estables' : 'Stable Operations Evidence'}
                    </h4>
                    <p className="text-xs text-slate-400">{prospect.stableOperationsEvidence}</p>
                  </div>
                </div>
              </div>

              {/* Pipeline Notes & Status Management */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                <h3 className="text-sm font-bold text-white">
                  {lang === 'es' ? 'Notas Privadas del Creador' : 'Private Creator Notes & Status'}
                </h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={lang === 'es' ? 'Añade notas de llamadas, objeciones del cliente, preferencias de diseño...' : 'Add notes from calls, client preferences, quote status...'}
                  rows={3}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
                <div className="flex justify-between items-center">
                  <select
                    value={prospect.status}
                    onChange={(e) => onUpdateStatus(prospect.id, e.target.value as LeadStatus, notes)}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="new">Status: New Lead</option>
                    <option value="high_priority">Status: High Priority Opportunity</option>
                    <option value="ready_to_contact">Status: Ready to Contact</option>
                    <option value="contacted">Status: Contacted</option>
                    <option value="interested">Status: Interested / Meeting Booked</option>
                    <option value="client_signed">Status: Client Signed (€500+)</option>
                    <option value="excluded">Status: Excluded</option>
                  </select>

                  <button
                    onClick={() => onUpdateStatus(prospect.id, prospect.status, notes)}
                    className="rounded-xl bg-cyan-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-cyan-400 transition"
                  >
                    {lang === 'es' ? 'Guardar Notas' : 'Save Notes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VERIFICATION EVIDENCE */}
          {activeTab === 'verification' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {lang === 'es' ? 'Auditoría de Existencia Web Multifuente' : 'Multi-Check Website Existence Audit'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === 'es'
                      ? 'No asumimos conclusiones sin pruebas. Guardamos evidencia de cada consulta y sondeo HTTP.'
                      : 'We store evidence, not just conclusions. Every check records queries, HTTP status, and counter-evidence.'}
                  </p>
                </div>

                <button
                  onClick={handleTriggerReverify}
                  disabled={isVerifying}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isVerifying ? 'animate-spin' : ''}`} />
                  <span>{lang === 'es' ? 'Verificar de Nuevo' : 'Re-verify Now'}</span>
                </button>
              </div>

              <div className="space-y-3">
                {prospect.verifications && prospect.verifications.length > 0 ? (
                  prospect.verifications.map((v, i) => (
                    <div key={v.id || i} className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-400 uppercase">
                            {v.checkType.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs font-bold text-white">
                            Status: <code className="text-cyan-300">{v.status}</code>
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {new Date(v.checkedAt).toLocaleDateString()} {new Date(v.checkedAt).toLocaleTimeString()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{v.explanation}</p>

                      {v.candidateDomain && (
                        <div className="text-xs text-slate-400 font-mono">
                          Candidate: <span className="text-white">{v.candidateDomain}</span>
                          {v.httpStatus && ` (HTTP ${v.httpStatus}, ${v.responseTimeMs}ms)`}
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-800/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-500 block font-semibold text-[10px] uppercase">
                            {lang === 'es' ? 'Por qué este resultado podría ser erróneo:' : 'Why result could be wrong:'}
                          </span>
                          <span className="text-slate-400">{v.counterEvidence}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block font-semibold text-[10px] uppercase">
                            {lang === 'es' ? 'Paso de verificación recomendado:' : 'Recommended next check:'}
                          </span>
                          <span className="text-cyan-400">{v.recommendedNextStep}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-slate-800 p-6 text-center text-xs text-slate-400">
                    {lang === 'es' ? 'No hay registros detallados de verificación.' : 'No detailed verification logs available.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: 3 CREATIVE WEBSITE DIRECTIONS */}
          {activeTab === 'concepts' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Palette className="w-4 h-4 text-cyan-400" />
                    <span>{lang === 'es' ? 'Tres Direcciones Creativas Únicas' : 'Three Truly Distinct Creative Directions'}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === 'es'
                      ? 'Propuestas de diseño personalizadas con paletas exactas en hexadecimal, tipografías y estrategia de conversión.'
                      : 'Bespoke design concepts with exact hex color palettes, typography pairings, and tailored hero concepts.'}
                  </p>
                </div>

                <button
                  onClick={handleTriggerRegenerateBrief}
                  disabled={isGeneratingBrief}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition shrink-0"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-cyan-400 ${isGeneratingBrief ? 'animate-spin' : ''}`} />
                  <span>{lang === 'es' ? 'Regenerar Conceptos' : 'Regenerate Brief'}</span>
                </button>
              </div>

              {brief ? (
                <div className="space-y-6">
                  {/* Direction Switcher Pills */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 1, dir: brief.direction1 },
                      { id: 2, dir: brief.direction2 },
                      { id: 3, dir: brief.direction3 },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedDirection(item.id as any)}
                        className={`rounded-xl border p-3.5 text-left transition ${
                          selectedDirection === item.id
                            ? 'border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-950/20'
                            : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/40 text-slate-400'
                        }`}
                      >
                        <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                          Concept 0{item.id}
                        </div>
                        <h4 className="font-bold text-white text-sm mt-0.5">{item.dir?.title || `Direction ${item.id}`}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{item.dir?.tagline}</p>
                      </button>
                    ))}
                  </div>

                  {/* Active Concept Details */}
                  {currentDirection && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-5">
                      <div className="border-b border-slate-800 pb-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-extrabold text-white">{currentDirection.title}</h4>
                          <span className="text-xs text-cyan-400 font-semibold">{currentDirection.tagline}</span>
                        </div>
                        <p className="mt-2 text-xs text-slate-300 leading-relaxed">{currentDirection.designPhilosophy}</p>
                      </div>

                      {/* Color Palette Display */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          {lang === 'es' ? 'Paleta de Color Sugerida (Hex Exactos)' : 'Suggested Color Palette (Exact Hex)'}
                        </h5>
                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                          {Object.entries(currentDirection.colorPalette || {}).map(([key, hex]) => (
                            <div key={key} className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-center">
                              <div
                                className="h-8 w-full rounded-lg mb-1.5 shadow-inner"
                                style={{ backgroundColor: hex }}
                              />
                              <span className="text-[10px] text-slate-400 block capitalize">{key}</span>
                              <span className="font-mono text-[11px] text-white font-bold">{hex}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Typography and Hero */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1.5 rounded-xl bg-slate-950/60 p-4 border border-slate-800">
                          <h5 className="text-xs font-bold text-cyan-400 uppercase">Typography System</h5>
                          <p className="text-xs text-white font-bold">
                            Heading: {currentDirection.typography?.headingFont}
                          </p>
                          <p className="text-xs text-slate-300">
                            Body: {currentDirection.typography?.bodyFont}
                          </p>
                          <p className="text-[11px] text-slate-400 italic mt-1">
                            {currentDirection.typography?.rationale}
                          </p>
                        </div>

                        <div className="space-y-1.5 rounded-xl bg-slate-950/60 p-4 border border-slate-800">
                          <h5 className="text-xs font-bold text-indigo-400 uppercase">Hero Concept</h5>
                          <p className="text-xs text-white italic">"{currentDirection.heroConcept}"</p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Image treatment: {currentDirection.imageTreatment}
                          </p>
                        </div>
                      </div>

                      {/* Conversion Strategy */}
                      <div className="rounded-xl bg-emerald-950/20 p-4 border border-emerald-900/40 space-y-1">
                        <h5 className="text-xs font-bold text-emerald-400 uppercase">Conversion Strategy</h5>
                        <p className="text-xs text-emerald-200">{currentDirection.conversionStrategy}</p>
                      </div>

                      {/* Key Components */}
                      <div className="space-y-1.5">
                        <h5 className="text-xs font-bold text-slate-400 uppercase">Key Tailored Components</h5>
                        <div className="flex flex-wrap gap-2">
                          {currentDirection.keyComponents?.map((comp, idx) => (
                            <span key={idx} className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-200">
                              {comp}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Suggested Pages Architecture */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                      {lang === 'es' ? 'Arquitectura Web Recomendada' : 'Tailored Website Architecture & Pages'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {brief.suggestedPages?.map((page, i) => (
                        <div key={i} className="rounded-xl bg-slate-950/70 p-3.5 border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs">{page.name}</span>
                            <span className="text-[10px] text-cyan-400 font-mono">{page.callToAction}</span>
                          </div>
                          <p className="text-xs text-slate-400">{page.purpose}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  {lang === 'es' ? 'Cargando conceptos de diseño...' : 'Generating creative website brief...'}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COMPLETE GOOGLE AI STUDIO PROMPT */}
          {activeTab === 'prompt' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileCode2 className="w-4 h-4 text-cyan-400" />
                    <span>{lang === 'es' ? 'Prompt Completo para Google AI Studio' : 'Copy-Ready Prompt for Google AI Studio'}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === 'es'
                      ? 'Copia este prompt completo y pégalo directamente en Google AI Studio para programar la web de tu cliente.'
                      : 'Copy this prompt and paste it into Google AI Studio to build the custom website for your client.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyPrompt}
                    className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-400 transition shadow-lg shadow-cyan-950/40"
                  >
                    {copiedPrompt ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedPrompt ? (lang === 'es' ? 'Copiado!' : 'Copied!') : (lang === 'es' ? 'Copiar Prompt' : 'Copy AI Prompt')}</span>
                  </button>
                </div>
              </div>

              <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-[500px]">
                <pre className="whitespace-pre-wrap leading-relaxed font-mono">
                  {brief?.aiStudioPrompt || 'Prompt generation in progress...'}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 5: OUTREACH DRAFT & LEGAL NOTICE */}
          {activeTab === 'outreach' && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    {lang === 'es' ? 'Aviso Legal de Contacto B2B (GDPR / LSSI-CE España)' : 'Legal Outreach Guardrails (GDPR & LSSI-CE Spain)'}
                  </h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {lang === 'es'
                    ? 'LeadHunter AI no envía correos ni mensajes automáticos sin tu consentimiento. Cada propuesta debe ser revisada por ti. En España (LSSI Art. 21 y GDPR Art. 6.1.f), el contacto B2B está permitido bajo Interés Legítimo si guarda relación directa con su actividad y se facilita la baja.'
                    : 'LeadHunter AI does not send automated spam. Each outreach draft is prepared for your personal review. Under EU GDPR and Spanish LSSI regulations, professional B2B communications are permitted under Legitimate Interest with clear opt-out options.'}
                </p>
              </div>

              {/* Outreach Configuration Controls */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                        {lang === 'es' ? 'Canal de Contacto' : 'Channel'}
                      </label>
                      <select
                        value={outreachChannel}
                        onChange={(e) => setOutreachChannel(e.target.value as any)}
                        className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="email">Email</option>
                        <option value="phone_script">{lang === 'es' ? 'Guión Telefónico' : 'Phone Script'}</option>
                        <option value="in_person_script">{lang === 'es' ? 'Guión Visita Presencial' : 'In-Person Script'}</option>
                        <option value="instagram_dm">Instagram DM</option>
                        <option value="whatsapp">WhatsApp Business</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                        {lang === 'es' ? 'Tono' : 'Tone'}
                      </label>
                      <select
                        value={outreachTone}
                        onChange={(e) => setOutreachTone(e.target.value as any)}
                        className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="consultative">{lang === 'es' ? 'Consultivo y cercano' : 'Consultative'}</option>
                        <option value="value_first">{lang === 'es' ? 'Aportando valor de inmediato' : 'Value-First'}</option>
                        <option value="professional">{lang === 'es' ? 'Profesional y formal' : 'Professional'}</option>
                        <option value="friendly">{lang === 'es' ? 'Amistoso y local' : 'Friendly'}</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleTriggerOutreach}
                    disabled={isGeneratingOutreach}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-white hover:from-cyan-400 hover:to-blue-500 transition shadow-md self-end"
                  >
                    {isGeneratingOutreach ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{lang === 'es' ? 'Generar Mensaje Personalizado' : 'Generate Outreach Script'}</span>
                  </button>
                </div>

                {currentOutreachDraft && (
                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        {currentOutreachDraft.subject}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(currentOutreachDraft.body);
                          setCopiedOutreach(true);
                          setTimeout(() => setCopiedOutreach(false), 2000);
                        }}
                        className="flex items-center gap-1 text-xs text-cyan-400 hover:underline"
                      >
                        {copiedOutreach ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedOutreach ? 'Copiado!' : 'Copiar Texto'}</span>
                      </button>
                    </div>

                    <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                      {currentOutreachDraft.body}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-slate-950/80 px-6 py-3.5 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSummary ? 'Copiado' : (lang === 'es' ? 'Copiar Resumen' : 'Copy Summary')}</span>
            </button>

            {brief?.aiStudioPrompt && (
              <button
                onClick={handleCopyPrompt}
                className="flex items-center gap-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-3 py-1.5 text-xs font-semibold hover:bg-cyan-500/30 transition"
              >
                {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileCode2 className="w-3.5 h-3.5" />}
                <span>{lang === 'es' ? 'Copiar Prompt AI Studio' : 'Copy AI Prompt'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateStatus(prospect.id, 'contacted')}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              {lang === 'es' ? 'Marcar Contactado' : 'Mark as Contacted'}
            </button>
            <button
              onClick={onClose}
              className="rounded-xl bg-slate-800 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-700 transition"
            >
              {lang === 'es' ? 'Cerrar' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
