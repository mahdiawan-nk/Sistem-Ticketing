import React, { useState } from 'react';
import { HelpdeskTicket, AIAnalysisResult } from '../types';
import {
  X,
  Sparkles,
  Calendar,
  Clock,
  User,
  Building,
  Wrench,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

import { UserRole } from '../types';

interface TicketDetailModalProps {
  ticket: HelpdeskTicket | null;
  onClose: () => void;
  onUpdateTicket: (updated: HelpdeskTicket) => void;
  userRole?: UserRole;
  onRequireLogin?: () => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  onClose,
  onUpdateTicket,
  userRole = 'viewer',
  onRequireLogin,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [appliedNotice, setAppliedNotice] = useState(false);

  if (!ticket) return null;

  const handleRunAiAnalysis = async () => {
    if (userRole === 'viewer') {
      if (onRequireLogin) onRequireLogin();
      return;
    }
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAppliedNotice(false);
    try {
      const res = await fetch('/api/analyze-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemTitle: ticket.problemTitle,
          problemDescription: ticket.problemDescription,
          category: ticket.category,
          priority: ticket.priority,
        }),
      });

      if (!res.ok) {
        throw new Error('Gagal menghubungi AI service.');
      }

      const data = await res.json();
      setAiResult(data);
    } catch (err: any) {
      setAnalysisError(err.message || 'Terjadi kesalahan saat menganalisis tiket.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyAiSolution = () => {
    if (!aiResult) return;
    const updated: HelpdeskTicket = {
      ...ticket,
      rootCause: aiResult.akarMasalah || ticket.rootCause,
      actionTaken: aiResult.solusiTeknis || ticket.actionTaken,
      preventiveAction: aiResult.tindakanPencegahan || ticket.preventiveAction,
      durationFormatted: aiResult.estimasiWaktu || ticket.durationFormatted,
    };
    onUpdateTicket(updated);
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 4000);
  };

  const handleCopySummary = () => {
    const text = `*LOG TIKET HELPDESK IT*
No. Tiket: ${ticket.ticketNumber}
Waktu: ${ticket.dayName}, ${ticket.date} - ${ticket.time}
Pelapor: ${ticket.reporterName} (${ticket.reporterDept})
Kategori: ${ticket.category} [${ticket.priority}]
Status: ${ticket.status}

*Keluhan:*
${ticket.problemTitle}
${ticket.problemDescription}

*Akar Masalah:*
${ticket.rootCause}

*Solusi & Penanganan Teknis:*
${ticket.actionTaken}

*Tindakan Pencegahan:*
${ticket.preventiveAction}

*Teknisi:* ${ticket.technicianName} (Durasi: ${ticket.durationFormatted || ticket.durationMinutes + ' Menit'})`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-900 text-white">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono font-bold text-indigo-300 text-sm bg-indigo-950/80 px-2.5 py-0.5 rounded border border-indigo-700/50">
                {ticket.ticketNumber}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {ticket.category}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {ticket.status}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              {ticket.problemTitle}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-[11px] text-slate-500 block mb-0.5">Hari & Tanggal</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                {ticket.dayName}, {ticket.date}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">{ticket.time}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block mb-0.5">Pelapor & Unit</span>
              <span className="font-semibold text-slate-900 truncate block">
                {ticket.reporterName}
              </span>
              <span className="text-[10px] text-slate-500 truncate block">
                {ticket.reporterDept}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block mb-0.5">Teknisi PIC</span>
              <span className="font-semibold text-slate-900 truncate block">
                {ticket.technicianName}
              </span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" />
                {ticket.durationFormatted || `${ticket.durationMinutes} Menit`}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block mb-0.5">Prioritas & SLA</span>
              <span className="font-bold text-slate-900 block">
                Tingkat {ticket.priority}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">Hari Kerja</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5 text-sm">
              <AlertCircle className="w-4 h-4 text-indigo-600" />
              Deskripsi Gangguan / Keluhan Pengguna
            </h4>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-line">
              {ticket.problemDescription}
            </div>
          </div>

          {/* Root Cause */}
          <div>
            <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5 text-sm">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Analisis Akar Masalah (Root Cause Analysis)
            </h4>
            <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 text-amber-900 leading-relaxed whitespace-pre-line">
              {ticket.rootCause || 'Belum diisi'}
            </div>
          </div>

          {/* Technical Solution */}
          <div>
            <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5 text-sm">
              <Wrench className="w-4 h-4 text-emerald-600" />
              Tindakan & Solusi Teknis yang Dijalankan
            </h4>
            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80 text-emerald-950 leading-relaxed whitespace-pre-line font-normal">
              {ticket.actionTaken || 'Belum ada catatan solusi teknis'}
            </div>
          </div>

          {/* Preventive Action */}
          <div>
            <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              Langkah Pencegahan (Preventive Maintenance)
            </h4>
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/80 text-blue-950 leading-relaxed whitespace-pre-line">
              {ticket.preventiveAction || 'Pemeriksaan berkala standar'}
            </div>
          </div>

          {/* AI Re-analysis Section */}
          <div className="p-4 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60 rounded-xl border border-indigo-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Analisis & Rekomendasi Solusi Teknis AI (Gemini)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Otomatisasi diagnosa teknis dan rekomendasi perbaikan berbasis AI.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRunAiAnalysis}
                disabled={isAnalyzing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs disabled:opacity-50 transition cursor-pointer self-start sm:self-auto shrink-0"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menganalisis...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Analisis Ulang dengan AI</span>
                  </>
                )}
              </button>
            </div>

            {analysisError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                {analysisError}
              </div>
            )}

            {aiResult && (
              <div className="mt-3 space-y-3 pt-3 border-t border-indigo-100 text-xs">
                <div className="grid grid-cols-2 gap-2 text-[11px] pb-2">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block">Tingkat Kesulitan:</span>
                    <span className="font-bold text-slate-800">{aiResult.tingkatKesulitan}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block">Estimasi Pengerjaan:</span>
                    <span className="font-bold text-slate-800">{aiResult.estimasiWaktu}</span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1 text-indigo-900">
                    Diagnosa Akar Masalah AI:
                  </span>
                  <p className="text-slate-700">{aiResult.akarMasalah}</p>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1 text-emerald-900">
                    Rekomendasi Langkah Solusi Teknis AI:
                  </span>
                  <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                    {aiResult.solusiTeknis}
                  </p>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1 text-blue-900">
                    Tindakan Pencegahan AI:
                  </span>
                  <p className="text-slate-700">{aiResult.tindakanPencegahan}</p>
                </div>

                {aiResult.rekomendasiEskalasi && (
                  <div className="bg-purple-50 p-2.5 rounded-lg border border-purple-200 text-purple-900">
                    <span className="font-bold block mb-0.5">Panduan Eskalasi:</span>
                    <p>{aiResult.rekomendasiEskalasi}</p>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                  {appliedNotice && (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg flex items-center gap-1.5 animate-in fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Solusi teknis AI berhasil diterapkan pada tiket ini!
                    </span>
                  )}
                  <div className="ml-auto">
                    <button
                      type="button"
                      onClick={handleApplyAiSolution}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Terapkan Solusi AI Ini ke Data Tiket</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Tersalin ke Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Salin Format Notifikasi (WA/Slack)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
