import type { LeadStatus } from '../types/index.ts';

export interface StatusTheme {
  cardBg: string;
  border: string;
  ring: string;
  badgeBg: string;
  text: string;
  labelEn: string;
  labelEs: string;
  shortLabelEn: string;
  shortLabelEs: string;
  accentColor: string;
  dotColor: string;
  bgGlow: string;
}

export function getLeadStatusTheme(status?: LeadStatus, isContacted?: boolean): StatusTheme {
  if (status === 'client_signed') {
    return {
      cardBg: 'bg-gradient-to-br from-purple-950/40 via-[#0e162a] to-emerald-950/30',
      border: 'border-purple-500/60 hover:border-purple-400',
      ring: 'ring-1 ring-purple-500/40 shadow-lg shadow-purple-950/30',
      badgeBg: 'bg-gradient-to-r from-purple-600/30 to-emerald-600/30 border border-purple-400/60 text-purple-200 font-bold',
      text: 'text-purple-300',
      labelEn: '🤝 Signed Client (+€500)',
      labelEs: '🤝 Cliente Firmado (+€500)',
      shortLabelEn: 'Signed Client',
      shortLabelEs: 'Cliente Ganado',
      accentColor: '#a855f7',
      dotColor: 'bg-purple-400',
      bgGlow: 'shadow-purple-900/30'
    };
  }

  if (status === 'waiting') {
    return {
      cardBg: 'bg-gradient-to-br from-amber-950/40 via-[#14141f] to-amber-950/25',
      border: 'border-amber-500/60 hover:border-amber-400',
      ring: 'ring-1 ring-amber-500/40 shadow-lg shadow-amber-950/30',
      badgeBg: 'bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold',
      text: 'text-amber-300',
      labelEn: '⏳ Waiting for Response / Payment',
      labelEs: '⏳ Esperando Respuesta / Pago',
      shortLabelEn: 'Waiting Payment/Resp.',
      shortLabelEs: 'Esperando Pago/Resp.',
      accentColor: '#f59e0b',
      dotColor: 'bg-amber-400',
      bgGlow: 'shadow-amber-900/30'
    };
  }

  if (status === 'not_interested') {
    return {
      cardBg: 'bg-gradient-to-br from-rose-950/35 via-[#160c16] to-rose-950/20',
      border: 'border-rose-500/60 hover:border-rose-400',
      ring: 'ring-1 ring-rose-500/30 shadow-lg shadow-rose-950/20',
      badgeBg: 'bg-rose-500/20 border border-rose-500/50 text-rose-300 font-bold',
      text: 'text-rose-300',
      labelEn: '❌ Refused / Not Interested',
      labelEs: '❌ Rechazado / No Interesado',
      shortLabelEn: 'Refused',
      shortLabelEs: 'Rechazado',
      accentColor: '#f43f5e',
      dotColor: 'bg-rose-400',
      bgGlow: 'shadow-rose-900/20'
    };
  }

  if (isContacted || status === 'contacted') {
    return {
      cardBg: 'bg-gradient-to-br from-cyan-950/30 via-[#0a1626] to-cyan-950/20',
      border: 'border-cyan-500/50 hover:border-cyan-400',
      ring: 'ring-1 ring-cyan-500/30 shadow-lg shadow-cyan-950/20',
      badgeBg: 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-semibold',
      text: 'text-cyan-300',
      labelEn: '📩 Contacted (Outreach Sent)',
      labelEs: '📩 Contactado (Propuesta Enviada)',
      shortLabelEn: 'Contacted',
      shortLabelEs: 'Contactado',
      accentColor: '#06b6d4',
      dotColor: 'bg-cyan-400',
      bgGlow: 'shadow-cyan-900/20'
    };
  }

  // Default uncontacted
  return {
    cardBg: 'bg-[#0d1424]/80',
    border: 'border-slate-800/80 hover:border-cyan-500/40',
    ring: '',
    badgeBg: 'bg-slate-800/80 border border-slate-700/60 text-slate-300',
    text: 'text-slate-300',
    labelEn: 'Uncontacted Lead',
    labelEs: 'Lead Por Contactar',
    shortLabelEn: 'New',
    shortLabelEs: 'Nuevo',
    accentColor: '#64748b',
    dotColor: 'bg-slate-400',
    bgGlow: ''
  };
}
