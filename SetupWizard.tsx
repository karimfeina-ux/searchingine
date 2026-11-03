import React, { useState } from 'react';
import type { AppSettings } from '../types/index.ts';
import { Compass, Check, ArrowRight, ArrowLeft, ShieldCheck, MapPin, Tag, Sliders, Clock, Euro } from 'lucide-react';

interface SetupWizardProps {
  initialSettings: AppSettings;
  lang: 'en' | 'es';
  onComplete: (settings: Partial<AppSettings>) => void;
  onClose: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({
  initialSettings,
  lang,
  onComplete,
  onClose
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form states
  const [cityInput, setCityInput] = useState(initialSettings.cities.join(', '));
  const [region, setRegion] = useState(initialSettings.region);
  const [country, setCountry] = useState(initialSettings.country);
  const [searchRadius, setSearchRadius] = useState(initialSettings.searchRadiusKm);

  const [categories, setCategories] = useState<string[]>(initialSettings.categories);
  const [excludedCategories, setExcludedCategories] = useState<string[]>(initialSettings.excludedCategories);

  const [minRating, setMinRating] = useState(initialSettings.minRating);
  const [minReviews, setMinReviews] = useState(initialSettings.minReviews);
  const [maxLeads, setMaxLeads] = useState(initialSettings.maxLeadsPerRun);
  const [dailyBudget, setDailyBudget] = useState(initialSettings.dailyBudgetEur);

  const [dailyTime, setDailyTime] = useState(initialSettings.dailyScheduleTime);
  const [timezone, setTimezone] = useState(initialSettings.timezone);

  const [basePrice, setBasePrice] = useState(initialSettings.baseWebsitePrice);
  const [hostingPrice, setHostingPrice] = useState(initialSettings.monthlyHostingPrice);

  const availableCategories = [
    'Restaurants & Cafés',
    'Barbers & Hair Salons',
    'Beauty & Spa',
    'Independent Gyms & Fitness Studios',
    'Plumbers, Electricians & Trades',
    'Auto Repair Shops',
    'Local Hotels & Guesthouses',
    'Local Professional Practices & Clinics',
    'Photographers & Creative Studios',
    'Event Venues & Caterers'
  ];

  const toggleCategory = (cat: string) => {
    if (categories.includes(cat)) {
      setCategories(categories.filter((c) => c !== cat));
    } else {
      setCategories([...categories, cat]);
    }
  };

  const handleFinish = () => {
    const parsedCities = cityInput.split(',').map((c) => c.trim()).filter(Boolean);
    onComplete({
      isConfigured: true,
      cities: parsedCities.length > 0 ? parsedCities : ['Barcelona'],
      region,
      country,
      searchRadiusKm: searchRadius,
      categories,
      excludedCategories,
      minRating,
      minReviews,
      maxLeadsPerRun: maxLeads,
      dailyBudgetEur: dailyBudget,
      dailyScheduleTime: dailyTime,
      timezone,
      baseWebsitePrice: basePrice,
      monthlyHostingPrice: hostingPrice,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#0f172a] shadow-2xl p-6 sm:p-8 flex flex-col space-y-6 text-slate-100">
        {/* Wizard Header */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
              {lang === 'es' ? `Paso ${step} de 5: Configuración Inicial` : `Step ${step} of 5: Initial Setup`}
            </span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 w-6 rounded-full transition ${
                    step >= s ? 'bg-cyan-400' : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            {step === 1 && (lang === 'es' ? '1. Ubicación y Territorio Objetivo' : '1. Target Territory & Location')}
            {step === 2 && (lang === 'es' ? '2. Categorías de Negocios' : '2. Target Business Categories')}
            {step === 3 && (lang === 'es' ? '3. Criterios de Calificación y Presupuesto' : '3. Qualification Filters & Limits')}
            {step === 4 && (lang === 'es' ? '4. Horario de Prospección Autónoma' : '4. Autonomous Daily Schedule')}
            {step === 5 && (lang === 'es' ? '5. Tus Servicios y Precios Web' : '5. Your Web Creator Pricing')}
          </h2>
        </div>

        {/* Wizard Steps */}
        <div className="min-h-[260px] flex flex-col justify-center">
          {/* STEP 1: GEOGRAPHY */}
          {step === 1 && (
            <div className="space-y-4 text-xs">
              <p className="text-slate-400">
                {lang === 'es'
                  ? 'Configura tu ciudad o ciudades objetivo. No asumimos tu ubicación. Puedes seleccionar Barcelona, Madrid, Valencia o cualquier municipio.'
                  : 'Specify your target cities and territory. You can prospect a specific city, multiple cities, an autonomous community, or whole region.'}
              </p>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  {lang === 'es' ? 'Ciudad o ciudades (separadas por coma)' : 'Target City or Cities (comma separated)'}
                </label>
                <input
                  type="text"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  placeholder="Barcelona, Badalona, L'Hospitalet"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    {lang === 'es' ? 'Comunidad Autónoma / Región' : 'Region / Province'}
                  </label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    {lang === 'es' ? 'País' : 'Country'}
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CATEGORIES */}
          {step === 2 && (
            <div className="space-y-3 text-xs">
              <p className="text-slate-400">
                {lang === 'es'
                  ? 'Selecciona los sectores a investigar con alta rentabilidad para diseño web:'
                  : 'Select the high-ROI business sectors you want to research:'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {availableCategories.map((cat) => {
                  const isChecked = categories.includes(cat);
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition ${
                        isChecked
                          ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center border ${isChecked ? 'bg-cyan-500 border-cyan-400 text-white' : 'border-slate-700'}`}>
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                      <span className="font-medium truncate">{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: QUALIFICATION FILTERS */}
          {step === 3 && (
            <div className="space-y-4 text-xs">
              <p className="text-slate-400">
                {lang === 'es'
                  ? 'Solo investigamos negocios consolidados que proporcionan un servicio contrastado.'
                  : 'We only prioritize businesses with verified customer love and real operations.'}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    {lang === 'es' ? 'Valoración Mínima (★)' : 'Minimum Rating (★)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value) || 4.0)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    {lang === 'es' ? 'Número Mínimo de Reseñas' : 'Minimum Review Count'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={minReviews}
                    onChange={(e) => setMinReviews(parseInt(e.target.value, 10) || 5)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    {lang === 'es' ? 'Prospectos investigados al día' : 'Max Leads Investigated Per Run'}
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="25"
                    value={maxLeads}
                    onChange={(e) => setMaxLeads(parseInt(e.target.value, 10) || 8)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    {lang === 'es' ? 'Límite Presupuestario Diario (€)' : 'Daily Research Budget Cap (€)'}
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="50"
                    value={dailyBudget}
                    onChange={(e) => setDailyBudget(parseFloat(e.target.value) || 5.0)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SCHEDULE */}
          {step === 4 && (
            <div className="space-y-4 text-xs">
              <p className="text-slate-400">
                {lang === 'es'
                  ? 'Configura la hora diaria a la que el servidor iniciará la prospección autónoma.'
                  : 'Configure the time when the backend server launches the daily autonomous run.'}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    {lang === 'es' ? 'Hora de ejecución diaria' : 'Daily Run Time'}
                  </label>
                  <input
                    type="time"
                    value={dailyTime}
                    onChange={(e) => setDailyTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    {lang === 'es' ? 'Zona Horaria' : 'Local Timezone'}
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Europe/Madrid">Europe/Madrid (Spain)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Europe/Paris">Europe/Paris (CET)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: CREATOR PRICING */}
          {step === 5 && (
            <div className="space-y-4 text-xs">
              <p className="text-slate-400">
                {lang === 'es'
                  ? 'Tus tarifas de creador web. Se integrarán automáticamente en los briefs de diseño y los borradores de contacto.'
                  : 'Your website development rates. Automatically embedded in generated briefs and personalized outreach scripts.'}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    {lang === 'es' ? 'Precio Web Base (€)' : 'Base Website Project (€)'}
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={basePrice}
                    onChange={(e) => setBasePrice(parseFloat(e.target.value) || 500)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    {lang === 'es' ? 'Hosting Gestionado (€/mes)' : 'Monthly Managed Hosting (€/mo)'}
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    value={hostingPrice}
                    onChange={(e) => setHostingPrice(parseFloat(e.target.value) || 40)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-cyan-950/20 p-3 border border-cyan-800/40 text-cyan-300">
                {lang === 'es'
                  ? '¡Todo listo! Podrás modificar estos ajustes en cualquier momento desde la pestaña Configuración.'
                  : 'All set! You can fine-tune these parameters at any time in the Settings tab.'}
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{lang === 'es' ? 'Anterior' : 'Back'}</span>
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as any)}
              className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-5 py-2 text-xs font-bold text-white hover:bg-cyan-400 transition"
            >
              <span>{lang === 'es' ? 'Siguiente' : 'Next'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 text-xs font-bold text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-950/40 transition"
            >
              <Check className="w-4 h-4" />
              <span>{lang === 'es' ? 'Guardar y Comenzar' : 'Save & Start Prospecting'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
