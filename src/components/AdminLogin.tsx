import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { apiFetch } from '../services/apiBridge.ts';

interface AdminLoginProps {
  onLoginSuccess: (user: { email: string; name: string }) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please provide administrator email and security key.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('leadhunter_admin_token', data.token);
        localStorage.setItem('leadhunter_admin_user', JSON.stringify(data.user));
        localStorage.removeItem('leadhunter_logged_out');
        onLoginSuccess(data.user);
      } else {
        setError(data.error || 'Access denied: Invalid administrator credentials.');
      }
    } catch {
      setError('Connection error. Please check server connectivity.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#070b14] overflow-hidden px-4 selection:bg-cyan-500 selection:text-white">
      {/* Background ambient futuristic lighting & subtle grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.18),rgba(255,255,255,0))] pointer-events-none" />
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-[128px] pointer-events-none" />

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        {/* Glow halo */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-cyan-500/20 rounded-2xl blur opacity-75" />

        <div className="relative bg-[#0d1322]/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 sm:p-10 shadow-2xl">
          {/* Top Badge */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <ShieldCheck className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">LEADHUNTER</span>
                <span className="text-xs font-mono text-slate-500 ml-1.5">// CORE</span>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">RESTRICTED</span>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5">
              Admin Portal
            </h1>
            <p className="text-xs text-slate-400">
              Authorized credentials required to access the autonomous intelligence network.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 flex items-start space-x-2.5 p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                Administrator Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@leadhunter.ai"
                  autoComplete="username"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400">
                  Security Key
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Default: admin</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-900/60 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full group relative flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 active:scale-[0.99] transition-all duration-200 shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Verifying clearance...</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate Session</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer note */}
          <div className="mt-8 pt-6 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>SYS_ID: 6C99-F944</span>
            <span className="text-slate-600">ENCRYPTION: ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
