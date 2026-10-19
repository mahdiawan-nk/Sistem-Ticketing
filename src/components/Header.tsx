import React from 'react';
import {
  ShieldCheck,
  Calendar,
  Settings,
  LogIn,
  LogOut,
  Users,
  Shield,
  ShieldAlert,
  Eye,
} from 'lucide-react';
import { UserAccount, UserRole } from '../types';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenLogin: () => void;
  onOpenUserManagement: () => void;
  onLogout: () => void;
  currentUser: UserAccount | null;
  userRole: UserRole;
  institutionName: string;
  departmentName: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenLogin,
  onOpenUserManagement,
  onLogout,
  currentUser,
  userRole,
  institutionName,
  departmentName,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Brand & Titles */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/10 shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  IT Helpdesk Incident Log
                  <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Rekapitulasi Gangguan
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-xl">
                {institutionName} • {departmentName}
              </p>
            </div>
          </div>

          {/* Right badges & RBAC Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            {/* Workday Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
              <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-medium">Senin - Jumat</span>
            </div>

            {/* Role Badge */}
            {userRole === 'admin' ? (
              <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-purple-950/70 text-purple-200 border border-purple-800/60">
                <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-semibold">Admin: {currentUser?.name || 'Administrator'}</span>
              </div>
            ) : userRole === 'operator' ? (
              <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-950/70 text-blue-200 border border-blue-800/60">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-semibold">Operator: {currentUser?.name || 'Petugas'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 text-amber-300 border border-slate-700">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-medium">Mode Viewer (Tanpa Login)</span>
              </div>
            )}

            {/* Admin-only Button: User Management (RBAC) */}
            {userRole === 'admin' && (
              <button
                type="button"
                onClick={onOpenUserManagement}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700 transition cursor-pointer"
                title="Kelola Akun User & Role (data/users.json)"
              >
                <Users className="w-3.5 h-3.5 text-purple-300" />
                <span>Kelola User</span>
              </button>
            )}

            {/* Admin-only Button: Report Format Settings */}
            {userRole === 'admin' && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                title="Pengaturan Kop Surat & Lembar Pengesahan Laporan"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Kop Laporan</span>
              </button>
            )}

            {/* Login or Logout Button */}
            {userRole === 'viewer' ? (
              <button
                type="button"
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-xs transition cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login Petugas</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/70 hover:text-rose-300 hover:border-rose-800 text-slate-300 border border-slate-700 transition cursor-pointer"
                title="Keluar dari akun dan kembali ke mode viewer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
