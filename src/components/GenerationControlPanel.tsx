import React, { useState } from 'react';
import {
  Sparkles,
  FileSpreadsheet,
  FileText,
  Plus,
  Calendar,
  Layers,
  Building2,
  SlidersHorizontal,
  RefreshCw,
  Info,
  UserCheck,
  Tag,
  Eye,
  EyeOff,
  Lock,
  LogIn,
} from 'lucide-react';
import { INDO_MONTHS, CATEGORIES, getWorkdaysInMonth } from '../utils/dateUtils';
import { GenerationParams, UserRole } from '../types';

interface GenerationControlPanelProps {
  year: number;
  month: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onGenerate: (params: GenerationParams) => Promise<void>;
  isGenerating: boolean;
  onExportExcel: () => void;
  onExportPdf: () => void;
  onAddNewTicket: () => void;
  ticketsCount: number;
  showReporterColumn: boolean;
  onToggleReporterColumn: () => void;
  userRole: UserRole;
  onRequireLogin: () => void;
}

export const GenerationControlPanel: React.FC<GenerationControlPanelProps> = ({
  year,
  month,
  onYearChange,
  onMonthChange,
  onGenerate,
  isGenerating,
  onExportExcel,
  onExportPdf,
  onAddNewTicket,
  ticketsCount,
  showReporterColumn,
  onToggleReporterColumn,
  userRole,
  onRequireLogin,
}) => {
  const [dataCount, setDataCount] = useState<number>(6); // Default 6, user can pick 5, 6, etc.
  const [categoryFilter, setCategoryFilter] = useState<string>('Semua');
  const [selectedTechnician, setSelectedTechnician] = useState<string>('Otomatis');
  const [customTechnicianName, setCustomTechnicianName] = useState<string>('');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [institutionContext, setInstitutionContext] = useState<string>(
    'Divisi TIK & Sistem Informasi'
  );

  const isViewer = userRole === 'viewer';
  const workdays = getWorkdaysInMonth(year, month);
  const currentMonthName = INDO_MONTHS[month - 1];

  const technicianOptions = [
    'Otomatis (Bervariasi)',
    'Ahmad Fauzi (Senior IT Support)',
    'Rian Hidayat (Network Engineer)',
    'Dewi Lestari (Systems & Apps Analyst)',
    'Bambang S. (Hardware Specialist)',
    'Fajar Nugroho (Helpdesk Technician)',
    'Siti Rahmawati (Infrastructure Support)',
    'Kustom',
  ];

  const topicPresets = [
    { label: 'Semua Masalah', value: '' },
    { label: 'Jaringan & WiFi Drop', value: 'Gangguan koneksi LAN, WiFi sering putus, dan router switch' },
    { label: 'Printer & Paper Jam', value: 'Printer paper jam, spooler macet, dan penggantian tinta/toner' },
    { label: 'PC BSOD / Hardware', value: 'Komputer lemot, restart sendiri, BSOD, dan penggantian RAM/SSD' },
    { label: 'Akun & Email Lockout', value: 'Akun domain terkunci, reset password, dan konfigurasi email Outlook' },
    { label: 'Aplikasi & Database Error', value: 'Aplikasi internal timeout error 500 dan sinkronisasi database' },
  ];

  const handleGenerateClick = () => {
    if (isViewer) {
      onRequireLogin();
      return;
    }

    const finalTech =
      selectedTechnician === 'Kustom'
        ? customTechnicianName.trim()
        : selectedTechnician === 'Otomatis (Bervariasi)'
        ? 'Otomatis'
        : selectedTechnician;

    onGenerate({
      year,
      month,
      count: dataCount,
      categoryFilter,
      institutionContext,
      customTopic: customTopic.trim(),
      technician: finalTech,
    });
  };

  const handleAddTicketClick = () => {
    if (isViewer) {
      onRequireLogin();
      return;
    }
    onAddNewTicket();
  };

  const handleExcelClick = () => {
    if (isViewer) {
      onRequireLogin();
      return;
    }
    onExportExcel();
  };

  const handlePdfClick = () => {
    if (isViewer) {
      onRequireLogin();
      return;
    }
    onExportPdf();
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 mb-6">
      {/* Viewer Notice Banner */}
      {isViewer && (
        <div className="mb-4 p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Mode Viewer (Publik):</strong> Anda dapat melihat seluruh tabel data tiket & analisis teknis. Untuk melakukan <strong>Generate AI</strong>, <strong>Input/Edit Tiket</strong>, atau <strong>Ekspor Laporan</strong>, silakan masuk sebagai Operator atau Admin.
            </span>
          </div>
          <button
            type="button"
            onClick={onRequireLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shrink-0 transition cursor-pointer self-start sm:self-auto"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login Petugas</span>
          </button>
        </div>
      )}

      {/* Top Banner / Guidance */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <SlidersHorizontal className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-800">
              Konfigurasi Generator Laporan Tiket & Topik
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pilih periode, jumlah data tiket, tentukan teknisi penanggung jawab, dan tetapkan topik gangguan spesifik. Laporan otomatis tersaring pada <strong className="text-slate-700">Hari Kerja (Senin s/d Jumat)</strong>.
          </p>
        </div>

        {/* Workday indicator pill & Column Visibility Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>
              {currentMonthName} {year}: <strong className="text-slate-900">{workdays.length} Hari Kerja</strong>
            </span>
          </div>

          {/* Toggle Hide/Show Reporter & Dept Column */}
          <button
            type="button"
            onClick={onToggleReporterColumn}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              showReporterColumn
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
            }`}
            title="Sembunyikan atau tampilkan kolom Pelapor & Unit Kerja di tabel serta ekspor Excel/PDF"
          >
            {showReporterColumn ? (
              <>
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                <span>Kolom Pelapor: Tampil</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                <span>Kolom Pelapor: Disembunyikan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Row 1: Month, Year, Data Count */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Month Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Bulan Laporan
          </label>
          <select
            value={month}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
          >
            {INDO_MONTHS.map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Year Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Tahun
          </label>
          <select
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                Tahun {y}
              </option>
            ))}
          </select>
        </div>

        {/* Data Count Selection (5, 6, 10, etc.) */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Jumlah Data Tiket (Contoh: 5 atau 6 data per bulan)
          </label>
          <div className="flex items-center gap-2">
            {[5, 6, 8, 10, 15].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setDataCount(preset)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                  dataCount === preset
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {preset} Data
              </button>
            ))}
            {/* Custom count input */}
            <div className="relative flex-1 min-w-[70px]">
              <input
                type="number"
                min="1"
                max="50"
                value={dataCount}
                onChange={(e) => setDataCount(Math.max(1, Number(e.target.value) || 1))}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                placeholder="Custom"
                title="Ketik jumlah kustom"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Tentukan Teknisi & Kategori */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 pt-1">
        {/* Tentukan Teknisi */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            Tentukan Teknisi Penanggung Jawab
          </label>
          <select
            value={selectedTechnician}
            onChange={(e) => setSelectedTechnician(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {technicianOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          {selectedTechnician === 'Kustom' && (
            <input
              type="text"
              value={customTechnicianName}
              onChange={(e) => setCustomTechnicianName(e.target.value)}
              placeholder="Ketik nama teknisi (misal: Rahmat Syahputra, S.Kom)..."
              className="mt-2 w-full px-3 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          )}
        </div>

        {/* Filter Kategori */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            Fokus Kategori Gangguan
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Instansi / Lingkungan */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            Konteks Lingkungan Kerja
          </label>
          <input
            type="text"
            value={institutionContext}
            onChange={(e) => setInstitutionContext(e.target.value)}
            placeholder="Contoh: Diskominfo, Rumah Sakit, BUMN..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Row 3: Berdasarkan Topik Gangguan (Prominent Topic Feature) */}
      <div className="mb-5 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-indigo-600" />
            Generate Berdasarkan Topik Gangguan Tertentu:
          </label>
          <span className="text-[11px] text-slate-500">Pilih preset topik atau ketik topik kustom</span>
        </div>

        {/* Quick Topic Chips */}
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {topicPresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setCustomTopic(preset.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                customTopic === preset.value
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Custom topic input */}
        <input
          type="text"
          value={customTopic}
          onChange={(e) => setCustomTopic(e.target.value)}
          placeholder="Atau ketik topik gangguan spesifik di sini (misal: 'Pembaruan Antivirus EDR dan Trojan di folder Downloads')..."
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-400"
        />
      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Left: Generator Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleGenerateClick}
            disabled={isGenerating}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer ${
              isViewer
                ? 'bg-slate-700 hover:bg-slate-800'
                : 'bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-indigo-500/20'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>AI Sedang Menganalisis & Men-generate...</span>
              </>
            ) : isViewer ? (
              <>
                <Lock className="w-4 h-4 text-amber-300" />
                <span>Auto Generate AI (Login Diperlukan)</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>
                  Auto Generate {dataCount} Tiket AI ({currentMonthName})
                  {customTopic ? ' • Sesuai Topik' : ''}
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleAddTicketClick}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl font-medium text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
          >
            {isViewer ? <Lock className="w-3.5 h-3.5 text-slate-400" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Tambah Tiket Manual</span>
          </button>
        </div>

        {/* Right: Export Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleExcelClick}
            disabled={ticketsCount === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer ${
              isViewer ? 'bg-slate-600 hover:bg-slate-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
            title={isViewer ? 'Login Operator / Admin untuk Ekspor Excel' : `Ekspor ${ticketsCount} tiket ke Excel`}
          >
            {isViewer ? <Lock className="w-3.5 h-3.5 text-amber-300" /> : <FileSpreadsheet className="w-4 h-4" />}
            <span>Ekspor Excel</span>
          </button>

          <button
            type="button"
            onClick={handlePdfClick}
            disabled={ticketsCount === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer ${
              isViewer ? 'bg-slate-600 hover:bg-slate-700' : 'bg-rose-600 hover:bg-rose-700'
            }`}
            title={isViewer ? 'Login Operator / Admin untuk Ekspor PDF' : `Ekspor ${ticketsCount} tiket ke PDF`}
          >
            {isViewer ? <Lock className="w-3.5 h-3.5 text-amber-300" /> : <FileText className="w-4 h-4" />}
            <span>Ekspor PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
