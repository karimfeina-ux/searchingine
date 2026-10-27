import React, { useState } from 'react';
import type { AppSettings } from '../types/index.ts';
import { Settings, Save, Check, RefreshCw, Sliders, MapPin, DollarSign, Clock, ShieldCheck } from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  lang: 'en' | 'es';
  onSave: (updated: Partial<AppSettings>) => void;
  onOpenWizard: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  lang,
  onSave,
  onOpenWizard
}) => {
  const [cities, setCities] = useState(settings.cities.join(', '));
  const [region, setRegion] = useState(settings.region);
  const [country, setCountry] = useState(settings.country);
  const [minRating, setMinRating] = useState(settings.minRating);
  const [minReviews, setMinReviews] = useState(settings.minReviews);
  const [maxLeads, setMaxLeads] = useState(settings.maxLeadsPerRun);
  const [dailyTime, setDailyTime] = useState(settings.dailyScheduleTime);
  const [timezone, setTimezone] = useState(settings.timezone);

  // Scoring weights
  const [wWebOpp, setWWebOpp] = useState(settings.weightWebsiteOpp);
  const [wRep, setWRep] = useState(settings.weightReputation);
  const [wAct, setWAct] = useState(settings.weightActivity);
  const [wCat, setWCat] = useState(settings.weightCategoryValue);
  const [wCont, setWCont] = useState(settings.weightContactability);
  const [wEvid, setWEvid] = useState(settings.weightEvidenceQuality);

  // Pricing
  const [basePrice, setBasePrice] = useState(settings.baseWebsitePrice);
  const [hostingPrice, setHostingPrice] = useState(settings.monthlyHostingPrice);
  const [budgetCap, setBudgetCap] = useState(settings.dailyBudgetEur);

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const parsedCities = cities.split(',').map((c) => c.trim()).filter(Boolean);
    onSave({
      cities: parsedCities.length > 0 ? parsedCities : ['Barcelona'],
      region,
      country,
      minRating,
      minReviews,
      maxLeadsPerRun: maxLeads,
      dailyScheduleTime: dailyTime,
      timezone,
      weightWebsiteOpp: wWebOpp,
      weightReputation: wRep,
      weightActivity: wAct,
      weightCategoryValue: wCat,
      weightContactability: wCont,
      weightEvidenceQuality: wEvid,
      baseWebsitePrice: basePrice,
      monthlyHostingPrice: hostingPrice,
      dailyBudgetEur: budgetCap,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const totalWeights = wWebOpp + wRep + wAct + wCat + wCont + wEvid;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Settings Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <span>{lang === 'es' ? 'Configuración de LeadHunter AI' : 'LeadHunter AI Configuration'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'es'
              ? 'Personaliza tus territorios, ponderaciones de puntuación y tarifas de diseño web.'
              : 'Customize your prospecting territory, scoring model weights, and web agency rates.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenWizard}
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
          >
            {lang === 'es' ? 'Abrir Asistente Paso a Paso' : 'Launch Setup Wizard'}
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-white hover:from-cyan-400 hover:to-blue-500 transition shadow-md"
          >
            {saved ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
            <span>{saved ? (lang === 'es' ? '¡Guardado!' : 'Saved!') : (lang === 'es' ? 'Guardar Cambios' : 'Save Changes')}</span>
          </button>
        </div>
      </div>

      {/* Section 1: Territory */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center gap-2 text-white">
          <MapPin className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold">{lang === 'es' ? 'Territorio Geográfico' : 'Geographic Territory'}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 font-medium">{lang === 'es' ? 'Ciudades' : 'Cities'}</label>
            <input
              type="text"
              value={cities}
              onChange={(e) => setCities(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">{lang === 'es' ? 'Región / Comunidad' : 'Region'}</label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">{lang === 'es' ? 'País' : 'Country'}</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Creator Rates */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center gap-2 text-white">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold">{lang === 'es' ? 'Tarifas del Creador Web' : 'Web Creator Pricing'}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 font-medium">
              {lang === 'es' ? 'Precio Web Base (€)' : 'Base Website Project (€)'}
            </label>
            <input
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(parseFloat(e.target.value) || 500)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">
              {lang === 'es' ? 'Hosting Gestionado (€/mes)' : 'Monthly Managed Hosting (€/mo)'}
            </label>
            <input
              type="number"
              value={hostingPrice}
              onChange={(e) => setHostingPrice(parseFloat(e.target.value) || 40)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">
              {lang === 'es' ? 'Límite Presupuestario Diario (€)' : 'Daily Research Budget Cap (€)'}
            </label>
            <input
              type="number"
              value={budgetCap}
              onChange={(e) => setBudgetCap(parseFloat(e.target.value) || 5.0)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Scoring Model Weights */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold">
              {lang === 'es' ? 'Ponderación del Algoritmo de Puntuación (Total: ' + totalWeights + ' pts)' : 'Lead Scoring Weights (Total: ' + totalWeights + ' pts)'}
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Normalized to 0-100</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 font-medium">Website Opportunity ({wWebOpp})</label>
            <input
              type="range"
              min={10}
              max={50}
              value={wWebOpp}
              onChange={(e) => setWWebOpp(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">Reputation & Satisfaction ({wRep})</label>
            <input
              type="range"
              min={10}
              max={40}
              value={wRep}
              onChange={(e) => setWRep(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-400"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">Activity & Recency ({wAct})</label>
            <input
              type="range"
              min={5}
              max={30}
              value={wAct}
              onChange={(e) => setWAct(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-400"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">Category Commercial Value ({wCat})</label>
            <input
              type="range"
              min={5}
              max={30}
              value={wCat}
              onChange={(e) => setWCat(parseInt(e.target.value, 10))}
              className="w-full accent-amber-400"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">Contactability ({wCont})</label>
            <input
              type="range"
              min={5}
              max={25}
              value={wCont}
              onChange={(e) => setWCont(parseInt(e.target.value, 10))}
              className="w-full accent-purple-400"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">Evidence Confidence ({wEvid})</label>
            <input
              type="range"
              min={5}
              max={25}
              value={wEvid}
              onChange={(e) => setWEvid(parseInt(e.target.value, 10))}
              className="w-full accent-rose-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
