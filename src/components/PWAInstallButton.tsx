import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { Download, Monitor, CheckCircle, HelpCircle, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ lang?: 'en' | 'es' }> = ({ lang = 'en' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 rounded-lg">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>{lang === 'es' ? 'App de Escritorio Instalada' : 'Desktop App Active'}</span>
      </div>
    );
  }

  return (
    <>
      {isInstallable ? (
        <button
          onClick={install}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-cyan-900/40 hover:from-cyan-400 hover:to-blue-500 active:scale-95 transition"
          title={lang === 'es' ? 'Instalar LeadHunter AI en el escritorio de Windows / macOS' : 'Install LeadHunter AI on Windows / macOS desktop'}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>{lang === 'es' ? 'Instalar App Escritorio' : 'Install Desktop App'}</span>
        </button>
      ) : isIOS ? (
        <button
          onClick={() => setShowGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>{lang === 'es' ? 'Instalar en iOS' : 'Install on iOS'}</span>
        </button>
      ) : (
        <button
          onClick={() => setShowGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
          title="Desktop App Installation Instructions"
        >
          <Monitor className="w-3.5 h-3.5 text-cyan-400" />
          <span>{lang === 'es' ? 'App de Escritorio' : 'Desktop App'}</span>
        </button>
      )}

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0f172a] p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Monitor className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {lang === 'es' ? 'Instalación de LeadHunter AI en Escritorio' : 'LeadHunter AI Desktop Installation'}
                </h3>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-sm text-slate-300">
              <div className="rounded-xl bg-slate-900/80 p-3.5 border border-slate-800 space-y-2">
                <p className="font-semibold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-bold">1</span>
                  {lang === 'es' ? 'En Chrome / Edge (Windows, Mac o Linux)' : 'In Chrome / Edge (Windows, Mac, or Linux)'}
                </p>
                <p className="text-xs text-slate-400 pl-7">
                  {lang === 'es'
                    ? 'Haz clic en el icono de instalación (pantalla con flecha) situado en la barra de direcciones superior del navegador, o en el menú de 3 puntos selecciona "Instalar LeadHunter AI".'
                    : 'Click the install icon (computer with down arrow) in your browser URL bar, or click the 3 dots menu and select "Install LeadHunter AI".'}
                </p>
              </div>

              <div className="rounded-xl bg-slate-900/80 p-3.5 border border-slate-800 space-y-2">
                <p className="font-semibold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-bold">2</span>
                  {lang === 'es' ? 'En Safari / macOS' : 'In Safari / macOS'}
                </p>
                <p className="text-xs text-slate-400 pl-7">
                  {lang === 'es'
                    ? 'Ve a Archivo > "Añadir al Dock..." para crear un icono nativo en tu dock de macOS.'
                    : 'Click File > "Add to Dock..." to launch LeadHunter as a standalone macOS application.'}
                </p>
              </div>

              <div className="rounded-xl bg-slate-900/80 p-3.5 border border-slate-800 space-y-2">
                <p className="font-semibold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-bold">3</span>
                  {lang === 'es' ? 'Búsquedas Autónomas en Servidor' : 'Autonomous Server Execution'}
                </p>
                <p className="text-xs text-slate-400 pl-7">
                  {lang === 'es'
                    ? 'El motor de búsqueda diaria se ejecuta en segundo plano en el servidor. No necesitas mantener la aplicación de escritorio abierta para que se completen las investigaciones programadas.'
                    : 'Scheduled daily prospecting runs autonomously on the backend server. The app does not need to stay open for daily discoveries to execute.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full rounded-xl bg-cyan-500 py-2.5 text-xs font-semibold text-white hover:bg-cyan-400 transition"
            >
              {lang === 'es' ? 'Entendido' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
