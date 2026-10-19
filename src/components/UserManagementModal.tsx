import React, { useState, useEffect } from 'react';
import { UserAccount } from '../types';
import {
  X,
  UserPlus,
  Users,
  Trash2,
  Shield,
  ShieldAlert,
  UserCheck,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  FileCode,
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
}) => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New user form state
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'operator'>('operator');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat daftar user.');
      setUsers(data.users || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memuat user.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, name, password, role }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat user.');

      setSuccessMsg(`User "${username}" (${role}) berhasil dibuat dan disimpan di users.json!`);
      setUsername('');
      setName('');
      setPassword('');
      setRole('operator');
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal membuat user baru.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: UserAccount) => {
    if (user.id === currentUserId) {
      alert('Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.');
      return;
    }

    if (!confirm(`Hapus user "${user.username}" (${user.name})? Tindakan ini akan menghapus data dari users.json.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus user.');
      setSuccessMsg(`User "${user.username}" berhasil dihapus.`);
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghapus user.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Manajemen Pengguna & RBAC
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50 flex items-center gap-1">
                  <FileCode className="w-3 h-3" /> data/users.json
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Fitur Admin: Tambah, edit, dan kelola hak akses operator helpdesk
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Create New User */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-1.5 text-xs sm:text-sm">
              <UserPlus className="w-4 h-4 text-indigo-600" />
              Tambah User Petugas Baru
            </h4>

            <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Misal: teknisi1"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama teknisi / staf..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Hak Akses (Role)
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'operator')}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="operator">Operator (CRUD & Ekspor)</option>
                  <option value="admin">Admin (Semua Akses + Buat User)</option>
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Menyimpan ke JSON...' : 'Buat & Simpan User'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* User List Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                Daftar Akun Pengguna Terdaftar ({users.length})
              </h4>
              <button
                type="button"
                onClick={fetchUsers}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3">Username</th>
                    <th className="py-2.5 px-3">Nama Lengkap</th>
                    <th className="py-2.5 px-3">Role & Hak Akses</th>
                    <th className="py-2.5 px-3">Tanggal Dibuat</th>
                    <th className="py-2.5 px-3 text-center w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Memuat data user...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Belum ada user.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                          {u.username}
                          {u.id === currentUserId && (
                            <span className="ml-1.5 text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded font-sans">
                              (Anda)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {u.name}
                        </td>
                        <td className="py-2.5 px-3">
                          {u.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                              <ShieldAlert className="w-3 h-3" />
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                              <Shield className="w-3 h-3" />
                              Operator
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {u.id !== currentUserId && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition cursor-pointer"
                              title="Hapus user"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
