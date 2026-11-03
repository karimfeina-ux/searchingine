import React from 'react';
import type { AppSettings, DailyJobRun } from '../types/index.ts';
import { Clock, Play, Pause, ShieldCheck, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';

interface SchedulerViewProps {
  settings: AppSettings;
  schedulerStatus: {
    isActive: boolean;
    isCurrentlyRunning: boolean;
    scheduleTime: string;
    timezone: string;
    nextScheduledRun: string | null;
    lastRun: string | null;
    recentJobs: DailyJobRun[];
  };
  lang: 'en' | 'es';
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onToggleScheduler: (enabled: boolean) => void;
  onTriggerResearch: () => void;
}

export const SchedulerView: React.FC<SchedulerViewProps> = ({
  settings,
  schedulerStatus,
  lang,
  onUpdateSettings,
  onToggleScheduler,
  onTriggerResearch
}) => {
  return (
    <div className="space-y-6">
      {/* Top Status Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-extrabold text-white">
                {lang === 'es' ? 'Programador Autónomo en Servidor' : 'Autonomous Server Scheduler'}
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              {lang === 'es'
                ? 'El motor de búsqueda diaria se ejecuta de forma independiente en la nube sin depender de que mantengas la pestaña abierta.'
                : 'Daily prospecting runs autonomously in the cloud without needing your browser tab to stay open.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggleScheduler(!schedulerStatus.isActive)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-md ${
                schedulerStatus.isActive
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
              }`}
            >
              {schedulerStatus.isActive ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>
                {schedulerStatus.isActive
                  ? (lang === 'es' ? 'Pausar Programación' : 'Pause Scheduler')
                  : (lang === 'es' ? 'Activar Programación' : 'Activate Scheduler')}
              </span>
            </button>

            <button
              onClick={onTriggerResearch}
              disabled={schedulerStatus.isCurrentlyRunning}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-white hover:from-cyan-400 hover:to-blue-500 transition shadow-md disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${schedulerStatus.isCurrentlyRunning ? 'animate-spin' : ''}`} />
              <span>{lang === 'es' ? 'Ejecutar Búsqueda Ahora' : 'Run Now'}</span>
            </button>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
          <div className="rounded-xl bg-slate-950/60 p-3.5 border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">State</span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  schedulerStatus.isCurrentlyRunning
                    ? 'bg-amber-400 animate-ping'
                    : schedulerStatus.isActive
                    ? 'bg-emerald-400'
                    : 'bg-slate-500'
                }`}
              />
              <span className="font-bold text-white text-sm">
                {schedulerStatus.isCurrentlyRunning
                  ? 'Running Now...'
                  : schedulerStatus.isActive
                  ? 'Active / Scheduled'
                  : 'Paused'}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/60 p-3.5 border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Next Run</span>
            <span className="font-bold text-cyan-300 text-sm mt-1 block font-mono">
              {schedulerStatus.nextScheduledRun
                ? new Date(schedulerStatus.nextScheduledRun).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                : 'Paused'}
            </span>
          </div>

          <div className="rounded-xl bg-slate-950/60 p-3.5 border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Daily Time & Zone</span>
            <span className="font-bold text-white text-sm mt-1 block font-mono">
              {settings.dailyScheduleTime} ({settings.timezone})
            </span>
          </div>

          <div className="rounded-xl bg-slate-950/60 p-3.5 border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Daily Budget Ceiling</span>
            <span className="font-bold text-emerald-400 text-sm mt-1 block">
              €{settings.dailyBudgetEur.toFixed(2)} / day
            </span>
          </div>
        </div>
      </div>

      {/* Scheduler Preferences Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">
            {lang === 'es' ? 'Horario de Búsqueda Diaria' : 'Daily Schedule Configuration'}
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1 font-medium">
                {lang === 'es' ? 'Hora de ejecución diaria' : 'Daily run time'}
              </label>
              <input
                type="time"
                value={settings.dailyScheduleTime}
                onChange={(e) => onUpdateSettings({ dailyScheduleTime: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-medium">
                {lang === 'es' ? 'Zona Horaria Local' : 'Timezone'}
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => onUpdateSettings({ timezone: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="Europe/Madrid">Europe/Madrid (Spain)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Europe/Paris">Europe/Paris (CET)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-medium">
                {lang === 'es' ? 'Límite máximo de prospectos por día' : 'Max leads investigated per daily run'}
              </label>
              <input
                type="number"
                min={1}
                max={25}
                value={settings.maxLeadsPerRun}
                onChange={(e) => onUpdateSettings({ maxLeadsPerRun: parseInt(e.target.value, 10) || 8 })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                {lang === 'es'
                  ? 'Recomendado: 8-15 clientes para priorizar calidad, brief completo y contacto personal.'
                  : 'Recommended: 8-15 leads to prioritize deep verification, briefs, and personal outreach.'}
              </p>
            </div>
          </div>
        </div>

        {/* Deduplication & Rolling History Guide */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center gap-2 text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white">
              {lang === 'es' ? 'Historial Rodante y Antiduplicados' : 'Rolling History & Deduplication'}
            </h3>
          </div>

          <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
            <p>
              {lang === 'es'
                ? 'LeadHunter AI mantiene un registro permanente de cada negocio ya investigado. El motor normaliza los nombres, teléfonos y direcciones para que jamás recibas el mismo cliente dos veces.'
                : 'LeadHunter AI maintains a rolling database of every previously analyzed business. Names and phones are normalized so you never receive duplicate leads.'}
            </p>
            <p className="text-slate-400">
              {lang === 'es'
                ? 'Si un negocio ya ha sido contactado, descartado o firmado, la búsqueda automática diaria lo omite de los nuevos informes ejecutivos.'
                : 'Businesses already contacted, excluded, or signed are suppressed from new daily reports to keep your daily focus pristine.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
