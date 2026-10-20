import React, { useState } from "react";
import { KopSurat, ReportConfig } from "../types";
import { X, Check, Building, UserCheck } from "lucide-react";
import dataKop from "../../data/data-kop.json";
interface ReportConfigModalProps {
  isOpen: boolean;
  config: ReportConfig;
  onClose: () => void;
  // onSave: (config: ReportConfig) => void;
  onSave: (config: KopSurat) => void;
}

const dataKopSurat: KopSurat = dataKop as KopSurat;

export const ReportConfigModal: React.FC<ReportConfigModalProps> = ({
  isOpen,
  config,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<KopSurat>(dataKopSurat);
  // const [formData, setFormData] = useState<ReportConfig>(config);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    // onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              Pengaturan Format Laporan & Tanda Tangan
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Instansi / Perusahaan
            </label>
            <input
              type="text"
              required
              value={formData.nama_instansi}
              // value={formData.institutionName}
              onChange={
                (e) =>
                  setFormData({ ...formData, nama_instansi: e.target.value })
                // setFormData({ ...formData, institutionName: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Divisi / Bagian / Unit Kerja
            </label>
            <input
              type="text"
              required
              value={formData.unit_kerja}
              // value={formData.departmentName}
              onChange={
                (e) => setFormData({ ...formData, unit_kerja: e.target.value })
                // setFormData({ ...formData, departmentName: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Kota Dokumen
            </label>
            <input
              type="text"
              required
              value={formData.kota}
              // value={formData.city}
              onChange={
                (e) => setFormData({ ...formData, kota: e.target.value })
                // setFormData({ ...formData, city: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              Pejabat Penandatangan (Pimpinan)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 mb-1">
                  Nama Pimpinan
                </label>
                <input
                  type="text"
                  required
                  // value={formData.headName}

                  value={formData.nama_pimpinan}
                  onChange={
                    (e) =>
                      setFormData({
                        ...formData,
                        nama_pimpinan: e.target.value,
                      })
                    // setFormData({ ...formData, headName: e.target.value })
                  }
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">
                  Jabatan Pimpinan
                </label>
                <input
                  type="text"
                  required
                  value={formData.jabatan_pimpinan}
                  // value={formData.headTitle}
                  onChange={
                    (e) =>
                      setFormData({
                        ...formData,
                        jabatan_pimpinan: e.target.value,
                      })
                    // setFormData({ ...formData, headTitle: e.target.value })
                  }
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-600 mb-1">
                  NIP / ID Pegawai (Opsional)
                </label>
                <input
                  type="text"
                  value={formData.nip ?? "-"}
                  // value={formData.headNip || ""}
                  onChange={
                    (e) => setFormData({ ...formData, nip: e.target.value })
                    // setFormData({ ...formData, headNip: e.target.value })
                  }
                  placeholder="Contoh: 19850312 201001 1 004"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              Koordinator Tim Helpdesk / Pelaksana
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 mb-1">
                  Nama Koordinator
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama_koordinator}
                  // value={formData.technicianLeadName}
                  onChange={
                    (e) =>
                      setFormData({
                        ...formData,
                        nama_koordinator: e.target.value,
                      })
                    // setFormData({
                    //   ...formData,
                    //   technicianLeadName: e.target.value,
                    // })
                  }
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Jabatan</label>
                <input
                  type="text"
                  required
                  // value={formData.technicianLeadTitle}

                  value={formData.jabatan_koordinator}
                  onChange={
                    (e) =>
                      setFormData({
                        ...formData,
                        jabatan_koordinator: e.target.value,
                      })
                    // setFormData({
                    //   ...formData,
                    //   technicianLeadTitle: e.target.value,
                    // })
                  }
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
