import React, { useState } from 'react';
import type { AppSettings, DailyJobRun } from '../types/index.ts';
import { FileText, Download, Copy, Check, Clock, CheckCircle2, ChevronRight, Play } from 'lucide-react';

interface DailyReportsViewProps {
  jobs: DailyJobRun[];
  settings: AppSettings;
  lang: 'en' | 'es';
  onTriggerResearch: () => void;
  isResearchRunning: boolean;
  onExportCsv: () => void;
}

export const DailyReportsView: React.FC<DailyReportsViewProps> = ({
  jobs,
  settings,
  lang,
  onTriggerResearch,
  isResearchRunning,
  onExportCsv
}) => {
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || '');
  const [copied, setCopied] = useState(false);

  const activeJob = jobs.find((j) => j.id === selectedJobId) || jobs[0];

  const handleCopyReport = () => {
    if (activeJob?.summaryReport) {
      navigator.clipboard.writeText(activeJob.summaryReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>{lang === 'es' ? 'Informes Diarios de Prospección' : 'Daily Autonomous Prospecting Reports'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'es'
              ? 'Informes ejecutivos resumidos generados por el servidor tras cada jornada de prospección.'
              : 'Autonomous server reports prioritizing quality over quantity, highlighting verified opportunities.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>{lang === 'es' ? 'Descargar CSV' : 'Export CSV'}</span>
          </button>
          <button
            onClick={onTriggerResearch}
            disabled={isResearchRunning}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-white hover:from-cyan-400 hover:to-blue-500 transition shadow-md disabled:opacity-60"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{lang === 'es' ? 'Generar Nuevo Informe' : 'Generate New Report'}</span>
          </button>
        </div>
      </div>

      {/* Main Container: Past Runs List & Active Report */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Run Selector Sidebar */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            {lang === 'es' ? 'Historial de Ejecuciones' : 'Execution History'}
          </h3>
          <div className="space-y-1.5">
            {jobs.length === 0 ? (
              <p className="text-xs text-slate-500 p-3">No jobs recorded yet.</p>
            ) : (
              jobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    activeJob?.id === job.id
                      ? 'border-cyan-400 bg-cyan-950/20 text-white shadow-md'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold uppercase tracking-wider text-cyan-400">{job.runType}</span>
                    <span className="text-slate-500">{new Date(job.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="text-xs font-semibold text-white mt-1">
                    {new Date(job.startedAt).toLocaleDateString()}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{job.qualifiedLeads} {lang === 'es' ? 'calificados' : 'qualified'}</span>
                    <span className="text-emerald-400 font-bold">€{job.apiUsage.estimatedCostEur.toFixed(2)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Active Report Reader */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md space-y-4">
          {activeJob ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                      {activeJob.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-400">
                      Started: {new Date(activeJob.startedAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCopyReport}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado!' : (lang === 'es' ? 'Copiar Markdown' : 'Copy Markdown')}</span>
                </button>
              </div>

              {/* Stats Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block">Discovered</span>
                  <span className="text-lg font-bold text-white">{activeJob.businessesDiscovered}</span>
                </div>
                <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block">Websites Verified</span>
                  <span className="text-lg font-bold text-cyan-400">{activeJob.websitesVerified}</span>
                </div>
                <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block">Qualified Prospects</span>
                  <span className="text-lg font-bold text-indigo-400">{activeJob.qualifiedLeads}</span>
                </div>
                <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block">Duplicates Filtered</span>
                  <span className="text-lg font-bold text-emerald-400">{activeJob.duplicatesRemoved}</span>
                </div>
              </div>

              {/* Markdown Content Box */}
              <div className="rounded-xl bg-slate-950 p-5 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed border border-slate-800 whitespace-pre-wrap">
                {activeJob.summaryReport || 'No report text generated for this job.'}
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-400 text-center py-12">Select a job to view report.</p>
          )}
        </div>
      </div>
    </div>
  );
};
