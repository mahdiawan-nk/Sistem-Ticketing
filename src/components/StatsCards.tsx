import React from 'react';
import { HelpdeskTicket } from '../types';
import { CheckCircle2, Clock, AlertOctagon, FileSpreadsheet, CalendarDays, BarChart2 } from 'lucide-react';
import { INDO_MONTHS, getWorkdaysInMonth } from '../utils/dateUtils';

interface StatsCardsProps {
  tickets: HelpdeskTicket[];
  year: number;
  month: number;
  onSelectMonth?: (m: number) => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ tickets, year, month, onSelectMonth }) => {
  const isAllMonths = month === 0;
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
  const periodLabel = isAllMonths ? `Semua Bulan Tahun ${year} (Jan - Des)` : `${INDO_MONTHS[month - 1]} ${year}`;

  // If isAllMonths, calculate monthly distribution for all 12 months
  const monthlyDistribution = React.useMemo(() => {
    if (!isAllMonths) return [];
    const counts = Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const prefix = `${year}-${String(monthNum).padStart(2, '0')}`;
      const count = tickets.filter((t) => t.date && t.date.startsWith(prefix)).length;
      return {
        monthIndex: monthNum,
        monthName: INDO_MONTHS[i],
        shortName: INDO_MONTHS[i].slice(0, 3),
        count,
      };
    });
    return counts;
  }, [isAllMonths, tickets, year]);

  return (
    <div className="mb-6 space-y-3.5">
      {/* If All Months is active, show banner badge */}
      {isAllMonths && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl text-xs text-indigo-950 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-indigo-600 text-white shrink-0">
              <BarChart2 className="w-3.5 h-3.5" />
            </span>
            <div>
              <span className="font-bold text-indigo-900">Statistik Global Semua Bulan ({year}):</span>{' '}
              <span className="text-indigo-700">
                Menampilkan akumulasi seluruh insiden helpdesk yang tercatat di <code className="bg-indigo-100/80 px-1 py-0.5 rounded font-mono text-[11px]">data/tickets.json</code> sepanjang tahun {year}.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
            <span className="text-[11px] font-semibold bg-white border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-xl">
              Total {totalTickets} Tiket Terdaftar
            </span>
          </div>
        </div>
      )}

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
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
          <p className="text-[11px] text-slate-500 mt-1 truncate" title={periodLabel}>
            Periode: {periodLabel}
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

        {/* Hari Kerja */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-slate-300 transition col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hari Kerja</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-600">{workdaysInMonth.length}</span>
            <span className="text-xs text-slate-500">
              {isAllMonths ? 'Hari Kerja 1 Tahun' : 'Senin - Jumat'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {isAllMonths ? 'Akumulasi hari kerja sepanjang tahun' : 'Sabtu & Minggu otomatis dikecualikan'}
          </p>
        </div>
      </div>

      {/* Monthly distribution bar when viewing All Months */}
      {isAllMonths && (
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
              Distribusi Tiket Berdasarkan Bulan ({year})
            </span>
            <span className="text-[11px] text-slate-500">
              Klik nama bulan untuk memfilter bulan spesifik
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-1.5">
            {monthlyDistribution.map((m) => {
              const hasData = m.count > 0;
              return (
                <button
                  key={m.monthIndex}
                  type="button"
                  onClick={() => onSelectMonth && onSelectMonth(m.monthIndex)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition cursor-pointer ${
                    hasData
                      ? 'bg-indigo-50/70 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300'
                      : 'bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-400'
                  }`}
                  title={`${m.monthName} ${year}: ${m.count} tiket terdaftar`}
                >
                  <span className={`text-[11px] font-semibold ${hasData ? 'text-indigo-900' : 'text-slate-500'}`}>
                    {m.shortName}
                  </span>
                  <span
                    className={`mt-0.5 text-xs font-bold px-1.5 py-0.2 rounded-full ${
                      hasData ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {m.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
