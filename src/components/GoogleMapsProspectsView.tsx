import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import type { AppSettings, LeadStatus, Prospect } from '../types/index.ts';
import { getGoogleMapsUrl } from '../utils/maps.ts';
import { ContactOutcomeMenu } from './ContactOutcomeMenu.tsx';
import {
  MapPin,
  Search,
  Filter,
  Phone,
  ExternalLink,
  Star,
  Globe,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  Loader2,
  Navigation,
  Compass,
  Layers,
  Building2,
  Share2,
  EyeOff,
  Eye,
  Award,
  Clock
} from 'lucide-react';

interface GoogleMapsProspectsViewProps {
  prospects: Prospect[];
  settings: AppSettings;
  lang: 'en' | 'es';
  onSelectProspect: (prospect: Prospect) => void;
  onSearchGoogleMaps: (searchParams: {
    location: string;
    query: string;
    onlyNoWebsite?: boolean;
    minRating?: number;
  }) => Promise<void>;
  onUpdateStatus?: (id: string, status: LeadStatus, notes?: string) => void;
  onDeleteNotInterested?: (id: string) => void;
  isSearching: boolean;
  searchError?: string | null;
}

// Controller component to smoothly center & zoom map when target coordinates change
function MapRecenterController({ center, zoom }: { center: { lat: number; lng: number }; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (map && center && !isNaN(center.lat) && !isNaN(center.lng)) {
      map.panTo(center);
      if (zoom) map.setZoom(zoom);
    }
  }, [map, center.lat, center.lng, zoom]);
  return null;
}

