import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { Smartphone, Download, Share, X, Check } from 'lucide-react';

export const PWAInstallButton: React.FC<{ lang?: 'en' | 'es' }> = ({ lang = 'en' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running in standalone mode (from home screen), hide the prompt
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition cursor-pointer"
        title={lang === 'es' ? 'Añadir a la pantalla de inicio' : 'Add to home screen'}
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{lang === 'es' ? 'Instalar App' : 'Add to Home'}</span>
        <span className="sm:hidden">{lang === 'es' ? 'Instalar' : 'Install'}</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-950/40 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/50 transition cursor-pointer"
          title="Add to Home Screen on iOS"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>{lang === 'es' ? 'Añadir al Móvil' : 'Add to Mobile'}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-[#0f172a] p-5 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">
                    {lang === 'es' ? 'Añadir a Pantalla de Inicio' : 'Add to iPhone / iPad'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] font-bold text-cyan-400">1</span>
                  <span>{lang === 'es' ? 'Pulsa el botón de Compartir' : 'Tap the Share button'} <Share className="inline w-3.5 h-3.5 text-cyan-400 mx-1" /> {lang === 'es' ? 'en la barra inferior de Safari.' : 'in the Safari toolbar.'}</span>
                </div>
                <div className="flex items-start gap-2.5 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] font-bold text-cyan-400">2</span>
                  <span>{lang === 'es' ? 'Desplázate hacia abajo y selecciona "Añadir a la pantalla de inicio".' : 'Scroll down and tap "Add to Home Screen".'}</span>
                </div>
                <div className="flex items-start gap-2.5 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] font-bold text-cyan-400">3</span>
                  <span>{lang === 'es' ? '¡Listo! Ábrelo desde tu pantalla de inicio como una app nativa a pantalla completa.' : 'Open it anytime from your home screen as a full-screen native app.'}</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-cyan-500 py-2 text-xs font-bold text-white hover:bg-cyan-400 transition"
              >
                {lang === 'es' ? 'Entendido' : 'Got it'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback for devices without native prompt
  return (
    <button
      onClick={() => setShowIOSGuide(true)}
      className="hidden md:flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white transition cursor-pointer"
      title="Mobile Home Screen Installation"
    >
      <Smartphone className="w-3 h-3 text-cyan-400" />
      <span>{lang === 'es' ? 'App Móvil' : 'Mobile App'}</span>
    </button>
  );
};
