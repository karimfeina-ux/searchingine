import React, { useState, useRef, useEffect } from 'react';
import type { LeadStatus, Prospect } from '../types/index.ts';
import { t } from '../utils/translations.ts';
import {
  CheckCircle2,
  Clock,
  Award,
  Trash2,
  ChevronDown,
  Sparkles,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';

interface ContactOutcomeMenuProps {
  prospect: Prospect;
  lang: 'en' | 'es';
  onUpdateStatus: (id: string, status: LeadStatus, notes?: string) => void;
  onDeleteNotInterested?: (id: string) => void;
  compact?: boolean;
}

export const ContactOutcomeMenu: React.FC<ContactOutcomeMenuProps> = ({
  prospect,
  lang,
  onUpdateStatus,
  onDeleteNotInterested,
  compact = false
}) => {
  const tr = t[lang] || t.en;
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close popup menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowConfirmDelete(false);
      }
    };
    if (isOpen || showConfirmDelete) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, showConfirmDelete]);

  const isContacted = Boolean(
    prospect.isContacted ||
    prospect.status === 'contacted' ||
    prospect.status === 'waiting' ||
    prospect.status === 'client_signed'
  );

  const handleSelectStatus = (status: LeadStatus, notes?: string) => {
    onUpdateStatus(prospect.id, status, notes);
    setIsOpen(false);
  };

  const handleConfirmDelete = () => {
    if (onDeleteNotInterested) {
      onDeleteNotInterested(prospect.id);
    } else {
      onUpdateStatus(prospect.id, 'not_interested');
    }
    setShowConfirmDelete(false);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef} onClick={(e) => e.stopPropagation()}>
      {/* Primary Trigger Button */}
      <div className="flex items-center gap-1">
        {prospect.status === 'client_signed' ? (
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 border border-emerald-400/40 hover:brightness-110 transition cursor-pointer"
            title="Deal Won & Signed"
          >
            <Award className="h-3.5 w-3.5" />
            <span>{tr.signedBadge}</span>
            <ChevronDown className="h-3 w-3 opacity-80" />
          </button>
        ) : prospect.status === 'waiting' ? (
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition cursor-pointer"
            title="Waiting for response or payment"
          >
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>{compact ? (lang === 'es' ? '⏳ Esperando' : '⏳ Waiting') : tr.waitingBadge}</span>
            <ChevronDown className="h-3 w-3 opacity-80" />
          </button>
        ) : prospect.status === 'not_interested' ? (
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold hover:bg-rose-500/30 transition cursor-pointer"
            title="Refused / Not interested"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-400" />
            <span>{compact ? (lang === 'es' ? '❌ Rechazado' : '❌ Refused') : (lang === 'es' ? '❌ No Interesado' : '❌ Not Interested')}</span>
            <ChevronDown className="h-3 w-3 opacity-80" />
          </button>
        ) : isContacted ? (
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 text-xs font-semibold hover:border-cyan-400 transition cursor-pointer"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
            <span>{tr.contactedBadge}</span>
            <ChevronDown className="h-3 w-3 opacity-70" />
          </button>
        ) : (
          <div className="flex items-center rounded-xl bg-slate-900 border border-slate-700/80 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => handleSelectStatus('contacted')}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-emerald-300 hover:bg-emerald-950/40 transition cursor-pointer"
              title="Mark contacted (moves out of uncontacted discovery list)"
            >
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span>{tr.markContacted}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="px-1.5 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 border-l border-slate-700/80 transition cursor-pointer"
              title="More contact options"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && !showConfirmDelete && (
        <div className="absolute right-0 bottom-full sm:bottom-auto sm:top-full mt-1.5 mb-1.5 z-50 w-64 rounded-2xl border border-slate-700 bg-[#0d1424] p-1.5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1.5 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {tr.contactOutcomeTitle}
          </div>

          <div className="py-1 space-y-0.5">
            {/* Option 2: Waiting for Response or Payment */}
            <button
              type="button"
              onClick={() => handleSelectStatus('waiting', 'Waiting for customer response or payment')}
              className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-amber-500/10 transition cursor-pointer text-slate-200 hover:text-amber-300 group"
            >
              <Clock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold leading-tight flex items-center gap-1">
                  <span>{tr.optionWaiting}</span>
                </div>
                <div className="text-[10px] text-slate-400 group-hover:text-amber-200/80">
                  {lang === 'es' ? 'Mantiene en pipeline de seguimiento' : 'Keep active in follow-up pipeline'}
                </div>
              </div>
            </button>

            {/* Option 3: Client Signed / Won */}
            <button
              type="button"
              onClick={() => handleSelectStatus('client_signed', 'Client signed website contract')}
              className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-emerald-500/10 transition cursor-pointer text-slate-200 hover:text-emerald-300 group"
            >
              <Award className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold leading-tight flex items-center gap-1">
                  <span>{tr.optionClientWon}</span>
                </div>
                <div className="text-[10px] text-slate-400 group-hover:text-emerald-200/80">
                  {lang === 'es' ? 'Contrato cerrado (+€500) y cliente ganado' : 'Deal closed & added to Clients Won'}
                </div>
              </div>
            </button>

            {/* General Contacted */}
            <button
              type="button"
              onClick={() => handleSelectStatus('contacted')}
              className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-cyan-500/10 transition cursor-pointer text-slate-200 hover:text-cyan-300 group"
            >
              <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold leading-tight">
                  <span>{tr.contactedStatus}</span>
                </div>
                <div className="text-[10px] text-slate-400 group-hover:text-cyan-200/80">
                  {lang === 'es' ? 'Ocultar de la lista de prospección activa' : 'Hide from active discovery list'}
                </div>
              </div>
            </button>

            <div className="pt-1 mt-1 border-t border-slate-800">
              {/* Option 1: Not Interested & Delete from Research */}
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-rose-500/15 transition cursor-pointer text-rose-300 hover:text-rose-200 group"
              >
                <Trash2 className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold leading-tight">
                    <span>{tr.optionNotInterested}</span>
                  </div>
                  <div className="text-[10px] text-rose-400/80">
                    {lang === 'es' ? 'Guardar en Contactados como No Interesado' : 'Save to Contacted pipeline under Not Interested'}
                  </div>
                </div>
              </button>

              {/* Reset to uncontacted */}
              {(isContacted || prospect.status === 'not_interested') && (
                <button
                  type="button"
                  onClick={() => handleSelectStatus('new', '')}
                  className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-slate-800 transition cursor-pointer text-slate-400 hover:text-slate-200 group mt-0.5"
                >
                  <Sparkles className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-medium leading-tight">
                      <span>{lang === 'es' ? 'Restablecer a No Contactado' : 'Reset to Uncontacted'}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {lang === 'es' ? 'Devolver a la lista de descubrimiento' : 'Move back to active discovery'}
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Sub-Modal for Option 1 */}
      {showConfirmDelete && (
        <div className="absolute right-0 bottom-full sm:bottom-auto sm:top-full mt-1.5 mb-1.5 z-50 w-72 rounded-2xl border border-rose-500/40 bg-[#120a12] p-4 shadow-2xl backdrop-blur-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-start gap-2.5 mb-2.5">
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white">
                {lang === 'es' ? '¿Eliminar de la investigación?' : 'Delete & Exclude from Research?'}
              </h4>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                {lang === 'es'
                  ? `"${prospect.name}" no volverá a aparecer en ninguna búsqueda futura de Google Maps u OpenStreetMap.`
                  : `"${prospect.name}" will be permanently removed and banned so it never shows up in future searches.`}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-rose-900/40">
            <button
              type="button"
              onClick={() => setShowConfirmDelete(false)}
              className="px-2.5 py-1 text-xs text-slate-400 hover:text-white transition cursor-pointer"
            >
              {lang === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{lang === 'es' ? 'Sí, Eliminar' : 'Yes, Delete'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
