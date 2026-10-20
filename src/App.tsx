import React, { useState, useEffect, useCallback } from "react";
import {
  HelpdeskTicket,
  ReportConfig,
  GenerationParams,
  UserAccount,
  UserRole,
  KopSurat,
} from "./types";
import { Header } from "./components/Header";
import { StatsCards } from "./components/StatsCards";
import { GenerationControlPanel } from "./components/GenerationControlPanel";
import { ViewerPeriodBar } from "./components/ViewerPeriodBar";
import { TicketsTable } from "./components/TicketsTable";
import { TicketDetailModal } from "./components/TicketDetailModal";
import { TicketEditModal } from "./components/TicketEditModal";
import { ReportConfigModal } from "./components/ReportConfigModal";
import { LoginModal } from "./components/LoginModal";
import { UserManagementModal } from "./components/UserManagementModal";
import { exportTicketsToExcel } from "./utils/exportExcel";
import { exportTicketsToPdf } from "./utils/exportPdf";
import { INDO_MONTHS } from "./utils/dateUtils";
import {
  Sparkles,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  Info,
  FileCode,
} from "lucide-react";

import dataKop from "../data/data-kop.json";

export default function App() {
  // Default to October (month 10) 2026 as requested in prompt example
  const [year, setYear] = useState<number>(2026);
  const [month, setMonth] = useState<number>(10);
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isLoadingTickets, setIsLoadingTickets] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const kopSurat = dataKop as KopSurat;

  // Column visibility state (Pelapor & Unit)
  const [showReporterColumn, setShowReporterColumn] = useState<boolean>(true);

  // RBAC Authentication State (persisted in localStorage, verified against data/users.json)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem("helpdesk_auth_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const userRole: UserRole = currentUser ? currentUser.role : "viewer";

  // Modals state
  const [selectedTicketForDetail, setSelectedTicketForDetail] =
    useState<HelpdeskTicket | null>(null);
  const [selectedTicketForEdit, setSelectedTicketForEdit] =
    useState<HelpdeskTicket | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] =
    useState<boolean>(false);
  const [ticketToDelete, setTicketToDelete] = useState<HelpdeskTicket | null>(
    null
  );

  // Official report configuration (Kop & Signatures)
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    // institutionName: "DINAS KOMUNIKASI DAN INFORMATIKA",
    institutionName: dataKop.nama_instansi,
    // departmentName: "BIDANG TIK & INFRASTRUKTUR TEKNOLOGI INFORMASI",
    departmentName: dataKop.unit_kerja,
    reportTitle:
      "LAPORAN REKAPITULASI TIKET ADUAN HELPDESK & PENANGANAN GANGGUAN",
    // city: "Jakarta",
    city: dataKop.kota,
    // headName: "Ir. H. Budi Santoso, M.Kom",
    headName: dataKop.nama_pimpinan,
    // headTitle: "Kepala Bidang Pengelolaan TIK & Sistem Informasi",
    headTitle: dataKop.jabatan_pimpinan,
    // headNip: "19820415 200801 1 012",
    headNip: dataKop.nip,
    // technicianLeadName: "Ahmad Fauzi, S.Kom",
    technicianLeadName: dataKop.nama_koordinator,
    // technicianLeadTitle: "Koordinator Helpdesk & Penanganan Insiden",
    technicianLeadTitle: dataKop.jabatan_koordinator,
    // technicianLeadNip: "19900820 201402 1 007",
    technicianLeadNip: dataKop.nip_koordinator ?? "tidak ada nip",
  });

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  // Fetch tickets stored in data/tickets.json for selected year & month
  const fetchTickets = useCallback(
    async (targetYear: number, targetMonth: number) => {
      setIsLoadingTickets(true);
      try {
        const res = await fetch(
          `/api/tickets?year=${targetYear}&month=${targetMonth}`
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.tickets)) {
            setTickets(data.tickets);
          }
        }
      } catch (err) {
        console.error("Failed to load tickets from data/tickets.json:", err);
      } finally {
        setIsLoadingTickets(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchTickets(year, month);
  }, [year, month, fetchTickets]);

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("helpdesk_auth_user", JSON.stringify(user));
    } catch {}
    showToast(
      `Selamat datang, ${
        user.name
      }! Anda masuk sebagai ${user.role.toUpperCase()}.`,
      "success"
    );
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem("helpdesk_auth_user");
    } catch {}
    showToast(
      "Anda telah keluar. Mode Viewer aktif (Panel generator disembunyikan).",
      "info"
    );
  };

  const handleRequireLogin = () => {
    setIsLoginModalOpen(true);
    showToast(
      "Akses dibatasi. Silakan login sebagai Operator atau Admin.",
      "info"
    );
  };

  // Generate tickets via AI / system and persist into data/tickets.json
  const generateTickets = async (params: GenerationParams) => {
    if (userRole === "viewer") {
      handleRequireLogin();
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        throw new Error("Gagal menghubungi server generator.");
      }

      const data = await res.json();
      if (Array.isArray(data.tickets) && data.tickets.length > 0) {
        setTickets(data.tickets);
        const sourceLabel =
          data.source === "gemini-ai" ? "AI Gemini" : "Sistem Standar IT";
        const topicNote = params.customTopic
          ? ` dengan topik "${params.customTopic}"`
          : "";
        const techNote =
          params.technician &&
          params.technician !== "Otomatis" &&
          params.technician !== "Semua"
            ? ` untuk teknisi ${params.technician}`
            : "";
        const targetMonthLabel =
          params.month === 0
            ? "Semua Bulan"
            : INDO_MONTHS[params.month - 1] || "Bulan";
        showToast(
          `Berhasil men-generate ${data.tickets.length} tiket aduan hari kerja untuk ${targetMonthLabel} ${params.year}${topicNote}${techNote} dan tersimpan di data/tickets.json!`,
          "success"
        );
      } else {
        throw new Error("Tidak ada data tiket yang berhasil dihasilkan.");
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Gagal generate tiket.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportExcel = () => {
    if (userRole === "viewer") {
      handleRequireLogin();
      return;
    }
    if (tickets.length === 0) {
      showToast("Tidak ada data tiket untuk diekspor.", "error");
      return;
    }
    exportTicketsToExcel(tickets, year, month, reportConfig, {
      showReporter: showReporterColumn,
    });
    showToast(
      `Laporan Excel (.xlsx) berhasil diunduh${
        !showReporterColumn ? " (tanpa kolom Pelapor & Unit)" : ""
      }!`,
      "success"
    );
  };

  const handleExportPdf = () => {
    if (userRole === "viewer") {
      handleRequireLogin();
      return;
    }
    if (tickets.length === 0) {
      showToast("Tidak ada data tiket untuk diekspor.", "error");
      return;
    }
    exportTicketsToPdf(tickets, year, month, reportConfig, {
      showReporter: showReporterColumn,
    });
    showToast(
      `Laporan PDF resmi berhasil dibuat${
        !showReporterColumn ? " (tanpa kolom Pelapor & Unit)" : ""
      }!`,
      "success"
    );
  };

  // Save ticket (Add new or Update existing) and persist into data/tickets.json
  const handleSaveTicket = async (savedTicket: HelpdeskTicket) => {
    if (userRole === "viewer") {
      handleRequireLogin();
      return;
    }

    const isExisting = tickets.some((t) => t.id === savedTicket.id);
    try {
      if (isExisting) {
        // Update via PUT
        const res = await fetch(`/api/tickets/${savedTicket.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(savedTicket),
        });
        if (!res.ok) throw new Error("Gagal memperbarui tiket di server.");
        setTickets((prev) =>
          prev.map((t) => (t.id === savedTicket.id ? savedTicket : t))
        );
        showToast(
          `Tiket ${savedTicket.ticketNumber} diperbarui di data/tickets.json!`,
          "success"
        );
      } else {
        // Create via POST
        const res = await fetch("/api/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(savedTicket),
        });
        if (!res.ok) throw new Error("Gagal menyimpan tiket baru di server.");
        const result = await res.json();
        const created = result.ticket || savedTicket;
        setTickets((prev) => [created, ...prev]);
        showToast(
          `Tiket ${created.ticketNumber} tersimpan di data/tickets.json!`,
          "success"
        );
      }
    } catch (err: any) {
      console.error(err);
      showToast(
        err.message || "Gagal menyimpan tiket ke data/tickets.json",
        "error"
      );
    }
  };

  // Delete ticket and persist into data/tickets.json
  const handleDeleteTicket = (ticketId: string) => {
    if (userRole === "viewer") {
      handleRequireLogin();
      return;
    }
    const target = tickets.find((t) => t.id === ticketId);
    if (target) {
      setTicketToDelete(target);
    }
  };

  const handleConfirmDeleteTicket = async () => {
    if (!ticketToDelete) return;
    try {
      const res = await fetch(`/api/tickets/${ticketToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus tiket di server.");
      setTickets((prev) => prev.filter((t) => t.id !== ticketToDelete.id));
      showToast(
        `Tiket ${ticketToDelete.ticketNumber} berhasil dihapus dari data/tickets.json.`,
        "info"
      );
      setTicketToDelete(null);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Gagal menghapus tiket.", "error");
      setTicketToDelete(null);
    }
  };

  const handleOpenAddTicket = () => {
    if (userRole === "viewer") {
      handleRequireLogin();
      return;
    }
    setSelectedTicketForEdit(null);
    setIsEditModalOpen(true);
  };

  const handleEditTicket = (ticket: HelpdeskTicket) => {
    if (userRole === "viewer") {
      handleRequireLogin();
      return;
    }
    setSelectedTicketForEdit(ticket);
    setIsEditModalOpen(true);
  };

  const handleViewDetail = (ticket: HelpdeskTicket) => {
    setSelectedTicketForDetail(ticket);
  };

  const handleSaveReportConfig = async (newConfig: KopSurat): Promise<void> => {
    const response = await fetch("http://localhost:3001/api/kop-surat", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newConfig),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);

      throw new Error(
        result?.message ?? "Gagal menyimpan konfigurasi kop surat."
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <Header
        onOpenSettings={() => setIsConfigModalOpen(true)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenUserManagement={() => setIsUserManagementModalOpen(true)}
        onLogout={handleLogout}
        currentUser={currentUser}
        userRole={userRole}
        institutionName={reportConfig.institutionName}
        departmentName={reportConfig.departmentName}
      />

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-16 right-4 z-50 max-w-md animate-in slide-in-from-top-3 duration-200 shadow-xl">
          <div
            className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs font-medium ${
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                : notification.type === "error"
                ? "bg-rose-50 text-rose-900 border-rose-200"
                : "bg-blue-50 text-blue-900 border-blue-200"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">{notification.message}</div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI & Summary Cards */}
        <StatsCards
          tickets={tickets}
          year={year}
          month={month}
          onSelectMonth={(m) => setMonth(m)}
        />

        {/* 
          ROLE VIEWER/USER VIEW:
          PANEL GENERATOR HIDE!
          If user is Admin or Operator -> Show full GenerationControlPanel
          If user is Viewer/User -> HIDE generator panel, show ViewerPeriodBar instead!
        */}
        {userRole !== "viewer" ? (
          <GenerationControlPanel
            year={year}
            month={month}
            onYearChange={(newYear) => setYear(newYear)}
            onMonthChange={(newMonth) => setMonth(newMonth)}
            onGenerate={generateTickets}
            isGenerating={isGenerating}
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            onAddNewTicket={handleOpenAddTicket}
            ticketsCount={tickets.length}
            showReporterColumn={showReporterColumn}
            onToggleReporterColumn={() =>
              setShowReporterColumn(!showReporterColumn)
            }
            userRole={userRole}
            onRequireLogin={handleRequireLogin}
            onShowNotification={(msg, type) => showToast(msg, type)}
          />
        ) : (
          <ViewerPeriodBar
            year={year}
            month={month}
            onYearChange={(newYear) => setYear(newYear)}
            onMonthChange={(newMonth) => setMonth(newMonth)}
            showReporterColumn={showReporterColumn}
            onToggleReporterColumn={() =>
              setShowReporterColumn(!showReporterColumn)
            }
            ticketsCount={tickets.length}
            onOpenLogin={() => setIsLoginModalOpen(true)}
          />
        )}

        {/* Data Table */}
        <TicketsTable
          tickets={tickets}
          showReporterColumn={showReporterColumn}
          onToggleReporterColumn={() =>
            setShowReporterColumn(!showReporterColumn)
          }
          onViewDetail={handleViewDetail}
          onEditTicket={handleEditTicket}
          onDeleteTicket={handleDeleteTicket}
          onAnalyzeWithAI={handleViewDetail}
          userRole={userRole}
        />

        {/* Quick Tips / Information Footer */}
        <div className="mt-6 p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>
              <strong>Penyimpanan Berkas JSON:</strong> Seluruh tiket aduan
              disimpan di{" "}
              <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono">
                data/tickets.json
              </code>{" "}
              dan akun RBAC di{" "}
              <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono">
                data/users.json
              </code>
              .
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400 shrink-0">
            <span>Status Kolom:</span>
            <span className="text-xs text-slate-600 font-medium">
              Pelapor & Unit: {showReporterColumn ? "Tampil" : "Disembunyikan"}
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        <p>
          Sistem Rekapitulasi Tiket Aduan Helpdesk & Penanganan Gangguan IT •
          Penyimpanan Berkas JSON & AI Gemini
        </p>
      </footer>

      {/* Modals */}
      <TicketDetailModal
        ticket={selectedTicketForDetail}
        onClose={() => setSelectedTicketForDetail(null)}
        onUpdateTicket={handleSaveTicket}
        userRole={userRole}
        onRequireLogin={handleRequireLogin}
      />

      <TicketEditModal
        isOpen={isEditModalOpen}
        ticket={selectedTicketForEdit}
        year={year}
        month={month}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveTicket}
      />

      <ReportConfigModal
        isOpen={isConfigModalOpen}
        config={reportConfig}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={async (newConfig) => {
          await handleSaveReportConfig(newConfig);
          // handleSaveReportConfig(newConfig);
          // setReportConfig(newConfig);
          // setReportConfig(newConfig);
          showToast(
            "Pengaturan kop surat dan tanda tangan berhasil diperbarui!",
            "success"
          );
        }}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <UserManagementModal
        isOpen={isUserManagementModalOpen}
        onClose={() => setIsUserManagementModalOpen(false)}
        currentUserId={currentUser?.id || ""}
      />

      {/* Delete Ticket Confirmation Modal */}
      {ticketToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Konfirmasi Hapus Tiket
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus tiket{" "}
              <strong className="text-slate-900 font-mono">
                {ticketToDelete.ticketNumber}
              </strong>{" "}
              (<span className="italic">{ticketToDelete.problemTitle}</span>)?
              Data akan dihapus secara permanen dari{" "}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono">
                data/tickets.json
              </code>
              .
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setTicketToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTicket}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition cursor-pointer"
              >
                Ya, Hapus Tiket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
