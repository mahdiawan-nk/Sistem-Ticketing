import React from 'react';
import { HelpdeskTicket } from '../types';
import { CheckCircle2, Clock, AlertOctagon, FileSpreadsheet, CalendarDays } from 'lucide-react';
import { INDO_MONTHS, getWorkdaysInMonth } from '../utils/dateUtils';

interface StatsCardsProps {
  tickets: HelpdeskTicket[];
  year: number;
  month: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ tickets, year, month }) => {
  const totalTickets = tickets.length;
  const completed = tickets.filter((t) => t.status === 'Selesai').length;
  const inProgress = tickets.filter((t) => t.status === 'Dalam Proses').length;
  const escalated = tickets.filter((t) => t.status === 'Eskalasi Vendor' || t.status === 'Menunggu Part').length;
  const criticalOrHigh = tickets.filter((t) => t.priority === 'Kritis' || t.priority === 'Tinggi').length;

  const totalMinutes = tickets.reduce((acc, t) => acc + (t.durationMinutes || 0), 0);
  const avgMinutes = totalTickets > 0 ? Math.round(totalMinutes / totalTickets) : 0;
  const avgDurationFormatted =
    avgMinutes >= 60
      ? `${Math.floor(avgMinutes / 60)}j ${avgMinutes % 60 ? (avgMinutes % 60) + 'm' : ''}`.trim()
      : `${avgMinutes} mnt`;

  const completionRate = totalTickets > 0 ? Math.round((completed / totalTickets) * 100) : 0;
  const workdaysInMonth = getWorkdaysInMonth(year, month);
  const monthName = INDO_MONTHS[month - 1];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
      {/* Total Aduan */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-slate-300 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Aduan</span>
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">{totalTickets}</span>
          <span className="text-xs text-slate-500 font-medium">Tiket Terdaftar</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 truncate">
          Periode: {monthName} {year}
        </p>
      </div>

      {/* Terselesaikan */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-slate-300 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Terselesaikan</span>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-emerald-600">{completed}</span>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
            {completionRate}%
          </span>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Rata-rata Durasi Penanganan (MTTR) */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-slate-300 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">MTTR (Rata-rata)</span>
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">{avgDurationFormatted}</span>
          <span className="text-xs text-slate-500">per insiden</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Total waktu: {Math.round(totalMinutes / 60)} Jam {totalMinutes % 60} mnt
        </p>
      </div>

      {/* Tingkat Urgensi Tinggi / Kritis */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-slate-300 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tinggi / Kritis</span>
          <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
            <AlertOctagon className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-rose-600">{criticalOrHigh}</span>
          <span className="text-xs text-slate-500">
            {inProgress > 0 ? `(${inProgress} proses)` : '(0 pending)'}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          {escalated > 0 ? `${escalated} eskalasi vendor` : 'Prioritas penanganan cepat'}
        </p>
      </div>

      {/* Hari Kerja Bulan Ini */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-slate-300 transition col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hari Kerja</span>
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <CalendarDays className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-indigo-600">{workdaysInMonth.length}</span>
          <span className="text-xs text-slate-500">Senin - Jumat</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Sabtu & Minggu otomatis dikecualikan
        </p>
      </div>
    </div>
  );
};
