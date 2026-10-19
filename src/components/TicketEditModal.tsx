import React, { useState, useEffect } from 'react';
import { HelpdeskTicket, PriorityLevel, TicketStatus } from '../types';
import {
  X,
  Sparkles,
  Calendar,
  Clock,
  User,
  Wrench,
  Check,
  RefreshCw,
  Info,
} from 'lucide-react';
import { CATEGORIES, getWorkdaysInMonth, INDO_DAYS } from '../utils/dateUtils';

interface TicketEditModalProps {
  isOpen: boolean;
  ticket: HelpdeskTicket | null;
  year: number;
  month: number;
  onClose: () => void;
  onSave: (ticket: HelpdeskTicket) => void;
}

export const TicketEditModal: React.FC<TicketEditModalProps> = ({
  isOpen,
  ticket,
  year,
  month,
  onClose,
  onSave,
}) => {
  const workdays = getWorkdaysInMonth(year, month);

  const [formData, setFormData] = useState<Partial<HelpdeskTicket>>({});
  const [isGeneratingSolution, setIsGeneratingSolution] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  useEffect(() => {
    if (ticket) {
      setFormData(ticket);
    } else {
      // New ticket default
      const defaultWorkday = workdays[0] || {
        dateStr: `${year}-${String(month).padStart(2, '0')}-01`,
        dayName: 'Senin',
      };
      setFormData({
        id: `ticket-${Date.now()}`,
        ticketNumber: `TKT-${year}${String(month).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`,
        date: defaultWorkday.dateStr,
        dayName: defaultWorkday.dayName,
        time: '08:30 WIB',
        reporterName: '',
        reporterDept: '',
        category: 'Jaringan & Internet',
        priority: 'Sedang',
        problemTitle: '',
        problemDescription: '',
        technicianName: 'Tim Support IT',
        durationMinutes: 45,
        durationFormatted: '45 Menit',
        rootCause: '',
        actionTaken: '',
        preventiveAction: '',
        status: 'Selesai',
      });
    }
    setAiNotice(null);
  }, [ticket, isOpen, year, month]);

  if (!isOpen) return null;

  const handleDateChange = (dateStr: string) => {
    const selected = workdays.find((w) => w.dateStr === dateStr);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        date: selected.dateStr,
        dayName: selected.dayName,
      }));
    } else {
      // Calculate day name
      const d = new Date(dateStr);
      const dayName = INDO_DAYS[d.getDay()] || 'Senin';
      setFormData((prev) => ({
        ...prev,
        date: dateStr,
        dayName,
      }));
    }
  };

  const handleAutoGenerateSolution = async () => {
    if (!formData.problemTitle && !formData.problemDescription) {
      alert('Harap isi judul atau deskripsi keluhan terlebih dahulu agar AI dapat menganalisis.');
      return;
    }

    setIsGeneratingSolution(true);
    setAiNotice(null);

    try {
      const res = await fetch('/api/analyze-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemTitle: formData.problemTitle,
          problemDescription: formData.problemDescription,
          category: formData.category,
          priority: formData.priority,
        }),
      });

      if (!res.ok) {
        throw new Error('Gagal menghubungi AI service.');
      }

      const data = await res.json();
      setFormData((prev) => ({
        ...prev,
        rootCause: data.akarMasalah || prev.rootCause,
        actionTaken: data.solusiTeknis || prev.actionTaken,
        preventiveAction: data.tindakanPencegahan || prev.preventiveAction,
        durationFormatted: data.estimasiWaktu || prev.durationFormatted,
      }));

      setAiNotice('Solusi teknis & akar masalah berhasil di-generate secara otomatis oleh AI!');
    } catch (err: any) {
      setAiNotice(`Gagal generate solusi: ${err.message}`);
    } finally {
      setIsGeneratingSolution(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.problemTitle || !formData.reporterName) {
      alert('Mohon lengkapi Nama Pelapor dan Judul Gangguan.');
      return;
    }

    const dur = Number(formData.durationMinutes) || 30;
    const durFormatted =
      dur >= 60 ? `${Math.floor(dur / 60)} Jam ${dur % 60 ? (dur % 60) + ' Menit' : ''}`.trim() : `${dur} Menit`;

    const finalTicket: HelpdeskTicket = {
      id: formData.id || `ticket-${Date.now()}`,
      ticketNumber: formData.ticketNumber || `TKT-${year}${month}-001`,
      date: formData.date || workdays[0]?.dateStr || `${year}-${String(month).padStart(2, '0')}-01`,
      dayName: formData.dayName || 'Senin',
      time: formData.time || '09:00 WIB',
      reporterName: formData.reporterName || 'Staf',
      reporterDept: formData.reporterDept || 'Umum',
      category: formData.category || 'Jaringan & Internet',
      priority: (formData.priority as PriorityLevel) || 'Sedang',
      problemTitle: formData.problemTitle || '',
      problemDescription: formData.problemDescription || '',
      technicianName: formData.technicianName || 'Tim Support IT',
      durationMinutes: dur,
      durationFormatted: formData.durationFormatted || durFormatted,
      rootCause: formData.rootCause || 'Dalam penanganan standar',
      actionTaken: formData.actionTaken || 'Penanganan teknis selesai',
      preventiveAction: formData.preventiveAction || 'Pemeriksaan rutin berkala',
      status: (formData.status as TicketStatus) || 'Selesai',
      resolutionDate: `${formData.date} 16:00 WIB`,
    };

    onSave(finalTicket);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">
              {ticket ? 'Edit Data Tiket Aduan' : 'Tambah Tiket Aduan Baru'}
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800">
              Hari Kerja (Senin - Jumat)
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Row 1: Nomor Tiket & Waktu */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nomor Tiket
              </label>
              <input
                type="text"
                required
                value={formData.ticketNumber || ''}
                onChange={(e) => setFormData({ ...formData, ticketNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Pilih Tanggal (Hari Kerja)
              </label>
              <select
                value={formData.date || ''}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
              >
                {workdays.map((w) => (
                  <option key={w.dateStr} value={w.dateStr}>
                    {w.formattedShort}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jam Aduan Masuk
              </label>
              <input
                type="text"
                value={formData.time || '09:00 WIB'}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                placeholder="Contoh: 08:45 WIB"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Row 2: Pelapor & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Pelapor
              </label>
              <input
                type="text"
                required
                value={formData.reporterName || ''}
                onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                placeholder="Contoh: Budi Santoso"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Divisi / Unit Kerja
              </label>
              <input
                type="text"
                required
                value={formData.reporterDept || ''}
                onChange={(e) => setFormData({ ...formData, reporterDept: e.target.value })}
                placeholder="Contoh: Bagian Keuangan & Aset"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Row 3: Kategori, Prioritas, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kategori Gangguan
              </label>
              <select
                value={formData.category || 'Jaringan & Internet'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {CATEGORIES.filter((c) => c !== 'Semua').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tingkat Prioritas
              </label>
              <select
                value={formData.priority || 'Sedang'}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as PriorityLevel })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Rendah">Rendah</option>
                <option value="Sedang">Sedang</option>
                <option value="Tinggi">Tinggi</option>
                <option value="Kritis">Kritis</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Status Tiket
              </label>
              <select
                value={formData.status || 'Selesai'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TicketStatus })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold text-indigo-700"
              >
                <option value="Selesai">Selesai</option>
                <option value="Dalam Proses">Dalam Proses</option>
                <option value="Eskalasi Vendor">Eskalasi Vendor</option>
                <option value="Menunggu Part">Menunggu Part</option>
              </select>
            </div>
          </div>

          {/* Problem Title & Description */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Judul Gangguan Singkat
            </label>
            <input
              type="text"
              required
              value={formData.problemTitle || ''}
              onChange={(e) => setFormData({ ...formData, problemTitle: e.target.value })}
              placeholder="Contoh: Koneksi internet WiFi ruang rapat putus-putus"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">
                Deskripsi Gangguan / Gejala Masalah
              </label>

              {/* AI auto-generate solution trigger */}
              <button
                type="button"
                onClick={handleAutoGenerateSolution}
                disabled={isGeneratingSolution}
                className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition cursor-pointer"
              >
                {isGeneratingSolution ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menganalisis Solusi AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Generate Solusi Teknis AI Otomatis</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={3}
              value={formData.problemDescription || ''}
              onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
              placeholder="Deskripsikan keluhan pengguna secara rinci..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {aiNotice && (
            <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{aiNotice}</span>
            </div>
          )}

          {/* Root Cause & Action Taken */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Akar Masalah (Root Cause)
              </label>
              <textarea
                rows={2}
                value={formData.rootCause || ''}
                onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
                placeholder="Penyebab utama gangguan..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tindakan & Solusi Teknis
              </label>
              <textarea
                rows={2}
                value={formData.actionTaken || ''}
                onChange={(e) => setFormData({ ...formData, actionTaken: e.target.value })}
                placeholder="Langkah perbaikan yang dilakukan teknisi..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Preventive Action */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tindakan Pencegahan (Preventive Action)
            </label>
            <input
              type="text"
              value={formData.preventiveAction || ''}
              onChange={(e) => setFormData({ ...formData, preventiveAction: e.target.value })}
              placeholder="SOP atau langkah agar gangguan tidak terulang kembali..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Technician & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Teknisi Penanggung Jawab
              </label>
              <input
                type="text"
                value={formData.technicianName || ''}
                onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                placeholder="Contoh: Ahmad Fauzi (IT Support)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Durasi Penanganan (Menit)
              </label>
              <input
                type="number"
                min="5"
                max="1440"
                value={formData.durationMinutes || 45}
                onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Submit buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Tiket</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
