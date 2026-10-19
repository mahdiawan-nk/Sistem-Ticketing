import React from 'react';
import {
  Calendar,
  Eye,
  EyeOff,
  LogIn,
  SlidersHorizontal,
  FileCode,
  ShieldAlert,
} from 'lucide-react';
import { INDO_MONTHS, getWorkdaysInMonth } from '../utils/dateUtils';

interface ViewerPeriodBarProps {
  year: number;
  month: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  showReporterColumn: boolean;
  onToggleReporterColumn: () => void;
  ticketsCount: number;
  onOpenLogin: () => void;
}

export const ViewerPeriodBar: React.FC<ViewerPeriodBarProps> = ({
  year,
  month,
  onYearChange,
  onMonthChange,
  showReporterColumn,
  onToggleReporterColumn,
  ticketsCount,
  onOpenLogin,
}) => {
  const workdays = getWorkdaysInMonth(year, month);
  const currentMonthName = INDO_MONTHS[month - 1];
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Title & Notice */}
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <SlidersHorizontal className="w-4 h-4 text-slate-600" />
            </span>
            <h2 className="text-sm sm:text-base font-bold text-slate-800">
              Papan Rekapitulasi Tiket Helpdesk (Mode Publik / Viewer)
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <FileCode className="w-3 h-3" /> data/tickets.json
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Menampilkan data laporan resmi tersimpan pada hari kerja (Senin - Jumat). Panel generator disembunyikan untuk role Viewer.
          </p>
        </div>

        {/* Right: Period Dropdowns & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-600">Bulan:</span>
            <select
              value={month}
              onChange={(e) => onMonthChange(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {INDO_MONTHS.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-600">Tahun:</span>
            <select
              value={year}
              onChange={(e) => onYearChange(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Workdays badge */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 rounded-xl text-xs text-slate-600 font-medium">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>{workdays.length} Hari Kerja</span>
          </div>

          {/* Column Toggle */}
          <button
            type="button"
            onClick={onToggleReporterColumn}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              showReporterColumn
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
            }`}
          >
            {showReporterColumn ? (
              <>
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                <span>Pelapor: On</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                <span>Pelapor: Off</span>
              </>
            )}
          </button>

          {/* Login button */}
          <button
            type="button"
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition cursor-pointer"
            title="Masuk sebagai Operator / Admin untuk mengakses Generator AI dan Ekspor"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login Petugas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
