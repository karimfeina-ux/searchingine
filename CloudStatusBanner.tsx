import { useEffect, useState } from 'react';

interface Props {
  lang?: string;
}

type Health = { database?: boolean; databaseWorking?: boolean; databaseError?: string } | null;

// Shows a clear warning when cloud storage (Cloudflare D1) is not connected,
// because without it nothing can sync between PC and mobile.
export function CloudStatusBanner({ lang = 'en' }: Props) {
  const [state, setState] = useState<'checking' | 'ok' | 'no-db' | 'db-error' | 'no-backend'>('checking');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await window.fetch('/api/health', { headers: { Accept: 'application/json' } });
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          if (!cancelled) setState('no-backend');
          return;
        }
        const h: Health = await res.json();
        if (cancelled) return;
        if (!h?.database) setState('no-db');
        else if (!h.databaseWorking) setState('db-error');
        else setState('ok');
      } catch {
        if (!cancelled) setState('ok'); // offline: the offline indicator already covers this
      }
    };
    check();
    const id = setInterval(check, 60000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (dismissed || state === 'ok' || state === 'checking') return null;

  const es = lang === 'es';
  const text =
    state === 'no-db'
      ? es
        ? 'Base de datos en la nube NO conectada: tus datos solo se guardan en este dispositivo y no se sincronizan con el móvil/PC. En Cloudflare Pages → Settings → Bindings añade D1 con el nombre DB y vuelve a desplegar.'
        : 'Cloud database NOT connected: your data is only saved on this device and will not sync between PC and mobile. In Cloudflare Pages → Settings → Bindings add a D1 database named DB, then redeploy.'
      : state === 'db-error'
      ? es
        ? 'La base de datos D1 está conectada pero falla. Revisa el binding DB en Cloudflare.'
        : 'The D1 database is bound but failing. Check the DB binding in Cloudflare.'
      : es
      ? 'El backend (/functions) no está desplegado: la búsqueda y la sincronización no funcionarán.'
      : 'The backend (/functions folder) is not deployed: search and sync will not work.';

  return (
    <div className="fixed bottom-3 left-3 right-3 z-50 mx-auto max-w-2xl rounded-xl border border-amber-500/40 bg-amber-950/95 px-4 py-3 text-xs text-amber-100 shadow-lg">
      <div className="flex items-start gap-3">
        <span className="flex-1 leading-relaxed">{text}</span>
        <button onClick={() => setDismissed(true)} className="shrink-0 rounded px-2 py-0.5 text-amber-300 hover:bg-amber-900">
          ✕
        </button>
      </div>
    </div>
  );
}
