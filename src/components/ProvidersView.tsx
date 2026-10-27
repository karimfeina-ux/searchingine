import React, { useState } from 'react';
import type { AppSettings } from '../types/index.ts';
import { Cpu, ShieldCheck, CheckCircle2, AlertTriangle, Key, ExternalLink, DollarSign, Info } from 'lucide-react';

interface ProvidersViewProps {
  settings: AppSettings;
  providersData: {
    providers: Array<{
      name: string;
      type: string;
      status: string;
      pricing: string;
      rateLimits: string;
      notes: string;
    }>;
    estimatedMonthlySpend: number;
    dailyBudgetCap: number;
    manualResearchModeAvailable: boolean;
  } | null;
  lang: 'en' | 'es';
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
}

export const ProvidersView: React.FC<ProvidersViewProps> = ({
  settings,
  providersData,
  lang,
  onUpdateSettings
}) => {
  const [googleKey, setGoogleKey] = useState(settings.providerKeys?.googlePlacesKey || '');
  const [serperKey, setSerperKey] = useState(settings.providerKeys?.serperApiKey || '');
  const [saved, setSaved] = useState(false);

  const handleSaveKeys = () => {
    onUpdateSettings({
      providerKeys: {
        ...settings.providerKeys,
        googlePlacesKey: googleKey.trim() || undefined,
        serperApiKey: serperKey.trim() || undefined
      }
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md space-y-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-extrabold text-white">
            {lang === 'es' ? 'Proveedores de Investigación y Control de Costes' : 'Research Providers & Cost Control'}
          </h2>
        </div>
        <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
          {lang === 'es'
            ? 'LeadHunter AI utiliza una arquitectura modular. La búsqueda estándar funciona de inmediato con OpenStreetMap Overpass (legal, público y gratuito) y la sonda HTTP de verificación. Jamás consumimos APIs de pago sin tu configuración explícita.'
            : 'LeadHunter AI operates on a modular provider architecture. Core discovery works out-of-the-box using OpenStreetMap Overpass (lawful, public, and free) plus our HTTP/DNS verification probe. We never silently trigger expensive APIs.'}
        </p>

        <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 block">{lang === 'es' ? 'Límite de Gasto Diario:' : 'Daily Budget Ceiling:'}</span>
            <span className="text-base font-bold text-emerald-400">€{settings.dailyBudgetEur.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-500 block">{lang === 'es' ? 'Modo Manual:' : 'Manual Research Fallback:'}</span>
            <span className="text-base font-bold text-cyan-400">Available</span>
          </div>
        </div>
      </div>

      {/* Connected Providers Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          {lang === 'es' ? 'Estado de los Servicios de Datos' : 'Data Services Status'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providersData?.providers.map((provider, i) => (
            <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{provider.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      provider.status === 'connected'
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                        : provider.status === 'ready_fallback'
                        ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {provider.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-[11px] text-cyan-400 font-medium mt-0.5">{provider.type}</div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{provider.notes}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/60 text-[11px] text-slate-500 flex justify-between">
                <span>{provider.pricing}</span>
                <span className="font-mono">{provider.rateLimits}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Optional Provider Credentials Config */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md space-y-4">
        <div className="flex items-center gap-2 text-white">
          <Key className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold">
            {lang === 'es' ? 'Credenciales Opcionales de Proveedores Externos' : 'Optional External Provider Keys'}
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          {lang === 'es'
            ? 'Si deseas complementar OpenStreetMap con Google Places o Serper, puedes guardar tus claves aquí. Se almacenan de forma segura en la base de datos del servidor y nunca se exponen al navegador.'
            : 'If you want to supplement OpenStreetMap with Google Places or Serper, you can supply your keys here. Stored securely on the server and never exposed in client code.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 font-medium">Google Places API Key (Optional)</label>
            <input
              type="password"
              value={googleKey}
              onChange={(e) => setGoogleKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">Serper.dev Web Search API Key (Optional)</label>
            <input
              type="password"
              value={serperKey}
              onChange={(e) => setSerperKey(e.target.value)}
              placeholder="serper_..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-emerald-400 font-semibold">{saved && (lang === 'es' ? '¡Guardado con éxito!' : 'Saved successfully!')}</span>
          <button
            onClick={handleSaveKeys}
            className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-400 transition"
          >
            {lang === 'es' ? 'Guardar Claves' : 'Save Provider Keys'}
          </button>
        </div>
      </div>
    </div>
  );
};
