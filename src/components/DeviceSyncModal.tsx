import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Laptop,
  QrCode,
  Copy,
  Check,
  CheckCircle2,
  Database,
  Cloud,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import type { Prospect } from '../types/index.ts';
import { saveStoredProspects, getStoredProspects, computeStats } from '../services/clientDataEngine.ts';

interface DeviceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospects: Prospect[];
  lang?: 'en' | 'es';
  onSyncImported?: (importedCount: number) => void;
}

export const DeviceSyncModal: React.FC<DeviceSyncModalProps> = ({
  isOpen,
  onClose,
  prospects,
  lang = 'en',
  onSyncImported
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'cloudflare'>('qr');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedBindingName, setCopiedBindingName] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter only contacted, in-progress, or won leads for the sync payload
  const contactedToSync = prospects.filter((p) =>
    Boolean(
      p.isContacted ||
      p.status === 'contacted' ||
      p.status === 'waiting' ||
      p.status === 'client_signed'
    )
  );

  // Generate lightweight sync payload
  const syncPayload = JSON.stringify(
    contactedToSync.map((p) => ({
      id: p.id,
      name: p.name,
      normalizedName: p.normalizedName,
      phone: p.phone,
      address: p.address,
      city: p.city,
      category: p.category,
      websiteStatus: p.websiteStatus,
      status: p.status,
      leadScore: p.leadScore,
      notes: p.notes,
      isContacted: true,
      contactedAt: p.contactedAt || new Date().toISOString()
    }))
  );

  const base64Data = typeof window !== 'undefined' ? btoa(unescape(encodeURIComponent(syncPayload))) : '';
  const syncUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}#sync=${base64Data}`
    : '';

  // Quick QR Code generator via standard public Google Chart / QR service or SVG
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(syncUrl)}&bgcolor=090d18&color=38bdf8&margin=6`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(syncUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(base64Data);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleManualImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;
    try {
      const decodedJson = decodeURIComponent(escape(atob(manualCodeInput.trim())));
      const items = JSON.parse(decodedJson);
      if (Array.isArray(items) && items.length > 0) {
        const current = getStoredProspects();
        const map = new Map<string, Prospect>();
        for (const p of current) map.set(p.id, p);
        for (const item of items) {
          map.set(item.id, { ...(map.get(item.id) || {}), ...item, isContacted: true });
        }
        const merged = Array.from(map.values());
        saveStoredProspects(merged);
        setImportStatus(
          lang === 'es'
            ? `¡${items.length} clientes contactados importados con éxito!`
            : `Successfully imported ${items.length} contacted clients!`
        );
        if (onSyncImported) onSyncImported(items.length);
        setManualCodeInput('');
      } else {
        setImportStatus(lang === 'es' ? 'Código de sincronización vacío.' : 'Sync code contains 0 records.');
      }
    } catch (err: any) {
      setImportStatus(lang === 'es' ? 'Error al procesar el código de sincronización.' : 'Invalid sync code format.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-700 bg-[#0c1222] p-5 sm:p-7 shadow-2xl text-slate-100 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{lang === 'es' ? 'Sincronizar PC & Móvil' : 'Sync PC & Mobile'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {contactedToSync.length} {lang === 'es' ? 'contactados' : 'contacted'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'es'
                  ? 'Accede a tus clientes contactados desde tu teléfono móvil o PC en cualquier momento.'
                  : 'Access your contacted clients on your phone or PC with zero lost leads.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-4 mb-5 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span>{lang === 'es' ? '1. Escanear con Móvil (Instantáneo)' : '1. Scan with Phone (Instant)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('cloudflare')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'cloudflare'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cloud className="w-4 h-4 text-indigo-400" />
            <span>{lang === 'es' ? '2. Cloudflare D1 (Nuevo Menú)' : '2. Cloudflare D1 (Updated Menu)'}</span>
          </button>
        </div>

        {/* TAB 1: Instant QR Code & Link Sync */}
        {activeTab === 'qr' && (
          <div className="space-y-4">
            {/* Live Cloud Sync Banner */}
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div className="flex-1">
                <span className="font-bold">
                  {lang === 'es' ? 'Sincronización en Vivo PC & Móvil Activa: ' : 'Live Cloud Sync Active: '}
                </span>
                <span className="text-slate-300 text-[11px]">
                  {lang === 'es'
                    ? 'Cualquier modificación o edición realizada en PC o en tu teléfono se actualiza en tiempo real en todos tus dispositivos conectados.'
                    : 'Any edits or modifications made on your PC or phone register in real-time across all your devices.'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-950/60 rounded-2xl p-4 sm:p-5 border border-slate-800">
              {/* QR Code Container */}
              <div className="shrink-0 flex flex-col items-center justify-center p-3 rounded-2xl bg-[#090d18] border border-cyan-500/30 shadow-lg shadow-cyan-950/50">
                <img
                  src={qrCodeUrl}
                  alt="Sync QR Code"
                  className="w-40 h-40 sm:w-44 sm:h-44 rounded-xl"
                />
                <span className="text-[10px] text-cyan-400 font-mono mt-2 flex items-center gap-1 font-semibold">
                  <Smartphone className="w-3 h-3" />
                  {lang === 'es' ? 'Apunta tu cámara' : 'Point phone camera'}
                </span>
              </div>

              {/* Instructions */}
              <div className="flex-1 space-y-3 text-xs">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>{lang === 'es' ? 'Abre LeadHunter en tu Teléfono Móvil' : 'Open LeadHunter on your Mobile Phone'}</span>
                  </h3>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {lang === 'es'
                      ? 'Abre la cámara de tu teléfono móvil, enfoca el código QR y pulsa en abrir. ¡Tus clientes contactados se guardarán automáticamente en tu móvil para siempre!'
                      : 'Open your mobile phone camera, scan the QR code and tap open. All your contacted clients will be permanently stored on your phone!'}
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition cursor-pointer text-xs shadow-md shadow-cyan-900/30"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? (lang === 'es' ? '¡Enlace Copiado!' : 'Link Copied!') : (lang === 'es' ? 'Copiar Enlace de Sincronización' : 'Copy Sync Link')}</span>
                  </button>

                  <button
                    onClick={handleCopyCode}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition cursor-pointer text-xs"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{lang === 'es' ? 'Copiar Código' : 'Copy Code'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-emerald-300 bg-emerald-950/30 border border-emerald-500/20 p-2 rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {lang === 'es'
                      ? 'Aunque limpies las búsquedas, tus contactados nunca se borrarán.'
                      : 'Cleaning search lists will never delete your contacted clients.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Manual Code Import for Phone */}
            <form onSubmit={handleManualImport} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                {lang === 'es' ? '¿Estás en tu teléfono? Pega aquí el código copiado de tu PC:' : 'On your phone? Paste the sync code copied from your PC:'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCodeInput}
                  onChange={(e) => setManualCodeInput(e.target.value)}
                  placeholder={lang === 'es' ? 'Pega el código de sincronización aquí...' : 'Paste sync code here...'}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-600 transition cursor-pointer"
                >
                  {lang === 'es' ? 'Importar' : 'Import'}
                </button>
              </div>
              {importStatus && (
                <p className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{importStatus}</span>
                </p>
              )}
            </form>
          </div>
        )}

        {/* TAB 2: Cloudflare D1 Guide (Where is it in the new dashboard) */}
        {activeTab === 'cloudflare' && (
          <div className="space-y-4 text-xs">
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-4 text-indigo-200">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                <Database className="w-4 h-4 text-indigo-400" />
                <span>
                  {lang === 'es'
                    ? '¿Por qué no aparece "Functions" en Cloudflare?'
                    : 'Where is the D1 setting in the new Cloudflare Dashboard?'}
                </span>
              </h3>
              <p className="text-xs text-indigo-300/90 leading-relaxed">
                {lang === 'es'
                  ? 'Cloudflare ha actualizado su panel de control: ahora la opción se llama "Bindings" (o "Variables and Secrets" → "Bindings") dentro de Settings de tu proyecto Pages.'
                  : 'Cloudflare updated their dashboard layout: D1 database connections are now located under "Bindings" (or "Variables and Secrets" → "Bindings") inside your project Settings.'}
              </p>
            </div>

            {/* Step-by-step visual path */}
            <div className="space-y-3 bg-slate-950/60 rounded-2xl p-4 border border-slate-800">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">
                {lang === 'es' ? 'Ruta exacta en el panel de Cloudflare:' : 'Exact path in Cloudflare Dashboard:'}
              </h4>

              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 font-mono font-bold text-[11px]">1</span>
                  <div>
                    <span className="font-bold text-white">Compute (Workers & Pages)</span>
                    <span className="text-slate-400"> → Pulsa en tu proyecto (ej: <code className="text-cyan-300 font-mono">searchingine</code>).</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 font-mono font-bold text-[11px]">2</span>
                  <div>
                    <span className="font-bold text-white">Settings</span>
                    <span className="text-slate-400"> (pestaña superior o lateral).</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 font-mono font-bold text-[11px]">3</span>
                  <div>
                    <span className="font-bold text-emerald-400">Bindings</span>
                    <span className="text-slate-400"> (en la barra lateral izquierda bajo Settings). *Si ves "Variables and Secrets", haz clic ahí y luego en "Bindings".*</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 font-mono font-bold text-[11px]">4</span>
                  <div>
                    <span className="font-bold text-white">Add</span> → Selecciona <span className="font-bold text-cyan-400">D1 Database</span>:
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-700">
                        <span className="text-slate-400 block text-[10px]">Variable name (exacto):</span>
                        <div className="flex items-center justify-between font-mono font-bold text-cyan-300">
                          <span>DB</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('DB');
                              setCopiedBindingName(true);
                              setTimeout(() => setCopiedBindingName(false), 2000);
                            }}
                            className="text-[10px] text-slate-400 hover:text-white"
                          >
                            {copiedBindingName ? '✓' : 'Copiar'}
                          </button>
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-700">
                        <span className="text-slate-400 block text-[10px]">D1 Database:</span>
                        <span className="font-mono font-bold text-white">leadhunter_db</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 font-mono font-bold text-[11px]">5</span>
                  <div>
                    <span className="font-bold text-white">Save</span>
                    <span className="text-slate-400"> → ¡Listo! A partir de ese momento, cada vez que marques un cliente en tu PC o móvil, se sincronizará automáticamente por la nube.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition cursor-pointer"
          >
            {lang === 'es' ? 'Cerrar' : 'Done'}
          </button>
        </div>

      </div>
    </div>
  );
};