export const GoogleMapsProspectsView: React.FC<GoogleMapsProspectsViewProps> = ({
  prospects,
  settings,
  lang,
  onSelectProspect,
  onSearchGoogleMaps,
  onUpdateStatus,
  onDeleteNotInterested,
  isSearching,
  searchError
}) => {
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();

  // Search parameters
  const [cityInput, setCityInput] = useState(() => settings.cities[0] || 'Madrid, Spain');
  const [queryInput, setQueryInput] = useState(() => 'barbershop');
  const [onlyNoWebsite, setOnlyNoWebsite] = useState(true);
  const [filterHideContacted, setFilterHideContacted] = useState(true);
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Default initial center (Madrid)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 40.4168,
    lng: -3.7038
  });
  const [mapZoom, setMapZoom] = useState<number>(13);

  // Filter prospects with valid coordinates
  const geolocatedProspects = useMemo(() => {
    return prospects.filter((p) => {
      const hasCoords = typeof p.latitude === 'number' && typeof p.longitude === 'number' && !isNaN(p.latitude) && !isNaN(p.longitude);
      if (!hasCoords) return false;
      if (filterHideContacted) {
        if (
          p.isContacted ||
          p.status === 'contacted' ||
          p.status === 'waiting' ||
          p.status === 'client_signed' ||
          p.status === 'not_interested' ||
          p.status === 'excluded'
        ) {
          return false;
        }
      }
      if (onlyNoWebsite && p.websiteStatus === 'website_exists') return false;
      if (minRatingFilter > 0 && p.reviewRating < minRatingFilter) return false;
      return true;
    });
  }, [prospects, filterHideContacted, onlyNoWebsite, minRatingFilter]);

  // Center map on highest priority prospect when geolocatedProspects change
  useEffect(() => {
    if (geolocatedProspects.length > 0) {
      const firstWithCoords = geolocatedProspects[0];
      if (firstWithCoords.latitude && firstWithCoords.longitude) {
        setMapCenter({
          lat: firstWithCoords.latitude,
          lng: firstWithCoords.longitude
        });
      }
    }
  }, [geolocatedProspects.length]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loc = cityInput.trim() || 'Madrid, Spain';
    const q = queryInput.trim() || 'barbershop';
    await onSearchGoogleMaps({
      location: loc,
      query: q,
      onlyNoWebsite,
      minRating: minRatingFilter > 0 ? minRatingFilter : undefined
    });
  };

  const handleSelectFromList = (p: Prospect) => {
    setSelectedProspect(p);
    if (p.latitude && p.longitude) {
      setMapCenter({ lat: p.latitude, lng: p.longitude });
      setMapZoom(16);
    }
  };

  // Preset location quick picks
  const quickLocations = ['Madrid, Spain', 'Barcelona, Spain', 'London, UK', 'New York, USA', 'Miami, USA', 'Valencia, Spain'];
  const quickNiches = [
    { en: 'Barbershop', es: 'Peluquería' },
    { en: 'Italian Restaurant', es: 'Restaurante' },
    { en: 'Dental Clinic', es: 'Clínica Dental' },
    { en: 'Bakery', es: 'Panadería' },
    { en: 'Auto Repair', es: 'Taller Mecánico' },
    { en: 'Fitness Gym', es: 'Gimnasio' },
  ];

  if (!apiKey) {
    return (
      <div className="mx-auto max-w-4xl p-6 sm:p-12 text-center">
        <div className="rounded-3xl border border-amber-500/30 bg-amber-950/20 p-8 text-amber-200">
          <AlertCircle className="mx-auto h-12 w-12 text-amber-400 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            {lang === 'es' ? 'Clave de Google Maps requerida' : 'Google Maps API Key Required'}
          </h2>
          <p className="text-sm text-amber-300/90 max-w-lg mx-auto mb-6">
            {lang === 'es'
              ? 'Para explorar negocios reales con Google Maps, introduce tu API Key en la configuración o variables de entorno.'
              : 'To research and visualize real-time commercial businesses on Google Maps, provide your API key in environment settings.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full overflow-hidden bg-[#090d18]">
      {/* Search & Filter Header Bar */}
      <div className="shrink-0 border-b border-slate-800 bg-[#0c1222]/95 px-4 py-3 backdrop-blur-md z-10 shadow-lg">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2.5">
          {/* Location input */}
          <div className="flex-1 min-w-[200px] relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400" />
            <input
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder={lang === 'es' ? 'Ciudad o territorio (ej. Madrid, Spain)' : 'City or territory (e.g. Madrid, Spain)'}
              className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Business Category input */}
          <div className="flex-1 min-w-[180px] relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder={lang === 'es' ? 'Nicho / Negocio (ej. Peluquería)' : 'Niche / Business (e.g. Barbershop)'}
              className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Only No Website Toggle */}
          <button
            type="button"
            onClick={() => setOnlyNoWebsite((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer select-none ${
              onlyNoWebsite
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-900/30'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>{lang === 'es' ? 'Solo Sin Web' : 'Only Without Website'}</span>
          </button>

          {/* Hide Contacted Toggle */}
          <button
            type="button"
            onClick={() => setFilterHideContacted((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer select-none ${
              filterHideContacted
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-900/30'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title={lang === 'es' ? 'Ocultar negocios ya contactados, en espera o firmados' : 'Hide businesses already contacted, waiting, or signed'}
          >
            {filterHideContacted ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span>{filterHideContacted ? (lang === 'es' ? 'Ocultar Contactados' : 'Hide Contacted') : (lang === 'es' ? 'Ver Todos' : 'Show All')}</span>
          </button>

          {/* Min Rating Filter */}
          <select
            value={minRatingFilter}
            onChange={(e) => setMinRatingFilter(Number(e.target.value))}
            className="rounded-xl bg-slate-900/90 border border-slate-700/80 px-2.5 py-2 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none cursor-pointer"
          >
            <option value={0}>{lang === 'es' ? 'Todas las estrellas' : 'All Ratings'}</option>
            <option value={4.0}>★ 4.0+</option>
            <option value={4.5}>★ 4.5+</option>
            <option value={4.8}>★ 4.8+ ({lang === 'es' ? 'Top clientes' : 'Top leads'})</option>
          </select>

          {/* Search Button */}
          <button
            type="submit"
            disabled={isSearching}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition cursor-pointer disabled:opacity-50"
          >
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>{lang === 'es' ? 'Buscando en Maps...' : 'Searching Maps...'}</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                <span>{lang === 'es' ? 'Buscar en Google Maps' : 'Search Google Maps'}</span>
              </>
            )}
          </button>

          {/* Toggle sidebar button */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title={lang === 'es' ? 'Mostrar/Ocultar lista de negocios' : 'Toggle businesses list'}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </form>

        {/* Quick Location & Niche Chips */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/60 overflow-x-auto no-scrollbar text-[11px]">
          <span className="text-slate-400 shrink-0 font-medium">
            {lang === 'es' ? 'Accesos rápidos:' : 'Quick shortcuts:'}
          </span>
          {quickLocations.slice(0, 4).map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => {
                setCityInput(loc);
                onSearchGoogleMaps({
                  location: loc,
                  query: queryInput,
                  onlyNoWebsite,
                  minRating: minRatingFilter > 0 ? minRatingFilter : undefined
                });
              }}
              className="px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition cursor-pointer shrink-0"
            >
              {loc}
            </button>
          ))}
          <span className="text-slate-600">|</span>
          {quickNiches.slice(0, 4).map((n) => {
            const label = lang === 'es' ? n.es : n.en;
            return (
              <button
                key={n.en}
                type="button"
                onClick={() => {
                  setQueryInput(label);
                  onSearchGoogleMaps({
                    location: cityInput,
                    query: label,
                    onlyNoWebsite,
                    minRating: minRatingFilter > 0 ? minRatingFilter : undefined
                  });
                }}
                className="px-2 py-0.5 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 border border-indigo-700/40 transition cursor-pointer shrink-0"
              >
                {label}
              </button>
            );
          })}
        </div>

        {searchError && (
          <div className="mt-2 text-xs text-rose-400 flex items-center gap-1.5 bg-rose-950/30 p-2 rounded-lg border border-rose-800/40">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{searchError}</span>
          </div>
        )}
      </div>

      {/* Main Map + Sidebar Workspace */}
      <div className="relative flex-1 w-full flex overflow-hidden">
        {/* Left Side Businesses List Drawer */}
        {isSidebarOpen && (
          <aside className="w-80 sm:w-96 shrink-0 h-full border-r border-slate-800 bg-[#0a0f1d]/95 backdrop-blur-md flex flex-col z-20 shadow-xl overflow-hidden transition-all">
            <div className="p-3 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {lang === 'es' ? 'Negocios en el Mapa' : 'Businesses on Map'} ({geolocatedProspects.length})
                </span>
              </div>
              <span className="text-[10px] text-cyan-400 font-mono font-semibold bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/30">
                Google Maps Places API
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 p-2">
              {geolocatedProspects.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  <Compass className="h-8 w-8 mx-auto text-slate-600 mb-2 opacity-50" />
                  <p>{lang === 'es' ? 'No hay negocios visibles con estos filtros.' : 'No businesses visible with current filters.'}</p>
                  <p className="mt-1 text-slate-600">
                    {lang === 'es' ? 'Prueba a pulsar "Buscar en Google Maps" arriba.' : 'Try clicking "Search Google Maps" above.'}
                  </p>
                </div>
              ) : (
                geolocatedProspects.map((p) => {
                  const isSelected = selectedProspect?.id === p.id;
                  const isNoWeb = p.websiteStatus === 'no_website';
                  const isSocial = p.websiteStatus === 'possibly_no_website';
                  const mapsUrl = getGoogleMapsUrl(p);

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectFromList(p)}
                      className={`p-3 rounded-xl transition cursor-pointer mb-1 border ${
                        isSelected
                          ? 'bg-cyan-950/50 border-cyan-500/60 shadow-md shadow-cyan-950/50'
                          : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                            {p.name}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {p.category} • {p.city}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-mono font-extrabold text-cyan-400 bg-cyan-950/70 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                          {p.leadScore} pts
                        </span>
                      </div>

                      {/* Ratings & Status Pill */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px]">
                        {p.status === 'client_signed' && (
                          <span className="flex items-center gap-1 font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.5 rounded">
                            <Award className="h-3 w-3 text-emerald-400" />
                            <span>{lang === 'es' ? 'Cliente Firmado' : 'Client Signed'}</span>
                          </span>
                        )}
                        {p.status === 'waiting' && (
                          <span className="flex items-center gap-1 font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-1.5 py-0.5 rounded">
                            <Clock className="h-3 w-3 text-amber-400" />
                            <span>{lang === 'es' ? 'En Espera' : 'Waiting'}</span>
                          </span>
                        )}
                        {(p.status === 'contacted' || p.isContacted) && p.status !== 'client_signed' && p.status !== 'waiting' && (
                          <span className="flex items-center gap-1 font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-1.5 py-0.5 rounded">
                            <CheckCircle2 className="h-3 w-3 text-cyan-400" />
                            <span>{lang === 'es' ? 'Contactado' : 'Contacted'}</span>
                          </span>
                        )}

                        {p.reviewRating > 0 && (
                          <span className="flex items-center gap-1 font-semibold text-amber-400 bg-amber-950/40 border border-amber-600/30 px-1.5 py-0.5 rounded">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {p.reviewRating} ({p.reviewCount})
                          </span>
                        )}

                        {isNoWeb ? (
                          <span className="font-semibold text-rose-400 bg-rose-950/40 border border-rose-500/30 px-1.5 py-0.5 rounded">
                            {lang === 'es' ? 'Sin Web' : 'No Website'}
                          </span>
                        ) : isSocial ? (
                          <span className="font-semibold text-amber-300 bg-amber-950/40 border border-amber-500/30 px-1.5 py-0.5 rounded">
                            {lang === 'es' ? 'Solo Redes' : 'Social Only'}
                          </span>
                        ) : (
                          <span className="text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded">
                            {lang === 'es' ? 'Con Web' : 'Has Website'}
                          </span>
                        )}
                      </div>

                      {/* Contact Action Bar */}
                      <div className="flex items-center justify-between gap-1.5 mt-2 pt-2 border-t border-slate-800/60 text-[11px]">
                        {p.phone ? (
                          <a
                            href={`tel:${p.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 text-slate-300 hover:text-cyan-400 transition"
                          >
                            <Phone className="h-3 w-3 text-emerald-400" />
                            <span className="truncate max-w-[100px]">{p.phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-500">{lang === 'es' ? 'Sin teléfono' : 'No phone'}</span>
                        )}

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {onUpdateStatus && (
                            <ContactOutcomeMenu
                              prospect={p}
                              lang={lang}
                              compact
                              onUpdateStatus={onUpdateStatus}
                              onDeleteNotInterested={
                                onDeleteNotInterested
                                  ? (id) => {
                                      if (selectedProspect?.id === id) setSelectedProspect(null);
                                      onDeleteNotInterested(id);
                                    }
                                  : undefined
                              }
                            />
                          )}
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition"
                            title="Open Google Maps link"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <button
                            type="button"
                            onClick={() => onSelectProspect(p)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 font-medium transition cursor-pointer"
                          >
                            <span>{lang === 'es' ? 'Ficha' : 'Pitch'}</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}

        {/* Map Container */}
        <div className="flex-1 h-full w-full relative">
          <APIProvider apiKey={apiKey} language={lang}>
            <Map
              defaultCenter={mapCenter}
              defaultZoom={mapZoom}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              className="w-full h-full"
              style={{ width: '100%', height: '100%' }}
              gestureHandling="greedy"
              disableDefaultUI={false}
            >
              <MapRecenterController center={mapCenter} zoom={mapZoom} />

              {/* Advanced Markers for each business */}
              {geolocatedProspects.map((prospect) => {
                if (!prospect.latitude || !prospect.longitude) return null;

                const isNoWeb = prospect.websiteStatus === 'no_website';
                const isSocial = prospect.websiteStatus === 'possibly_no_website';
                const isSigned = prospect.status === 'client_signed';
                const isWaiting = prospect.status === 'waiting';
                const isContacted = Boolean(prospect.isContacted || prospect.status === 'contacted');

                // Custom pin background colors
                const background = isSigned
                  ? '#8b5cf6' // purple/gold for signed client
                  : isWaiting
                  ? '#f59e0b' // amber for waiting response/payment
                  : isContacted
                  ? '#10b981' // emerald for contacted
                  : isNoWeb
                  ? '#ef4444' // red (prime opportunity!)
                  : isSocial
                  ? '#ea580c' // orange
                  : '#3b82f6'; // blue

                const glyphColor = '#ffffff';
                const borderColor = '#0f172a';

                return (
                  <AdvancedMarker
                    key={prospect.id}
                    position={{ lat: prospect.latitude, lng: prospect.longitude }}
                    title={prospect.name}
                    onClick={() => setSelectedProspect(prospect)}
                  >
                    <Pin
                      background={background}
                      glyphColor={glyphColor}
                      borderColor={borderColor}
                      scale={isNoWeb ? 1.25 : 1.0}
                    />
                  </AdvancedMarker>
                );
              })}

              {/* InfoWindow popup on selected pin */}
              {selectedProspect && selectedProspect.latitude && selectedProspect.longitude && (
                <InfoWindow
                  position={{ lat: selectedProspect.latitude, lng: selectedProspect.longitude }}
                  onCloseClick={() => setSelectedProspect(null)}
                  maxWidth={320}
                >
                  <div className="p-1 text-slate-900 font-sans">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-1.5 mb-2">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 leading-tight">
                          {selectedProspect.name}
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {selectedProspect.category}
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold text-cyan-700 bg-cyan-100 px-1.5 py-0.5 rounded">
                        {selectedProspect.leadScore} pts
                      </span>
                    </div>

                    {/* Ratings */}
                    {selectedProspect.reviewRating > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-800 mb-1.5 font-medium">
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        <span>{selectedProspect.reviewRating}</span>
                        <span className="text-slate-500">({selectedProspect.reviewCount} {lang === 'es' ? 'reseñas de Google' : 'Google reviews'})</span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="mb-2">
                      {selectedProspect.websiteStatus === 'no_website' ? (
                        <span className="inline-block text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                          {lang === 'es' ? '🚨 100% Sin Sitio Web (Gran Oportunidad)' : '🚨 100% No Website (Top Opportunity)'}
                        </span>
                      ) : selectedProspect.websiteStatus === 'possibly_no_website' ? (
                        <span className="inline-block text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                          {lang === 'es' ? '📱 Solo Perfil en Redes (Sin Web Propia)' : '📱 Social Profile Only (No Real Web)'}
                        </span>
                      ) : (
                        <span className="inline-block text-[11px] font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                          {lang === 'es' ? '🌐 Sitio Web Existente' : '🌐 Website Exists'}
                        </span>
                      )}
                    </div>

                    {/* Address & Phone */}
                    <p className="text-xs text-slate-600 mb-2 flex items-start gap-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
                      <span>{selectedProspect.address}</span>
                    </p>

                    {selectedProspect.phone && (
                      <p className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-emerald-600" />
                        <a href={`tel:${selectedProspect.phone}`} className="hover:underline text-emerald-700">
                          {selectedProspect.phone}
                        </a>
                      </p>
                    )}

                    {/* Action buttons inside InfoWindow */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 mt-2">
                      {onUpdateStatus && (
                        <div className="w-full">
                          <ContactOutcomeMenu
                            prospect={selectedProspect}
                            lang={lang}
                            onUpdateStatus={onUpdateStatus}
                            onDeleteNotInterested={
                              onDeleteNotInterested
                                ? (id) => {
                                    setSelectedProspect(null);
                                    onDeleteNotInterested(id);
                                  }
                                : undefined
                            }
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <a
                          href={getGoogleMapsUrl(selectedProspect)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold py-1.5 px-2 transition"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Google Maps</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => onSelectProspect(selectedProspect)}
                          className="flex-1 flex items-center justify-center gap-1 rounded bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold py-1.5 px-2 transition cursor-pointer shadow-sm"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>{lang === 'es' ? 'Crear Propuesta' : 'Pitch Brief'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>

          {/* Floating Map Legend */}
          <div className="absolute bottom-6 right-6 bg-[#0a0f1d]/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-xl z-10 text-[11px] text-slate-300 flex flex-col gap-1.5">
            <span className="font-bold text-white uppercase text-[10px] tracking-wider mb-0.5">
              {lang === 'es' ? 'Leyenda de Oportunidad' : 'Opportunity Pins'}
            </span>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-purple-500 inline-block shadow-sm shadow-purple-500/50"></span>
              <span>{lang === 'es' ? '🎉 Cliente Firmado / Ganado' : '🎉 Client Signed / Won'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-500 inline-block"></span>
              <span>{lang === 'es' ? '⏳ En Espera (Respuesta / Pago)' : '⏳ Waiting for Response / Payment'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block"></span>
              <span>{lang === 'es' ? 'Contactado' : 'Contacted Lead'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500 inline-block shadow-sm shadow-rose-500/50"></span>
              <span>{lang === 'es' ? 'Sin Sitio Web (Prioridad Alta)' : 'No Website (Top Priority)'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-orange-500 inline-block"></span>
              <span>{lang === 'es' ? 'Solo Redes Sociales / Linktree' : 'Social Only / Linktree'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blue-500 inline-block"></span>
              <span>{lang === 'es' ? 'Sitio Web Existente' : 'Website Exists'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
