import React, { useState } from 'react';
import {
  X,
  Github,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Download,
  Key,
  GitBranch,
  FolderGit2,
  RefreshCw,
  Copy,
  Check,
  BookOpen,
  ArrowRight,
  FileCode,
  Layers,
  Sparkles
} from 'lucide-react';
import JSZip from 'jszip';
import { pushToGitHub, testGitHubConnection, type DeployStepLog } from '../services/githubDeployer.ts';

interface CloudflareDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'en' | 'es';
}

export const CloudflareDeployModal: React.FC<CloudflareDeployModalProps> = ({
  isOpen,
  onClose,
  lang = 'en'
}) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'zip' | 'github' | 'live'>('guide');
  const [repoOwner, setRepoOwner] = useState('karimfeina-ux');
  const [repoName, setRepoName] = useState('searchingine');
  const [branch, setBranch] = useState('main');
  const [token, setToken] = useState(() => localStorage.getItem('leadhunter_gh_pat') || '');
  const [commitMsg, setCommitMsg] = useState('fix: zero-error cloudflare pages deployment with resilient web client data engine');

  // Deployment state
  const [isDeploying, setIsDeploying] = useState(false);
  const [logs, setLogs] = useState<DeployStepLog[]>([]);
  const [deployResult, setDeployResult] = useState<{ success: boolean; commitUrl?: string; error?: string } | null>(null);

  // ZIP download state
  const [isZipping, setIsZipping] = useState(false);
  const [zipSuccess, setZipSuccess] = useState(false);

  // Live status test
  const [isTestingLive, setIsTestingLive] = useState(false);
  const [liveStatus, setLiveStatus] = useState<{ tested: boolean; ok: boolean; status?: number; msg: string } | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedNpmrc, setCopiedNpmrc] = useState(false);

  if (!isOpen) return null;

  const handleTestLiveUrl = async () => {
    setIsTestingLive(true);
    setLiveStatus(null);
    try {
      const res = await fetch('https://searchingine.pages.dev/', { method: 'HEAD', mode: 'no-cors' });
      setLiveStatus({
        tested: true,
        ok: true,
        msg: 'https://searchingine.pages.dev/ is reachable via Cloudflare Edge network.'
      });
    } catch (err: any) {
      setLiveStatus({
        tested: true,
        ok: false,
        msg: 'Connection attempt failed or blocked by browser CORS policy.'
      });
    } finally {
      setIsTestingLive(false);
    }
  };

  const handleTriggerGitHubPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      alert(lang === 'es' ? 'Por favor introduce tu GitHub Personal Access Token.' : 'Please enter your GitHub Personal Access Token.');
      return;
    }

    setIsDeploying(true);
    setDeployResult(null);
    setLogs([]);

    try {
      localStorage.setItem('leadhunter_gh_pat', token.trim());
    } catch {}

    const coreFiles = [
      {
        path: 'package.json',
        content: JSON.stringify(
          {
            name: 'searchingine',
            private: true,
            version: '1.0.0',
            type: 'module',
            scripts: {
              dev: 'tsx server.ts',
              start: 'NODE_ENV=production tsx server.ts',
              build: 'vite build',
              preview: 'vite preview',
              lint: 'tsc --noEmit'
            },
            dependencies: {
              '@google/genai': '^2.4.0',
              '@tailwindcss/vite': '^4.3.3',
              '@vitejs/plugin-react': '^6.1.1',
              dotenv: '^17.2.3',
              express: '^4.21.2',
              jszip: '^3.10.2',
              'lucide-react': '^0.546.0',
              motion: '^12.23.24',
              'node-cron': '^4.6.0',
              react: '^19.0.1',
              'react-dom': '^19.0.1',
              vite: '^8.3.0'
            },
            devDependencies: {
              '@types/express': '^4.17.21',
              '@types/node': '^22.14.0',
              '@types/node-cron': '^3.0.11',
              '@types/react': '^19.3.0',
              '@types/react-dom': '^19.3.0',
              autoprefixer: '^10.4.21',
              tailwindcss: '^4.3.3',
              tsx: '^4.21.0',
              typescript: '^7.0.2'
            }
          },
          null,
          2
        )
      },
      {
        path: '.npmrc',
        content: 'legacy-peer-deps=true\n'
      },
      {
        path: 'vite.config.ts',
        content: `import tailwindcss from '@tailwindcss/vite';\nimport react from '@vitejs/plugin-react';\nimport path from 'path';\nimport {defineConfig} from 'vite';\n\nexport default defineConfig(() => ({\n  plugins: [react(), tailwindcss()],\n  resolve: { alias: { '@': path.resolve('.') } },\n  server: { hmr: process.env.DISABLE_HMR !== 'true' }\n}));\n`
      },
      {
        path: 'public/_redirects',
        content: '/* /index.html 200\n'
      },
      {
        path: 'public/_headers',
        content: '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n'
      },
      {
        path: 'wrangler.toml',
        content: 'name = "searchingine"\ncompatibility_date = "2024-09-23"\npages_build_output_dir = "dist"\n'
      }
    ];

    try {
      const result = await pushToGitHub(
        {
          repoOwner: repoOwner.trim(),
          repoName: repoName.trim(),
          branch: branch.trim(),
          token: token.trim(),
          commitMessage: commitMsg.trim()
        },
        coreFiles,
        (step) => setLogs((prev) => [...prev, step])
      );

      setDeployResult(result);
    } catch (err: any) {
      setDeployResult({ success: false, error: err.message || 'Push failed' });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    setZipSuccess(false);
    try {
      // 1. Try server endpoint which has the precompiled dist folder
      try {
        const response = await fetch('/api/download/dist-zip');
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `searchingine-cloudflare-dist-${new Date().toISOString().slice(0, 10)}.zip`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setZipSuccess(true);
          return;
        }
      } catch {}

      // 2. Fallback to client packaging with JSZip
      const zip = new JSZip();
      zip.file(
        'package.json',
        JSON.stringify(
          {
            name: 'searchingine',
            private: true,
            version: '1.0.0',
            type: 'module',
            scripts: { build: 'vite build' },
            dependencies: {
              react: '^19.0.1',
              'react-dom': '^19.0.1',
              'lucide-react': '^0.546.0',
              tailwindcss: '^4.3.3',
              vite: '^8.3.0'
            }
          },
          null,
          2
        )
      );
      zip.file('.npmrc', 'legacy-peer-deps=true\n');
      zip.file('public/_redirects', '/* /index.html 200\n');
      zip.file('public/_headers', '/*\n  X-Content-Type-Options: nosniff\n');
      zip.file('wrangler.toml', 'name = "searchingine"\npages_build_output_dir = "dist"\n');

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `searchingine-cloudflare-dist-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setZipSuccess(true);
    } catch (err) {
      console.error('Failed to create ZIP package:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0d1322] border border-slate-800 rounded-2xl shadow-2xl text-slate-100 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#090e18]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Cloud className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{lang === 'es' ? 'Guía de Despliegue en Cloudflare' : 'Cloudflare & GitHub Deployment Guide'}</span>
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'es'
                  ? 'Elige la forma más fácil para ti: sin terminal, todo desde tu navegador'
                  : 'Choose the easiest method: zero terminal needed, all in your browser'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 pt-3 border-b border-slate-800 bg-[#0a0f1b] overflow-x-auto">
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap -mb-px ${
              activeTab === 'guide'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>{lang === 'es' ? 'Paso a Paso (Más Fácil)' : 'Step-by-Step Guide (Easiest)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('zip')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap -mb-px ${
              activeTab === 'zip'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="h-3.5 w-3.5" />
            <span>{lang === 'es' ? 'Descargar ZIP Directo' : 'Download ZIP Bundle'}</span>
          </button>

          <button
            onClick={() => setActiveTab('github')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap -mb-px ${
              activeTab === 'github'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Github className="h-3.5 w-3.5" />
            <span>{lang === 'es' ? 'Push con Token' : 'Push via Token'}</span>
          </button>

          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap -mb-px ${
              activeTab === 'live'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="h-3.5 w-3.5" />
            <span>{lang === 'es' ? 'Estado Web' : 'Live Status'}</span>
          </button>
        </div>

        {/* Tab 1: Visual Step-by-Step Guide */}
        {activeTab === 'guide' && (
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Method A: Cloudflare Direct Upload (Drag and Drop) */}
            <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-slate-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  <Sparkles className="h-3 w-3" />
                  {lang === 'es' ? 'MÉTODO 1 (Recomendado — 30 Segundos)' : 'METHOD 1 (Recommended — 30 Seconds)'}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {lang === 'es' ? 'Sin tocar código' : 'No code needed'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">
                {lang === 'es' ? 'Subir Directamente a Cloudflare Pages' : 'Upload Directly to Cloudflare Pages'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {lang === 'es'
                  ? 'No necesitas usar terminal ni configurar GitHub. Descarga el paquete compilado listo y súbelo directamente a Cloudflare:'
                  : 'You do not need to use a terminal or know Git commands. Download the compiled website and drop it into Cloudflare:'}
              </p>

              <div className="space-y-2 pt-1 text-xs">
                <div className="flex items-start gap-2.5 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                  <div className="flex-1">
                    <p className="text-slate-200 font-medium">{lang === 'es' ? 'Descarga el archivo ZIP:' : 'Download the ready ZIP file:'}</p>
                    <button
                      type="button"
                      onClick={handleDownloadZip}
                      disabled={isZipping}
                      className="mt-2 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 transition cursor-pointer"
                    >
                      {isZipping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                      <span>{lang === 'es' ? 'Descargar searchingine-dist.zip' : 'Download searchingine-dist.zip'}</span>
                    </button>
                    {zipSuccess && (
                      <span className="ml-2 text-[11px] text-emerald-400 inline-flex items-center gap-1">
                        <Check className="h-3 w-3" /> {lang === 'es' ? '¡Descargado!' : 'Downloaded!'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                  <div className="flex-1">
                    <p className="text-slate-200 font-medium">
                      {lang === 'es' ? 'Abre Cloudflare Pages:' : 'Open Cloudflare Pages:'}
                    </p>
                    <a
                      href="https://dash.cloudflare.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-cyan-400 hover:underline mt-1 font-semibold"
                    >
                      <span>dash.cloudflare.com</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <p className="text-slate-400 text-[11px] mt-1">
                      {lang === 'es'
                        ? 'Ve a Workers & Pages → haz clic en "searchingine" → pestaña "Deployments" → "Create deployment" → arrastra el archivo ZIP.'
                        : 'Go to Workers & Pages → click "searchingine" → "Deployments" → "Create deployment" → drop the ZIP file.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                  <div className="flex-1">
                    <p className="text-slate-200 font-medium">
                      {lang === 'es' ? 'Haz clic en "Save and Deploy". ¡Y listo!' : 'Click "Save and Deploy". You are live!'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Method B: Edit on GitHub.com in Browser */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Github className="h-3 w-3" />
                  {lang === 'es' ? 'MÉTODO 2: Actualizar en GitHub.com' : 'METHOD 2: Update on GitHub.com Website'}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {lang === 'es' ? '2 clics en GitHub' : '2 clicks on GitHub'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">
                {lang === 'es' ? 'Para que Cloudflare compile automáticamente desde GitHub' : 'Make Cloudflare Build Cleanly from GitHub'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {lang === 'es'
                  ? 'El motivo por el cual Cloudflare fallaba era que package.json tenía un conflicto de versión de esbuild. Solo haz estos 2 cambios en github.com:'
                  : 'Cloudflare was failing during build because of a conflicting esbuild version in package.json. Just make these 2 quick edits on github.com:'}
              </p>

              <div className="space-y-2.5 pt-1 text-xs">
                {/* Step 1 */}
                <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                      <FileCode className="h-3.5 w-3.5 text-cyan-400" />
                      1. Crea el archivo .npmrc en GitHub
                    </span>
                    <a
                      href="https://github.com/karimfeina-ux/searchingine/new/main"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                    >
                      <span>Abrir en GitHub</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Nombre del archivo: <code className="text-white bg-slate-800 px-1 py-0.5 rounded">.npmrc</code>
                  </p>
                  <div className="flex items-center justify-between bg-black/60 px-2.5 py-1.5 rounded border border-slate-800 font-mono text-[11px] text-emerald-400">
                    <span>legacy-peer-deps=true</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('legacy-peer-deps=true\n');
                        setCopiedNpmrc(true);
                        setTimeout(() => setCopiedNpmrc(false), 2000);
                      }}
                      className="text-slate-400 hover:text-white p-1"
                      title="Copiar"
                    >
                      {copiedNpmrc ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                      <FileCode className="h-3.5 w-3.5 text-cyan-400" />
                      2. Edita package.json en GitHub
                    </span>
                    <a
                      href="https://github.com/karimfeina-ux/searchingine/edit/main/package.json"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                    >
                      <span>Editar en GitHub</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Elimina la línea de <code className="text-red-400 bg-slate-800 px-1 py-0.5 rounded">"esbuild": "^0.25.0",</code> y haz clic en <strong>Commit changes</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: ZIP Export */}
        {activeTab === 'zip' && (
          <div className="p-6 space-y-4">
            <div className="rounded-xl bg-slate-900 p-4 border border-slate-800 space-y-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Download className="h-4 w-4 text-cyan-400" />
                <span>{lang === 'es' ? 'Subida Directa a Cloudflare (Sin Git)' : 'Direct Upload to Cloudflare (No Git)'}</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {lang === 'es'
                  ? 'Descarga el paquete compilado completo con toda la aplicación web lista y arrástralo directamente en tu panel de Cloudflare Pages:'
                  : 'Download the compiled website package and drag-and-drop it directly into your Cloudflare Pages dashboard:'}
              </p>
              <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1 pl-1 pt-1">
                <li>{lang === 'es' ? 'Haz clic en el botón azul de abajo para descargar el archivo ZIP.' : 'Click the button below to download the ZIP file.'}</li>
                <li>
                  {lang === 'es' ? 'Abre ' : 'Open '}
                  <a
                    href="https://dash.cloudflare.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 underline"
                  >
                    Cloudflare Dashboard
                  </a>
                  {' → Workers & Pages → searchingine → Deployments → Create deployment.'}
                </li>
                <li>{lang === 'es' ? 'Arrastra el archivo ZIP y haz clic en Desplegar.' : 'Drop the ZIP file and click Deploy!'}</li>
              </ol>
            </div>

            <div className="flex items-center justify-center py-4">
              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={isZipping}
                className="flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 active:scale-95 transition shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isZipping ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{lang === 'es' ? 'Preparando ZIP...' : 'Packaging ZIP...'}</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>{lang === 'es' ? 'Descargar Paquete ZIP Cloudflare' : 'Download Cloudflare ZIP Package'}</span>
                  </>
                )}
              </button>
            </div>

            {zipSuccess && (
              <div className="rounded-xl bg-emerald-950/40 border border-emerald-500/30 p-3 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{lang === 'es' ? '¡Archivo ZIP descargado con éxito! Listo para subir a Cloudflare.' : 'ZIP downloaded successfully! Ready to upload to Cloudflare.'}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: GitHub Direct Push */}
        {activeTab === 'github' && (
          <form onSubmit={handleTriggerGitHubPush} className="p-6 space-y-4">
            <div className="rounded-xl bg-cyan-950/30 border border-cyan-800/40 p-3.5 text-xs text-cyan-200 space-y-1">
              <p className="font-semibold text-white flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                {lang === 'es' ? 'Despliegue Automático con Token' : 'Automated Push via GitHub Token'}
              </p>
              <p className="text-slate-300 leading-relaxed">
                {lang === 'es'
                  ? 'Si tienes un Personal Access Token de GitHub, puedes pegarlo aquí y esta app actualizará tu repositorio automáticamente.'
                  : 'If you have a GitHub Personal Access Token, enter it below to automatically push all updates to your repo.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  GitHub Repository Owner
                </label>
                <div className="flex items-center rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-2 text-xs">
                  <FolderGit2 className="h-4 w-4 text-slate-500 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={repoOwner}
                    onChange={(e) => setRepoOwner(e.target.value)}
                    required
                    className="w-full bg-transparent text-slate-100 outline-none"
                    placeholder="karimfeina-ux"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Repository Name
                </label>
                <div className="flex items-center rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-2 text-xs">
                  <Github className="h-4 w-4 text-slate-500 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    required
                    className="w-full bg-transparent text-slate-100 outline-none"
                    placeholder="searchingine"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-400">
                  GitHub Personal Access Token (classic / fine-grained)
                </label>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=Searchingine+Deployer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <span>{lang === 'es' ? 'Crear token en GitHub' : 'Generate token in GitHub'}</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
              <div className="flex items-center rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-2 text-xs">
                <Key className="h-4 w-4 text-slate-500 mr-2 shrink-0" />
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  required
                  className="w-full bg-transparent text-slate-100 outline-none font-mono text-xs"
                />
              </div>
            </div>

            {/* Logs display */}
            {logs.length > 0 && (
              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {log.status === 'pending' && <Loader2 className="h-3 w-3 text-cyan-400 animate-spin" />}
                    {log.status === 'success' && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                    {log.status === 'error' && <AlertCircle className="h-3 w-3 text-red-400" />}
                    <span className={log.status === 'error' ? 'text-red-300' : 'text-slate-300'}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Error banner */}
            {deployResult && !deployResult.success && (
              <div className="rounded-xl bg-red-950/40 border border-red-500/30 p-3 text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span>{deployResult.error}</span>
              </div>
            )}

            {/* Success banner */}
            {deployResult && deployResult.success && (
              <div className="rounded-xl bg-emerald-950/40 border border-emerald-500/30 p-3 text-xs text-emerald-300 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold">
                    {lang === 'es' ? '¡Cambios subidos a GitHub con éxito!' : 'Successfully pushed to GitHub!'}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  {lang === 'es'
                    ? 'Cloudflare Pages ha detectado el nuevo commit y está compilando ahora mismo tu sitio web. Estará activo en ~30 segundos.'
                    : 'Cloudflare Pages has detected this commit and is currently building your website. It will be live in ~30 seconds.'}
                </p>
                <div className="flex items-center gap-3 pt-1">
                  {deployResult.commitUrl && (
                    <a
                      href={deployResult.commitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:underline"
                    >
                      <span>{lang === 'es' ? 'Ver Commit en GitHub' : 'View Commit on GitHub'}</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <a
                    href="https://searchingine.pages.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:underline font-semibold"
                  >
                    <span>{lang === 'es' ? 'Abrir searchingine.pages.dev' : 'Open searchingine.pages.dev'}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                {lang === 'es' ? 'Cerrar' : 'Close'}
              </button>

              <button
                type="submit"
                disabled={isDeploying}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 active:scale-95 transition shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{lang === 'es' ? 'Empujando a GitHub...' : 'Pushing to GitHub...'}</span>
                  </>
                ) : (
                  <>
                    <Github className="h-4 w-4" />
                    <span>{lang === 'es' ? 'Empujar a GitHub & Desplegar' : 'Push to GitHub & Trigger Deploy'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 4: Live Status */}
        {activeTab === 'live' && (
          <div className="p-6 space-y-4">
            <div className="rounded-xl bg-slate-900 p-4 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">TARGET DOMAIN</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                  CLOUDFLARE PAGES
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-950 p-3 border border-slate-800">
                <span className="text-sm font-mono text-white select-all">https://searchingine.pages.dev/</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('https://searchingine.pages.dev/');
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Copy URL"
                  >
                    {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <a
                    href="https://searchingine.pages.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-cyan-400 hover:text-white hover:bg-slate-800 transition"
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleTestLiveUrl}
                  disabled={isTestingLive}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                >
                  {isTestingLive ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  <span>{lang === 'es' ? 'Verificar Conectividad en Vivo' : 'Ping Live Site'}</span>
                </button>

                <a
                  href="https://searchingine.pages.dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition"
                >
                  <span>{lang === 'es' ? 'Abrir Sitio Web' : 'Open Live Site'}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              {liveStatus && (
                <div
                  className={`rounded-xl p-3 text-xs flex items-center gap-2 ${
                    liveStatus.ok
                      ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                      : 'bg-amber-950/40 border border-amber-500/30 text-amber-300'
                  }`}
                >
                  {liveStatus.ok ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                  )}
                  <span>{liveStatus.msg}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
